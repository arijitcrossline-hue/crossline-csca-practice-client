const { app, BrowserWindow, globalShortcut, ipcMain, powerSaveBlocker, session, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { createGithubUpdateHelper } = require("./github-updater");
const { extractQuestionSource, extractHtmlQuestionSource } = require("./source-import");

app.commandLine.appendSwitch("enable-media-stream");

const practiceKiosk = !process.argv.includes("--windowed");
let mainWindow;
let powerBlockerId = null;
let allowClose = false;
let focusGuard = null;
let focusGuardPausedUntil = 0;
let kioskActive = false;
let oauthWindow = null;
const API_ORIGIN = "https://api.crosslinecscatest.com";

const blockedShortcuts = [
  "Alt+Tab",
  "Alt+Escape",
  "CommandOrControl+R",
  "CommandOrControl+Shift+R",
  "CommandOrControl+W",
  "CommandOrControl+Q",
  "F5",
  "F11",
  "F12",
  "Alt+F4"
];

function emitIntegrityEvent(type, detail = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("integrity-event", {
    type,
    detail,
    at: new Date().toISOString()
  });
}

function enforceKioskFocus() {
  if (!practiceKiosk || !kioskActive || !mainWindow || mainWindow.isDestroyed()) return;
  if (Date.now() < focusGuardPausedUntil) return;
  mainWindow.setKiosk(true);
  mainWindow.setFullScreen(true);
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.show();
  mainWindow.moveTop();
  mainWindow.focus();
}

function startFocusGuard() {
  if (!practiceKiosk) return;
  kioskActive = true;
  if (!focusGuard) focusGuard = setInterval(enforceKioskFocus, 1000);
  if (powerBlockerId === null) powerBlockerId = powerSaveBlocker.start("prevent-display-sleep");
  blockedShortcuts.forEach((shortcut) => {
    try { globalShortcut.register(shortcut, () => emitIntegrityEvent("blocked_global_shortcut", { shortcut })); } catch {}
  });
  enforceKioskFocus();
}

function stopFocusGuard() {
  kioskActive = false;
  if (focusGuard) clearInterval(focusGuard);
  focusGuard = null;
  globalShortcut.unregisterAll();
  if (powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)) powerSaveBlocker.stop(powerBlockerId);
  powerBlockerId = null;
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setKiosk(false);
  mainWindow.setFullScreen(false);
  mainWindow.setMinimizable(true);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "CSCA Practice Client",
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    icon: path.join(__dirname, "..", "build", "icon.png"),
    autoHideMenuBar: true,
    fullscreen: false,
    kiosk: false,
    alwaysOnTop: false,
    minimizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.setContentProtection(true);
  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, "..", "src", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event) => event.preventDefault());
  mainWindow.webContents.on("before-input-event", (event, input) => {
    const key = input.key.toUpperCase();
    if (!kioskActive) return;
    const blocked =
      input.key === "F12" ||
      input.key === "F5" ||
      input.key === "Escape" ||
      (input.alt && key === "F4") ||
      (input.alt && key === "TAB") ||
      (input.meta && ["Q", "W", "R"].includes(key)) ||
      (input.control && ["R", "W"].includes(key)) ||
      (input.control && input.shift && ["I", "J", "C"].includes(input.key.toUpperCase())) ||
      (input.alt && ["LEFT", "RIGHT"].includes(input.key.toUpperCase()));

    if (blocked) {
      event.preventDefault();
      emitIntegrityEvent("blocked_shortcut", { key: input.key, alt: input.alt, control: input.control, meta: input.meta, shift: input.shift });
    }
  });

  mainWindow.on("blur", () => {
    if (!kioskActive) return;
    emitIntegrityEvent("focus_lost");
    setTimeout(enforceKioskFocus, 50);
    setTimeout(enforceKioskFocus, 250);
    setTimeout(enforceKioskFocus, 750);
  });

  mainWindow.on("minimize", (event) => {
    if (!practiceKiosk || !kioskActive) return;
    event.preventDefault();
    emitIntegrityEvent("minimize_blocked");
    enforceKioskFocus();
  });

  mainWindow.on("close", (event) => {
    if (!practiceKiosk || !kioskActive || allowClose) return;
    event.preventDefault();
    emitIntegrityEvent("close_blocked");
    enforceKioskFocus();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function openOAuthWindow(provider) {
  if (!mainWindow || mainWindow.isDestroyed()) throw new Error("The Crossline window is not available.");
  if (!["google", "facebook"].includes(provider)) throw new Error("Unsupported social sign-in provider.");
  if (oauthWindow && !oauthWindow.isDestroyed()) {
    oauthWindow.focus();
    return true;
  }

  oauthWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    width: 520,
    height: 720,
    minWidth: 420,
    minHeight: 560,
    title: `Continue with ${provider === "google" ? "Google" : "Facebook"}`,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  oauthWindow.setMenu(null);
  oauthWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  oauthWindow.webContents.on("will-redirect", (event, targetUrl) => {
    if (!targetUrl.startsWith(`${API_ORIGIN}/auth/oauth/complete?`)) return;
    event.preventDefault();
    const callback = new URL(targetUrl);
    const token = callback.searchParams.get("token") || "";
    let user = null;
    try { user = JSON.parse(callback.searchParams.get("user") || "null"); } catch {}
    if (token && user && mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("oauth-complete", { token, user });
    oauthWindow?.close();
  });
  oauthWindow.on("closed", () => { oauthWindow = null; });
  oauthWindow.loadURL(`${API_ORIGIN}/auth/oauth/${provider}/start?desktop=1`);
  return true;
}

const updateHelper = createGithubUpdateHelper({
  app,
  autoUpdater,
  getMainWindow: () => mainWindow,
  setAllowClose: (value) => { allowClose = Boolean(value); },
  stopFocusGuard,
  emitIntegrityEvent
});

app.whenReady().then(() => {
  updateHelper.initialize();
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(["media", "camera", "microphone"].includes(permission));
  });

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return ["media", "camera", "microphone"].includes(permission);
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!details.url.startsWith("file:")) return callback({ responseHeaders: details.responseHeaders });
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; font-src 'self' data: https://cdn.jsdelivr.net; img-src 'self' data: blob: https://api.qrserver.com; media-src 'self' blob:; connect-src 'self' https://api.crosslinecscatest.com https://media.crosslinecscatest.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"
        ]
      }
    });
  });

  ipcMain.handle("runtime-info", () => ({
    platform: process.platform,
    practiceKiosk: kioskActive,
    kioskAvailable: practiceKiosk,
    contentProtection: true,
    version: app.getVersion()
  }));

  ipcMain.handle("check-for-updates", updateHelper.checkForUpdates);
  ipcMain.handle("download-update", updateHelper.downloadUpdate);
  ipcMain.handle("install-downloaded-update", updateHelper.installDownloadedUpdate);
  ipcMain.handle("reset-update", updateHelper.resetUpdate);
  ipcMain.handle("start-oauth", (_event, provider) => openOAuthWindow(String(provider || "")));
  ipcMain.handle("open-external", (_event, target) => {
    const url = String(target || "");
    const allowed = [
      "https://discord.gg/",
      "https://exam.crosslinecscatest.com/privacy",
      "https://exam.crosslinecscatest.com/terms",
      "https://exam.crosslinecscatest.com/data-deletion"
    ];
    if (!allowed.some((prefix) => url.startsWith(prefix))) throw new Error("Unsupported external link.");
    return shell.openExternal(url);
  });
  ipcMain.handle("extract-question-source", async (event, payload) => {
    return extractQuestionSource(payload, (progress) => {
      if (!event.sender.isDestroyed()) event.sender.send("source-import-progress", progress);
    });
  });
  ipcMain.handle("extract-html-question-source", async (event, filePath) => {
    return extractHtmlQuestionSource(filePath, (progress) => {
      if (!event.sender.isDestroyed()) event.sender.send("source-import-progress", progress);
    });
  });

  ipcMain.handle("leave-kiosk", () => {
    stopFocusGuard();
    return true;
  });

  ipcMain.handle("enter-kiosk", () => {
    startFocusGuard();
    return practiceKiosk;
  });

  ipcMain.handle("exit-app", () => {
    allowClose = true;
    stopFocusGuard();
    app.quit();
    return true;
  });

  ipcMain.handle("pause-focus-guard", (_event, milliseconds = 2500) => {
    if (!practiceKiosk) return false;
    focusGuardPausedUntil = Date.now() + Math.max(500, Math.min(Number(milliseconds) || 2500, 10000));
    return true;
  });

  createWindow();
  mainWindow.webContents.once("did-finish-load", () => {
    setTimeout(() => updateHelper.checkForUpdates().catch(() => {}), 1200);
  });
});

app.on("will-quit", () => {
  allowClose = true;
  stopFocusGuard();
});

app.on("window-all-closed", () => app.quit());
