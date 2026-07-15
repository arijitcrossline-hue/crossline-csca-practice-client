const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { createGithubUpdateHelper, compareVersions } = require("../electron/github-updater");

class FakeUpdater extends EventEmitter {
  constructor() {
    super();
    this.quitCalls = [];
  }

  async checkForUpdates() {
    const updateInfo = { version: "0.1.36", releaseDate: "2026-07-15T00:00:00.000Z" };
    this.emit("checking-for-update");
    this.emit("update-available", updateInfo);
    return { updateInfo };
  }

  async downloadUpdate() {
    this.emit("download-progress", { percent: 42, transferred: 42, total: 100, bytesPerSecond: 5000 });
    this.emit("update-downloaded", { version: "0.1.36" });
    return ["update.exe"];
  }

  quitAndInstall(...args) {
    this.quitCalls.push(args);
  }
}

(async () => {
  assert.equal(compareVersions("0.1.36", "0.1.35"), 1);
  const events = [];
  const updater = new FakeUpdater();
  let allowClose = false;
  let focusStopped = false;
  const helper = createGithubUpdateHelper({
    app: { isPackaged: true, getVersion: () => "0.1.35" },
    autoUpdater: updater,
    getMainWindow: () => ({
      isDestroyed: () => false,
      webContents: { send: (_channel, event) => events.push(event) }
    }),
    setAllowClose: (value) => { allowClose = value; },
    stopFocusGuard: () => { focusStopped = true; },
    emitIntegrityEvent: () => {},
    scheduleInstall: (callback) => callback()
  });

  helper.initialize();
  assert.equal(updater.autoDownload, false);
  assert.equal(updater.autoInstallOnAppQuit, true);
  assert.equal(updater.disableDifferentialDownload, false);

  const checked = await helper.checkForUpdates();
  assert.equal(checked.updateAvailable, true);
  assert.equal(checked.latest.version, "0.1.36");
  assert.ok(events.some((event) => event.type === "available"));

  const downloaded = await helper.downloadUpdate();
  assert.equal(downloaded.downloaded, true);
  assert.ok(events.some((event) => event.type === "downloading" && event.percent === 42));
  assert.ok(events.some((event) => event.type === "downloaded"));

  const installed = await helper.installDownloadedUpdate();
  assert.equal(installed.installing, true);
  assert.equal(allowClose, true);
  assert.equal(focusStopped, true);
  assert.deepEqual(updater.quitCalls, [[false, true]]);
  console.log("GitHub updater adapter test passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
