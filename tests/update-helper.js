const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { promisify } = require("node:util");
const AdmZip = require("adm-zip");
const { compareVersions, safePatchEntry, extractPatch } = require("../electron/update-helper");
let realFs = fs;
try {
  const originalFs = require("original-fs");
  realFs = {
    readFile: promisify(originalFs.readFile.bind(originalFs)),
    rm: promisify(originalFs.rm.bind(originalFs))
  };
} catch {}

(async () => {
  assert.equal(compareVersions("0.1.31", "0.1.30"), 1);
  assert.equal(safePatchEntry("payload/resources/app.asar"), true);
  assert.equal(safePatchEntry("payload/resources/app.asar."), true);
  assert.equal(safePatchEntry("../app.asar"), false);

  const root = await fs.mkdtemp(path.join(os.tmpdir(), "crossline-update-test-"));
  try {
    // Version 0.1.32 uses process.noAsar while staging. Keep this bridge test
    // so that an installed 0.1.32 client can safely receive the next release.
    const bridgeAsar = path.join(root, "bridge", "resources", "app.asar");
    const previousNoAsar = process.noAsar;
    process.noAsar = true;
    try {
      await fs.mkdir(path.dirname(bridgeAsar), { recursive: true });
      await fs.writeFile(bridgeAsar, Buffer.from("bridge-asar"), { flag: "wx" });
    } finally {
      process.noAsar = previousNoAsar;
    }
    assert.equal(await realFs.readFile(bridgeAsar, "utf8"), "bridge-asar");

    const zipPath = path.join(root, "patch.zip");
    const staging = path.join(root, "staging");
    const zip = new AdmZip();
    // Deliberately omit directory entries: the updater must create parents itself.
    zip.addFile("payload/resources/app.asar", Buffer.from("test-asar"));
    zip.addFile("patch-manifest.json", Buffer.from(JSON.stringify({ version: "0.1.31", files: ["resources/app.asar"] })));
    zip.writeZip(zipPath);
    const manifest = await extractPatch(zipPath, staging);
    assert.equal(manifest.version, "0.1.31");
    assert.equal(await realFs.readFile(path.join(staging, "payload", "resources", "app.asar"), "utf8"), "test-asar");
  } finally {
    await realFs.rm(root, { recursive: true, force: true });
  }
  console.log("ZIP updater extraction test passed.");
})();
