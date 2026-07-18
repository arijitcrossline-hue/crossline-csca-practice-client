const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("examRuntime", {
  getInfo: () => ipcRenderer.invoke("runtime-info"),
  setScreenCaptureAllowed: (allowed, adminToken) => ipcRenderer.invoke("set-screen-capture-allowed", allowed === true, adminToken),
  onContentProtectionChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("content-protection-changed", listener);
    return () => ipcRenderer.removeListener("content-protection-changed", listener);
  },
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installDownloadedUpdate: () => ipcRenderer.invoke("install-downloaded-update"),
  resetUpdate: () => ipcRenderer.invoke("reset-update"),
  startOAuth: (provider) => ipcRenderer.invoke("start-oauth", provider),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  extractQuestionSource: (payload) => ipcRenderer.invoke("extract-question-source", payload),
  extractHtmlQuestionSource: (file) => ipcRenderer.invoke("extract-html-question-source", webUtils.getPathForFile(file)),
  onSourceImportProgress: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("source-import-progress", listener);
    return () => ipcRenderer.removeListener("source-import-progress", listener);
  },
  onOAuthComplete: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("oauth-complete", listener);
    return () => ipcRenderer.removeListener("oauth-complete", listener);
  },
  onUpdateProgress: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("update-progress", listener);
    return () => ipcRenderer.removeListener("update-progress", listener);
  },
  leaveKiosk: () => ipcRenderer.invoke("leave-kiosk"),
  enterKiosk: () => ipcRenderer.invoke("enter-kiosk"),
  exitApp: () => ipcRenderer.invoke("exit-app"),
  pauseFocusGuard: (milliseconds) => ipcRenderer.invoke("pause-focus-guard", milliseconds),
  onIntegrityEvent: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("integrity-event", listener);
    return () => ipcRenderer.removeListener("integrity-event", listener);
  }
});
