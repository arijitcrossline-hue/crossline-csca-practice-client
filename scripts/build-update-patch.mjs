import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip");
const root = path.resolve(import.meta.dirname, "..");
const release = path.join(root, "release");
const unpackedResources = path.join(release, "win-unpacked", "resources");
const packageJson = JSON.parse(await fsp.readFile(path.join(root, "package.json"), "utf8"));
const version = packageJson.version;
const zipName = `Crossline-CSCA-Practice-Patch-${version}.zip`;
const zipPath = path.join(release, zipName);
const versionedInstallerPath = path.join(release, `Crossline-CSCA-Practice-Setup-${version}.exe`);
const installerPath = path.join(release, "Crossline-CSCA-Practice-Setup.exe");
const zip = new AdmZip();
const files = [];
const queuedFiles = [];

function addFile(source, relative) {
  const normalized = relative.replace(/\\/g, "/");
  queuedFiles.push({ source, relative: normalized });
  files.push(normalized);
}

function addDirectory(directory, relativeRoot) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    const relative = path.posix.join(relativeRoot, entry.name);
    if (entry.isDirectory()) addDirectory(source, relative);
    else if (entry.isFile()) addFile(source, relative);
  }
}

addFile(path.join(unpackedResources, "app.asar"), "resources/app.asar");
addDirectory(path.join(unpackedResources, "app.asar.unpacked"), "resources/app.asar.unpacked");
const directories = new Set();
for (const file of queuedFiles) {
  const parts = `payload/${file.relative}`.split("/");
  for (let index = 1; index < parts.length; index += 1) directories.add(parts.slice(0, index).join("/"));
}
[...directories].sort((left, right) => left.split("/").length - right.split("/").length || left.localeCompare(right)).forEach((directory) => {
  zip.addFile(`${directory}/`, Buffer.alloc(0));
});
queuedFiles.forEach(({ source, relative }) => {
  zip.addLocalFile(source, path.posix.dirname(`payload/${relative}`), path.posix.basename(relative));
});
zip.addFile("patch-manifest.json", Buffer.from(JSON.stringify({ version, files }, null, 2)));
zip.writeZip(zipPath);

// The website keeps a stable URL while GitHub uses versioned filenames so the
// differential updater can resolve the previous release's blockmap.
await fsp.copyFile(versionedInstallerPath, installerPath);

const archiveEntries = new Map(new AdmZip(zipPath).getEntries().map((entry) => [entry.entryName, entry]));
for (const file of files) {
  const parts = `payload/${file}`.split("/");
  for (let index = 1; index < parts.length; index += 1) {
    const directory = `${parts.slice(0, index).join("/")}/`;
    if (!archiveEntries.get(directory)?.isDirectory) throw new Error(`Patch ZIP is missing Windows bridge directory ${directory}`);
  }
}

const bytes = await fsp.readFile(zipPath);
const patchSha256 = crypto.createHash("sha256").update(bytes).digest("hex");
const installerBytes = await fsp.readFile(versionedInstallerPath);
const installerSha256 = crypto.createHash("sha256").update(installerBytes).digest("hex");
const latestPath = path.join(release, "latest.json");
let latest = {};
try { latest = JSON.parse(await fsp.readFile(latestPath, "utf8")); } catch {}
latest = {
  ...latest,
  version,
  sha256: installerSha256,
  size: installerBytes.length,
  url: "https://media.crosslinecscatest.com/downloads/Crossline-CSCA-Practice-Setup.exe",
  patchUrl: `https://media.crosslinecscatest.com/updates/${zipName}`,
  patchSha256,
  patchSize: bytes.length,
  notes: "Moves future Windows updates to GitHub Releases with blockmap-assisted differential downloads and in-app progress."
};
await fsp.writeFile(latestPath, `${JSON.stringify(latest, null, 2)}\n`);
console.log(`Built ${zipName} (${(bytes.length / 1024 / 1024).toFixed(1)} MB)`);
