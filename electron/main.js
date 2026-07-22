const { app, BrowserWindow, globalShortcut, ipcMain, net, powerSaveBlocker, protocol, safeStorage, session, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { createContentProtectionController } = require("./content-protection");
const { createGithubUpdateHelper } = require("./github-updater");
const { extractQuestionSource, extractHtmlQuestionSource } = require("./source-import");

app.commandLine.appendSwitch("enable-media-stream");
protocol.registerSchemesAsPrivileged([{
  scheme: "app",
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true }
}]);

const practiceKiosk = !process.argv.includes("--windowed");
let mainWindow;
let powerBlockerId = null;
let allowClose = false;
let focusGuard = null;
let focusGuardPausedUntil = 0;
let kioskActive = false;
let oauthWindow = null;
const API_ORIGIN = "https://api.crosslinecscatest.com";
const APP_ORIGIN = "app://crossline";
const APP_ROOT = path.resolve(__dirname, "..", "src");
const APP_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https://api.crosslinecscatest.com https://media.crosslinecscatest.com https://api.qrserver.com https://lh3.googleusercontent.com; media-src 'self' blob:; connect-src 'self' https://api.crosslinecscatest.com https://media.crosslinecscatest.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";
const SECURE_TOKEN_SLOTS = new Set(["student", "admin"]);

function replaceResponseHeader(headers = {}, name, values) {
  const next = Object.fromEntries(Object.entries(headers).filter(([key]) => key.toLowerCase() !== name.toLowerCase()));
  next[name] = values;
  return next;
}

function assertMainSender(event) {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender.id !== mainWindow.webContents.id || event.senderFrame?.url?.startsWith(`${APP_ORIGIN}/`) !== true) {
    throw new Error("Unsupported window.");
  }
}

function secureTokensPath() {
  return path.join(app.getPath("userData"), "secure-tokens.json");
}

function readSecureTokens() {
  try { return JSON.parse(fs.readFileSync(secureTokensPath(), "utf8")); } catch { return {}; }
}

