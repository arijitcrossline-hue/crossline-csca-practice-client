const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { promisify } = require("node:util");
const { spawn } = require("node:child_process");
const AdmZip = require("adm-zip");

// Electron patches node:fs so paths ending in .asar behave like read-only
// archives. Update staging must use the real filesystem instead.
let originalFs = fs;
try { originalFs = require("original-fs"); } catch {}
const originalFsp = {
  access: promisify(originalFs.access.bind(originalFs)),
  mkdir: promisify(originalFs.mkdir.bind(originalFs)),
  readFile: promisify(originalFs.readFile.bind(originalFs)),
  rm: promisify(originalFs.rm.bind(originalFs)),
  writeFile: promisify(originalFs.writeFile.bind(originalFs))
};

const UPDATE_MANIFEST_URL = "https://media.crosslinecscatest.com/updates/latest.json";
const MAX_PATCH_BYTES = 300 * 1024 * 1024;

function compareVersions(left, right) {
  const a = String(left || "0").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const b = String(right || "0").split(".").map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) > (b[index] || 0) ? 1 : -1;
  }
  return 0;
}

function safePatchEntry(name) {
  const normalized = String(name || "").replace(/\\/g, "/");
  return normalized && !normalized.startsWith("/") && !normalized.split("/").includes("..") && !/^[a-z]:/i.test(normalized);
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function downloadFile(url, destination, onProgress) {
  const response = await fetch(url, { cache: "no-store", redirect: "follow" });
  if (!response.ok || !response.body) throw new Error(`Update download failed (${response.status}).`);
  const total = Number(response.headers.get("content-length") || 0);
  if (total > MAX_PATCH_BYTES) throw new Error("The update patch is unexpectedly large.");
  const output = fs.createWriteStream(destination, { flags: "wx" });
  const reader = response.body.getReader();
  let transferred = 0;
  const startedAt = Date.now();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      transferred += value.byteLength;
      if (transferred > MAX_PATCH_BYTES) throw new Error("The update patch exceeded the allowed size.");
      if (!output.write(Buffer.from(value))) await new Promise((resolve) => output.once("drain", resolve));
      const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);
      onProgress({ transferred, total, percent: total ? (transferred / total) * 100 : 0, bytesPerSecond: transferred / elapsed });
    }
    await new Promise((resolve, reject) => output.end((error) => error ? reject(error) : resolve()));
  } catch (error) {
    output.destroy();
    throw error;
  }
}

async function extractPatch(zipPath, stagingDirectory) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  if (!entries.length || entries.length > 5000 || entries.some((entry) => !safePatchEntry(entry.entryName))) throw new Error("The update ZIP contains unsafe paths.");
  const expandedBytes = entries.reduce((sum, entry) => sum + Number(entry.header?.size || 0), 0);
  if (expandedBytes > 500 * 1024 * 1024) throw new Error("The extracted update is unexpectedly large.");
  const previousNoAsar = process.noAsar;
  process.noAsar = true;
  try {
    await originalFsp.mkdir(stagingDirectory, { recursive: true });
    for (const entry of entries) {
      const normalized = String(entry.entryName).replace(/\\/g, "/");
      const destination = path.join(stagingDirectory, ...normalized.split("/").filter(Boolean));
      if (entry.isDirectory) {
        await originalFsp.mkdir(destination, { recursive: true });
        continue;
      }
      await originalFsp.mkdir(path.dirname(destination), { recursive: true });
      const content = entry.getData();
      if (!content || Number(entry.header?.size || 0) !== content.length) throw new Error(`The update entry ${normalized} is incomplete.`);
      await originalFsp.writeFile(destination, content, { flag: "wx" });
    }
    const manifestPath = path.join(stagingDirectory, "patch-manifest.json");
    const manifest = JSON.parse(await originalFsp.readFile(manifestPath, "utf8"));
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    if (!files.length || files.some((file) => !safePatchEntry(file) || !file.startsWith("resources/"))) throw new Error("The update manifest is invalid.");
    for (const file of files) await originalFsp.access(path.join(stagingDirectory, "payload", file));
    return manifest;
  } finally {
    process.noAsar = previousNoAsar;
  }
}

function helperScript() {
  return String.raw`param(
  [Parameter(Mandatory=$true)][int]$MainProcessId,
  [Parameter(Mandatory=$true)][string]$PayloadDirectory,
  [Parameter(Mandatory=$true)][string]$InstallDirectory,
  [Parameter(Mandatory=$true)][string]$ExecutablePath,
  [Parameter(Mandatory=$true)][string]$CleanupDirectory
)
$ErrorActionPreference = "Stop"
try { Wait-Process -Id $MainProcessId -ErrorAction SilentlyContinue } catch {}
Start-Sleep -Milliseconds 650
Get-ChildItem -LiteralPath $PayloadDirectory -Recurse -File | ForEach-Object {
  $relative = $_.FullName.Substring($PayloadDirectory.Length).TrimStart([char]92, [char]47)
  $destination = Join-Path $InstallDirectory $relative
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
  Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
}
Start-Process -FilePath $ExecutablePath
$cleanup = Join-Path $env:TEMP ("crossline-cleanup-" + [guid]::NewGuid().ToString("N") + ".cmd")
$quote = [char]34
$lines = @("@echo off", "timeout /t 2 /nobreak >nul", ("rmdir /s /q " + $quote + $CleanupDirectory + $quote), ("del /q " + $quote + "%~f0" + $quote))
Set-Content -LiteralPath $cleanup -Value $lines -Encoding ASCII
Start-Process -FilePath "cmd.exe" -ArgumentList "/d", "/c", $cleanup -WindowStyle Hidden
`;
}

