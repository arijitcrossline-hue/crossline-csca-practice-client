function compareVersions(left, right) {
  const a = String(left || "0").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const b = String(right || "0").split(".").map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) > (b[index] || 0) ? 1 : -1;
  }
  return 0;
}

function publicUpdateInfo(info, currentVersion, downloaded = false) {
  const version = String(info?.version || currentVersion || "0.0.0");
  return {
    currentVersion,
    latest: {
      version,
      releaseDate: info?.releaseDate || "",
      releaseName: info?.releaseName || ""
    },
    updateAvailable: compareVersions(version, currentVersion) > 0,
    downloaded,
    requiresRestart: downloaded,
    patchMode: "differential"
  };
}

function createGithubUpdateHelper({
  app,
  autoUpdater,
  getMainWindow,
  setAllowClose,
  stopFocusGuard,
  emitIntegrityEvent,
  scheduleInstall = setImmediate
}) {
  let pendingInfo = null;
  let downloadedInfo = null;
  let initialized = false;

  function emitUpdateProgress(detail = {}) {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("update-progress", detail);
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.autoRunAppAfterInstall = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.disableDifferentialDownload = false;

    autoUpdater.on("checking-for-update", () => {
      emitUpdateProgress({ type: "checking", patchMode: "differential" });
    });
    autoUpdater.on("update-available", (info) => {
      pendingInfo = info;
      emitUpdateProgress({
        type: "available",
        ...publicUpdateInfo(info, app.getVersion()),
        patchMode: "differential"
      });
    });
    autoUpdater.on("update-not-available", (info) => {
      pendingInfo = null;
      emitUpdateProgress({
        type: "not-available",
        ...publicUpdateInfo(info, app.getVersion()),
        patchMode: "differential"
      });
    });
    autoUpdater.on("download-progress", (progress) => {
      emitUpdateProgress({
        type: "downloading",
        percent: Number(progress?.percent || 0),
        transferred: Number(progress?.transferred || 0),
        total: Number(progress?.total || 0),
        bytesPerSecond: Number(progress?.bytesPerSecond || 0),
        patchMode: "differential"
      });
    });
    autoUpdater.on("update-downloaded", (info) => {
      downloadedInfo = info;
      emitUpdateProgress({
        type: "downloaded",
        percent: 100,
        requiresRestart: true,
        ...publicUpdateInfo(info, app.getVersion(), true),
        patchMode: "differential"
      });
    });
    autoUpdater.on("error", (error) => {
      const message = error?.message || "The update service reported an unknown error.";
      emitIntegrityEvent("update_error", { message });
      emitUpdateProgress({ type: "error", message, patchMode: "differential" });
    });
  }

  async function checkForUpdates() {
    initialize();
    if (!app.isPackaged) {
      return {
        ...publicUpdateInfo({ version: app.getVersion() }, app.getVersion()),
        development: true
      };
    }
    const result = await autoUpdater.checkForUpdates();
    const info = result?.updateInfo || pendingInfo || { version: app.getVersion() };
    return publicUpdateInfo(info, app.getVersion(), Boolean(downloadedInfo));
  }

  async function downloadUpdate() {
    initialize();
    if (downloadedInfo) return publicUpdateInfo(downloadedInfo, app.getVersion(), true);
    if (!pendingInfo) {
      const status = await checkForUpdates();
      if (!status.updateAvailable) return status;
    }
    emitUpdateProgress({ type: "starting", percent: 0, patchMode: "differential" });
    await autoUpdater.downloadUpdate();
    const info = downloadedInfo || pendingInfo || { version: app.getVersion() };
    return publicUpdateInfo(info, app.getVersion(), Boolean(downloadedInfo));
  }

  async function installDownloadedUpdate() {
    initialize();
    if (!downloadedInfo) return { installing: false, reason: "No downloaded update is ready." };
    emitUpdateProgress({ type: "installing", percent: 100, patchMode: "differential" });
    setAllowClose(true);
    stopFocusGuard();
    scheduleInstall(() => autoUpdater.quitAndInstall(false, true));
    return { installing: true };
  }

  async function resetUpdate() {
    pendingInfo = null;
    downloadedInfo = null;
    emitUpdateProgress({ type: "reset", percent: 0, patchMode: "differential" });
    return { reset: true };
  }

  return { initialize, checkForUpdates, downloadUpdate, installDownloadedUpdate, resetUpdate };
}

module.exports = { createGithubUpdateHelper, compareVersions, publicUpdateInfo };