function writeSecureTokens(tokens) {
  const target = secureTokensPath();
  const temporary = `${target}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(tokens), { mode: 0o600 });
  fs.renameSync(temporary, target);
}

function getSecureToken(slot) {
  if (!SECURE_TOKEN_SLOTS.has(slot) || !safeStorage.isEncryptionAvailable()) return "";
  const encrypted = readSecureTokens()[slot];
  if (!encrypted) return "";
  try { return safeStorage.decryptString(Buffer.from(encrypted, "base64")); } catch { return ""; }
}

function setSecureToken(slot, token) {
  if (!SECURE_TOKEN_SLOTS.has(slot)) throw new Error("Unsupported credential slot.");
  if (!safeStorage.isEncryptionAvailable()) throw new Error("Secure credential storage is unavailable.");
  const value = String(token || "");
  if (value.length > 4096) throw new Error("Credential is too large.");
  const tokens = readSecureTokens();
  if (value) tokens[slot] = safeStorage.encryptString(value).toString("base64");
  else delete tokens[slot];
  writeSecureTokens(tokens);
  return true;
}

async function authorizeAdminScreenCapture(adminToken) {
  const response = await fetch(`${API_ORIGIN}/admin/desktop-capture/authorize`, {
    method: "POST",
    headers: { authorization: `Bearer ${String(adminToken || "")}` }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.authorized) throw new Error(payload.error || "Administrator authorization failed.");
  return payload;
}

const contentProtection = createContentProtectionController({
  getWindow: () => mainWindow,
  authorizeAdmin: authorizeAdminScreenCapture,
  onChange: (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("content-protection-changed", status);
  }
});

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

  contentProtection.protect();
  mainWindow.setMenu(null);
  mainWindow.loadURL(`${APP_ORIGIN}/index.html`);

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
  oauthWindow.webContents.on("will-redirect", async (event, targetUrl) => {
    if (!targetUrl.startsWith(`${API_ORIGIN}/auth/oauth/complete?`)) return;
    event.preventDefault();
    const callback = new URL(targetUrl);
    const code = callback.searchParams.get("code") || "";
    try {
      const response = await fetch(`${API_ORIGIN}/auth/oauth/exchange`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.token || !payload.user) throw new Error(payload.error || "Social sign-in could not be completed.");
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("oauth-complete", payload);
    } catch (error) {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("oauth-complete", { error: error.message || "Social sign-in failed." });
    }
    oauthWindow?.close();
  });
  oauthWindow.webContents.on("will-navigate", (event, targetUrl) => {
    const allowedOrigins = new Set([API_ORIGIN, "https://accounts.google.com", "https://www.facebook.com"]);
    let allowed = false;
    try { allowed = allowedOrigins.has(new URL(targetUrl).origin); } catch {}
    if (!allowed) event.preventDefault();
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
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.resolve(APP_ROOT, `.${requestedPath}`);
    if (filePath !== APP_ROOT && !filePath.startsWith(`${APP_ROOT}${path.sep}`)) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });
  updateHelper.initialize();
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const trusted = webContents.id === mainWindow?.webContents.id && String(details.requestingUrl || "").startsWith(`${APP_ORIGIN}/`);
    callback(trusted && ["media", "camera", "microphone"].includes(permission));
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    return webContents.id === mainWindow?.webContents.id && requestingOrigin === APP_ORIGIN && ["media", "camera", "microphone"].includes(permission);
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (details.url.startsWith(API_ORIGIN)) {
      let headers = replaceResponseHeader(details.responseHeaders, "Access-Control-Allow-Origin", [APP_ORIGIN]);
      headers = replaceResponseHeader(headers, "Vary", ["Origin"]);
      return callback({ responseHeaders: headers });
    }
    if (!details.url.startsWith(`${APP_ORIGIN}/`)) return callback({ responseHeaders: details.responseHeaders });
    callback({
      responseHeaders: replaceResponseHeader(details.responseHeaders, "Content-Security-Policy", [APP_CSP])
    });
  });

  ipcMain.handle("runtime-info", (event) => {
    assertMainSender(event);
    return ({
    platform: process.platform,
    practiceKiosk: kioskActive,
    kioskAvailable: practiceKiosk,
    ...contentProtection.status(),
    version: app.getVersion()
  }); });

  ipcMain.handle("check-for-updates", (event) => { assertMainSender(event); return updateHelper.checkForUpdates(); });
  ipcMain.handle("download-update", (event) => { assertMainSender(event); return updateHelper.downloadUpdate(); });
  ipcMain.handle("install-downloaded-update", (event) => { assertMainSender(event); return updateHelper.installDownloadedUpdate(); });
  ipcMain.handle("reset-update", (event) => { assertMainSender(event); return updateHelper.resetUpdate(); });
  ipcMain.handle("start-oauth", (event, provider) => { assertMainSender(event); return openOAuthWindow(String(provider || "")); });
  ipcMain.handle("set-screen-capture-allowed", async (event, allowed, adminToken = "") => {
    assertMainSender(event);
    return contentProtection.setAllowed(allowed === true, adminToken);
  });
  ipcMain.handle("secure-token-get", (event, slot) => { assertMainSender(event); return getSecureToken(String(slot || "")); });
  ipcMain.handle("secure-token-set", (event, slot, token) => { assertMainSender(event); return setSecureToken(String(slot || ""), token); });
  ipcMain.handle("open-external", (_event, target) => {
    assertMainSender(_event);
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
    assertMainSender(event);
    return extractQuestionSource(payload, (progress) => {
      if (!event.sender.isDestroyed()) event.sender.send("source-import-progress", progress);
    });
  });
  ipcMain.handle("extract-html-question-source", async (event, filePath) => {
    assertMainSender(event);
    return extractHtmlQuestionSource(filePath, (progress) => {
      if (!event.sender.isDestroyed()) event.sender.send("source-import-progress", progress);
    });
  });

  ipcMain.handle("leave-kiosk", (event) => {
    assertMainSender(event);
    stopFocusGuard();
    return true;
  });

  ipcMain.handle("enter-kiosk", (event) => {
    assertMainSender(event);
    startFocusGuard();
    return practiceKiosk;
  });

  ipcMain.handle("exit-app", (event) => {
    assertMainSender(event);
    allowClose = true;
    stopFocusGuard();
    app.quit();
    return true;
  });

  ipcMain.handle("pause-focus-guard", (event, milliseconds = 2500) => {
    assertMainSender(event);
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