function createUpdateHelper({ app, getMainWindow, setAllowClose, stopFocusGuard, emitIntegrityEvent }) {
  let pending = null;
  let staged = null;

  function emitUpdateProgress(detail = {}) {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("update-progress", detail);
  }

  async function checkForUpdates() {
    if (!app.isPackaged) return { currentVersion: app.getVersion(), latest: { version: app.getVersion() }, updateAvailable: false, development: true };
    const response = await fetch(`${UPDATE_MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not check for updates (${response.status}).`);
    const latest = await response.json();
    const updateAvailable = compareVersions(latest.version, app.getVersion()) > 0;
    pending = updateAvailable ? latest : null;
    return { currentVersion: app.getVersion(), latest, updateAvailable, downloaded: Boolean(staged), requiresRestart: Boolean(staged), patchMode: "zip" };
  }

  async function downloadUpdate() {
    const status = pending ? { currentVersion: app.getVersion(), latest: pending, updateAvailable: true } : await checkForUpdates();
    if (!status.updateAvailable) return { ...status, downloaded: false, requiresRestart: false };
    if (staged) return { ...status, downloaded: true, requiresRestart: true, patchMode: "zip" };
    const patchUrl = String(status.latest.patchUrl || "");
    const expectedHash = String(status.latest.patchSha256 || "").toLowerCase();
    if (!patchUrl.startsWith("https://media.crosslinecscatest.com/updates/") || !/^[a-f0-9]{64}$/.test(expectedHash)) throw new Error("This release does not include a valid ZIP patch.");

    const root = await fsp.mkdtemp(path.join(os.tmpdir(), "crossline-update-"));
    const zipPath = path.join(root, "update.zip");
    const stagingDirectory = path.join(root, "staged");
    await fsp.mkdir(stagingDirectory, { recursive: true });
    try {
      emitUpdateProgress({ type: "starting", percent: 0, patchMode: "zip" });
      await downloadFile(patchUrl, zipPath, (progress) => emitUpdateProgress({ type: "downloading", ...progress, patchMode: "zip" }));
      if ((await sha256File(zipPath)) !== expectedHash) throw new Error("The downloaded update failed its integrity check.");
      const manifest = await extractPatch(zipPath, stagingDirectory);
      if (String(manifest.version) !== String(status.latest.version)) throw new Error("The update version does not match its manifest.");
      staged = { root, payload: path.join(stagingDirectory, "payload"), latest: status.latest };
      emitUpdateProgress({ type: "downloaded", percent: 100, requiresRestart: true, patchMode: "zip" });
      return { ...status, downloaded: true, requiresRestart: true, patchMode: "zip" };
    } catch (error) {
      await originalFsp.rm(root, { recursive: true, force: true });
      emitIntegrityEvent("update_error", { message: error.message });
      emitUpdateProgress({ type: "error", message: error.message });
      throw error;
    }
  }

  async function installDownloadedUpdate() {
    if (!staged) return { installing: false, reason: "No downloaded update is ready." };
    if (process.platform !== "win32") return { installing: false, reason: "ZIP patch installation is available on Windows." };
    const scriptPath = path.join(staged.root, "apply-update.ps1");
    await fsp.writeFile(scriptPath, helperScript(), "utf8");
    emitUpdateProgress({ type: "installing", percent: 100, patchMode: "zip" });
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath, "-MainProcessId", String(process.pid), "-PayloadDirectory", staged.payload, "-InstallDirectory", path.dirname(process.execPath), "-ExecutablePath", process.execPath, "-CleanupDirectory", staged.root], { detached: true, stdio: "ignore", windowsHide: true });
    child.unref();
    setAllowClose(true);
    stopFocusGuard();
    setTimeout(() => app.quit(), 120);
    return { installing: true };
  }

  async function resetUpdate() {
    if (staged?.root) await originalFsp.rm(staged.root, { recursive: true, force: true });
    staged = null;
    pending = null;
    emitUpdateProgress({ type: "reset", percent: 0, patchMode: "zip" });
    return { reset: true };
  }

  return { checkForUpdates, downloadUpdate, installDownloadedUpdate, resetUpdate };
}

module.exports = { createUpdateHelper, compareVersions, safePatchEntry, extractPatch };
