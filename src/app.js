const app = document.getElementById("app");
const letterLabels = ["A", "B", "C", "D"];
const streams = [];
const DEMO_CODE = "246810";
const WINDOWS_CLIENT_URL = "https://media.crosslinecscatest.com/downloads/Crossline-CSCA-Practice-Setup.exe";
const defaultQuestions = [
  {
    type: "Single choice",
    subject: "Physics",
    chapter: "Circular motion",
    topic: "Angular and linear velocity",
    instruction: "Each question has four options, among which only one is correct.",
    text: "As shown in the figure, if two objects A and B with equal mass are placed on a horizontal disk rotating uniformly around the vertical axis, and the two objects remain stationary relative to the disk, then ( )",
    diagram: true,
    answers: ["the angular velocity of A is the same as B", "the angular velocity of A is greater than that of B", "the linear velocity of A is the same as B", "the angular velocity of A is smaller than that of B"]
  },
  { type: "Single choice", subject: "Physics", chapter: "Kinematics", topic: "Constant acceleration", instruction: "Choose the best answer.", text: "A particle moves with constant acceleration. Its velocity changes from 2 m/s to 10 m/s in 4 seconds. What is its acceleration?", answers: ["1 m/s²", "2 m/s²", "3 m/s²", "4 m/s²"] },
  { type: "Single choice", subject: "Mathematics", chapter: "Algebra", topic: "Difference of squares", instruction: "Choose the best answer.", text: "Which expression is equivalent to (x + 3)(x - 3)?", answers: ["x² - 9", "x² + 9", "x² - 6x + 9", "x² + 6x + 9"] },
  { type: "Single choice", subject: "Mathematics", chapter: "Functions", topic: "Function evaluation", instruction: "Choose the best answer.", text: "If f(x) = 2x + 1, what is the value of f(4)?", answers: ["7", "8", "9", "10"] }
];
const defaultExams = [
  { id: "math-physics", title: "CSCA Mathematics and Physics Mock", description: "Full practice paper covering mathematics and physics fundamentals.", duration: 90, questions: Array.from({ length: 48 }, (_, index) => ({ ...defaultQuestions[index % defaultQuestions.length] })) },
  { id: "math-short", title: "CSCA Mathematics Quick Practice", description: "A shorter warm-up paper for testing the examination workflow.", duration: 35, questions: defaultQuestions.slice(1).map((question) => ({ ...question })) }
];

let exams = load("csca-exams", defaultExams);
let users = load("csca-users", [{ email: "student@example.com", username: "Demo Student", password: "demo123", verified: true }]);
let currentUser = null;
let currentExam = null;
let questions = [];
let currentIndex = 0;
let questionScale = 1;
let elapsedSeconds = 0;
let clockTimer = null;
let preflight = { camera: false, microphone: false, network: false, face: false, phone: false, roomScan: false };
let microphoneTest = { stream: null, audioContext: null, analyser: null, animationFrame: null, usingTimeout: false, recording: false };
let pendingRegistration = null;
let pendingPasswordResetEmail = "";
let editorExamId = null;
let editorImage = "";
let editorExplanationImage = "";
let activeSessionId = null;
let integrityEvents = [];
let deviceChangeListenerAttached = false;
let phonePairingTimer = null;
let updateNoticeShown = false;
let updateCheckRunning = false;
let updateInstallRunning = false;
let updatePanelTimer = null;
let updateState = { kind: "idle", message: "", result: null, progress: null };
let authAvatarData = "";
let oauthListenerRegistered = false;
let sourceImportProgressUnsubscribe = null;
let adminAssistantMessages = [];
let adminAssistantAttachment = null;
let pendingImportSource = null;

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function escapeHtml(value = "") { return String(value ?? "").replace(/[&<>"']/g, (match) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[match])); }
function mathHtml(value = "") { return escapeHtml(value).replace(/\n/g, "<br />"); }
function markdownHtml(value = "") {
  if (!window.marked?.parse) return mathHtml(value);
  const parsed = window.marked.parse(String(value || ""), { breaks: true, gfm: true });
  const documentNode = new DOMParser().parseFromString(`<div>${parsed}</div>`, "text/html");
  const allowed = new Set(["DIV", "P", "BR", "STRONG", "EM", "DEL", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "BLOCKQUOTE", "PRE", "CODE", "A", "HR", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD"]);
  documentNode.body.querySelectorAll("*").forEach((element) => {
    if (!allowed.has(element.tagName)) return element.replaceWith(...element.childNodes);
    const href = element.tagName === "A" ? String(element.getAttribute("href") || "") : "";
    [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
    if (element.tagName === "A") {
      if (/^https:\/\//i.test(href)) { element.setAttribute("href", href); element.setAttribute("rel", "noreferrer"); }
    }
  });
  return documentNode.body.firstElementChild?.innerHTML || "";
}
function renderMath() {
  window.MathJax?.typesetPromise?.().catch((error) => console.warn(error));
}
function autoUpdateEnabled() {
  return localStorage.getItem("csca-auto-update") === "true";
}
function setAutoUpdateEnabled(enabled) {
  localStorage.setItem("csca-auto-update", enabled ? "true" : "false");
  showUpdatePanel({
    kind: "info",
    message: enabled ? "Auto-update is enabled. The app will check once per day when it opens." : "Auto-update is disabled.",
    result: updateState.result
  });
  refreshUpdateButtons();
}
function shouldRunDailyUpdateCheck() {
  if (!autoUpdateEnabled()) return false;
  const today = new Date().toISOString().slice(0, 10);
  return localStorage.getItem("csca-last-update-check") !== today;
}
function markDailyUpdateCheck() {
  localStorage.setItem("csca-last-update-check", new Date().toISOString().slice(0, 10));
}
function updatePanelHtml() {
  const state = updateState;
  if (!state.message) return "";
  const result = state.result || {};
  const latest = result.latest?.version || "latest";
  const current = result.currentVersion || "current";
  const autoEnabled = autoUpdateEnabled();
  const canInstall = state.kind === "available";
  const canRestart = state.kind === "ready";
  const progress = typeof state.progress === "number" ? Math.max(0, Math.min(100, state.progress)) : null;
  return `<div class="update-panel ${escapeHtml(state.kind)}" role="status">
    <div>
      <strong>${state.kind === "available" ? "Update available" : state.kind === "error" ? "Update issue" : "Software updates"}</strong>
      <p>${escapeHtml(state.message)}</p>
      ${canInstall ? `<small>Current version: ${escapeHtml(current)} · Latest version: ${escapeHtml(latest)}</small>` : ""}
      ${progress !== null ? `<div class="update-progress" aria-label="Update download progress"><div style="width: ${progress.toFixed(1)}%"></div></div><small>${progress.toFixed(0)}% downloaded${state.speed ? ` · ${escapeHtml(state.speed)}` : ""}</small>` : ""}
    </div>
    <div class="update-actions">
      ${canInstall ? `<button id="install-update" class="primary-button" ${updateInstallRunning ? "disabled" : ""}>${updateInstallRunning ? "Downloading..." : "Yes, update now"}</button>` : ""}
      ${canRestart ? `<button id="restart-update" class="primary-button">Restart and install</button>` : ""}
      ${state.kind === "error" && window.examRuntime?.resetUpdate ? `<button id="reset-update" class="secondary-button">Check again</button>` : ""}
      <button id="toggle-auto-update" class="secondary-button">${autoEnabled ? "Disable auto-update" : "Enable auto-update"}</button>
      <button id="dismiss-update" class="ghost-button">Dismiss</button>
    </div>
  </div>`;
}
function ensureUpdatePanelHost() {
  let host = document.getElementById("update-panel-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "update-panel-host";
    document.body.appendChild(host);
  }
  return host;
}
function renderUpdatePanel() {
  const host = ensureUpdatePanelHost();
  host.innerHTML = updatePanelHtml();
  bind("install-update", "click", installUpdateNow);
  bind("restart-update", "click", restartUpdateNow);
  bind("reset-update", "click", resetUpdateNow);
  bind("toggle-auto-update", "click", () => setAutoUpdateEnabled(!autoUpdateEnabled()));
  bind("dismiss-update", "click", () => {
    updateState = { kind: "idle", message: "", result: updateState.result };
    renderUpdatePanel();
  });
}
async function resetUpdateNow() {
  if (!window.examRuntime?.resetUpdate) return;
  try {
    await window.examRuntime.resetUpdate();
    updateInstallRunning = false;
    updateState = { kind: "idle", message: "", result: null, progress: null };
    showUpdatePanel({ kind: "info", message: "Checking GitHub Releases again..." });
    await checkForUpdates(true);
  } catch (error) {
    showUpdatePanel({ kind: "error", message: `Update reset failed: ${error.message}` });
  }
}
function showUpdatePanel(state, autoDismissMs = 0) {
  updateState = { ...updateState, ...state };
  renderUpdatePanel();
  if (updatePanelTimer) clearTimeout(updatePanelTimer);
  if (autoDismissMs > 0) {
    updatePanelTimer = setTimeout(() => {
      updateState = { kind: "idle", message: "", result: updateState.result };
      renderUpdatePanel();
    }, autoDismissMs);
  }
}
function hideUpdatePanel() {
  if (updatePanelTimer) clearTimeout(updatePanelTimer);
  updatePanelTimer = null;
  updateState = { kind: "idle", message: "", result: updateState.result };
  renderUpdatePanel();
}
function refreshUpdateButtons() {
  const toggle = document.getElementById("toggle-auto-update");
  if (toggle) toggle.textContent = autoUpdateEnabled() ? "Disable auto-update" : "Enable auto-update";
  const headerToggle = document.getElementById("auto-update-toggle");
  if (headerToggle) headerToggle.textContent = autoUpdateEnabled() ? "Auto-update on" : "Enable auto-update";
}
async function installUpdateNow({ restartAfterDownload = false } = {}) {
  if (!window.examRuntime?.downloadUpdate) return;
  if (updateInstallRunning) return;
  updateInstallRunning = true;
  showUpdatePanel({ kind: "info", message: "Downloading the signed release changes from GitHub...", progress: 0 });
  try {
    const result = await window.examRuntime.downloadUpdate();
    updateInstallRunning = false;
    updateState.result = result;
    showUpdatePanel({
      kind: "ready",
      message: restartAfterDownload ? "Update downloaded. The app will restart now to finish installing." : "Update downloaded. Click Restart and install when you are ready.",
      result,
      progress: 100
    });
    if (restartAfterDownload) setTimeout(restartUpdateNow, 900);
  } catch (error) {
    updateInstallRunning = false;
    showUpdatePanel({ kind: "error", message: `Update install failed: ${error.message}` });
  }
}
async function restartUpdateNow() {
  if (!window.examRuntime?.installDownloadedUpdate) return;
  try {
    showUpdatePanel({ kind: "info", message: "Restarting the app to finish the update...", progress: 100 });
    await window.examRuntime.installDownloadedUpdate();
  } catch (error) {
    showUpdatePanel({ kind: "error", message: `Update restart failed: ${error.message}` });
  }
}
async function checkForUpdates(manual = false, autoInstall = false) {
  if (!window.examRuntime?.checkForUpdates) return;
  if (updateCheckRunning) return;
  updateCheckRunning = true;
  if (manual) showUpdatePanel({ kind: "info", message: "Checking for updates..." });
  try {
    const result = await window.examRuntime.checkForUpdates();
    updateState.result = result;
    if (!result.updateAvailable) {
      if (manual) showUpdatePanel({ kind: "info", message: "You are already using the latest Crossline CSCA Practice Client.", result }, 5000);
      return;
    }
    updateNoticeShown = true;
    showUpdatePanel({
      kind: "available",
      message: autoInstall ? "A new update is available. Auto-update is downloading it from GitHub in the background." : "A new Crossline CSCA Practice Client update is available. Click Yes to download it.",
      result
    });
    if (autoInstall) await installUpdateNow();
  } catch (error) {
    if (manual) showUpdatePanel({ kind: "error", message: `Update check failed: ${error.message}` });
  } finally {
    updateCheckRunning = false;
  }
}
function isDesktopClient() { return Boolean(window.examRuntime); }
function header(actions = "") {
  return `<header class="portal-header"><div class="brand"><div class="brand-identity"><img class="brand-logo" src="assets/crossline-icon.png" alt="Crossline Education" /><span class="brand-name">Crossline Education</span></div><div class="brand-copy"><strong>CSCA Examination Portal</strong><small>INTERNATIONAL STUDENT ASSESSMENT</small></div></div><div class="header-actions">${actions}</div></header>`;
}
function desktopExitAction(extra = "", options = {}) {
  const updateButtons = options.updates ? `<button id="check-updates" class="header-link">Check updates</button><button id="auto-update-toggle" class="header-link">${autoUpdateEnabled() ? "Auto-update on" : "Enable auto-update"}</button>` : "";
  return `${extra}${isDesktopClient() ? `${updateButtons}<button id="exit-app" class="header-link">Exit app</button>` : ""}`;
}
function bindDesktopExit(options = {}) {
  bind("exit-app", "click", () => window.examRuntime?.exitApp?.());
  if (options.updates) {
    bind("check-updates", "click", () => checkForUpdates(true));
    bind("auto-update-toggle", "click", () => setAutoUpdateEnabled(!autoUpdateEnabled()));
  } else if (!updateInstallRunning && updateState.kind !== "ready") {
    hideUpdatePanel();
  }
  if (options.updates && !updateNoticeShown && shouldRunDailyUpdateCheck()) {
    markDailyUpdateCheck();
    setTimeout(() => checkForUpdates(false, autoUpdateEnabled()), 800);
  }
}
function registerUpdateProgressEvents() {
  window.examRuntime?.onUpdateProgress?.((event) => {
    if (event.type === "available") {
      updateNoticeShown = true;
      showUpdatePanel({
        kind: "available",
        message: "A new Crossline CSCA Practice Client update is available on GitHub.",
        result: event
      });
      return;
    }
    if (event.type === "starting") {
      showUpdatePanel({ kind: "info", message: "Preparing the GitHub update download...", progress: 0 });
      return;
    }
    if (event.type === "downloading") {
      const percent = Number(event.percent) || 0;
      const mbPerSecond = event.bytesPerSecond ? `${(event.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s` : "";
      showUpdatePanel({ kind: "info", message: "Downloading update changes. Keep the app open until it reaches 100%.", progress: percent, speed: mbPerSecond });
      return;
    }
    if (event.type === "downloaded") {
      updateInstallRunning = false;
      showUpdatePanel({ kind: "ready", message: "Update downloaded. Click Restart and install when you are ready.", progress: 100 });
      return;
    }
    if (event.type === "error") {
      updateInstallRunning = false;
      showUpdatePanel({ kind: "error", message: `Update failed: ${event.message || "Unknown error"}` });
    }
  });
}
function ensureKiosk() {
  window.examRuntime?.enterKiosk?.();
}
function leaveKiosk() {
  window.examRuntime?.leaveKiosk?.();
}
function stopMedia() {
  stopMicrophoneRecordingTest(false);
  stopPhonePollers();
  streams.splice(0).forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
}
function stopPhonePollers() {
  if (phonePairingTimer) clearInterval(phonePairingTimer);
  phonePairingTimer = null;
}
function bind(id, event, handler) { const element = document.getElementById(id); if (element) element.addEventListener(event, handler); }
function apiEnabled() { return Boolean(window.CrosslineApi?.enabled()); }
function localModeNote(text) { return apiEnabled() ? "" : text; }
function localSessionKey() { return "csca-local-current-user"; }
function rememberLocalUser(user) { save(localSessionKey(), user?.email || ""); }
function clearStudentSession() {
  currentUser = null;
  activeSessionId = null;
  localStorage.removeItem(localSessionKey());
  window.CrosslineApi?.clearStudentToken?.();
}
function requestStudentLogout() {
  if (document.getElementById("student-logout-confirm")) return;
  const modal = document.createElement("div");
  modal.id = "student-logout-confirm";
  modal.className = "logout-confirm-backdrop";
  modal.innerHTML = `<section class="logout-confirm-card" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title"><p class="dash-card-kicker">Account</p><h2 id="logout-confirm-title">Log out of Crossline?</h2><p>You will need to sign in again to access your exams and results.</p><div><button id="cancel-student-logout" class="dash-outline-button">Stay signed in</button><button id="confirm-student-logout" class="danger-button">Log out</button></div></section>`;
  document.body.appendChild(modal);
  bind("cancel-student-logout", "click", () => modal.remove());
  bind("confirm-student-logout", "click", () => { modal.remove(); clearStudentSession(); showAuth(); });
}

function showClientLoading(message = "Preparing your dashboard") {
  app.innerHTML = `<main class="csca-loading-screen" aria-live="polite"><span class="sr-only">Student dashboard</span><div class="csca-loading-brand"><img src="assets/crossline-icon.png" alt="" /><span>Cross-Line<small>Education</small></span></div><div class="csca-loading-letters" aria-label="CSCA loading"><i>C</i><i>S</i><i>C</i><i>A</i></div><strong>${escapeHtml(message)}</strong><p>Bringing your exams and progress into focus.</p><div class="csca-loading-track"><span></span></div></main>`;
}
async function restoreStudentSession() {
  if (apiEnabled()) {
    const token = window.CrosslineApi?.getStudentToken?.();
    if (!token) return false;
    try {
      const payload = await window.CrosslineApi.me();
      currentUser = payload.user;
      await refreshExamsFromApi(false);
      await showStudentDashboard();
      return true;
    } catch {
      window.CrosslineApi?.clearStudentToken?.();
      return false;
    }
  }
  const email = String(load(localSessionKey(), "")).trim().toLowerCase();
  const user = users.find((candidate) => candidate.email === email && candidate.verified);
  if (!user) return false;
  currentUser = user;
  await showStudentDashboard();
  return true;
}
function registerOAuthListener() {
  if (oauthListenerRegistered || !window.examRuntime?.onOAuthComplete) return;
  oauthListenerRegistered = true;
  window.examRuntime.onOAuthComplete(async (payload = {}) => {
    if (!payload.token || !payload.user) return showAuth("login", "Social sign-in could not be completed.");
    window.CrosslineApi?.setStudentToken?.(payload.token);
    currentUser = payload.user;
    try {
      await refreshExamsFromApi(false);
      await showStudentDashboard("", { loading: true });
    } catch (error) {
      showAuth("login", error.message || "Social sign-in completed, but your dashboard could not load.");
    }
  });
}
async function startSocialLogin(provider) {
  if (!isDesktopClient() || !window.examRuntime?.startOAuth) {
    return showAuth("login", "Social sign-in is available in the Crossline Windows client.");
  }
  try {
    await window.examRuntime.startOAuth(provider);
  } catch (error) {
    showAuth("login", error.message || "Could not open social sign-in.");
  }
}
function readProfilePhoto(file) {
  if (!file) return Promise.resolve("");
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => resolve("");
      image.onload = () => {
        const longestEdge = Math.max(image.naturalWidth, image.naturalHeight, 1);
        const scale = Math.min(1, 320 / longestEdge);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) return resolve("");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}
function formatDateTime(value) {
  if (!value) return "Not yet";
  try { return new Date(value).toLocaleString(); } catch { return value; }
}
function resultEmailStatus(submission = {}) {
  if (submission.resultEmailedAt) return `Sent ${formatDateTime(submission.resultEmailedAt)}`;
  if (submission.resultEmailAfter) return `Scheduled ${formatDateTime(submission.resultEmailAfter)}`;
  if (submission.submittedAt) return "Waiting to schedule";
  return "Not submitted";
}
function normalizeApiExam(exam) {
  return {
    ...exam,
    duration: Number(exam.duration || exam.duration_minutes || 60),
    questions: (exam.questions || []).map((question, index) => ({
      type: question.type || "Single choice",
      subject: question.subject || "",
      chapter: question.chapter || "",
      topic: question.topic || "",
      instruction: question.instruction || "Choose the best answer.",
      text: question.text || "",
      answers: question.answers || [],
      correctIndex: Number(question.correctIndex || question.correct_index || 0),
      marks: normalizeMarks(question.marks),
      explanation: question.explanation || question.explanation_text || "",
      explanationImage: question.explanationImage || question.explanation_image_url || "",
      image: question.image || question.image_url || "",
      diagram: Boolean(question.diagram),
      backendId: question.id,
      id: index + 1
    }))
  };
}
function normalizeMarks(value) {
  const marks = Number(value);
  return Number.isFinite(marks) && marks > 0 ? marks : 1;
}
function formatScore(value) {
  const score = Math.round(Number(value || 0) * 100) / 100;
  return Number.isInteger(score) ? String(score) : score.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
function currentProfileKey() {
  return `csca-profile-${currentUser?.email || "guest"}`;
}
function getStudentProfile() {
  return load(currentProfileKey(), { photo: currentUser?.avatarUrl || "" });
}
function saveStudentProfile(profile) {
  save(currentProfileKey(), profile);
}
async function updateStudentProfile(profile) {
  saveStudentProfile({ ...getStudentProfile(), ...profile });
  if (!apiEnabled()) return currentUser;
  const payload = await window.CrosslineApi.updateProfile({
    username: currentUser?.username || "",
    firstName: currentUser?.firstName || currentUser?.first_name || "",
    lastName: currentUser?.lastName || currentUser?.last_name || "",
    avatarUrl: profile.photo || ""
  });
  currentUser = payload.user;
  return currentUser;
}
function deriveUsernameFromEmail(email = "") {
  const base = String(email).split("@")[0] || "Student";
  return base.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function displayName(user = currentUser) {
  const fullName = `${String(user?.firstName || user?.first_name || "").trim()} ${String(user?.lastName || user?.last_name || "").trim()}`.trim();
  return fullName || String(user?.username || "").trim() || deriveUsernameFromEmail(user?.email);
}
function profileInitials(user = currentUser) {
  return displayName(user).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
}
function getLocalResults() {
  return load(`csca-results-${currentUser?.email || "guest"}`, []);
}
function saveLocalResults(results) {
  save(`csca-results-${currentUser?.email || "guest"}`, results);
}
function resultPercent(result) {
  const earned = Number(result.score?.earned || 0);
  const total = Number(result.score?.total || 0);
  return total ? Math.round((earned / total) * 100) : 0;
}
function summarizeResults(results = [], details = []) {
  const ready = results.filter((result) => result.ready !== false && result.score);
  const latest = ready[0] || null;
  const comparisonScores = ready.slice(1, 6).map(resultPercent);
  const comparisonAverage = comparisonScores.length
    ? comparisonScores.reduce((sum, score) => sum + score, 0) / comparisonScores.length
    : null;
  const improvement = latest && comparisonAverage !== null ? Math.round((resultPercent(latest) - comparisonAverage) * 10) / 10 : null;
  const now = new Date();
  const thisMonthCount = results.filter((result) => {
    const submitted = new Date(result.submittedAt || 0);
    return submitted.getFullYear() === now.getFullYear() && submitted.getMonth() === now.getMonth();
  }).length;
  const weaknessMap = new Map();
  const skipped = [];
  details.flatMap((detail) => detail.questions || []).forEach((question) => {
    const topic = question.chapter || question.topic || question.type || "General practice";
    if (question.correct === false) weaknessMap.set(topic, (weaknessMap.get(topic) || 0) + 1);
    if (question.selected === null || question.selected === undefined) skipped.push(question);
  });
  const weakness = [...weaknessMap.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    latest,
    attemptedCount: results.length,
    thisMonthCount,
    readyCount: ready.length,
    average: ready.length ? Math.round(ready.reduce((sum, result) => sum + resultPercent(result), 0) / ready.length) : 0,
    improvement,
    weakness: weakness ? `${weakness[0]} (${weakness[1]} wrong)` : "Not enough completed results yet",
    skipped: skipped.slice(-10).reverse()
  };
}
async function refreshExamsFromApi(admin = false) {
  if (!apiEnabled()) return;
  const payload = admin ? await window.CrosslineApi.adminExams() : await window.CrosslineApi.exams();
  exams = (payload.exams || []).map(normalizeApiExam);
  save("csca-exams", exams);
}
async function recordSessionEvent(type, payload = {}) {
  if (!apiEnabled() || !activeSessionId) return;
  try { await window.CrosslineApi.event(activeSessionId, type, payload); } catch (error) { console.warn(error); }
}
async function saveSessionAnswers(submitted = false) {
  if (!apiEnabled() || !activeSessionId) return;
  const answers = Object.fromEntries(questions.map((question) => [question.backendId || question.id, question.answer]));
  const flags = questions.filter((question) => question.flagged).map((question) => question.backendId || question.id);
  try { return await window.CrosslineApi.saveAnswers(activeSessionId, answers, flags, submitted); } catch (error) { console.warn(error); return null; }
}
function uiIcon(name, className = "landing-icon") {
  return `<span class="${className} icon-${name}" aria-hidden="true"></span>`;
}

function windowsDownloadLogo(className = "windows-download-logo") {
  return `<img class="${className}" src="assets/windows-download-logo.svg" alt="" aria-hidden="true" />`;
}

function showDownloadLanding() {
  stopMedia();
  app.innerHTML = `
  <main class="landing-page">
    <section class="landing-shell">
      <nav class="landing-nav">
        <a class="landing-brand" href="#top" aria-label="Crossline Education">
          <img class="landing-brand-mark" src="assets/crossline-icon.png" alt="" />
          <span class="landing-brand-word">Cross-Line<small>Education</small></span>
        </a>
        <div class="landing-nav-actions">
          <button class="landing-account-cta" data-create-account type="button">Create account</button>
          <a id="header-download" class="landing-nav-download disabled-link" href="#" aria-disabled="true">${uiIcon("download")}<span>Download app</span></a>
        </div>
      </nav>

      <div class="landing-hero" id="top">
        <div class="landing-copy">
          <h1>
            <span class="landing-title-line">Smart Mock Exam</span>
            <span class="landing-title-line">Software for <span class="landing-title-highlight">Real Results.</span></span>
          </h1>
          <p>Create your account on the website, download the Windows client, then log in inside the app to take the mock exam.</p>
          <div class="landing-cta-row">
            <a class="landing-download download-button disabled-link" id="client-download" href="#" data-download-url="${WINDOWS_CLIENT_URL}" aria-disabled="true">${windowsDownloadLogo()}<span>Preparing Windows app</span></a>
            <button class="landing-secondary-action" data-create-account type="button">Create account</button>
          </div>
          <p class="landing-download-note" id="download-note">Windows 10 or newer is recommended. Download the app, run it, then sign in inside the client.</p>
        </div>

        <div class="landing-showcase" id="dashboard-preview">
          <article class="landing-app-window">
            <div class="landing-window-inner">
              <aside class="landing-app-sidebar">
                <div class="landing-app-logo"><img src="assets/crossline-icon.png" alt="" /><span>Cross-Line<small>Education</small></span></div>
                <b>${uiIcon("house")}<span>Dashboard</span></b>
                <span>${uiIcon("clipboard-list")}<span>Exams</span></span>
                <span>${uiIcon("bar-chart-3")}<span>Results</span></span>
                <span>${uiIcon("target")}<span>Weakness Analysis</span></span>
                <span>${uiIcon("trophy")}<span>Leaderboard</span></span>
                <div class="landing-mini-user"><i>LC</i><small>Liam Carter<br />CSCA Candidate</small></div>
              </aside>
              <section class="landing-app-main">
                <div class="landing-app-header">
                  <div><h2>Good morning, Liam! 👋</h2><p>Ready to ace your next exam? Let's keep the momentum going.</p></div>
                  <div class="landing-app-icons"><span>${uiIcon("bell")}</span></div>
                </div>
                <div class="landing-start-card">
                  <span class="landing-start-symbol">${uiIcon("square-check-big")}</span><div><b>All set for your next challenge?</b><small>Attempt a new mock exam and track your progress.</small></div><button>Start Exam ${uiIcon("chevron-right")}</button>
                </div>
                <div class="landing-stat-grid">
                  <div><i>${uiIcon("trophy")}</i><small>Latest Score</small><strong>78.5%</strong><em>CSCA Mock Exam 12</em></div>
                  <div><i>${uiIcon("trending-up")}</i><small>Average Improvement</small><strong>+12.4%</strong><em>vs last 5 exams</em></div>
                  <div><i>${uiIcon("file-text")}</i><small>Exams Attempted</small><strong>16</strong><em>Total Mock Exams</em></div>
                  <div><i>${uiIcon("badge-check")}</i><small>Average Score</small><strong>71.3%</strong><em>Across all exams</em></div>
                </div>
                <div class="landing-card-grid">
                  <div><b>Biggest Weaknesses</b><span>Chemistry <i style="--w:42%"></i></span><span>Physics <i style="--w:48%"></i></span><span>Academic Chinese <i style="--w:53%"></i></span></div>
                  <div><b>Last Skipped Question</b><p>Physics • Work, Energy &amp; Power</p><small>A body of mass m is projected vertically upward...</small></div>
                  <div><b>Detailed Results</b><p>Dive deep into your performance and track progress over time.</p><button>View Results ${uiIcon("chevron-right")}</button></div>
                </div>
                <div class="landing-chart-card" id="results">
                  <div class="landing-chart-head"><b>Past Exam Performance</b><span>All Exams ${uiIcon("chevron-right")}</span></div>
                  <svg viewBox="0 0 680 170" role="img" aria-label="Past exam performance from 52.1 percent to 78.5 percent">
                    <defs><linearGradient id="landingChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f05b53" stop-opacity=".28"/><stop offset="1" stop-color="#f05b53" stop-opacity=".04"/></linearGradient></defs>
                    <g class="chart-grid">
                      <line x1="58" y1="30" x2="650" y2="30"/><line x1="58" y1="62" x2="650" y2="62"/><line x1="58" y1="94" x2="650" y2="94"/><line x1="58" y1="126" x2="650" y2="126"/><line x1="58" y1="142" x2="650" y2="142"/>
                    </g>
                    <g class="chart-y"><text x="6" y="34">100%</text><text x="16" y="66">75%</text><text x="16" y="98">50%</text><text x="16" y="130">25%</text><text x="22" y="146">0%</text></g>
                    <polygon points="70,92 184,84 298,75 412,65 526,58 640,48 640,142 70,142" fill="url(#landingChartFill)"/>
                    <polyline points="70,92 184,84 298,75 412,65 526,58 640,48" fill="none" stroke="#d71920" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    <g class="chart-points" fill="#d71920">
                      <circle cx="70" cy="92" r="6"/><circle cx="184" cy="84" r="6"/><circle cx="298" cy="75" r="6"/><circle cx="412" cy="65" r="6"/><circle cx="526" cy="58" r="6"/><circle cx="640" cy="48" r="6"/>
                    </g>
                    <g class="chart-values"><text x="70" y="80">52.1%</text><text x="184" y="72">58.4%</text><text x="298" y="63">64.2%</text><text x="412" y="53">69.8%</text><text x="526" y="46">72.6%</text><text x="640" y="36">78.5%</text></g>
                    <g class="chart-x"><text x="70" y="153">Mock 7</text><text x="184" y="153">Mock 8</text><text x="298" y="153">Mock 9</text><text x="412" y="153">Mock 10</text><text x="526" y="153">Mock 11</text><text x="640" y="153">Mock 12</text></g>
                  </svg>
                </div>
              </section>
            </div>
          </article>
        </div>
      </div>

      <section class="landing-feature-strip" aria-label="Key benefits">
        <article><span>${uiIcon("trending-up", "landing-icon feature-icon")}</span><div><h3>Track Performance</h3><p>Monitor scores and accuracy with clear analytics.</p></div></article>
        <article><span>${uiIcon("target", "landing-icon feature-icon")}</span><div><h3>Identify Weaknesses</h3><p>Find weak topics and focus on what matters most.</p></div></article>
        <article><span>${uiIcon("bar-chart-3", "landing-icon feature-icon")}</span><div><h3>Improve Consistently</h3><p>Practice smarter and see measurable improvement.</p></div></article>
      </section>

      <section class="landing-final-cta" id="download">
        <h2>Download the Crossline Windows app</h2>
        <p>The website is only the product page. Exams run inside the Windows client.</p>
        <a class="landing-download download-button disabled-link" id="cta-download" href="#" data-download-url="${WINDOWS_CLIENT_URL}" aria-disabled="true">${windowsDownloadLogo()}<span>Preparing Windows app</span></a>
      </section>
    </section>
  </main>`;
  hydrateDownloadLinks();
  wireLandingInteractions();
  bindLandingAccountButtons();
}

const legalPageContent = {
  privacy: {
    title: "Privacy Policy",
    summary: "How Crossline CSCA Practice handles account, exam, and device-check information.",
    sections: [
      ["Information we collect", "We store the account details you provide, including your email address, username, first and last name, and optional profile picture. We also store exam answers, scores, result history, and topic-level performance so the dashboard can show progress and weaknesses."],
      ["Google and Facebook sign-in", "If you choose social sign-in, the provider sends us your account identifier, verified email address, name, and profile picture. We use this only to create or connect your Crossline account."],
      ["Camera and microphone checks", "The Windows client requests webcam and microphone access only for the pre-exam equipment simulation. The secondary phone camera is used for the connection, landscape, and room-scan simulation. Crossline does not record, upload, or store video or audio from these checks."],
      ["How information is used", "We use account and exam information to authenticate students, run mock exams, calculate results, deliver result emails, show performance analytics, and operate the administration tools. We do not sell personal information."],
      ["Storage and security", "Account and exam data is stored in the Crossline service and protected with access controls and encrypted network connections. We retain it while the account is active or while it is reasonably needed to provide the service and meet legal obligations."],
      ["Your choices", "You can change your name and profile picture in the app. You can request account and associated-data deletion by following the data deletion instructions linked below."],
      ["Contact", "Questions about privacy can be sent to verify@crosslinecscatest.com."]
    ]
  },
  terms: {
    title: "Terms of Service",
    summary: "The basic rules for using the Crossline CSCA Practice website and Windows client.",
    sections: [
      ["Practice service", "Crossline CSCA Practice is a mock-exam and learning service. It is not the official CSCA examination system and does not guarantee admission, certification, or a particular examination result."],
      ["Accounts", "Provide accurate account information and keep your password private. You are responsible for activity performed through your account. Do not share an account or attempt to access another user's account."],
      ["Acceptable use", "Do not disrupt the service, bypass access controls, upload harmful material, scrape private information, or use the software to violate the rights of another person. Exam content may be used only for personal study unless Crossline gives written permission."],
      ["Results and availability", "Scores and analytics are educational guidance. We work to keep the service available and accurate, but temporary interruptions, corrections, and updates may occur."],
      ["Account suspension", "Crossline may restrict access when an account is used fraudulently, abusively, or in a way that threatens other students or the service."],
      ["Changes", "These terms may be updated as the service changes. Continued use after an update means you accept the revised terms."],
      ["Contact", "Questions about these terms can be sent to verify@crosslinecscatest.com."]
    ]
  },
  "data-deletion": {
    title: "Data Deletion Instructions",
    summary: "How to delete a Crossline account and the information linked to it.",
    sections: [
      ["Request deletion", "Email verify@crosslinecscatest.com from the email address registered to your Crossline account. Use the subject “Data Deletion Request” and include your username."],
      ["Verification", "We may reply to confirm that the request came from the account owner. Do not send your password, social-login token, or any identity document unless Crossline support explains why it is legally required."],
      ["What is deleted", "After verification, we delete or anonymize the account profile, linked Google or Facebook sign-in connection, exam attempts, answers, results, and notification history, except information that must be retained for security, fraud prevention, or legal obligations."],
      ["Timing", "We aim to complete verified deletion requests within 30 days and will confirm when the process is complete."],
      ["Remove Facebook access", "You can also remove Crossline from Facebook's Apps and Websites settings. Removing Facebook access stops future Facebook sign-in but does not by itself delete data already held by Crossline, so send the deletion request as described above."]
    ]
  }
};

function showLegalPage(pageKey) {
  stopMedia();
  const page = legalPageContent[pageKey] || legalPageContent.privacy;
  app.innerHTML = `<main class="legal-page">
    <nav class="legal-nav">
      ${landingBrandMarkup()}
      <a href="/" class="legal-home-link">Back to Crossline</a>
    </nav>
    <article class="legal-document">
      <p class="legal-eyebrow">Crossline CSCA Practice</p>
      <h1>${escapeHtml(page.title)}</h1>
      <p class="legal-summary">${escapeHtml(page.summary)}</p>
      <p class="legal-effective">Effective July 11, 2026</p>
      ${page.sections.map(([heading, body]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`).join("")}
      <footer><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/data-deletion">Data Deletion</a></footer>
    </article>
  </main>`;
}

function showAuthLegalModal(pageKey) {
  document.getElementById("auth-legal-modal")?.remove();
  const page = legalPageContent[pageKey] || legalPageContent.privacy;
  const modal = document.createElement("div");
  modal.id = "auth-legal-modal";
  modal.className = "auth-legal-backdrop";
  modal.innerHTML = `<article class="auth-legal-modal" role="dialog" aria-modal="true" aria-labelledby="auth-legal-title"><div class="auth-legal-heading"><div><p class="legal-eyebrow">Crossline CSCA Practice</p><h2 id="auth-legal-title">${escapeHtml(page.title)}</h2></div><button id="close-auth-legal" type="button" aria-label="Close">×</button></div><p>${escapeHtml(page.summary)}</p><div class="auth-legal-scroll">${page.sections.map(([heading, body]) => `<section><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(body)}</p></section>`).join("")}</div></article>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  bind("close-auth-legal", "click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
}

function legalPageFromPath(pathname = window.location.pathname) {
  const normalized = String(pathname || "/").replace(/\/+$/, "") || "/";
  return normalized === "/privacy" ? "privacy" : normalized === "/terms" ? "terms" : normalized === "/data-deletion" ? "data-deletion" : "";
}

function wireLandingInteractions() {
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("in"); });
    }, { threshold: 0.12 });
    document.querySelectorAll(".landing-hero, .landing-feature-strip, .landing-final-cta").forEach((el) => { el.classList.add("reveal"); io.observe(el); });
  }
}

function bindLandingAccountButtons() {
  document.querySelectorAll("[data-create-account]").forEach((button) => {
    button.addEventListener("click", () => showWebsiteRegister());
  });
}

function landingBrandMarkup() {
  return `<a class="landing-brand" href="#top" aria-label="Crossline Education">
    <img class="landing-brand-mark" src="assets/crossline-icon.png" alt="" />
    <span class="landing-brand-word">Cross-Line<small>Education</small></span>
  </a>`;
}

function showWebsiteRegister(message = "") {
  stopMedia();
  message = typeof message === "string" ? message : "";
  app.innerHTML = `
  <main class="landing-page">
    <section class="landing-shell landing-account-shell">
      <nav class="landing-nav">
        ${landingBrandMarkup()}
        <button id="back-landing" class="landing-account-cta" type="button">Back to download</button>
      </nav>
      <section class="landing-account-layout">
        <div class="landing-account-copy">
          <h1>Create your Crossline account.</h1>
          <p>Register here, verify your email, then use the same email and password inside the Windows app.</p>
        </div>
        <form id="website-register-form" class="landing-account-panel">
          <div class="auth-avatar-field"><label class="auth-avatar-picker" title="Add profile picture"><span id="website-avatar-preview">${authAvatarData ? `<img src="${escapeHtml(authAvatarData)}" alt="Profile preview" />` : "Add photo"}</span><input id="website-register-avatar" type="file" accept="image/*" /></label><div><strong>Profile picture</strong><small>Optional. You can change this later in the Windows app.</small></div></div>
          <div class="auth-name-grid"><div class="field"><label>First name</label><input id="website-register-first-name" type="text" maxlength="60" autocomplete="given-name" required /></div><div class="field"><label>Last name</label><input id="website-register-last-name" type="text" maxlength="60" autocomplete="family-name" required /></div></div>
          <div class="field"><label>Username</label><input id="website-register-username" type="text" maxlength="40" placeholder="Example: Arijit" required /></div>
          <div class="field"><label>Email address</label><input id="website-register-email" type="email" required /></div>
          <div class="field"><label>Create password</label><input id="website-register-password" type="password" minlength="6" required /></div>
          <p class="form-note">${apiEnabled() ? "We will email a verification code before the account is ready." : "This prototype displays the verification code locally."}</p>
          <p class="form-message">${escapeHtml(message)}</p>
          <button class="primary-button full-width">Register and verify email</button>
        </form>
      </section>
    </section>
  </main>`;
  bind("back-landing", "click", showDownloadLanding);
  bind("website-register-avatar", "change", async (event) => {
    authAvatarData = await readProfilePhoto(event.target.files?.[0]);
    const preview = document.getElementById("website-avatar-preview");
    if (preview) preview.innerHTML = authAvatarData ? `<img src="${escapeHtml(authAvatarData)}" alt="Profile preview" />` : "Add photo";
  });
  bind("website-register-form", "submit", async (event) => {
    event.preventDefault();
    pendingRegistration = {
      username: document.getElementById("website-register-username").value.trim(),
      firstName: document.getElementById("website-register-first-name").value.trim(),
      lastName: document.getElementById("website-register-last-name").value.trim(),
      avatarUrl: authAvatarData,
      email: document.getElementById("website-register-email").value.trim().toLowerCase(),
      password: document.getElementById("website-register-password").value
    };
    if (apiEnabled()) {
      try {
        await window.CrosslineApi.register(pendingRegistration.email, pendingRegistration.password, pendingRegistration.username, pendingRegistration);
      } catch (error) {
        return showWebsiteRegister(error.message);
      }
    }
    showWebsiteVerification();
  });
}

function showWebsiteVerification(message = "") {
  if (!pendingRegistration) return showWebsiteRegister();
  message = typeof message === "string" ? message : "";
  app.innerHTML = `
  <main class="landing-page">
    <section class="landing-shell landing-account-shell">
      <nav class="landing-nav">
        ${landingBrandMarkup()}
        <button id="back-register" class="landing-account-cta" type="button">Back to account</button>
      </nav>
      <section class="landing-account-layout">
        <div class="landing-account-copy">
          <h1>Verify your email.</h1>
          <p>Enter the six-digit code sent to <strong>${escapeHtml(pendingRegistration.email)}</strong>.</p>
        </div>
        <form id="website-verify-form" class="landing-account-panel">
          ${apiEnabled() ? "<p class=\"form-note\">Check your inbox for the verification code.</p>" : `<p class="form-note">Prototype verification code</p><div class="demo-code">${DEMO_CODE}</div>`}
          <div class="field"><label>Verification code</label><input id="website-verify-code" inputmode="numeric" maxlength="6" required /></div>
          <p class="form-message">${escapeHtml(message)}</p>
          <button class="primary-button full-width">Verify email</button>
        </form>
      </section>
    </section>
  </main>`;
  bind("back-register", "click", () => showWebsiteRegister());
  bind("website-verify-form", "submit", async (event) => {
    event.preventDefault();
    const code = document.getElementById("website-verify-code").value;
    if (apiEnabled()) {
      try {
        await window.CrosslineApi.verify(pendingRegistration.email, code);
        window.CrosslineApi?.clearStudentToken();
        return showWebsiteAccountReady();
      } catch (error) {
        return showWebsiteVerification(error.message);
      }
    }
    if (code !== DEMO_CODE) return showWebsiteVerification("Enter the six-digit prototype code shown above.");
    users = users.filter((user) => user.email !== pendingRegistration.email);
    users.push({ ...pendingRegistration, verified: true });
    save("csca-users", users);
    showWebsiteAccountReady();
  });
}

function showWebsiteAccountReady() {
  app.innerHTML = `
  <main class="landing-page">
    <section class="landing-shell landing-account-shell">
      <nav class="landing-nav">
        ${landingBrandMarkup()}
        <button id="back-home" class="landing-account-cta" type="button">Back to home</button>
      </nav>
      <section class="landing-account-layout landing-account-complete">
        <div class="landing-account-copy">
          <h1>Your account is ready.</h1>
          <p>Download the Windows app and log in there with the account you just verified.</p>
          <a class="landing-download download-button disabled-link" id="cta-download" href="#" data-download-url="${WINDOWS_CLIENT_URL}" aria-disabled="true">${windowsDownloadLogo()}<span>Preparing Windows app</span></a>
        </div>
      </section>
    </section>
  </main>`;
  bind("back-home", "click", showDownloadLanding);
  hydrateDownloadLinks();
}

async function hydrateDownloadLinks() {
  const links = [
    document.getElementById("client-download"),
    document.getElementById("cta-download")
  ].filter(Boolean);

  let available = 0;
  for (const link of links) {
    const url = link.dataset.downloadUrl;
    try {
      const response = await fetch(url, { method: "HEAD", cache: "no-store" });
      const type = response.headers.get("content-type") || "";
      if (response.ok && !type.includes("text/html")) {
        link.href = url;
        link.setAttribute("download", "");
        link.classList.remove("disabled-link");
        link.removeAttribute("aria-disabled");
        link.innerHTML = `${windowsDownloadLogo()}<span>Download Windows app</span>`;
        available += 1;
      }
    } catch {}
  }

  const headerDownload = document.getElementById("header-download");
  const client = document.getElementById("client-download");
  const note = document.getElementById("download-note");
  if (available && headerDownload && client) {
    headerDownload.href = client.href;
    headerDownload.setAttribute("download", "");
    headerDownload.classList.remove("disabled-link");
    headerDownload.removeAttribute("aria-disabled");
    headerDownload.innerHTML = `${uiIcon("download")}<span>Download</span>`;
  }
  if (note) {
    note.textContent = available
      ? "Windows 10 or newer is recommended. Download the app, run it, then sign in inside the client."
      : "Windows 10 or newer is recommended. The final Windows build is not uploaded yet, so downloads are temporarily disabled.";
  }
}

function registerIntegrityEvents() {
  if (!window.examRuntime?.onIntegrityEvent) return;
  window.examRuntime.onIntegrityEvent((event) => {
    integrityEvents = [event, ...integrityEvents].slice(0, 4);
    const list = document.getElementById("integrity-events");
    if (list) {
      list.innerHTML = integrityEvents.map((item) => `<li>${escapeHtml(item.type.replaceAll("_", " "))}<span>${new Date(item.at).toLocaleTimeString()}</span></li>`).join("");
    }
    recordSessionEvent("integrity_event", event);
  });
}

function showAuth(tab = "login", message = "") {
  leaveKiosk();
  stopMedia();
  message = typeof message === "string" ? message : "";
  const isLogin = tab === "login";
  const authForm = isLogin
    ? `<form id="login-form" class="auth-form">
        <label class="auth-field"><span>Email address</span><input id="login-email" type="email" autocomplete="email" value="${apiEnabled() ? "" : "student@example.com"}" placeholder="you@example.com" required /></label>
        <label class="auth-field"><span>Password</span><span class="auth-password-wrap"><input id="login-password" type="password" autocomplete="current-password" value="${apiEnabled() ? "" : "demo123"}" placeholder="Enter your password" required /><button id="toggle-login-password" type="button" aria-label="Show password">Show</button></span></label>
        <button id="forgot-password" class="auth-inline-link" type="button">Forgot password?</button>
        ${localModeNote("<p class=\"form-note\">Demo student: student@example.com / demo123</p>")}
        <p class="form-message auth-form-message">${escapeHtml(message)}</p>
        <div class="auth-submit-row"><button id="register-tab" class="auth-secondary-button" type="button">Create account</button><button class="auth-primary-button" type="submit">Sign in <span>→</span></button></div>
      </form>`
    : `<form id="register-form" class="auth-form">
        <div class="auth-avatar-field"><label class="auth-avatar-picker" title="Add profile picture"><span id="register-avatar-preview">${authAvatarData ? `<img src="${escapeHtml(authAvatarData)}" alt="Profile preview" />` : "Add photo"}</span><input id="register-avatar" type="file" accept="image/*" /></label><div><strong>Profile picture</strong><small>Optional. You can change this later in Settings.</small></div></div>
        <div class="auth-name-grid"><label class="auth-field"><span>First name</span><input id="register-first-name" type="text" autocomplete="given-name" maxlength="60" required /></label><label class="auth-field"><span>Last name</span><input id="register-last-name" type="text" autocomplete="family-name" maxlength="60" required /></label></div>
        <label class="auth-field"><span>Username</span><input id="register-username" type="text" autocomplete="username" maxlength="40" placeholder="Example: Arijit" required /></label>
        <label class="auth-field"><span>Email address</span><input id="register-email" type="email" autocomplete="email" required /></label>
        <label class="auth-field"><span>Create password</span><span class="auth-password-wrap"><input id="register-password" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" required /><button id="toggle-register-password" type="button" aria-label="Show password">Show</button></span></label>
        <p class="form-note">${apiEnabled() ? "We will send a verification code before the account can take an exam." : "This prototype displays the verification code locally. Production will send it through an email service."}</p>
        <p class="form-message auth-form-message">${escapeHtml(message)}</p>
        <div class="auth-submit-row"><button id="login-tab" class="auth-secondary-button" type="button">Back to sign in</button><button class="auth-primary-button" type="submit">Create account <span>→</span></button></div>
      </form>`;
  app.innerHTML = `<main class="auth-screen">
    <section class="auth-card" aria-label="Student ${isLogin ? "login" : "registration"}">
      <div class="auth-card-heading"><div><p class="auth-eyebrow">Crossline CSCA practice</p><h1>${isLogin ? "Welcome back" : "Create your account"}</h1><p>${isLogin ? "Sign in to continue your mock exam journey." : "Set up your profile, then verify your email to begin."}</p></div><img src="assets/auth/login-books.png" alt="Books and a plant" /></div>
      <div class="auth-social-stack"><button id="google-sign-in" type="button" class="auth-social-button"><span class="auth-social-mark google">G</span>Continue with Google</button></div>
      <div class="auth-divider"><span>or use your email</span></div>
      ${authForm}
      <p class="auth-legal">By continuing, you agree to our <button id="auth-terms" type="button">Terms of Service</button> and <button id="auth-privacy" type="button">Privacy Policy</button>.</p>
      <div class="admin-entry"><button id="admin-entry" type="button">Administrator access</button></div>
    </section>
    <aside class="auth-showcase" aria-label="Crossline Education">
      <div class="auth-brand"><img src="assets/crossline-icon.png" alt="" /><span>Cross-Line<small>Education</small></span></div>
      <div class="auth-showcase-copy"><h2>Ace every mock exam.<br />Track every step forward.</h2><p>Access your exams, results, and progress all in one place.</p></div>
      <img class="auth-room-art" src="assets/auth/login-room.png" alt="Study space with books and a plant" />
      <div class="auth-trust-note"><span>✓</span><div><strong>Your progress. Our priority.</strong><small>Secure. Private. Built for your success.</small></div></div>
    </aside>
  </main>`;
  bind("login-tab", "click", () => showAuth("login"));
  bind("register-tab", "click", () => showAuth("register"));
  bind("admin-entry", "click", () => showAdminLogin());
  bind("google-sign-in", "click", () => startSocialLogin("google"));
  bind("auth-terms", "click", () => showAuthLegalModal("terms"));
  bind("auth-privacy", "click", () => showAuthLegalModal("privacy"));
  bind("forgot-password", "click", showPasswordReset);
  bind("toggle-login-password", "click", () => togglePasswordVisibility("login-password", "toggle-login-password"));
  bind("toggle-register-password", "click", () => togglePasswordVisibility("register-password", "toggle-register-password"));
  bind("register-avatar", "change", async (event) => {
    authAvatarData = await readProfilePhoto(event.target.files?.[0]);
    const preview = document.getElementById("register-avatar-preview");
    if (preview) preview.innerHTML = authAvatarData ? `<img src="${escapeHtml(authAvatarData)}" alt="Profile preview" />` : "Add photo";
  });
  bindDesktopExit({ updates: true });
  bind("login-form", "submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;
    if (apiEnabled()) {
      try {
        const payload = await window.CrosslineApi.login(email, password);
        window.CrosslineApi.setStudentToken(payload.token);
        currentUser = payload.user;
        await refreshExamsFromApi(false);
        return showStudentDashboard("", { loading: true });
      } catch (error) {
        return showAuth("login", error.message);
      }
    }
    const user = users.find((candidate) => candidate.email === email && candidate.password === password && candidate.verified);
    if (!user) return showAuth("login", "Check your credentials or finish email verification.");
    currentUser = user;
    rememberLocalUser(user);
    showStudentDashboard("", { loading: true });
  });
  bind("register-form", "submit", async (event) => {
    event.preventDefault();
    pendingRegistration = {
      username: document.getElementById("register-username").value.trim(),
      firstName: document.getElementById("register-first-name").value.trim(),
      lastName: document.getElementById("register-last-name").value.trim(),
      avatarUrl: authAvatarData,
      email: document.getElementById("register-email").value.trim().toLowerCase(),
      password: document.getElementById("register-password").value
    };
    if (apiEnabled()) {
      try {
        await window.CrosslineApi.register(pendingRegistration.email, pendingRegistration.password, pendingRegistration.username, pendingRegistration);
      } catch (error) {
        return showAuth("register", error.message);
      }
    }
    showVerification();
  });
}

function showPasswordReset(message = "", confirmStep = false) {
  leaveKiosk();
  stopMedia();
  message = typeof message === "string" ? message : "";
  const form = confirmStep
    ? `<form id="password-reset-confirm-form" class="auth-form"><label class="auth-field"><span>Email address</span><input value="${escapeHtml(pendingPasswordResetEmail)}" disabled /></label><label class="auth-field"><span>Six-digit reset code</span><input id="password-reset-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required /></label><label class="auth-field"><span>New password</span><span class="auth-password-wrap"><input id="password-reset-new" type="password" autocomplete="new-password" minlength="6" required /><button id="toggle-reset-password" type="button">Show</button></span></label><label class="auth-field"><span>Confirm new password</span><input id="password-reset-confirm" type="password" autocomplete="new-password" minlength="6" required /></label><p class="form-message auth-form-message">${escapeHtml(message)}</p><div class="auth-submit-row"><button id="reset-request-again" class="auth-secondary-button" type="button">Use another email</button><button class="auth-primary-button">Reset password <span>→</span></button></div></form>`
    : `<form id="password-reset-request-form" class="auth-form"><label class="auth-field"><span>Email address</span><input id="password-reset-email" type="email" autocomplete="email" placeholder="you@example.com" required /></label><p class="form-note">If the address belongs to a verified account, we will email a code that expires in 15 minutes.</p><p class="form-message auth-form-message">${escapeHtml(message)}</p><div class="auth-submit-row"><button id="reset-back-login" class="auth-secondary-button" type="button">Back to sign in</button><button class="auth-primary-button">Send reset code <span>→</span></button></div></form>`;
  app.innerHTML = `<main class="auth-screen"><section class="auth-card"><div class="auth-card-heading"><div><p class="auth-eyebrow">Account recovery</p><h1>${confirmStep ? "Choose a new password" : "Reset your password"}</h1><p>${confirmStep ? "Enter the code from your email and choose a new password." : "We will help you safely regain access to your dashboard."}</p></div><img src="assets/auth/login-books.png" alt="Books and a plant" /></div>${form}</section><aside class="auth-showcase" aria-label="Crossline Education"><div class="auth-brand"><img src="assets/crossline-icon.png" alt="" /><span>Cross-Line<small>Education</small></span></div><div class="auth-showcase-copy"><h2>Return to your progress.</h2><p>Your exams, results, and profile will be waiting after you sign in again.</p></div><div class="auth-trust-note"><span>✓</span><div><strong>One-time recovery code</strong><small>The code expires after 15 minutes.</small></div></div></aside></main>`;
  bindDesktopExit({ updates: true });
  bind("reset-back-login", "click", () => showAuth("login"));
  bind("reset-request-again", "click", () => { pendingPasswordResetEmail = ""; showPasswordReset(); });
  bind("toggle-reset-password", "click", () => togglePasswordVisibility("password-reset-new", "toggle-reset-password"));
  bind("password-reset-request-form", "submit", async (event) => {
    event.preventDefault();
    pendingPasswordResetEmail = document.getElementById("password-reset-email").value.trim().toLowerCase();
    if (apiEnabled()) {
      try { await window.CrosslineApi.requestPasswordReset(pendingPasswordResetEmail); }
      catch (error) { return showPasswordReset(error.message); }
    }
    showPasswordReset(apiEnabled() ? "Check your inbox for the six-digit code." : `Prototype reset code: ${DEMO_CODE}`, true);
  });
  bind("password-reset-confirm-form", "submit", async (event) => {
    event.preventDefault();
    const code = document.getElementById("password-reset-code").value.trim();
    const password = document.getElementById("password-reset-new").value;
    const confirmation = document.getElementById("password-reset-confirm").value;
    if (password !== confirmation) return showPasswordReset("The two passwords do not match.", true);
    if (apiEnabled()) {
      try { await window.CrosslineApi.confirmPasswordReset(pendingPasswordResetEmail, code, password); }
      catch (error) { return showPasswordReset(error.message, true); }
    } else {
      if (code !== DEMO_CODE) return showPasswordReset("Enter the prototype reset code shown above.", true);
      users = users.map((user) => user.email === pendingPasswordResetEmail ? { ...user, password } : user);
      save("csca-users", users);
    }
    pendingPasswordResetEmail = "";
    showAuth("login", "Password updated. Sign in with your new password.");
  });
}

function togglePasswordVisibility(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  if (!input || !button) return;
  input.type = input.type === "password" ? "text" : "password";
  button.textContent = input.type === "password" ? "Show" : "Hide";
}

function showVerification(message = "") {
  app.innerHTML = `${header(desktopExitAction(`<button id="back-login" class="header-link">Back to login</button>`))}<main class="portal-main narrow"><section class="panel"><div class="page-intro"><h1>Verify your email</h1><p>We sent a six-digit verification code to <strong>${escapeHtml(pendingRegistration.email)}</strong>.</p></div><div class="verification-box">${apiEnabled() ? "<p class=\"form-note\">Check your inbox for the verification code.</p>" : `<p class="form-note">Prototype verification code</p><div class="demo-code">${DEMO_CODE}</div>`}<form id="verify-form"><div class="field"><label>Verification code</label><input id="verify-code" inputmode="numeric" maxlength="6" required /></div><p class="form-message">${escapeHtml(message)}</p><button class="primary-button">Verify email</button></form></div></section></main>`;
  bind("back-login", "click", () => showAuth("login"));
  bindDesktopExit();
  bind("verify-form", "submit", async (event) => {
    event.preventDefault();
    const code = document.getElementById("verify-code").value;
    if (apiEnabled()) {
      try {
        const payload = await window.CrosslineApi.verify(pendingRegistration.email, code);
        window.CrosslineApi.setStudentToken(payload.token);
        currentUser = payload.user;
        await refreshExamsFromApi(false);
        return showStudentDashboard("", { loading: true });
      } catch (error) {
        return showVerification(error.message);
      }
    }
    if (code !== DEMO_CODE) return showVerification("Enter the six-digit prototype code shown above.");
    users = users.filter((user) => user.email !== pendingRegistration.email);
    users.push({ ...pendingRegistration, verified: true });
    save("csca-users", users);
    currentUser = users.at(-1);
    rememberLocalUser(currentUser);
    showStudentDashboard("", { loading: true });
  });
}

async function loadStudentResultData() {
  if (!apiEnabled()) return { results: getLocalResults(), details: getLocalResults() };
  const payload = await window.CrosslineApi.results();
  const results = payload.results || [];
  const details = (await Promise.all(results.filter((item) => item.ready).slice(0, 10).map(async (result) => {
    try { return await window.CrosslineApi.result(result.id); } catch { return null; }
  }))).filter(Boolean);
  return { results, details };
}

function questionTaxonomy(question = {}) {
  return {
    subject: String(question.subject || "General practice").trim() || "General practice",
    chapter: String(question.chapter || "General chapter").trim() || "General chapter",
    topic: String(question.topic || question.chapter || question.subject || "General practice").trim() || "General practice"
  };
}

function resultQuestionRefs(details = []) {
  return details.flatMap((detail) => (detail.questions || []).map((question) => ({
    ...question,
    resultId: detail.result?.id || "",
    examTitle: detail.result?.examTitle || "Practice exam",
    submittedAt: detail.result?.submittedAt || ""
  })));
}

function topicPerformance(details = []) {
  const stats = new Map();
  resultQuestionRefs(details).forEach((question) => {
    const taxonomy = questionTaxonomy(question);
    const key = [taxonomy.subject, taxonomy.chapter, taxonomy.topic].join("\u001f");
    const stat = stats.get(key) || { key, ...taxonomy, total: 0, correct: 0, wrong: 0, skipped: 0, questions: [] };
    stat.total += 1;
    if (question.correct === true) stat.correct += 1;
    else if (question.correct === false) stat.wrong += 1;
    else stat.skipped += 1;
    stat.questions.push(question);
    stats.set(key, stat);
  });
  return [...stats.values()].map((stat) => ({
    ...stat,
    accuracy: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0,
    weakness: stat.total ? Math.round(((stat.wrong + stat.skipped) / stat.total) * 100) : 0
  })).sort((a, b) => b.weakness - a.weakness || b.total - a.total || a.topic.localeCompare(b.topic));
}

function dashboardWeaknessBars(details = []) {
  const rows = topicPerformance(details).filter((stat) => stat.wrong || stat.skipped).slice(0, 3);
  if (!rows.length) return `<p class="dash-empty">Topic insights will appear after a released result.</p>`;
  return rows.map((stat) => `<div class="dash-weakness-row"><span>${escapeHtml(stat.topic)}<small>${escapeHtml(stat.subject)} · ${stat.correct} of ${stat.total} correct</small></span><b>${stat.weakness}%</b><i style="--w:${stat.weakness}%"></i></div>`).join("");
}

function subjectTrendData(details = []) {
  const subjects = new Map();
  [...details].reverse().forEach((detail) => {
    const perSubject = new Map();
    (detail.questions || []).forEach((question) => {
      const subject = questionTaxonomy(question).subject;
      const marks = normalizeMarks(question.marks);
      const point = perSubject.get(subject) || { earned: 0, total: 0 };
      point.total += marks;
      point.earned += Number(question.earnedMarks || 0);
      perSubject.set(subject, point);
    });
    perSubject.forEach((point, subject) => {
      const history = subjects.get(subject) || [];
      history.push({
        resultId: detail.result?.id || "",
        examTitle: detail.result?.examTitle || "Practice exam",
        submittedAt: detail.result?.submittedAt || "",
        score: point.total ? Math.round((point.earned / point.total) * 1000) / 10 : 0
      });
      subjects.set(subject, history.slice(-5));
    });
  });
  return [...subjects.entries()].map(([subject, points]) => ({ subject, points }));
}

function dashboardSubjectGraphs(details = []) {
  const trends = subjectTrendData(details);
  if (!trends.length) return `<article class="dash-performance dash-subject-empty"><h2>Subject performance</h2><p>Complete an exam to unlock score graphs for every subject you attempt.</p></article>`;
  return trends.map(({ subject, points }) => `<article class="dash-performance subject-trend-card"><div class="dash-section-title"><div><h2>${escapeHtml(subject)}</h2><p>Last ${points.length} released ${points.length === 1 ? "attempt" : "attempts"}</p></div><strong>${points.at(-1)?.score ?? 0}%</strong></div><div class="subject-trend-chart" role="img" aria-label="${escapeHtml(subject)} score history">${points.map((point, index) => `<button class="subject-trend-point" data-result-id="${escapeHtml(point.resultId)}" style="--score:${Math.max(4, point.score)}%" title="${escapeHtml(point.examTitle)}: ${point.score}%"><b>${point.score}%</b><span></span><small>${points.length === 1 ? "Latest" : `Mock ${index + 1}`}</small></button>`).join("")}</div><div class="subject-chart-scale" aria-hidden="true"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div></article>`).join("");
}

function dashboardQuestionMatch(details = [], type = "skipped") {
  const questions = resultQuestionRefs(details);
  return type === "wrong"
    ? questions.find((question) => question.correct === false)
    : questions.find((question) => question.selected === null || question.selected === undefined);
}

function dashboardQuestionSnippet(details = [], type = "skipped") {
  const match = dashboardQuestionMatch(details, type);
  if (!match) {
    return type === "wrong"
      ? `<p class="dash-empty">No wrong questions in released results yet.</p>`
      : `<p class="dash-empty">No skipped questions in released results yet.</p>`;
  }
  const selected = match.selected === null || match.selected === undefined ? "Not answered" : letterLabels[Number(match.selected)] || "Selected";
  const correct = letterLabels[Number(match.correctIndex || 0)] || "A";
  return `<div class="dash-question-note">
    <b>${escapeHtml(questionTaxonomy(match).topic)}</b>
    <p>${mathHtml(match.text || "Review this question from your latest exam.")}</p>
    <small>${escapeHtml(match.examTitle || "Practice exam")}</small>
    ${type === "wrong" ? `<div class="dash-answer-lines"><span>Your Answer: ${escapeHtml(selected)}</span><span>Correct Answer: ${escapeHtml(correct)}</span></div>` : ""}
  </div>`;
}

function showDashboardAppLayout({ profile, name, results, details, summary, latestPercent, leaderboard, message }) {
  const latestTitle = summary.latest?.examTitle || "No released exam yet";
  const improvement = summary.improvement === null ? "New" : `${summary.improvement >= 0 ? "+" : ""}${summary.improvement}%`;
  const attemptedCount = summary.attemptedCount;
  const average = summary.average;
  const profilePhoto = profile.photo
    ? `<img src="${escapeHtml(profile.photo)}" alt="Profile photo" />`
    : `<img src="assets/dashboard/student-avatar.png" alt="" />`;
  const skippedMatch = dashboardQuestionMatch(details, "skipped");
  const wrongMatch = dashboardQuestionMatch(details, "wrong");
  return `<main class="dash-shell">
    <aside class="dash-sidebar">
      <div class="dash-logo" aria-label="Crossline Education">
        <img src="assets/crossline-icon.png" alt="" />
        <strong>Cross-Line</strong>
        <span>Education</span>
      </div>
      <nav class="dash-side-nav" aria-label="Student dashboard">
        <button class="active">${uiIcon("house")}<span>Dashboard</span></button>
        <button id="side-start-exams">${uiIcon("clipboard-list")}<span>Exams</span></button>
        <button id="side-results">${uiIcon("bar-chart-3")}<span>Results</span></button>
        <button id="side-weakness">${uiIcon("target")}<span>Weakness Analysis</span></button>
        <button id="side-leaderboard">${uiIcon("trophy")}<span>Leaderboard</span></button>
        <button id="side-settings">${uiIcon("settings")}<span>Settings</span></button>
      </nav>
      <article class="dash-sidebar-note">
        <b>Keep learning, stay consistent!</b>
        <p>Small steps every day lead to big results.</p>
        <i></i>
      </article>
      <footer class="dash-user-card">
        <label class="dash-profile-upload" title="Change profile picture">
          <span class="dash-avatar">${profilePhoto}</span>
          <input id="profile-photo-input" type="file" accept="image/*" />
        </label>
        <div><b>${escapeHtml(name)}</b><small>CSCA Candidate</small></div>
        <button id="logout" aria-label="Log out">⌄</button>
      </footer>
    </aside>

    <section class="dash-main">
      <img class="dash-top-illustration" src="assets/dashboard/header-window.jpg" alt="" />
      <span class="sr-only">Student dashboard</span>
      <span class="sr-only">Welcome back, ${escapeHtml(name)}</span>
      <header class="dash-topbar">
        <div>
          <h1>Good morning, ${escapeHtml(name)}! <span>👋</span></h1>
          <p>Ready to ace your next exam? Let's keep the momentum going.</p>
        </div>
        <div class="dash-top-actions">
          ${isDesktopClient() ? `<button id="check-updates">Updates</button><button id="auto-update-toggle">${autoUpdateEnabled() ? "Auto-update on" : "Enable auto-update"}</button><button id="exit-app">Exit</button>` : ""}
          <button id="dashboard-notifications" aria-label="Notifications">${uiIcon("bell")}<i id="notification-count" class="hidden">0</i></button>
        </div>
      </header>

      ${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}

      <section class="dash-start-card">
        <div class="dash-start-icon">${uiIcon("square-check-big")}</div>
        <div>
          <h2>All set for your next challenge?</h2>
          <p>Attempt a new mock exam and track your progress.</p>
        </div>
        <button id="start-exam-dashboard" class="dash-start-button">Start Exam ${uiIcon("chevron-right")}</button>
        <div class="dash-start-paper" aria-hidden="true"></div>
      </section>

      <section class="dash-metrics" aria-label="Performance overview">
        <article class="dash-metric dash-metric-red"><i>${uiIcon("trophy")}</i><h3>Latest score</h3><strong>${escapeHtml(latestPercent)}</strong><p>${mathHtml(latestTitle)}</p><em>${leaderboard?.own ? `Live rank: #${leaderboard.own.rank}` : "No rank yet"}</em></article>
        <article class="dash-metric dash-metric-orange"><i>${uiIcon("trending-up")}</i><h3>Average Improvement</h3><strong>${escapeHtml(improvement)}</strong><p>vs previous 5 released exams</p><em>${summary.improvement === null ? "Complete another exam to compare" : summary.improvement >= 0 ? "Your latest score is above your recent average" : "Your latest score is below your recent average"}</em></article>
        <article class="dash-metric dash-metric-purple"><i>${uiIcon("file-text")}</i><h3>Exams Attempted</h3><strong>${attemptedCount}</strong><p>Total submitted mocks</p><em>This Month: ${summary.thisMonthCount}</em></article>
        <article class="dash-metric dash-metric-green"><i>${uiIcon("badge-check")}</i><h3>Average Score</h3><strong>${average}%</strong><p>Across all exams</p><em>${leaderboard?.participantCount ? `${leaderboard.participantCount} active students` : "Build your first score"}</em></article>
      </section>

      <section class="dash-insights">
        <article class="dash-card"><div class="dash-card-head"><i>${uiIcon("target")}</i><div><h3>Biggest Weaknesses</h3><p>Focus on these to improve your score</p></div></div><div class="dash-weakness">${dashboardWeaknessBars(details)}</div><button id="view-results-dashboard">View Weakness Analysis ${uiIcon("chevron-right")}</button></article>
        <article class="dash-card"><div class="dash-card-head"><i>${uiIcon("play")}</i><div><h3>Last Skipped Question</h3><p>You skipped this in your last exam</p></div></div>${dashboardQuestionSnippet(details, "skipped")}<button id="review-skipped-dashboard" ${skippedMatch ? `data-result-id="${escapeHtml(skippedMatch.resultId)}" data-question-id="${escapeHtml(skippedMatch.id)}"` : "disabled"}>Review Question ${uiIcon("chevron-right")}</button></article>
        <article class="dash-card dash-wrong-card"><div class="dash-card-head"><i>${uiIcon("circle-x")}</i><div><h3>Last Wrong Question</h3><p>You answered incorrectly</p></div></div>${dashboardQuestionSnippet(details, "wrong")}<button id="review-wrong-dashboard" ${wrongMatch ? `data-result-id="${escapeHtml(wrongMatch.resultId)}" data-question-id="${escapeHtml(wrongMatch.id)}"` : "disabled"}>Review Solution ${uiIcon("chevron-right")}</button></article>
        <article class="dash-card dash-results-card"><div class="dash-card-head"><i>${uiIcon("bar-chart-3")}</i><div><h3>Detailed Results</h3><p>Dive deep into your performance and track progress over time.</p></div></div><button id="dash-results-cta">View Results ${uiIcon("chevron-right")}</button><div class="dash-mini-bars" aria-hidden="true"><span></span><span></span><span></span><span></span></div></article>
      </section>

      <section class="dash-subject-graphs" aria-label="Subject performance graphs">${dashboardSubjectGraphs(details)}</section>
    </section>
  </main>`;
}

async function showStudentDashboard(message = "", options = {}) {
  leaveKiosk();
  message = typeof message === "string" ? message : "";
  const profile = getStudentProfile();
  const name = displayName();
  if (options.loading) {
    showClientLoading("Preparing your dashboard");
    bindDesktopExit({ updates: true });
  }
  let results = [];
  let details = [];
  let leaderboard = { entries: [], own: null, participantCount: 0 };
  try {
    const data = await loadStudentResultData();
    results = data.results || [];
    details = data.details || [];
  } catch {}
  const summary = summarizeResults(results, details);
  if (apiEnabled()) {
    const leaderboardPayload = await window.CrosslineApi.leaderboard({ mode: "exam", examId: summary.latest?.examId || "" }).catch(() => null);
    leaderboard = leaderboardPayload || leaderboard;
  }
  const latestPercent = summary.latest ? `${resultPercent(summary.latest)}%` : "--";
  app.innerHTML = showDashboardAppLayout({ profile, name, results, details, summary, latestPercent, leaderboard, message });
  bind("logout", "click", requestStudentLogout);
  bind("side-start-exams", "click", showExamList);
  bind("side-results", "click", showStudentResults);
  bind("side-weakness", "click", showWeaknessAnalysis);
  bind("side-leaderboard", "click", showLeaderboard);
  bind("side-settings", "click", showStudentSettings);
  bind("start-exam-dashboard", "click", showExamList);
  bind("view-results-dashboard", "click", showWeaknessAnalysis);
  bind("dash-results-cta", "click", showStudentResults);
  bind("dashboard-notifications", "click", showNotifications);
  ["review-skipped-dashboard", "review-wrong-dashboard"].forEach((id) => bind(id, "click", (event) => {
    const button = event.currentTarget;
    if (button.dataset.resultId) showStudentResultDetail(button.dataset.resultId, button.dataset.questionId);
  }));
  void hydrateNotificationBadge();
  bind("profile-photo-input", "change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    readProfilePhoto(file).then(async (photo) => {
      if (!photo) return;
      try {
        await updateStudentProfile({ photo });
        showStudentDashboard();
      } catch (error) {
        showStudentDashboard(error.message || "Your profile picture could not be saved.");
      }
    });
  });
  document.querySelectorAll(".view-result").forEach((button) => button.addEventListener("click", () => showStudentResultDetail(button.dataset.id)));
  document.querySelectorAll(".subject-trend-point").forEach((button) => button.addEventListener("click", () => showStudentResultDetail(button.dataset.resultId)));
  bindDesktopExit({ updates: true });
  renderMath();
}

function studentAvatarMarkup(profile = getStudentProfile()) {
  const photo = profile.photo || currentUser?.avatarUrl || "";
  return photo ? `<img src="${escapeHtml(photo)}" alt="Profile photo" />` : `<span>${escapeHtml(profileInitials())}</span>`;
}

function studentPageShell({ active = "dashboard", title, subtitle = "", content = "", action = "" }) {
  const name = displayName();
  const nav = [
    ["dashboard", "house", "Dashboard"], ["exams", "clipboard-list", "Exams"], ["results", "bar-chart-3", "Results"],
    ["weakness", "target", "Weakness Analysis"], ["leaderboard", "trophy", "Leaderboard"], ["settings", "settings", "Settings"]
  ];
  return `<main class="dash-shell">
    <aside class="dash-sidebar"><div class="dash-logo"><img src="assets/crossline-icon.png" alt="" /><strong>Cross-Line</strong><span>Education</span></div>
      <nav class="dash-side-nav" aria-label="Student dashboard">${nav.map(([id, icon, label]) => `<button id="side-${id}" class="${active === id ? "active" : ""}">${uiIcon(icon)}<span>${label}</span></button>`).join("")}</nav>
      <article class="dash-sidebar-note"><b>Keep learning, stay consistent!</b><p>Small steps every day lead to big results.</p><i></i></article>
      <footer class="dash-user-card"><button id="open-profile-settings" class="dash-avatar" aria-label="Open profile settings">${studentAvatarMarkup()}</button><div><b>${escapeHtml(name)}</b><small>CSCA Candidate</small></div><button id="logout" aria-label="Log out">⌄</button></footer>
    </aside>
    <section class="dash-main dash-page-main"><header class="dash-topbar"><div><h1>${mathHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div><div class="dash-top-actions"><button id="dashboard-notifications" aria-label="Notifications">${uiIcon("bell")}<i id="notification-count" class="hidden">0</i></button></div></header>${action}${content}</section>
  </main>`;
}

function bindStudentShell() {
  bind("side-dashboard", "click", showStudentDashboard);
  bind("side-exams", "click", showExamList);
  bind("side-results", "click", showStudentResults);
  bind("side-weakness", "click", showWeaknessAnalysis);
  bind("side-leaderboard", "click", showLeaderboard);
  bind("side-settings", "click", showStudentSettings);
  bind("logout", "click", requestStudentLogout);
  bind("open-profile-settings", "click", showStudentSettings);
  bind("dashboard-notifications", "click", showNotifications);
  void hydrateNotificationBadge();
}

async function hydrateNotificationBadge() {
  const localUpdateCount = ["available", "ready"].includes(updateState.kind) ? 1 : 0;
  try {
    const payload = apiEnabled() ? await window.CrosslineApi.notifications() : { unread: 0 };
    const badge = document.getElementById("notification-count");
    const unread = Number(payload.unread || 0) + localUpdateCount;
    if (!badge || !unread) return;
    badge.textContent = String(unread);
    badge.classList.remove("hidden");
  } catch {}
}

async function showExamList(message = "") {
  leaveKiosk();
  message = typeof message === "string" ? message : "";
  if (apiEnabled()) { try { await refreshExamsFromApi(false); } catch {} }
  const examCards = exams.length ? exams.map((exam) => {
    return `<article class="dash-page-card exam-choice-card"><div><div class="exam-title-row"><p class="dash-card-kicker">Practice mock</p></div><h2>${mathHtml(exam.title)}</h2><p>${mathHtml(exam.description)}</p><div class="exam-meta"><span>${exam.questions.length} questions</span><span>${exam.duration} minutes</span><span>Free for all students</span></div></div><button class="dash-start-button begin-exam" data-id="${escapeHtml(exam.id)}">Begin setup ${uiIcon("chevron-right")}</button></article>`;
  }).join("") : `<article class="dash-page-card"><h2>No exams are available yet</h2><p>Ask the Crossline team to publish a practice paper for your account.</p></article>`;
  const content = `${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}<section class="dash-page-grid exam-page-grid">${examCards}</section>`;
  app.innerHTML = studentPageShell({ active: "exams", title: "Choose an exam", subtitle: "Select a paper, complete the realistic device setup, then begin your timed practice.", content });
  bindStudentShell();
  document.querySelectorAll(".begin-exam").forEach((button) => button.addEventListener("click", () => { currentExam = exams.find((exam) => exam.id === button.dataset.id); activeSessionId = null; preflight = { camera: false, microphone: false, network: false, face: false, phone: false, roomScan: false }; showEquipmentCheck(); }));
  renderMath();
}

async function showStudentResults(message = "") {
  leaveKiosk();
  message = typeof message === "string" ? message : "";
  app.innerHTML = studentPageShell({ active: "results", title: "Your results", subtitle: "Loading your released mock exam results...", content: `<section class="dash-page-card"><p class="form-note">Loading results...</p></section>` });
  bindStudentShell();
  try {
    const payload = apiEnabled() ? await window.CrosslineApi.results() : { results: getLocalResults() };
    const results = payload.results || [];
    const content = `${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}<section class="dash-page-grid results-page-grid">${results.length ? results.map((result) => `<article class="dash-page-card result-choice-card"><div><p class="dash-card-kicker">${result.ready ? "Instant result" : "Finalizing result"}</p><h2>${mathHtml(result.examTitle)}</h2><p>${result.ready ? `Score ${formatScore(result.score?.earned)} / ${formatScore(result.score?.total)}` : "Your score is being finalized. Refresh in a moment."}</p><div class="exam-meta"><span>Submitted: ${escapeHtml(formatDateTime(result.submittedAt))}</span><span>${result.ready ? "Available now" : "Finalizing"}</span></div></div><button class="${result.ready ? "dash-outline-button" : "dash-muted-button"} view-result" data-id="${escapeHtml(result.id)}" ${result.ready ? "" : "disabled"}>${result.ready ? "View full result" : "Finalizing"}</button></article>`).join("") : `<article class="dash-page-card"><h2>No submitted mock results yet</h2><p>Your full score and answer review will appear immediately after you submit a mock.</p><button id="results-start-exam" class="dash-start-button">Choose an exam</button></article>`}</section>`;
    app.innerHTML = studentPageShell({ active: "results", title: "Your results", subtitle: "Review scores, every option you chose, correct answers, explanations, and marks.", content });
    bindStudentShell();
    bind("results-start-exam", "click", showExamList);
    document.querySelectorAll(".view-result").forEach((button) => button.addEventListener("click", () => showStudentResultDetail(button.dataset.id)));
    renderMath();
  } catch (error) {
    showStudentResults(error.message || "Your results could not be loaded.");
  }
}

function resultQuestionAnchor(questionId, prefix = "all") {
  return `result-question-${prefix}-${String(questionId || "question").replace(/[^a-z0-9_-]/gi, "-")}`;
}

async function showStudentResultDetail(resultId, focusQuestionId = "") {
  leaveKiosk();
  app.innerHTML = studentPageShell({ active: "results", title: "Result review", subtitle: "Loading your answers and explanations...", content: `<section class="dash-page-card"><p class="form-note">Loading answer review...</p></section>` });
  bindStudentShell();
  try {
    const payload = apiEnabled() ? await window.CrosslineApi.result(resultId) : getLocalResults().find((result) => result.id === resultId);
    if (!payload) return showStudentResults("Result not found.");
    const { result, questions = [] } = payload;
    if (!result.ready) return showStudentResults("This result is still pending.");
    const wrongQuestions = questions.filter((question) => question.correct === false);
    const content = `<div class="dash-result-summary"><div><p class="dash-card-kicker">${escapeHtml(result.examTitle)}</p><h2>${formatScore(result.score.earned)} / ${formatScore(result.score.total)}</h2><p>${wrongQuestions.length} incorrect question${wrongQuestions.length === 1 ? "" : "s"}. Every option and explanation is below.</p></div><button id="back-results" class="dash-outline-button">Back to results</button></div><section class="dash-review-section"><h2>Questions to review</h2>${wrongQuestions.length ? wrongQuestions.map((question) => resultQuestionHtml(question, "review")).join("") : `<p class="dash-empty">No incorrect questions. Nice work.</p>`}</section><section class="dash-review-section"><h2>All questions</h2>${questions.map((question) => resultQuestionHtml(question, "all")).join("")}</section>`;
    app.innerHTML = studentPageShell({ active: "results", title: "Result review", subtitle: "See what you selected, the correct option, earned marks, and the explanation for every question.", content });
    bindStudentShell();
    bind("back-results", "click", showStudentResults);
    renderMath();
    if (focusQuestionId) {
      const focused = document.getElementById(resultQuestionAnchor(focusQuestionId, "all"));
      focused?.classList.add("answer-review-focus");
      setTimeout(() => focused?.scrollIntoView?.({ behavior: "smooth", block: "center" }), 120);
    }
  } catch (error) {
    showStudentResults(error.message);
  }
}

async function showWeaknessAnalysis() {
  if (apiEnabled()) { try { await refreshExamsFromApi(false); } catch {} }
  app.innerHTML = studentPageShell({ active: "weakness", title: "Weakness analysis", subtitle: "Loading your topic-by-topic performance...", content: `<section class="dash-page-card"><p class="form-note">Loading performance details...</p></section>` });
  bindStudentShell();
  const data = await loadStudentResultData().catch(() => ({ details: [] }));
  const stats = topicPerformance(data.details || []).filter((stat) => stat.wrong || stat.skipped);
  const content = stats.length ? `<section class="weakness-summary"><div><strong>${stats.length}</strong><span>topics need attention</span></div><div><strong>${stats.reduce((sum, stat) => sum + stat.wrong, 0)}</strong><span>incorrect answers</span></div><div><strong>${stats.reduce((sum, stat) => sum + stat.skipped, 0)}</strong><span>skipped answers</span></div></section><section class="subject-performance-list">${stats.map((stat, index) => `<article class="dash-page-card subject-performance-card"><div><p class="dash-card-kicker">${escapeHtml(stat.subject)} · ${escapeHtml(stat.chapter)}</p><h2>${escapeHtml(stat.topic)}</h2><p>${stat.correct} correct out of ${stat.total} · ${stat.wrong} incorrect · ${stat.skipped} skipped</p></div><div><div class="subject-meter"><i style="--score:${stat.accuracy}%"></i></div><small>${stat.accuracy}% accuracy</small></div><button class="dash-outline-button weakness-review" data-index="${index}">Review ${stat.wrong + stat.skipped} questions</button></article>`).join("")}</section>` : `<section class="dash-page-card"><h2>No weak topics yet</h2><p>Complete a mock to build topic-level analysis. If every released answer is correct, this page will stay clear.</p><button id="weakness-start-exam" class="dash-start-button">Choose an exam</button></section>`;
  app.innerHTML = studentPageShell({ active: "weakness", title: "Weakness analysis", subtitle: "Every topic is calculated from your real correct, incorrect, and skipped answers.", content });
  bindStudentShell();
  bind("weakness-start-exam", "click", showExamList);
  document.querySelectorAll(".weakness-review").forEach((button) => button.addEventListener("click", () => showWeaknessTopic(stats[Number(button.dataset.index)])));
  renderMath();
}

function showWeaknessTopic(stat) {
  if (!stat) return showWeaknessAnalysis();
  const questions = stat.questions.filter((question) => question.correct !== true);
  const content = `<div class="dash-result-summary weakness-topic-summary"><div><p class="dash-card-kicker">${escapeHtml(stat.subject)} · ${escapeHtml(stat.chapter)}</p><h2>${escapeHtml(stat.topic)}</h2><p>${stat.correct} correct out of ${stat.total}. Review every mistake and skip below.</p></div><button id="back-weakness" class="dash-outline-button">Back to all topics</button></div><section class="dash-review-section"><h2>Mistakes and skipped questions</h2>${questions.map((question, index) => `<div class="weakness-question-wrap">${resultQuestionHtml(question, `topic-${index}`)}<button class="dash-outline-button open-question-result" data-result-id="${escapeHtml(question.resultId)}" data-question-id="${escapeHtml(question.id)}">Open in full result</button></div>`).join("")}</section>`;
  app.innerHTML = studentPageShell({ active: "weakness", title: stat.topic, subtitle: `${stat.subject} · ${stat.chapter}`, content });
  bindStudentShell();
  bind("back-weakness", "click", showWeaknessAnalysis);
  document.querySelectorAll(".open-question-result").forEach((button) => button.addEventListener("click", () => showStudentResultDetail(button.dataset.resultId, button.dataset.questionId)));
  renderMath();
}

function leaderboardTableHtml(payload, emptyMessage) {
  if (!payload?.entries?.length) return `<p class="dash-empty">${escapeHtml(emptyMessage)}</p>`;
  return `<ol class="leaderboard-table">${payload.entries.map((entry) => `<li class="${entry.isCurrentUser ? "current" : ""}"><b>#${entry.rank}</b><span>${escapeHtml(entry.name)}${payload.mode === "average" ? `<small>${entry.attempts} recent ${entry.attempts === 1 ? "exam" : "exams"}</small>` : ""}</span><strong>${entry.score}%</strong></li>`).join("")}</ol>`;
}

async function showLeaderboard(examId = "", subject = "") {
  examId = typeof examId === "string" ? examId : "";
  subject = typeof subject === "string" ? subject : "";
  app.innerHTML = studentPageShell({ active: "leaderboard", title: "Live leaderboard", subtitle: "Loading the latest student rankings...", content: `<section class="dash-page-card"><p class="form-note">Loading leaderboard...</p></section>` });
  bindStudentShell();
  const [examBoard, averageBoard] = apiEnabled() ? await Promise.all([
    window.CrosslineApi.leaderboard({ mode: "exam", examId }).catch(() => null),
    window.CrosslineApi.leaderboard({ mode: "average", subject }).catch(() => null)
  ]) : [null, null];
  const filters = examBoard?.filters || averageBoard?.filters || { exams: [], subjects: [] };
  const content = examBoard || averageBoard ? `<section class="leaderboard-controls dash-page-card"><label>Exam leaderboard<select id="leaderboard-exam-filter">${filters.exams.map((exam) => `<option value="${escapeHtml(exam.id)}" ${exam.id === examBoard?.examId ? "selected" : ""}>${escapeHtml(exam.title)}</option>`).join("")}</select></label><label>Five-exam average subject<select id="leaderboard-subject-filter"><option value="">All subjects</option>${filters.subjects.map((item) => `<option value="${escapeHtml(item)}" ${item === (averageBoard?.subject === "All subjects" ? "" : averageBoard?.subject) ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></label></section><section class="leaderboard-board-grid"><article class="dash-page-card leaderboard-page-card"><div class="dash-section-title"><div><p class="dash-card-kicker">Latest attempt per student</p><h2>${escapeHtml(examBoard?.examTitle || "Exam leaderboard")}</h2><p>${examBoard?.own ? `Your rank is #${examBoard.own.rank} with ${examBoard.own.score}%.` : "Complete this exam to join its ranking."}</p></div><strong>${examBoard?.participantCount || 0} students</strong></div>${leaderboardTableHtml(examBoard, "No one has completed this exam yet.")}</article><article class="dash-page-card leaderboard-page-card"><div class="dash-section-title"><div><p class="dash-card-kicker">Last five average</p><h2>${escapeHtml(averageBoard?.subject || "All subjects")}</h2><p>${averageBoard?.own ? `Your average rank is #${averageBoard.own.rank} with ${averageBoard.own.score}%.` : "Complete released exams to join this ranking."}</p></div><strong>${averageBoard?.participantCount || 0} students</strong></div>${leaderboardTableHtml(averageBoard, "No eligible results are available for this subject yet.")}</article></section>` : `<section class="dash-page-card"><h2>The leaderboard is temporarily unavailable</h2><p>Try again after the exam service reconnects.</p></section>`;
  app.innerHTML = studentPageShell({ active: "leaderboard", title: "Live leaderboard", subtitle: "Compare each exam separately or rank the last five average by subject. Only shortened display names are shown.", content });
  bindStudentShell();
  bind("leaderboard-exam-filter", "change", (event) => showLeaderboard(event.target.value, subject));
  bind("leaderboard-subject-filter", "change", (event) => showLeaderboard(examBoard?.examId || examId, event.target.value));
}

async function showNotifications() {
  app.innerHTML = studentPageShell({ active: "dashboard", title: "Notifications", subtitle: "Loading your Crossline updates...", content: `<section class="dash-page-card"><p class="form-note">Loading notifications...</p></section>` });
  bindStudentShell();
  const payload = apiEnabled() ? await window.CrosslineApi.notifications().catch(() => ({ notifications: [] })) : { notifications: [] };
  const notifications = payload.notifications || [];
  const updateNotification = ["available", "ready"].includes(updateState.kind) ? `<article class="dash-page-card notification-card update-notification"><div><p class="dash-card-kicker">Software update</p><h2>${updateState.kind === "ready" ? "Update ready to install" : "A new app update is available"}</h2><p>${escapeHtml(updateState.message || "Open Settings to update the Crossline Windows client.")}</p></div><button id="notification-update-action" class="dash-outline-button">${updateState.kind === "ready" ? "Restart and install" : "Update now"}</button></article>` : "";
  const content = (notifications.length || updateNotification) ? `<section class="notification-list">${updateNotification}${notifications.map((item) => `<article class="dash-page-card notification-card ${item.readAt ? "read" : ""}"><div><p class="dash-card-kicker">${escapeHtml(item.kind || "update")}</p><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.body)}</p><small>${escapeHtml(formatDateTime(item.createdAt))}</small></div>${item.readAt ? "" : `<button class="dash-outline-button notification-read" data-id="${escapeHtml(item.id)}">Mark read</button>`}</article>`).join("")}</section>` : `<section class="dash-page-card"><h2>No new notifications</h2><p>Exam releases and important updates from Crossline will appear here.</p></section>`;
  app.innerHTML = studentPageShell({ active: "dashboard", title: "Notifications", subtitle: "Exam releases and important Crossline updates are collected here.", content });
  bindStudentShell();
  bind("notification-update-action", "click", updateState.kind === "ready" ? restartUpdateNow : installUpdateNow);
  document.querySelectorAll(".notification-read").forEach((button) => button.addEventListener("click", async () => { try { await window.CrosslineApi.markNotificationRead(button.dataset.id); } finally { showNotifications(); } }));
}

function showStudentSettings(message = "") {
  message = typeof message === "string" ? message : "";
  const profile = getStudentProfile();
  const updateSettings = isDesktopClient() ? `<div class="settings-update-copy"><b>Windows app updates</b><p>Updates are verified before installation. If a previous download was interrupted, reset it here and check again.</p></div>` : "";
  const updateActions = isDesktopClient() ? `<button id="settings-check-updates" type="button" class="dash-outline-button">Check for updates</button><button id="settings-auto-update" type="button" class="dash-outline-button">${autoUpdateEnabled() ? "Auto-update enabled" : "Enable auto-update"}</button><button id="settings-reset-update" type="button" class="dash-outline-button">Reset update download</button>` : "";
  const content = `<section class="dash-page-card settings-card"><form id="student-settings-form"><div class="settings-profile-row"><label class="settings-avatar-picker"><span id="settings-avatar-preview">${studentAvatarMarkup(profile)}</span><input id="settings-avatar" type="file" accept="image/*" /></label><div><h2>${escapeHtml(displayName())}</h2><p>Choose a profile picture and update the name used throughout the dashboard.</p></div></div><div class="auth-name-grid"><label class="auth-field"><span>First name</span><input id="settings-first-name" value="${escapeHtml(currentUser?.firstName || currentUser?.first_name || "")}" required /></label><label class="auth-field"><span>Last name</span><input id="settings-last-name" value="${escapeHtml(currentUser?.lastName || currentUser?.last_name || "")}" required /></label></div><label class="auth-field"><span>Username</span><input id="settings-username" maxlength="40" value="${escapeHtml(currentUser?.username || "")}" required /></label><p class="form-message">${escapeHtml(message)}</p>${updateSettings}<div class="settings-actions"><button class="dash-start-button">Save profile</button>${updateActions}</div></form></section>`;
  app.innerHTML = studentPageShell({ active: "settings", title: "Settings", subtitle: "Manage your student profile and desktop app updates.", content });
  bindStudentShell();
  let nextPhoto = profile.photo || currentUser?.avatarUrl || "";
  bind("settings-avatar", "change", async (event) => { nextPhoto = await readProfilePhoto(event.target.files?.[0]); const preview = document.getElementById("settings-avatar-preview"); if (preview && nextPhoto) preview.innerHTML = `<img src="${escapeHtml(nextPhoto)}" alt="Profile photo" />`; });
  bind("settings-check-updates", "click", () => checkForUpdates(true));
  bind("settings-reset-update", "click", resetUpdateNow);
  bind("settings-auto-update", "click", () => { setAutoUpdateEnabled(!autoUpdateEnabled()); showStudentSettings(); });
  bind("student-settings-form", "submit", async (event) => { event.preventDefault(); const next = { username: document.getElementById("settings-username").value.trim(), firstName: document.getElementById("settings-first-name").value.trim(), lastName: document.getElementById("settings-last-name").value.trim(), avatarUrl: nextPhoto }; try { if (apiEnabled()) { const payload = await window.CrosslineApi.updateProfile(next); currentUser = payload.user; } else { currentUser = { ...currentUser, ...next }; users = users.map((user) => user.email === currentUser.email ? currentUser : user); save("csca-users", users); } saveStudentProfile({ ...getStudentProfile(), photo: nextPhoto }); showStudentSettings("Profile saved."); } catch (error) { showStudentSettings(error.message || "Your profile could not be saved."); } });
}

function resultQuestionHtml(question, prefix = "all") {
  const selected = question.selected === undefined ? null : question.selected;
  const hasSelection = selected !== null && selected !== undefined && Number.isInteger(Number(selected));
  const correctIndex = Number(question.correctIndex || 0);
  const answers = question.answers || [];
  return `<article id="${resultQuestionAnchor(question.id, prefix)}" class="answer-review ${question.correct === true ? "correct" : question.correct === false ? "wrong" : ""}"><h3>Question ${question.position} · ${formatScore(question.earnedMarks)} / ${formatScore(question.marks)} marks</h3>${question.image ? `<img class="question-preview-image" src="${escapeHtml(question.image)}" alt="Question image" />` : ""}<p>${mathHtml(question.text)}</p><div class="result-options">${answers.map((answer, index) => `<div class="result-option ${hasSelection && Number(selected) === index ? "selected" : ""} ${correctIndex === index ? "correct" : ""}"><strong>(${letterLabels[index]})</strong><span>${mathHtml(answer)}</span>${hasSelection && Number(selected) === index ? `<em>Selected</em>` : ""}${correctIndex === index ? `<em>Correct</em>` : ""}</div>`).join("")}</div><div class="exam-meta"><span>Selected option: ${hasSelection ? `(${letterLabels[Number(selected)]}) ${mathHtml(answers[Number(selected)] || "")}` : "Not answered"}</span><span>Correct option: (${letterLabels[correctIndex]}) ${mathHtml(answers[correctIndex] || "")}</span><span>${question.correct === null ? "Skipped" : question.correct ? "Correct" : "Wrong"}</span></div><div class="explanation-box"><strong>Explanation</strong>${question.explanation ? `<p>${mathHtml(question.explanation)}</p>` : `<p>No explanation has been added for this question yet.</p>`}${question.explanationImage ? `<img class="question-preview-image" src="${escapeHtml(question.explanationImage)}" alt="Explanation image" />` : ""}</div></article>`;
}

function setupStepper(active) {
  return `<div class="stepper"><span class="step ${active > 1 ? "done" : "active"}">1. Equipment check</span><span class="step ${active > 2 ? "done" : active === 2 ? "active" : ""}">2. Facial recognition</span><span class="step ${active > 3 ? "done" : active === 3 ? "active" : ""}">3. Connect phone camera</span><span class="step ${active > 4 ? "done" : active === 4 ? "active" : ""}">4. Room scan</span><span class="step ${active > 5 ? "done" : active === 5 ? "active" : ""}">5. Privacy terms</span><span class="step ${active === 6 ? "active" : ""}">6. Start exam</span></div>`;
}
function updatePreflightButtons() {
  const ready = preflight.camera && preflight.microphone && preflight.network;
  const next = document.getElementById("pairing-next");
  if (next) next.disabled = !ready;
}
function passCheck(key, label) {
  preflight[key] = true;
  const status = document.getElementById(`${key}-status`);
  if (status) { status.textContent = label; status.classList.add("pass"); }
  updatePreflightButtons();
}
function audioWaveBarsHtml(count = 28) {
  return Array.from({ length: count }, () => "<span></span>").join("");
}
function setAudioWaveIdle() {
  const wave = document.getElementById("microphone-wave");
  if (!wave) return;
  wave.classList.remove("recording");
  wave.querySelectorAll("span").forEach((bar) => {
    bar.style.height = "";
  });
}
function scheduleMicrophoneFrame(callback) {
  if (window.requestAnimationFrame) {
    microphoneTest.usingTimeout = false;
    microphoneTest.animationFrame = window.requestAnimationFrame(callback);
  } else {
    microphoneTest.usingTimeout = true;
    microphoneTest.animationFrame = setTimeout(callback, 55);
  }
}
function cancelMicrophoneFrame() {
  if (!microphoneTest.animationFrame) return;
  if (microphoneTest.usingTimeout) clearTimeout(microphoneTest.animationFrame);
  else window.cancelAnimationFrame?.(microphoneTest.animationFrame);
  microphoneTest.animationFrame = null;
}
function animateMicrophoneWave() {
  const wave = document.getElementById("microphone-wave");
  if (!wave || !microphoneTest.recording) return;
  const bars = Array.from(wave.querySelectorAll("span"));
  if (microphoneTest.analyser) {
    const data = new Uint8Array(microphoneTest.analyser.frequencyBinCount);
    microphoneTest.analyser.getByteTimeDomainData(data);
    bars.forEach((bar, index) => {
      const sample = data[Math.floor(index / bars.length * data.length)] || 128;
      const level = Math.min(1, Math.abs(sample - 128) / 54);
      bar.style.height = `${8 + Math.round(level * 38)}px`;
    });
  } else {
    bars.forEach((bar, index) => {
      const level = 0.35 + Math.abs(Math.sin(Date.now() / 130 + index * 0.72)) * 0.65;
      bar.style.height = `${8 + Math.round(level * 38)}px`;
    });
  }
  scheduleMicrophoneFrame(animateMicrophoneWave);
}
async function startMicrophoneRecordingTest() {
  const status = document.getElementById("microphone-status");
  const button = document.getElementById("microphone-check");
  const wave = document.getElementById("microphone-wave");
  if (!status || !button) return;
  stopMicrophoneRecordingTest(false);
  status.textContent = "Recording... speak into your microphone, then click Stop recording.";
  status.classList.remove("pass");
  button.textContent = "Stop recording";
  button.dataset.recording = "true";
  wave?.classList.add("recording");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: selectedDeviceConstraint("microphone-device") });
    stream._crosslineKind = "microphone";
    streams.push(stream);
    microphoneTest.stream = stream;
    microphoneTest.recording = true;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      microphoneTest.audioContext = new AudioContextClass();
      microphoneTest.analyser = microphoneTest.audioContext.createAnalyser();
      microphoneTest.analyser.fftSize = 128;
      microphoneTest.audioContext.createMediaStreamSource(stream).connect(microphoneTest.analyser);
    }
    await populateDeviceSelectors();
    animateMicrophoneWave();
  } catch (error) {
    stopMicrophoneRecordingTest(false);
    status.textContent = `Microphone access failed: ${error.message}`;
    button.textContent = "Start recording";
    button.dataset.recording = "false";
  }
}
function stopMicrophoneRecordingTest(markPassed = true) {
  cancelMicrophoneFrame();
  if (microphoneTest.audioContext && microphoneTest.audioContext.state !== "closed") {
    microphoneTest.audioContext.close().catch(() => {});
  }
  microphoneTest.audioContext = null;
  microphoneTest.analyser = null;
  microphoneTest.recording = false;
  stopPreflightStream("microphone");
  microphoneTest.stream = null;
  setAudioWaveIdle();
  const button = document.getElementById("microphone-check");
  if (button) {
    button.textContent = "Start recording";
    button.dataset.recording = "false";
  }
  if (markPassed) passCheck("microphone", "Microphone recording checked");
}
function stopPreflightStream(kind) {
  for (let index = streams.length - 1; index >= 0; index -= 1) {
    if (streams[index]._crosslineKind === kind) {
      streams[index].getTracks().forEach((track) => track.stop());
      streams.splice(index, 1);
    }
  }
}
function selectedDeviceConstraint(selectId) {
  const value = document.getElementById(selectId)?.value;
  return value ? { deviceId: { exact: value } } : true;
}
function pauseFocusGuardForDropdown() {
  window.examRuntime?.pauseFocusGuard?.(7000);
}
function bindDeviceDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  ["pointerdown", "mousedown", "focus", "keydown"].forEach((eventName) => select.addEventListener(eventName, pauseFocusGuardForDropdown));
  ["change", "blur"].forEach((eventName) => select.addEventListener(eventName, () => window.examRuntime?.pauseFocusGuard?.(2500)));
}
function renderDeviceOptions(devices, fallbackLabel, defaultLabel) {
  const defaultOption = `<option value="">${escapeHtml(defaultLabel)}</option>`;
  if (!devices.length) return `${defaultOption}<option value="" disabled>${escapeHtml(fallbackLabel)}</option>`;
  return `${defaultOption}${devices.map((device, index) => {
    const label = device.label || `${fallbackLabel.replace("No ", "").replace(" found", "")} ${index + 1}`;
    return `<option value="${escapeHtml(device.deviceId)}">${escapeHtml(label)}</option>`;
  }).join("")}`;
}
async function populateDeviceSelectors() {
  const cameraSelect = document.getElementById("camera-device");
  const microphoneSelect = document.getElementById("microphone-device");
  const previousCamera = cameraSelect?.value || "";
  const previousMicrophone = microphoneSelect?.value || "";
  if (!navigator.mediaDevices?.enumerateDevices || !cameraSelect || !microphoneSelect) {
    if (cameraSelect) cameraSelect.innerHTML = `<option value="">No device API available</option>`;
    if (microphoneSelect) microphoneSelect.innerHTML = `<option value="">No device API available</option>`;
    return;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const microphones = devices.filter((device) => device.kind === "audioinput");
    cameraSelect.innerHTML = renderDeviceOptions(cameras, "No webcam found", "Windows system default camera");
    microphoneSelect.innerHTML = renderDeviceOptions(microphones, "No microphone found", "Windows system default microphone");
    if (previousCamera && cameras.some((device) => device.deviceId === previousCamera)) cameraSelect.value = previousCamera;
    if (previousMicrophone && microphones.some((device) => device.deviceId === previousMicrophone)) microphoneSelect.value = previousMicrophone;
  } catch (error) {
    cameraSelect.innerHTML = `<option value="">Device list unavailable</option>`;
    microphoneSelect.innerHTML = `<option value="">Device list unavailable</option>`;
  }
}
async function unlockMediaPermission(kind, constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach((track) => track.stop());
    return { kind, ok: true };
  } catch (error) {
    return { kind, ok: false, error };
  }
}
async function scanAvailableDevices() {
  const scanStatus = document.getElementById("device-scan-status");
  if (scanStatus) scanStatus.textContent = "Requesting Windows camera and microphone permissions...";

  const results = [];
  if (navigator.mediaDevices?.getUserMedia) {
    results.push(await unlockMediaPermission("camera", { video: true, audio: false }));
    results.push(await unlockMediaPermission("microphone", { video: false, audio: true }));
  }

  await populateDeviceSelectors();
  const cameraOptions = Array.from(document.getElementById("camera-device")?.options || []);
  const microphoneOptions = Array.from(document.getElementById("microphone-device")?.options || []);
  const cameraCount = cameraOptions.filter((option) => option.value).length;
  const microphoneCount = microphoneOptions.filter((option) => option.value).length;
  if (scanStatus) {
    const failed = results.filter((result) => !result.ok).map((result) => `${result.kind}: ${result.error?.name || result.error?.message || "failed"}`);
    scanStatus.textContent = failed.length
      ? `Scan complete. Some permissions failed: ${failed.join(", ")}. Check Windows privacy settings if a physical device is missing.`
      : `Scan complete. Electron can see ${cameraCount} camera device(s) and ${microphoneCount} microphone device(s), plus Windows default routing.`;
  }
}
async function runNetworkTest() {
  const status = document.getElementById("network-status");
  const speed = document.getElementById("network-speed");
  const fill = document.getElementById("network-fill");
  if (status) {
    status.textContent = "Testing connection...";
    status.classList.remove("pass");
  }
  if (speed) speed.textContent = "Measuring download speed...";
  if (fill) fill.style.width = "32%";

  const startedAt = performance.now();
  let connected = navigator.onLine !== false;
  let kbps = 0;
  try {
    const response = await fetch("https://media.crosslinecscatest.com/updates/latest.json?networkTest=" + Date.now(), { cache: "no-store" });
    const text = await response.text();
    connected = response.ok;
    const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.12);
    kbps = Math.max(Math.round((text.length / 1024) / elapsedSeconds), 850 + Math.round(Math.random() * 2400));
  } catch {
    kbps = connected ? 1200 + Math.round(Math.random() * 1800) : 0;
  }

  if (fill) fill.style.width = connected ? "100%" : "18%";
  if (speed) speed.textContent = connected ? `${kbps} KB/s` : "Unavailable";
  if (connected) {
    passCheck("network", "Connected");
  } else if (status) {
    status.textContent = "Network unavailable";
  }
}
function showEquipmentCheck() {
  ensureKiosk();
  app.innerHTML = `${header(desktopExitAction(`<button id="back-exams" class="header-link">Back to exams</button>`))}<main class="portal-main narrow">${setupStepper(1)}<section class="panel"><div class="page-intro"><h1>Equipment Check</h1><p>Select the webcam and microphone Windows should use, then test your network before facial recognition.</p></div><div class="device-scan-bar"><div><strong>Device discovery</strong><p id="device-scan-status">Click scan to unlock and refresh the full Windows camera/microphone list.</p></div><button id="scan-devices" class="secondary-button">Scan devices</button></div><video class="preflight-video" id="preflight-camera" muted autoplay playsinline></video><div class="check-grid"><article class="check-card"><h3>◎ Camera</h3><p>Choose the camera that should show your face during the setup checks.</p><label class="device-label" for="camera-device">Camera device</label><select id="camera-device" class="device-select"><option>Loading cameras...</option></select><span id="camera-status" class="check-status">Not checked</span><button id="camera-check" class="secondary-button">Test</button></article><article class="check-card"><h3>◉ Microphone and headset</h3><p>Press Start recording, speak for a few seconds, then stop it to confirm the microphone wave reacts.</p><label class="device-label" for="microphone-device">Microphone device</label><select id="microphone-device" class="device-select"><option>Loading microphones...</option></select><div class="audio-wave" id="microphone-wave" aria-hidden="true">${audioWaveBarsHtml()}</div><span id="microphone-status" class="check-status">Not checked</span><button id="microphone-check" class="secondary-button" data-recording="false">Start recording</button></article><article class="check-card network-card"><h3>◎ Network</h3><p>Confirm the exam client can reach the Crossline exam service.</p><div class="network-box"><span>Network status</span><strong id="network-status">Not checked</strong></div><div class="network-box"><span>Download speed</span><strong id="network-speed">-- KB/s</strong><div class="network-meter"><div id="network-fill"></div></div></div><button id="network-check" class="secondary-button">Test again</button></article></div><p class="form-note">If a device is still missing after scanning, Windows is not exposing it to desktop apps. Check Settings > Privacy & security > Camera/Microphone and close apps that may own the device.</p><div class="button-row"><span class="muted">All three checks must pass before continuing.</span><button id="pairing-next" class="primary-button" disabled>Next</button></div></section></main>`;
  bind("back-exams", "click", showExamList);
  bindDesktopExit();
  bind("scan-devices", "click", scanAvailableDevices);
  bindDeviceDropdown("camera-device");
  bindDeviceDropdown("microphone-device");
  bind("camera-check", "click", async () => {
    const status = document.getElementById("camera-status");
    status.textContent = "Checking camera...";
    status.classList.remove("pass");
    try {
      stopPreflightStream("camera");
      const stream = await navigator.mediaDevices.getUserMedia({ video: selectedDeviceConstraint("camera-device"), audio: false });
      stream._crosslineKind = "camera";
      streams.push(stream);
      document.getElementById("preflight-camera").srcObject = stream;
      await populateDeviceSelectors();
      passCheck("camera", "Webcam connected");
    } catch (error) {
      status.textContent = `Camera access failed: ${error.message}`;
    }
  });
  bind("microphone-check", "click", () => {
    const button = document.getElementById("microphone-check");
    if (button?.dataset.recording === "true") stopMicrophoneRecordingTest(true);
    else startMicrophoneRecordingTest();
  });
  bind("network-check", "click", runNetworkTest);
  bind("pairing-next", "click", showFacialRecognition);
  if (!deviceChangeListenerAttached && navigator.mediaDevices?.addEventListener) {
    navigator.mediaDevices.addEventListener("devicechange", populateDeviceSelectors);
    deviceChangeListenerAttached = true;
  }
  populateDeviceSelectors();
  setTimeout(scanAvailableDevices, 350);
}

async function showFacialRecognition() {
  ensureKiosk();
  stopPreflightStream("face");
  app.innerHTML = `${header(desktopExitAction(`<button id="back-checks" class="header-link">Back to checks</button>`))}<main class="portal-main narrow">${setupStepper(2)}<section class="panel face-panel"><p class="face-status">Status: <span id="face-status">Waiting to start</span></p><div class="page-intro centered"><h1>Facial recognition</h1><p>Look straight at the camera and click Start.</p></div><div class="face-frame"><video id="face-camera" muted autoplay playsinline></video><div class="face-guide"></div></div><div class="face-progress hidden" id="face-progress"><div></div></div><div class="button-row centered-row"><button id="start-face-check" class="primary-button">Start</button></div></section></main>`;
  bind("back-checks", "click", showEquipmentCheck);
  bindDesktopExit();
  bind("start-face-check", "click", async () => {
    const status = document.getElementById("face-status");
    const button = document.getElementById("start-face-check");
    const progress = document.getElementById("face-progress");
    if (button) button.disabled = true;
    if (status) status.textContent = "Aligning face...";
    if (progress) progress.classList.remove("hidden");
    await new Promise((resolve) => setTimeout(resolve, 850));
    if (status) status.textContent = "Matching...";
    if (progress?.firstElementChild) progress.firstElementChild.style.width = "68%";
    await new Promise((resolve) => setTimeout(resolve, 900));
    preflight.face = true;
    if (status) status.textContent = "Face matched";
    if (progress?.firstElementChild) progress.firstElementChild.style.width = "100%";
    stopPreflightStream("face");
    await new Promise((resolve) => setTimeout(resolve, 450));
    showPhonePairing();
  });
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: selectedDeviceConstraint("camera-device"), audio: false });
    stream._crosslineKind = "face";
    streams.push(stream);
    document.getElementById("face-camera").srcObject = stream;
  } catch (error) {
    const status = document.getElementById("face-status");
    if (status) status.textContent = `Camera unavailable: ${error.message}`;
  }
}

async function showPhonePairing() {
  stopPhonePollers();
  let code = Math.random().toString(36).slice(2, 8).toUpperCase();
  let pairingUrl = `https://exam.local/connect?code=${code}`;
  let pairingMessage = "The QR code is scannable. Production pairing happens from the phone camera page.";
  if (apiEnabled()) {
    try {
      const session = await window.CrosslineApi.createSession(currentExam.id);
      activeSessionId = session.sessionId;
      code = session.pairingCode;
      pairingUrl = session.pairingUrl;
      pairingMessage = "Scan this QR code on the secondary device. The desktop app continues automatically after the phone connects.";
    } catch (error) {
      pairingMessage = `Backend session could not be created: ${escapeHtml(error.message)}. Please go back and try again.`;
    }
  }
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=210x210&data=${encodeURIComponent(pairingUrl)}`;
  app.innerHTML = `${header(desktopExitAction(`<button id="back-face" class="header-link">Back to facial recognition</button>`))}<main class="portal-main narrow">${setupStepper(3)}<section class="panel"><div class="page-intro"><h1>Connect your phone camera</h1><p>Scan the QR code with your phone. Keep the phone in landscape mode and prepare to scan the room after it connects.</p></div><div class="qr-layout"><div class="qr-box"><img alt="Phone camera pairing QR code" src="${qrUrl}" /></div><div><p class="muted">Pairing code</p><div class="pair-code">${escapeHtml(code)}</div><p class="muted">${pairingMessage}</p><div id="phone-success" class="success-banner hidden">Secondary phone camera connected. Continuing...</div></div></div><div class="button-row"><span class="muted">The setup will continue to the 360-degree room scan after the phone is connected.</span></div></section></main>`;
  bind("back-face", "click", showFacialRecognition);
  bindDesktopExit();
  if (apiEnabled() && activeSessionId) startPhonePairingPoll();
  if (!apiEnabled()) setTimeout(() => markPhoneConnected("Secondary phone camera connected."), 1200);
}

function markPhoneConnected(message = "Secondary phone camera connected.") {
  if (preflight.phone) return;
  preflight.phone = true;
  const success = document.getElementById("phone-success");
  if (success) {
    success.textContent = `${message} Continuing to room scan...`;
    success.classList.remove("hidden");
  }
  if (phonePairingTimer) clearInterval(phonePairingTimer);
  phonePairingTimer = null;
  setTimeout(showRoomScan, 650);
}

function showRoomScan() {
  ensureKiosk();
  preflight.roomScan = false;
  app.innerHTML = `${header(desktopExitAction(`<button id="back-phone" class="header-link">Back to phone setup</button>`))}<main class="portal-main narrow">${setupStepper(4)}<section class="panel room-scan-panel"><div class="page-intro"><h1>360-degree room scan</h1><p>Using the connected phone camera, slowly rotate your phone once around the room before the exam starts.</p></div><div class="room-scan-card"><div class="room-scan-orbit" aria-hidden="true"><span></span><i></i></div><div><h2>Scan checklist</h2><p>Hold your phone in landscape mode. Show the desk, keyboard, monitor, walls, and the area behind you. Move slowly so the scan feels like the real exam check.</p><ul class="scan-list"><li>Rotate the phone 360 degrees one full time</li><li>Keep the phone steady and in landscape mode</li><li>Return the phone to the side-camera position after the scan</li></ul><div id="room-scan-success" class="success-banner hidden">Room scan completed. Continuing...</div></div></div><div class="button-row"><button id="back-phone-bottom" class="ghost-button">Back</button><button id="room-scan-done" class="primary-button">Ok the scan is done</button></div></section></main>`;
  bind("back-phone", "click", showPhonePairing);
  bind("back-phone-bottom", "click", showPhonePairing);
  bindDesktopExit();
  bind("room-scan-done", "click", async () => {
    preflight.roomScan = true;
    const success = document.getElementById("room-scan-success");
    const button = document.getElementById("room-scan-done");
    if (button) button.disabled = true;
    if (success) success.classList.remove("hidden");
    await recordSessionEvent("room_scan_completed", { examId: currentExam?.id });
    setTimeout(showPrivacyTerms, 650);
  });
}

function startPhonePairingPoll() {
  const poll = async () => {
    try {
      const payload = await window.CrosslineApi.sessionStatus(activeSessionId);
      if (payload.session?.phoneConnectedAt) markPhoneConnected("Secondary phone camera connected.");
    } catch (error) {
      const success = document.getElementById("phone-success");
      if (success && !preflight.phone) {
        success.textContent = `Waiting for phone camera. ${error.message}`;
        success.classList.remove("hidden");
      }
    }
  };
  poll();
  phonePairingTimer = setInterval(poll, 2000);
}

function showPrivacyTerms() {
  app.innerHTML = `${header(desktopExitAction(`<button id="back-scan" class="header-link">Back to room scan</button>`))}<main class="portal-main narrow">${setupStepper(5)}<section class="panel"><div class="page-intro"><h1>Practice exam privacy terms</h1><p>Please read and accept this notice before starting your mock exam.</p></div><div class="terms-card"><p>This Crossline CSCA mock exam uses webcam, microphone, network, facial-recognition, secondary-camera, and 360-degree room-scan checks only to simulate the real exam setup.</p><p>The device checks confirm that your equipment can open correctly. After setup is complete, the exam does not continue using your webcam, microphone, or phone camera.</p><p>No webcam recording, microphone recording, screen recording, secondary-camera recording, or room-scan recording is saved by this practice exam.</p><p>Your answers and exam attempt details are saved so your result can be emailed after the review delay.</p></div><label class="terms-check"><input id="accept-terms" type="checkbox" /> <span>I understand and agree to continue with the practice exam.</span></label><div class="button-row"><span class="muted">The timer starts only after you click Start exam.</span><button id="launch-exam" class="primary-button" disabled>Start exam</button></div></section></main>`;
  bind("back-scan", "click", showRoomScan);
  bindDesktopExit();
  bind("accept-terms", "change", (event) => { const launch = document.getElementById("launch-exam"); if (launch) launch.disabled = !event.target.checked; });
  bind("launch-exam", "click", startExam);
}

function startExam() {
  ensureKiosk();
  if (phonePairingTimer) clearInterval(phonePairingTimer);
  phonePairingTimer = null;
  stopMedia();
  recordSessionEvent("exam_started", { examId: currentExam.id });
  questions = currentExam.questions.map((question, index) => ({ ...question, id: index + 1, answer: null, flagged: false }));
  currentIndex = 0; elapsedSeconds = 0; questionScale = 1;
  renderExamShell(); renderQuestion();
  clearInterval(clockTimer); clockTimer = setInterval(updateClock, 1000);
}
function renderExamShell() {
  integrityEvents = [];
  app.innerHTML = `<div class="app-shell"><header class="top-strip"><div class="brand"><div class="brand-identity"><img class="brand-logo" src="assets/crossline-icon.png" alt="Crossline Education" /><span class="brand-name">Crossline Education</span></div><div class="brand-copy"><strong>${escapeHtml(currentExam.title)}</strong><small>CSCA PRACTICE EXAMINATION</small></div></div><div class="session-meta"><span><i class="status-dot"></i> Exam in progress</span><span id="clock">00:00:00</span><button class="exit-button" id="exit-button">Exit practice</button></div></header><main class="exam-layout"><aside class="sidebar"><section class="candidate-card"><div class="avatar">${escapeHtml(currentUser.email[0].toUpperCase())}</div><div><strong>${escapeHtml(currentUser.email)}</strong><p>${escapeHtml(currentExam.id.toUpperCase())}</p></div></section><section class="side-section"><div class="section-heading"><h2>Answer sheet</h2><span id="progress-ratio"></span></div><div class="progress-track"><div id="progress-fill"></div></div><div class="question-grid" id="question-grid"></div><div class="legend"><span><i class="legend-box answered"></i>Answered</span><span><i class="legend-box current"></i>Current</span><span><i class="legend-box flagged"></i>Flagged</span><span><i class="legend-box"></i>Unanswered</span></div></section><section class="integrity-panel"><strong>Practice controls</strong><p>Device checks are complete. Camera and microphone streams are no longer active during the question section.</p><ul id="integrity-events"></ul></section></aside><section class="workspace"><nav class="question-toolbar"><button class="flag-button" id="flag-button"><span id="flag-icon">☆</span> Flag</button><div class="question-position">Question <strong id="current-number"></strong></div><div class="nav-buttons"><button id="previous-button">&lt; Previous</button><button id="next-button">Next &gt;</button></div><div class="zoom-controls"><button id="zoom-out" aria-label="Decrease text size">A<sup>-</sup></button><button id="zoom-in" aria-label="Increase text size">A<sup>+</sup></button></div></nav><div class="instruction-bar" id="instruction"></div><article class="question-card"><div class="question-type" id="question-type"></div><h1 id="question-text"></h1><div class="diagram" id="diagram"><div class="disc"><span class="object object-b">B</span><span class="axis"></span><span class="object object-a">A</span></div><span class="omega">↻ ω</span></div><img id="question-image" class="question-preview-image hidden" alt="Question reference" /><div class="answers" id="answers"></div></article><footer class="workspace-footer"><span>Use the answer sheet to jump between questions.</span><button class="submit-button" id="submit-button">Submit practice exam</button></footer></section></main></div><dialog id="submit-dialog"><div class="dialog-content"><h2>Submit practice exam?</h2><p id="submit-copy">Are you sure you want to submit your answers? Your score and full answer review will be available immediately.</p><div class="dialog-actions"><button class="ghost-button" id="cancel-submit">Cancel</button><button class="primary-button" id="confirm-submit">Submit exam</button></div></div></dialog>`;
  bind("previous-button", "click", () => navigate(-1)); bind("next-button", "click", () => navigate(1));
  bind("flag-button", "click", () => { questions[currentIndex].flagged = !questions[currentIndex].flagged; saveSessionAnswers(false); renderQuestion(); });
  bind("zoom-in", "click", () => { questionScale = Math.min(1.35, questionScale + .1); document.documentElement.style.setProperty("--question-scale", questionScale); });
  bind("zoom-out", "click", () => { questionScale = Math.max(.85, questionScale - .1); document.documentElement.style.setProperty("--question-scale", questionScale); });
  bind("exit-button", "click", async () => { clearInterval(clockTimer); await recordSessionEvent("practice_exit", { elapsedSeconds }); stopMedia(); ensureKiosk(); showExamList(); });
  bind("submit-button", "click", () => document.getElementById("submit-dialog").showModal());
  bind("cancel-submit", "click", () => document.getElementById("submit-dialog").close());
  bind("confirm-submit", "click", submitExamAndExit);
}
async function submitExamAndExit() {
  const answered = questions.filter((q) => q.answer !== null).length;
  const flagged = questions.filter((q) => q.flagged).length;
  clearInterval(clockTimer);
  await saveSessionAnswers(true);
  await recordSessionEvent("exam_submitted", { answered, flagged, elapsedSeconds });
  const localResultId = !apiEnabled() ? saveLocalExamResult() : "";
  stopMedia();
  leaveKiosk();
  if (apiEnabled() && activeSessionId) showStudentResultDetail(activeSessionId);
  else if (localResultId) showStudentResultDetail(localResultId);
  else showStudentResults();
}
function saveLocalExamResult() {
  let earned = 0;
  let total = 0;
  const resultQuestions = questions.map((question, index) => {
    const marks = normalizeMarks(question.marks);
    total += marks;
    const correctIndex = Number(question.correctIndex || 0);
    const selected = question.answer;
    const correct = selected === null ? null : Number(selected) === correctIndex;
    if (correct) earned += marks;
    return {
      id: question.backendId || question.id,
      position: index + 1,
      text: question.text,
      answers: question.answers || [],
      selected,
      correctIndex,
      selectedAnswer: selected === null ? null : question.answers?.[selected],
      correctAnswer: question.answers?.[correctIndex],
      correct,
      earnedMarks: correct ? marks : 0,
      marks,
      explanation: question.explanation || "Review the correct option and retry this topic in your next mock.",
      explanationImage: question.explanationImage || "",
      image: question.image || "",
      type: question.type || "General practice",
      subject: question.subject || "",
      chapter: question.chapter || "",
      topic: question.topic || ""
    };
  });
  const result = {
    id: `local-${Date.now()}`,
    examTitle: currentExam.title,
    submittedAt: new Date().toISOString(),
    ready: true,
    score: { earned: Math.round(earned * 100) / 100, total: Math.round(total * 100) / 100 },
    wrongCount: resultQuestions.filter((question) => question.correct === false).length
  };
  saveLocalResults([{ result, questions: resultQuestions, ...result }, ...getLocalResults()].slice(0, 30));
  return result.id;
}
function updateClock() { elapsedSeconds += 1; document.getElementById("clock").textContent = [Math.floor(elapsedSeconds / 3600), Math.floor((elapsedSeconds % 3600) / 60), elapsedSeconds % 60].map((value) => String(value).padStart(2, "0")).join(":"); }
function navigate(offset) { currentIndex = Math.max(0, Math.min(questions.length - 1, currentIndex + offset)); renderQuestion(); }
function renderQuestion() {
  const question = questions[currentIndex]; const answered = questions.filter((item) => item.answer !== null).length;
  document.getElementById("current-number").textContent = `${question.id} of ${questions.length}`; document.getElementById("instruction").innerHTML = mathHtml(question.instruction); document.getElementById("question-type").textContent = question.type; document.getElementById("question-text").innerHTML = mathHtml(question.text);
  document.getElementById("diagram").classList.toggle("hidden", !question.diagram);
  const image = document.getElementById("question-image"); image.classList.toggle("hidden", !question.image); if (question.image) image.src = question.image;
  document.getElementById("flag-icon").textContent = question.flagged ? "★" : "☆"; document.getElementById("previous-button").disabled = currentIndex === 0; document.getElementById("next-button").disabled = currentIndex === questions.length - 1;
  document.getElementById("progress-ratio").textContent = `${answered} / ${questions.length}`; document.getElementById("progress-fill").style.width = `${answered / questions.length * 100}%`;
  document.getElementById("question-grid").innerHTML = questions.map((item, index) => `<button class="question-cell ${item.answer !== null ? "answered" : ""} ${item.flagged ? "flagged" : ""} ${index === currentIndex ? "current" : ""}" data-index="${index}">${item.id}</button>`).join("");
  document.querySelectorAll(".question-cell").forEach((button) => button.addEventListener("click", () => { currentIndex = Number(button.dataset.index); renderQuestion(); }));
  document.getElementById("answers").innerHTML = question.answers.map((answer, index) => `<label class="answer-label"><input type="radio" name="answer" value="${index}" ${question.answer === index ? "checked" : ""} /><span>(${letterLabels[index]}) ${mathHtml(answer)}</span></label>`).join("");
  document.querySelectorAll('input[name="answer"]').forEach((input) => input.addEventListener("change", () => { question.answer = Number(input.value); saveSessionAnswers(false); renderQuestion(); }));
  renderMath();
}

function showAdminLogin(message = "") {
  app.innerHTML = `${header(desktopExitAction(`<button id="student-entry" class="header-link">Student portal</button>`))}<main class="portal-main narrow"><section class="panel"><div class="page-intro"><h1>Administrator login</h1><p>Manage exam papers and question content.</p></div><form id="admin-form"><div class="field"><label>Admin email</label><input id="admin-email" type="email" value="${apiEnabled() ? "arijitsumit123@gmail.com" : "admin@crossline.test"}" required /></div><div class="field"><label>Password</label><input id="admin-password" type="password" value="${apiEnabled() ? "" : "admin123"}" required /></div>${localModeNote("<p class=\"form-note\">Prototype admin: admin@crossline.test / admin123</p>")}<p class="form-message">${escapeHtml(message)}</p><button class="primary-button">Log in as administrator</button></form></section></main>`;
  bind("student-entry", "click", () => showAuth());
  bindDesktopExit();
  bind("admin-form", "submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("admin-email").value.trim().toLowerCase();
    const password = document.getElementById("admin-password").value;
    if (apiEnabled()) {
      try {
        const payload = await window.CrosslineApi.adminLogin(email, password);
        window.CrosslineApi.setAdminToken(payload.token);
        await refreshExamsFromApi(true);
        return showAdminDashboard();
      } catch (error) {
        return showAdminLogin(error.message);
      }
    }
    if (email !== "admin@crossline.test" || password !== "admin123") return showAdminLogin("Incorrect administrator credentials.");
    showAdminDashboard();
  });
}
function adminSkeleton(rows = 3) {
  return `<section class="admin-skeleton" aria-hidden="true">${Array.from({ length: rows }, () => `<div class="skeleton-card"><div class="skeleton-line w35"></div><div class="skeleton-line w70"></div><div class="skeleton-line w55"></div></div>`).join("")}</section>`;
}
function adminShell(content, active = "exams") {
  return `${header(desktopExitAction(`<span>Crossline administration</span><button id="admin-logout" class="header-link">Log out</button>`))}<main class="admin-layout admin-layout-modern"><aside class="admin-nav"><div class="admin-nav-brand"><img src="assets/crossline-icon.png" alt="" /><div><strong>Admin workspace</strong><small>CSCA practice</small></div></div><button id="admin-overview" class="${active === "overview" ? "active" : ""}">${uiIcon("layout-dashboard")} Overview</button><button id="admin-assistant" class="${active === "assistant" ? "active" : ""}">${uiIcon("star")} GLM assistant</button><button id="admin-exams" class="${active === "exams" ? "active" : ""}">${uiIcon("clipboard-list")} Exam library</button><button id="admin-import" class="${active === "import" ? "active" : ""}">${uiIcon("file-text")} Import questions</button><button id="admin-submissions" class="${active === "submissions" ? "active" : ""}">${uiIcon("bar-chart-3")} Student attempts</button><button id="admin-notifications" class="${active === "notifications" ? "active" : ""}">${uiIcon("bell")} Notifications</button></aside><section class="admin-workspace">${content}</section></main>`;
}
function bindAdminShell() {
  bind("admin-logout", "click", () => { window.CrosslineApi?.clearAdminToken(); showAdminLogin(); });
  bind("admin-overview", "click", showAdminOverview);
  bind("admin-assistant", "click", showAdminAssistant);
  bind("admin-exams", "click", showAdminDashboard);
  bind("admin-import", "click", showQuestionImport);
  bind("admin-submissions", "click", showAdminSubmissions);
  bind("admin-notifications", "click", showAdminNotifications);
  bindDesktopExit();
}
function showAdminDashboard() {
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Exam authoring</p><h1>Exam library</h1><p class="muted">Create free practice papers with question metadata, explanations, images, and marks.</p></div><div class="admin-toolbar-actions"><button id="import-questions" class="secondary-button">Import questions</button><button id="new-exam" class="primary-button">Create exam</button></div></div><section class="admin-exam-grid">${exams.map((exam) => `<article class="admin-card"><div class="exam-title-row"><p class="admin-kicker">Practice paper</p></div><h3>${mathHtml(exam.title)}</h3><p>${mathHtml(exam.description)}</p><div class="exam-meta"><span>${exam.questions.length} questions</span><span>${exam.duration} minutes</span><span>${formatScore(exam.questions.reduce((sum, question) => sum + normalizeMarks(question.marks), 0))} marks</span><span>Free for all students</span></div><div class="admin-card-actions"><button class="secondary-button edit-exam" data-id="${escapeHtml(exam.id)}">Edit questions</button><button class="danger-button delete-exam" data-id="${escapeHtml(exam.id)}">Delete exam</button></div></article>`).join("") || `<section class="panel"><p class="form-note">No exams exist yet. Create a paper to begin.</p></section>`}</section>`, "exams");
  bindAdminShell();
  bind("new-exam", "click", showCreateExam);
  bind("import-questions", "click", showQuestionImport);
  document.querySelectorAll(".edit-exam").forEach((button) => button.addEventListener("click", () => showQuestionEditor(button.dataset.id)));
  document.querySelectorAll(".delete-exam").forEach((button) => button.addEventListener("click", () => deleteExam(button.dataset.id)));
  renderMath();
}

function showAdminOverview() {
  const questionCount = exams.reduce((sum, exam) => sum + exam.questions.length, 0);
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Crossline CSCA practice</p><h1>Administration overview</h1><p class="muted">Manage the complete student assessment experience from one workspace.</p></div></div><section class="admin-overview-grid"><article class="admin-overview-card"><span>${uiIcon("clipboard-list")}</span><b>${exams.length}</b><small>Exam papers</small></article><article class="admin-overview-card"><span>${uiIcon("file-text")}</span><b>${questionCount}</b><small>Questions in the library</small></article><article class="admin-overview-card"><span>${uiIcon("target")}</span><b>Tags</b><small>Subject, chapter, and topic analytics</small></article></section><section class="admin-card admin-overview-action"><div><h2>Start with better question data</h2><p>Add subject, chapter, topic, correct answers, marks, explanations, and optional diagrams to every question. Those fields drive student result review and weakness analysis.</p></div><div class="admin-card-actions"><button id="overview-create-exam" class="primary-button">Create exam</button><button id="overview-import" class="secondary-button">Import questions</button></div></section>${adminAssistantPanel(true)}`, "overview");
  bindAdminShell();
  bind("overview-create-exam", "click", showCreateExam);
  bind("overview-import", "click", showQuestionImport);
  bindAdminAssistant();
}

function adminAssistantPanel(compact = false) {
  const messages = adminAssistantMessages;
  const attachment = adminAssistantAttachment;
  return `<section class="admin-card admin-assistant ${compact ? "compact" : "full"} ${messages.length ? "has-messages" : "empty"}">
    <div class="admin-assistant-heading"><div><p class="admin-kicker">GLM question assistant</p><h2>${compact ? "Plan and draft with an assistant" : "Question authoring assistant"}</h2><p>Drafts stay in this conversation until you review and add them to an exam.</p></div><span>${uiIcon("star")}</span></div>
    <div id="admin-assistant-thread" class="admin-assistant-thread" aria-live="polite">${messages.length ? messages.map((message) => `<article class="assistant-message ${message.role}"><b>${message.role === "user" ? "You" : "GLM"}</b><div class="assistant-markdown">${markdownHtml(message.content)}</div></article>`).join("") : `<div class="assistant-empty"><h2>Where should we begin?</h2><p>Attach a question bank, prepare a mock exam, or ask about your library.</p></div>`}</div>
    <form id="admin-assistant-form" class="admin-assistant-form">
      ${attachment ? `<div class="assistant-attachment"><div>${uiIcon("file-text")}<span><b>${escapeHtml(attachment.name)}</b><small>${escapeHtml(attachment.method.toUpperCase())} · ${attachment.images?.length || 0} preserved image${attachment.images?.length === 1 ? "" : "s"}${attachment.metadata?.duration ? ` · ${escapeHtml(attachment.metadata.duration)} minutes` : ""}</small></span></div><button id="assistant-remove-attachment" type="button" aria-label="Remove attachment">×</button></div>` : ""}
      <label class="sr-only" for="admin-assistant-input">Message</label><textarea id="admin-assistant-input" maxlength="4000" placeholder="Message GLM assistant" required></textarea>
      <div id="assistant-drop-zone" class="source-drop-zone" role="button" tabindex="0" aria-describedby="admin-assistant-status"><span>${uiIcon("upload")}</span><div><b>Drop question sources here</b><small>ZIP, HTML, PDF, Markdown, text, JSON, CSV, or named question images</small></div></div>
      <input id="admin-assistant-file" class="source-file-input" type="file" multiple accept=".zip,application/zip,application/x-zip-compressed,.html,.htm,text/html,.pdf,application/pdf,.md,.markdown,.txt,.json,.csv,image/png,image/jpeg,image/webp,image/bmp,image/tiff" />
      <div class="admin-card-actions"><button id="admin-assistant-send" class="primary-button">Ask assistant</button><button id="assistant-attach-trigger" type="button" class="secondary-button">Attach sources</button><button id="assistant-open-import" type="button" class="secondary-button">${attachment ? "Prepare questions from files" : "Open question importer"}</button><button id="admin-assistant-clear" type="button" class="ghost-button">Clear conversation</button></div><p id="admin-assistant-status" class="form-message"></p>
    </form>
  </section>`;
}

function showAdminAssistant() {
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Private authoring workspace</p><h1>GLM assistant</h1><p class="muted">Discuss exam structure and draft content without automatically changing the question library.</p></div></div>${adminAssistantPanel(false)}`, "assistant");
  bindAdminShell();
  bindAdminAssistant();
  renderMath();
}

function bindAdminAssistant() {
  bind("admin-assistant-clear", "click", () => { adminAssistantMessages = []; adminAssistantAttachment = null; showAdminAssistant(); });
  bind("assistant-remove-attachment", "click", () => { adminAssistantAttachment = null; showAdminAssistant(); });
  bind("assistant-open-import", "click", () => { pendingImportSource = adminAssistantAttachment; showQuestionImport(); });
  const handleAssistantFiles = async (fileList) => {
    const files = [...(fileList || [])];
    const status = document.getElementById("admin-assistant-status");
    if (!files.length) return;
    if (status) status.textContent = `Reading ${files.length === 1 ? files[0].name : `${files.length} source files`} locally...`;
    try {
      const result = await extractImportSourceFiles(files);
      adminAssistantAttachment = { ...result, name: result.name, size: files.reduce((sum, file) => sum + file.size, 0) };
      showAdminAssistant();
    } catch (error) {
      if (status) status.textContent = error.message || "The attachment could not be read.";
    }
  };
  bindSourceDropZone({ zoneId: "assistant-drop-zone", inputId: "admin-assistant-file", triggerId: "assistant-attach-trigger", onFiles: handleAssistantFiles });
  bind("admin-assistant-form", "submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("admin-assistant-input");
    const status = document.getElementById("admin-assistant-status");
    const send = document.getElementById("admin-assistant-send");
    const content = input?.value.trim();
    if (!content) return;
    adminAssistantMessages.push({ role: "user", content });
    if (input) input.value = "";
    if (send) send.disabled = true;
    if (status) status.textContent = "GLM is preparing a draft...";
    const thread = document.getElementById("admin-assistant-thread");
    if (thread) {
      thread.innerHTML = `${adminAssistantMessages.map((message) => `<article class="assistant-message ${message.role}"><b>${message.role === "user" ? "You" : "GLM"}</b><div class="assistant-markdown">${markdownHtml(message.content)}</div></article>`).join("")}<article class="assistant-message assistant"><b>GLM</b><div class="typing-dots" aria-label="GLM is typing"><span></span><span></span><span></span></div></article>`;
      thread.scrollTop = thread.scrollHeight;
    }
    try {
      if (!apiEnabled()) throw new Error("The assistant requires the deployed API.");
      const attachment = adminAssistantAttachment ? { name: adminAssistantAttachment.name, method: adminAssistantAttachment.method, text: adminAssistantAttachment.text, metadata: adminAssistantAttachment.metadata || {} } : null;
      const payload = await window.CrosslineApi.aiChat(adminAssistantMessages.slice(-12), attachment);
      adminAssistantMessages.push({ role: "assistant", content: payload.reply });
      showAdminAssistant();
    } catch (error) {
      adminAssistantMessages.pop();
      document.querySelector("#admin-assistant-thread .typing-dots")?.closest("article")?.remove();
      if (send) send.disabled = false;
      if (status) status.textContent = error.message || "The assistant could not respond.";
    }
  });
}

function parseImportedQuestionsLocally(sourceText) {
  try {
    const parsed = JSON.parse(sourceText);
    const list = Array.isArray(parsed.questions) ? parsed.questions : Array.isArray(parsed) ? parsed : [];
    return list.filter((item) => {
      const rawCorrectIndex = item?.correctIndex;
      const correctIndex = rawCorrectIndex === null || rawCorrectIndex === undefined || rawCorrectIndex === "" ? NaN : Number(rawCorrectIndex);
      return item?.text && Array.isArray(item.answers) && item.answers.length === 4 && Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex < 4;
    }).slice(0, 100).map((item, index, list) => ({ ...item, marks: normalizeMarks(list.length === 48 ? (index < 12 ? 1.5 : index < 38 ? 2 : 3) : item.marks), correctIndex: Number(item.correctIndex), instruction: item.instruction || "Choose the best answer." }));
  } catch {}
  const blocks = String(sourceText || "").split(/\n\s*(?=Question\s*\d+[:.)])/i).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const text = lines.shift()?.replace(/^Question\s*\d+[:.)]\s*/i, "") || "";
    const answers = [];
    let correctIndex = null;
    let explanation = "";
    lines.forEach((line) => {
      const option = line.match(/^([A-D])[.)]\s*(.+)$/i);
      const answer = line.match(/^(?:Answer|Correct answer)\s*:\s*([A-D])/i);
      const explanationLine = line.match(/^Explanation\s*:\s*(.+)$/i);
      if (option) answers["ABCD".indexOf(option[1].toUpperCase())] = option[2];
      if (answer) correctIndex = "ABCD".indexOf(answer[1].toUpperCase());
      if (explanationLine) explanation = explanationLine[1];
    });
    return { text, answers, correctIndex, marks: 1, explanation, instruction: "Choose the best answer." };
  }).filter((question) => question.text && question.answers.filter(Boolean).length === 4 && Number.isInteger(question.correctIndex)).slice(0, 100).map((question, index, list) => ({ ...question, marks: normalizeMarks(list.length === 48 ? (index < 12 ? 1.5 : index < 38 ? 2 : 3) : question.marks) }));
}

async function extractImportSourceFile(file) {
  if (!file) throw new Error("Choose a question source file first.");
  const htmlLike = /\.html?$/i.test(file.name) || String(file.type).toLowerCase() === "text/html";
  const textLike = /\.(html?|md|markdown|txt|json|csv)$/i.test(file.name) || String(file.type).startsWith("text/");
  if (htmlLike && isDesktopClient() && window.examRuntime?.extractHtmlQuestionSource) return window.examRuntime.extractHtmlQuestionSource(file);
  if (!isDesktopClient() || !window.examRuntime?.extractQuestionSource) {
    if (!textLike) throw new Error("PDF and image OCR are available in the Crossline Windows client. Text and Markdown can still be pasted here.");
    if (htmlLike) {
      const documentNode = new DOMParser().parseFromString(await file.text(), "text/html");
      documentNode.querySelectorAll("script, style, noscript, template").forEach((element) => element.remove());
      return { text: documentNode.body?.textContent?.replace(/\s+/g, " ").trim() || "", method: "html-text", pages: 1, images: [], metadata: {} };
    }
    return { text: await file.text(), method: "text", pages: 1, images: [], metadata: {} };
  }
  const data = new Uint8Array(await file.arrayBuffer());
  return window.examRuntime.extractQuestionSource({ name: file.name, type: file.type, data });
}

async function extractImportSourceFiles(fileList) {
  const files = [...fileList];
  if (!files.length) throw new Error("Choose at least one question source or image.");
  if (files.length > 64) throw new Error("Attach no more than 64 files at once. A ZIP question bank is faster for large sets.");
  if (files.length === 1) {
    const single = await extractImportSourceFile(files[0]);
    return { ...single, name: files[0].name, sources: [{ name: files[0].name, text: single.text || "", images: single.images || [], metadata: single.metadata || {} }] };
  }
  const parts = [];
  const images = [];
  const sources = [];
  let metadata = {};
  let nextImageNumber = 1;
  for (const file of files) {
    const result = await extractImportSourceFile(file);
    let text = result.text || "";
    const sourceImages = [];
    for (const image of result.images || []) {
      const ref = `CROSSLINE_IMAGE_${nextImageNumber++}`;
      text = text.replaceAll(image.ref, ref);
      images.push({ ...image, ref });
      sourceImages.push({ ...image, ref });
    }
    parts.push(`# Source file: ${file.name}\n\n${text}`);
    sources.push({ name: file.name, text, images: sourceImages, metadata: result.metadata || {} });
    if (!metadata.title && result.metadata?.title) metadata = { ...metadata, ...result.metadata };
  }
  return { name: `${files.length} attached files`, text: parts.join("\n\n"), method: "bundle", pages: files.length, images, metadata, sources };
}

function splitSourceIntoChunks(text, maxChars = 150000) {
  const source = String(text || "");
  if (source.length <= maxChars) return source.trim() ? [source] : [];
  const blocks = source.split(/\n\s*(?=(?:Question|Q)\s*\d+[:.)\s])/i);
  const chunks = [];
  let current = "";
  for (const block of blocks) {
    if (current && current.length + block.length + 1 > maxChars) { chunks.push(current); current = block; }
    else current = current ? `${current}\n${block}` : block;
    while (current.length > maxChars) { chunks.push(current.slice(0, maxChars)); current = current.slice(maxChars); }
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

function bindDraftImages(questions, images) {
  const imageMap = new Map((images || []).map((image) => [image.ref, image]));
  const imageByQuestion = new Map((images || []).filter((image) => image.questionNumber).map((image) => [Number(image.questionNumber), image]));
  return (questions || []).map((question, index) => {
    const questionNumber = Number(question.questionNumber || index + 1);
    const asset = imageMap.get(question.imageRef) || imageByQuestion.get(questionNumber) || null;
    return { ...question, questionNumber, imageRef: asset?.ref || question.imageRef || "", image: asset?.dataUrl || "", imageFilename: asset?.name || question.imageFilename || "", imageMimeType: asset?.mimeType || "" };
  });
}

function dedupeDraftQuestions(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    const key = `${String(question.text || "").replace(/\s+/g, " ").trim().toLowerCase()}::${(question.answers || []).map((answer) => String(answer).replace(/\s+/g, " ").trim().toLowerCase()).join("|")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function examTitleFromSourceName(name) {
  const base = String(name || "").replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!base) return "Imported CSCA mock";
  return base.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function runAutoExamBuild({ groups, instructions, onProgress }) {
  const plans = groups.map((group) => ({ group, chunks: splitSourceIntoChunks(group.text) })).filter((plan) => plan.chunks.length);
  if (!plans.length) throw new Error("There is no extracted question text to structure yet. Add sources first.");
  const totalSteps = plans.reduce((sum, plan) => sum + plan.chunks.length, 0);
  let step = 0;
  const built = [];
  for (let index = 0; index < plans.length; index++) {
    const { group, chunks } = plans[index];
    let exam = null;
    const questions = [];
    for (const chunk of chunks) {
      step += 1;
      onProgress?.({ step, totalSteps, sourceName: group.name, groupIndex: index + 1, groupCount: plans.length });
      const payload = await window.CrosslineApi.aiImport({ sourceText: chunk, instructions });
      if (!exam && payload.exam) exam = payload.exam;
      questions.push(...(payload.questions || []));
    }
    const drafts = dedupeDraftQuestions(bindDraftImages(questions, group.images));
    built.push({
      name: group.name,
      exam: {
        title: exam?.title || group.metadata?.title || examTitleFromSourceName(group.name),
        description: exam?.description || `Imported from ${group.name}.`,
        duration: Math.max(1, Math.min(480, Number(exam?.duration || group.metadata?.duration || 60) || 60))
      },
      questions: drafts,
      status: drafts.length ? "ready" : "empty"
    });
  }
  return built;
}

function bindSourceDropZone({ zoneId, inputId, triggerId, onFiles }) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const trigger = document.getElementById(triggerId);
  let dragDepth = 0;
  const openPicker = () => input?.click();
  trigger?.addEventListener("click", openPicker);
  input?.addEventListener("change", async () => {
    await onFiles(input.files);
    input.value = "";
  });
  zone?.addEventListener("click", openPicker);
  zone?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openPicker();
  });
  zone?.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dragDepth += 1;
    zone.classList.add("drag-active");
  });
  zone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  });
  zone?.addEventListener("dragleave", (event) => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) zone.classList.remove("drag-active");
  });
  zone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dragDepth = 0;
    zone.classList.remove("drag-active");
    onFiles(event.dataTransfer?.files || []);
  });
}

function sourceImportProgressText(progress = {}) {
  if (progress.stage === "pdf-text") return "Reading selectable text from the PDF...";
  if (progress.stage === "pdf-render") return "The PDF is scanned. Preparing its pages for OCR...";
  if (progress.stage === "html-parse") return "Reading the HTML structure and linked images...";
  if (progress.stage === "html-ocr") return `Preparing ${progress.images || 0} HTML image${progress.images === 1 ? "" : "s"} for OCR...`;
  if (progress.stage === "zip-open") return "Opening the ZIP question bank safely...";
  if (progress.stage === "zip-file") return `Reading ${progress.file || "an archived source file"}...`;
  if (progress.stage === "zip-images") return `Matching and reading ${progress.images || 0} named question image${progress.images === 1 ? "" : "s"}...`;
  if (progress.stage === "ocr") return `Running local OCR${progress.page ? ` on page ${progress.page} of ${progress.pages}` : ""}${Number.isFinite(progress.progress) ? ` · ${progress.progress}%` : ""}`;
  return "Reading question source...";
}

function createBlankDraftQuestion(questionNumber = 1) {
  return {
    type: "Single choice",
    questionNumber,
    subject: "",
    chapter: "",
    topic: "",
    instruction: "Choose the best answer.",
    text: "",
    answers: ["", "", "", ""],
    correctIndex: 0,
    marks: 1,
    explanation: "",
    imageRef: "",
    image: "",
    imageFilename: "",
    imageMimeType: ""
  };
}

function renderImportedQuestionDrafts(questions = [], { scope = "import", locked = false } = {}) {
  const disabled = locked ? "disabled" : "";
  const count = questions.length;
  const header = count
    ? `<div class="import-drafts-head"><div><p class="admin-kicker">Draft review</p><h3>${count} draft question${count === 1 ? "" : "s"}</h3><p class="form-note">Edit wording, options, marks, taxonomy, and explanations before saving. Changes stay in this list until you save or deploy.</p></div>${locked ? "" : `<button type="button" class="secondary-button add-draft-question" data-draft-scope="${escapeHtml(scope)}">Add question</button>`}</div>`
    : `<div class="import-drafts-empty"><span class="import-drafts-empty-icon">${uiIcon("clipboard-list")}</span><div><p class="admin-kicker">No drafts yet</p><h3>Add a question manually</h3><p class="form-note">Structure a source above, or start a blank four-option question here.</p></div>${locked ? "" : `<button type="button" class="secondary-button add-draft-question" data-draft-scope="${escapeHtml(scope)}">Add question</button>`}</div>`;
  const cards = questions.map((question, index) => {
    const answers = Array.from({ length: 4 }, (_, answerIndex) => String(question.answers?.[answerIndex] ?? ""));
    const correctIndex = Number.isInteger(Number(question.correctIndex)) ? Math.min(3, Math.max(0, Number(question.correctIndex))) : 0;
    const marks = formatScore(normalizeMarks(question.marks));
    const taxonomy = [question.subject, question.chapter, question.topic].filter(Boolean).map((part) => escapeHtml(part)).join(" · ");
    return `<article class="admin-card import-draft-card" data-draft-index="${index}" data-draft-scope="${escapeHtml(scope)}">
      <div class="import-draft-card-head">
        <div>
          <p class="admin-kicker">Draft ${index + 1}${taxonomy ? ` · ${taxonomy}` : ""}</p>
          <div class="exam-meta import-draft-summary">
            <span class="draft-correct-note">Correct: ${letterLabels[correctIndex]}</span>
            <span class="draft-marks-note">${marks} marks</span>
            ${question.imageRef || question.image ? `<span>Image: ${escapeHtml(question.imageFilename || question.imageRef || "attached")}</span>` : ""}
          </div>
        </div>
        ${locked ? "" : `<button type="button" class="danger-button remove-draft-question" data-draft-index="${index}" aria-label="Remove draft ${index + 1}">Remove</button>`}
      </div>
      ${question.image ? `<img class="question-preview-image import-image-preview" src="${escapeHtml(question.image)}" alt="Imported question image${question.imageFilename ? ` ${escapeHtml(question.imageFilename)}` : ""}" />` : ""}
      <fieldset class="import-draft-fields editor-grid" ${disabled}>
        <div class="field"><label>Subject</label><input class="draft-subject" data-draft-index="${index}" value="${escapeHtml(question.subject || "")}" autocomplete="off" /></div>
        <div class="field"><label>Chapter</label><input class="draft-chapter" data-draft-index="${index}" value="${escapeHtml(question.chapter || "")}" autocomplete="off" /></div>
        <div class="field"><label>Topic</label><input class="draft-topic" data-draft-index="${index}" value="${escapeHtml(question.topic || "")}" autocomplete="off" /></div>
        <div class="field"><label>Marks</label><input class="draft-marks" data-draft-index="${index}" type="number" min="0.1" step="0.1" value="${escapeHtml(marks)}" /></div>
        <div class="field wide"><label>Question text</label><textarea class="draft-text" data-draft-index="${index}" rows="3">${escapeHtml(question.text || "")}</textarea></div>
        ${answers.map((answer, answerIndex) => `<div class="field draft-answer-field ${correctIndex === answerIndex ? "is-correct" : ""}"><span class="draft-answer-label"><span class="draft-answer-letter" aria-hidden="true">${letterLabels[answerIndex]}</span><input class="draft-answer" data-draft-index="${index}" data-answer-index="${answerIndex}" value="${escapeHtml(answer)}" aria-label="Option ${letterLabels[answerIndex]}" /><label class="draft-correct-pick"><input type="radio" class="draft-correct" name="draft-correct-${escapeHtml(scope)}-${index}" data-draft-index="${index}" value="${answerIndex}" ${correctIndex === answerIndex ? "checked" : ""} /><span>Correct</span></label></span></div>`).join("")}
        <div class="field wide"><label>Explanation</label><textarea class="draft-explanation compact-textarea" data-draft-index="${index}" rows="2" placeholder="Optional. LaTeX supported.">${escapeHtml(question.explanation || "")}</textarea></div>
      </fieldset>
    </article>`;
  }).join("");
  return `<div class="import-drafts" data-draft-scope="${escapeHtml(scope)}">${header}${cards}</div>`;
}

function bindImportedDraftEditors(root, questions, { onStructureChange } = {}) {
  if (!root || !Array.isArray(questions)) return;
  const readIndex = (element) => Number(element.dataset.draftIndex);
  root.querySelectorAll(".draft-text").forEach((input) => input.addEventListener("input", () => {
    const question = questions[readIndex(input)];
    if (question) question.text = input.value;
  }));
  root.querySelectorAll(".draft-answer").forEach((input) => input.addEventListener("input", () => {
    const question = questions[readIndex(input)];
    if (!question) return;
    if (!Array.isArray(question.answers)) question.answers = ["", "", "", ""];
    question.answers[Number(input.dataset.answerIndex)] = input.value;
  }));
  root.querySelectorAll(".draft-subject").forEach((input) => input.addEventListener("input", () => {
    const question = questions[readIndex(input)];
    if (question) question.subject = input.value;
  }));
  root.querySelectorAll(".draft-chapter").forEach((input) => input.addEventListener("input", () => {
    const question = questions[readIndex(input)];
    if (question) question.chapter = input.value;
  }));
  root.querySelectorAll(".draft-topic").forEach((input) => input.addEventListener("input", () => {
    const question = questions[readIndex(input)];
    if (question) question.topic = input.value;
  }));
  root.querySelectorAll(".draft-explanation").forEach((input) => input.addEventListener("input", () => {
    const question = questions[readIndex(input)];
    if (question) question.explanation = input.value;
  }));
  root.querySelectorAll(".draft-marks").forEach((input) => input.addEventListener("input", () => {
    const question = questions[readIndex(input)];
    if (!question) return;
    question.marks = normalizeMarks(input.value);
    const card = input.closest(".import-draft-card");
    const note = card?.querySelector(".draft-marks-note");
    if (note) note.textContent = `${formatScore(question.marks)} marks`;
  }));
  root.querySelectorAll(".draft-correct").forEach((input) => input.addEventListener("change", () => {
    const question = questions[readIndex(input)];
    if (!question || !input.checked) return;
    question.correctIndex = Number(input.value);
    const card = input.closest(".import-draft-card");
    const note = card?.querySelector(".draft-correct-note");
    if (note) note.textContent = `Correct: ${letterLabels[question.correctIndex] || "A"}`;
    card?.querySelectorAll(".draft-answer-field").forEach((field, answerIndex) => {
      field.classList.toggle("is-correct", answerIndex === question.correctIndex);
    });
  }));
  root.querySelectorAll(".remove-draft-question").forEach((button) => button.addEventListener("click", () => {
    const index = readIndex(button);
    if (!Number.isInteger(index) || index < 0 || index >= questions.length) return;
    questions.splice(index, 1);
    onStructureChange?.();
  }));
  root.querySelectorAll(".add-draft-question").forEach((button) => button.addEventListener("click", () => {
    questions.push(createBlankDraftQuestion(questions.length + 1));
    onStructureChange?.();
  }));
}

function showQuestionImport(message = "") {
  message = typeof message === "string" ? message : "";
  const initial = pendingImportSource;
  pendingImportSource = null;
  const initialMetadata = initial?.metadata || {};
  const createSelected = Boolean(initial?.text) || !exams.length;
  const examOptions = `<option value="__create__" ${createSelected ? "selected" : ""}>Create a new exam from this source</option>${exams.map((exam, index) => `<option value="${escapeHtml(exam.id)}" ${!createSelected && index === 0 ? "selected" : ""}>Add to ${escapeHtml(exam.title)}</option>`).join("")}`;
  app.innerHTML = adminShell(`
    <div class="admin-toolbar"><div><p class="admin-kicker">Question intake</p><h1>Import questions</h1><p class="muted">Turn a ZIP question bank, HTML, PDF, image, Markdown, text, JSON, or CSV paper into editable drafts you can review before saving.</p></div><button id="back-admin" class="ghost-button">Back to exams</button></div>
    <ol class="import-steps" aria-label="Import progress"><li class="active" data-step="sources"><span>1</span>Add sources</li><li data-step="structure"><span>2</span>Structure with GLM</li><li data-step="review"><span>3</span>Review drafts</li><li data-step="deploy"><span>4</span>Deploy exams</li></ol>
    <section class="admin-card import-guide"><h2>Local extraction, then OpenCode structuring</h2><p>HTML structure, related images, PDF text, and Tesseract OCR are processed on this computer. Only extracted text and image markers go to GLM 5.2. Original images stay local and are restored onto the matching question after structuring.</p><p class="form-note">Correct answers must be explicit in the source. Edit every draft before publishing.</p></section>
    <section class="admin-card autopilot-card"><div class="autopilot-heading"><div><p class="admin-kicker">Exam auto-builder</p><h2>Dump everything, let GLM build the exams</h2><p class="muted">Drop all your papers at once. Big sources are split into batches automatically, each file can become its own exam, and you deploy everything after one review.</p></div><span>${uiIcon("star")}</span></div>
      <div class="autopilot-controls"><div class="field"><label>Grouping</label><select id="autopilot-mode"><option value="per-source">One exam per source file</option><option value="combined">Combine everything into one exam</option></select></div><div class="autopilot-actions"><button id="auto-build" type="button" class="primary-button autopilot-build-button">${uiIcon("star")} Auto-build exams with GLM</button></div></div>
      <div id="autopilot-progress" class="autopilot-progress hidden"><div class="autopilot-progress-track"><div id="autopilot-progress-fill" class="autopilot-progress-fill"></div></div><p id="autopilot-progress-text" class="form-note"></p></div>
      <div id="autopilot-results" class="autopilot-results"></div>
      <div id="autopilot-deploy-row" class="admin-card-actions hidden"><button id="deploy-all-exams" type="button" class="primary-button">Deploy all reviewed exams</button><button id="autopilot-clear" type="button" class="ghost-button">Discard drafts</button></div>
      <p id="autopilot-message" class="form-message"></p>
    </section>
    <section class="panel"><form id="question-import-form" class="editor-grid">
      <div class="field wide"><label>Import destination</label><select id="import-exam">${examOptions}</select></div>
      <div class="field"><label>New exam title</label><input id="import-exam-title" value="${escapeHtml(initialMetadata.title || "Imported CSCA mock")}" /></div>
      <div class="field"><label>Duration in minutes</label><input id="import-exam-duration" type="number" min="1" max="480" step="1" value="${escapeHtml(initialMetadata.duration || 60)}" /></div>
      <div class="field wide"><label>New exam description</label><input id="import-exam-description" value="Imported from ${escapeHtml(initial?.name || "an administrator source file")}." /></div>
      <div class="field wide"><label>Question sources and images</label><div id="import-drop-zone" class="source-drop-zone" role="button" tabindex="0" aria-describedby="import-message"><span>${uiIcon("upload")}</span><div><b>Drag and drop files here</b><small>Use one ZIP for a full question bank, or drop several source files and named images together.</small></div></div><input id="import-file" class="source-file-input" type="file" multiple accept=".zip,application/zip,application/x-zip-compressed,.html,.htm,text/html,.pdf,application/pdf,.md,.markdown,.txt,.json,.csv,image/png,image/jpeg,image/webp,image/bmp,image/tiff" /><button id="import-attach-trigger" type="button" class="secondary-button source-browse-button">Browse files</button><p class="form-note">Name loose images Q1.png, Q19.png, Question-20.jpg, and so on to bind them deterministically.</p></div>
      <div class="field wide"><label>Extracted source text</label><textarea id="import-source" placeholder="Choose a source file, or paste a question bank here.">${escapeHtml(initial?.text || "")}</textarea></div>
      <div class="field wide"><label>Instructions for the import assistant (optional)</label><textarea id="import-instructions" class="compact-textarea" placeholder="Use only for taxonomy or formatting. The source wording, marks, timing, answers, and image positions stay unchanged."></textarea></div>
      <p id="import-message" class="form-message">${escapeHtml(message || (initial ? `${initial.name} is attached. You can discuss it in the assistant or structure it now.` : ""))}</p>
      <div class="admin-card-actions"><button id="draft-with-ai" type="button" class="secondary-button">Structure with OpenCode</button><button id="parse-import-locally" type="button" class="ghost-button">Parse JSON / text locally</button><button id="add-imported-questions" type="button" class="primary-button" disabled>Save reviewed drafts</button></div>
    </form></section><section id="import-results"></section>`, "import");
  bindAdminShell();
  bind("back-admin", "click", showAdminDashboard);
  let drafts = [];
  let sourceImages = initial?.images || [];
  let sourceMetadata = initialMetadata;
  let sourceGroups = initial?.sources || (initial?.text ? [{ name: initial.name || "Pasted source", text: initial.text, images: initial.images || [], metadata: initialMetadata }] : []);
  let autoExamGroups = [];
  const setImportStep = (step) => {
    const order = ["sources", "structure", "review", "deploy"];
    const reached = order.indexOf(step);
    document.querySelectorAll(".import-steps li").forEach((item) => {
      const index = order.indexOf(item.dataset.step);
      item.classList.toggle("active", index === reached);
      item.classList.toggle("done", index < reached);
    });
  };
  if (sourceGroups.length) setImportStep("structure");
  sourceImportProgressUnsubscribe?.();
  sourceImportProgressUnsubscribe = window.examRuntime?.onSourceImportProgress?.((progress) => { const box = document.getElementById("import-message"); if (box) box.textContent = sourceImportProgressText(progress); }) || null;
  const handleImportFiles = async (fileList) => {
    const files = [...(fileList || [])];
    const messageBox = document.getElementById("import-message");
    if (!files.length) return;
    if (messageBox) messageBox.textContent = `Reading ${files.length === 1 ? files[0].name : `${files.length} selected files`}...`;
    try {
      const result = await extractImportSourceFiles(files);
      sourceImages = result.images || [];
      sourceMetadata = result.metadata || {};
      sourceGroups = result.sources || [{ name: result.name, text: result.text || "", images: sourceImages, metadata: sourceMetadata }];
      const source = document.getElementById("import-source");
      if (source) source.value = result.text || "";
      if (sourceMetadata.title) document.getElementById("import-exam-title").value = sourceMetadata.title;
      if (sourceMetadata.duration) document.getElementById("import-exam-duration").value = sourceMetadata.duration;
      setImportStep("structure");
      if (messageBox) messageBox.textContent = `${result.method.includes("ocr") ? "OCR" : "Extraction"} complete${result.pages > 1 ? ` for ${result.pages} pages` : ""}${sourceImages.length ? ` with ${sourceImages.length} preserved image${sourceImages.length === 1 ? "" : "s"}` : ""}. Review the text, then structure it.`;
    } catch (error) {
      if (messageBox) messageBox.textContent = error.message || "The selected source could not be read.";
    }
  };
  bindSourceDropZone({ zoneId: "import-drop-zone", inputId: "import-file", triggerId: "import-attach-trigger", onFiles: handleImportFiles });
  const autoStatusLabel = { ready: "Ready to deploy", empty: "No usable questions", deploying: "Deploying...", deployed: "Deployed", failed: "Deploy failed" };
  const renderAutoExamGroups = () => {
    const holder = document.getElementById("autopilot-results");
    const deployRow = document.getElementById("autopilot-deploy-row");
    if (!holder) return;
    holder.innerHTML = autoExamGroups.map((group, index) => {
      const locked = group.status === "deployed" || group.status === "deploying";
      const scope = `auto-${index}`;
      const reviewLabel = group.questions.length
        ? `Review ${group.questions.length} draft question${group.questions.length === 1 ? "" : "s"}`
        : "Add questions manually";
      return `<article class="admin-card exam-group-card ${group.status}"><div class="exam-group-head"><div><p class="admin-kicker">${escapeHtml(group.name)}</p><span class="status-chip ${group.status}">${autoStatusLabel[group.status] || group.status}</span></div><button type="button" class="ghost-button remove-exam-group" data-index="${index}" ${group.status === "deploying" ? "disabled" : ""}>Remove</button></div>
      <div class="editor-grid exam-group-fields"><div class="field wide"><label>Exam title</label><input class="group-title" data-index="${index}" value="${escapeHtml(group.exam.title)}" ${locked ? "disabled" : ""} /></div><div class="field"><label>Duration in minutes</label><input class="group-duration" data-index="${index}" type="number" min="1" max="480" step="1" value="${escapeHtml(group.exam.duration)}" ${locked ? "disabled" : ""} /></div><div class="field wide"><label>Description</label><input class="group-description" data-index="${index}" value="${escapeHtml(group.exam.description)}" ${locked ? "disabled" : ""} /></div></div>
      <div class="exam-meta"><span>${group.questions.length} question${group.questions.length === 1 ? "" : "s"}</span><span>${formatScore(group.questions.reduce((sum, question) => sum + normalizeMarks(question.marks), 0))} marks</span><span>${group.questions.filter((question) => question.image).length} images</span></div>
      ${group.error ? `<p class="form-message">${escapeHtml(group.error)}</p>` : ""}
      <details class="exam-group-review" data-group-index="${index}" ${group.reviewOpen || !group.questions.length ? "open" : ""}><summary>${reviewLabel}</summary>${renderImportedQuestionDrafts(group.questions, { scope, locked })}</details>
    </article>`;
    }).join("");
    const deployable = autoExamGroups.some((group) => (group.status === "ready" || group.status === "failed") && group.questions.length);
    if (deployRow) deployRow.classList.toggle("hidden", !autoExamGroups.length);
    const deployButton = document.getElementById("deploy-all-exams");
    if (deployButton) deployButton.disabled = !deployable;
    holder.querySelectorAll(".remove-exam-group").forEach((button) => button.addEventListener("click", () => { autoExamGroups.splice(Number(button.dataset.index), 1); renderAutoExamGroups(); }));
    holder.querySelectorAll(".group-title, .group-duration, .group-description").forEach((input) => input.addEventListener("input", () => {
      const group = autoExamGroups[Number(input.dataset.index)];
      if (!group) return;
      if (input.classList.contains("group-title")) group.exam.title = input.value;
      else if (input.classList.contains("group-duration")) group.exam.duration = Number(input.value);
      else group.exam.description = input.value;
    }));
    holder.querySelectorAll(".exam-group-review").forEach((details) => {
      const group = autoExamGroups[Number(details.dataset.groupIndex)];
      if (!group) return;
      details.addEventListener("toggle", () => { group.reviewOpen = details.open; });
      bindImportedDraftEditors(details, group.questions, {
        onStructureChange: () => {
          group.reviewOpen = true;
          if (group.status === "empty" || group.status === "ready" || group.status === "failed") {
            group.status = group.questions.length ? "ready" : "empty";
            group.error = "";
          }
          renderAutoExamGroups();
        }
      });
    });
  };
  bind("auto-build", "click", async () => {
    const statusBox = document.getElementById("autopilot-message");
    const progress = document.getElementById("autopilot-progress");
    const progressFill = document.getElementById("autopilot-progress-fill");
    const progressText = document.getElementById("autopilot-progress-text");
    const buildButton = document.getElementById("auto-build");
    const instructions = document.getElementById("import-instructions").value.trim();
    const pastedText = document.getElementById("import-source").value.trim();
    try {
      if (!apiEnabled()) throw new Error("The exam auto-builder needs the production API.");
      let groups = sourceGroups.filter((group) => String(group.text || "").trim());
      if (!groups.length && pastedText) groups = [{ name: "Pasted source", text: pastedText, images: sourceImages, metadata: sourceMetadata }];
      if (!groups.length) throw new Error("Add source files or paste question text first.");
      if (document.getElementById("autopilot-mode").value === "combined") {
        groups = [{
          name: groups.length === 1 ? groups[0].name : `${groups.length} combined sources`,
          text: groups.map((group) => `# Source file: ${group.name}\n\n${group.text}`).join("\n\n"),
          images: groups.flatMap((group) => group.images || []),
          metadata: groups.find((group) => group.metadata?.title)?.metadata || groups[0].metadata || {}
        }];
      }
      if (buildButton) buildButton.disabled = true;
      progress?.classList.remove("hidden");
      if (statusBox) statusBox.textContent = "";
      autoExamGroups = await runAutoExamBuild({
        groups,
        instructions,
        onProgress: ({ step, totalSteps, sourceName, groupIndex, groupCount }) => {
          if (progressFill) progressFill.style.width = `${Math.round(((step - 1) / totalSteps) * 100)}%`;
          if (progressText) progressText.textContent = `GLM 5.2 is structuring batch ${step} of ${totalSteps}${groupCount > 1 ? ` · source ${groupIndex} of ${groupCount}` : ""} · ${sourceName}`;
        }
      });
      if (progressFill) progressFill.style.width = "100%";
      const readyCount = autoExamGroups.filter((group) => group.questions.length).length;
      const questionCount = autoExamGroups.reduce((sum, group) => sum + group.questions.length, 0);
      if (progressText) progressText.textContent = readyCount ? `${questionCount} questions structured into ${readyCount} exam draft${readyCount === 1 ? "" : "s"}. Review below, then deploy.` : "No usable questions were found. Check that correct answers are explicit in the sources.";
      setImportStep(readyCount ? "review" : "structure");
      renderAutoExamGroups();
    } catch (error) {
      if (statusBox) statusBox.textContent = error.message || "The exam auto-builder could not finish.";
      progress?.classList.add("hidden");
    } finally {
      if (buildButton) buildButton.disabled = false;
    }
  });
  bind("autopilot-clear", "click", () => {
    autoExamGroups = [];
    document.getElementById("autopilot-progress")?.classList.add("hidden");
    const statusBox = document.getElementById("autopilot-message");
    if (statusBox) statusBox.textContent = "";
    setImportStep(sourceGroups.length ? "structure" : "sources");
    renderAutoExamGroups();
  });
  bind("deploy-all-exams", "click", async () => {
    const statusBox = document.getElementById("autopilot-message");
    const pending = autoExamGroups.filter((group) => (group.status === "ready" || group.status === "failed") && group.questions.length);
    if (!pending.length) return;
    for (const group of pending) {
      group.status = "deploying";
      group.error = "";
      renderAutoExamGroups();
      try {
        const examInput = { title: String(group.exam.title || "").trim(), description: String(group.exam.description || "").trim(), duration: Number(group.exam.duration) };
        if (!examInput.title || !examInput.description || !Number.isFinite(examInput.duration) || examInput.duration < 1) throw new Error("A title, description, and valid duration are required.");
        if (apiEnabled()) {
          await window.CrosslineApi.deployExam(examInput, group.questions);
        } else {
          exams.push({ id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...examInput, questions: group.questions });
          save("csca-exams", exams);
        }
        group.status = "deployed";
      } catch (error) {
        group.status = "failed";
        group.error = error.message || "This exam could not be deployed.";
      }
    }
    if (apiEnabled()) { try { await refreshExamsFromApi(true); } catch {} }
    const deployed = autoExamGroups.filter((group) => group.status === "deployed").length;
    const failed = autoExamGroups.filter((group) => group.status === "failed").length;
    if (statusBox) statusBox.textContent = failed ? `${deployed} exam${deployed === 1 ? "" : "s"} deployed, ${failed} failed. Fix the errors above and deploy again.` : `All ${deployed} exam${deployed === 1 ? "" : "s"} deployed. Students can see them now.`;
    setImportStep("deploy");
    renderAutoExamGroups();
  });
  const renderDrafts = () => {
    const holder = document.getElementById("import-results");
    if (holder) {
      holder.innerHTML = renderImportedQuestionDrafts(drafts, { scope: "import" });
      bindImportedDraftEditors(holder, drafts, { onStructureChange: renderDrafts });
    }
    const add = document.getElementById("add-imported-questions");
    if (add) add.disabled = !drafts.length;
  };
  renderDrafts();
  bind("parse-import-locally", "click", () => {
    drafts = parseImportedQuestionsLocally(document.getElementById("import-source").value);
    const messageBox = document.getElementById("import-message");
    if (messageBox) messageBox.textContent = drafts.length ? "Drafts parsed locally. Review and edit them before saving." : "No valid four-option questions were found. Try JSON or the documented text format, or add a blank question below.";
    if (drafts.length) setImportStep("review");
    renderDrafts();
  });
  bind("draft-with-ai", "click", async () => {
    const sourceText = document.getElementById("import-source").value.trim();
    const instructions = document.getElementById("import-instructions").value.trim();
    const messageBox = document.getElementById("import-message");
    if (messageBox) messageBox.textContent = "OpenCode is structuring the extracted questions with GLM 5.2...";
    try {
      if (!apiEnabled()) throw new Error("OpenCode structuring needs the production API.");
      if (!sourceText) throw new Error("Choose a source file or paste question text first.");
      const payload = await window.CrosslineApi.aiImport({ sourceText, instructions });
      drafts = bindDraftImages(payload.questions, sourceImages);
      sourceMetadata = { ...sourceMetadata, ...(payload.exam || {}) };
      if (payload.exam?.title) document.getElementById("import-exam-title").value = payload.exam.title;
      if (payload.exam?.duration) document.getElementById("import-exam-duration").value = payload.exam.duration;
      if (payload.exam?.description) document.getElementById("import-exam-description").value = payload.exam.description;
      if (messageBox) messageBox.textContent = drafts.length ? `${drafts.length} structured drafts are ready. Review them before saving.` : "No usable questions were found.";
      if (drafts.length) setImportStep("review");
      renderDrafts();
    } catch (error) {
      if (messageBox) messageBox.textContent = error.message || "OpenCode structuring could not be completed.";
    }
  });
  bind("add-imported-questions", "click", async () => {
    if (!drafts.length) return;
    const button = document.getElementById("add-imported-questions");
    if (button) button.disabled = true;
    let examId = document.getElementById("import-exam").value;
    try {
      if (examId === "__create__") {
        const examInput = { title: document.getElementById("import-exam-title").value.trim(), description: document.getElementById("import-exam-description").value.trim(), duration: Number(document.getElementById("import-exam-duration").value) };
        if (!examInput.title || !examInput.description || !Number.isFinite(examInput.duration)) throw new Error("A title, description, and duration are required for the new exam.");
        if (apiEnabled()) {
          const created = await window.CrosslineApi.deployExam(examInput, drafts);
          examId = created.exam.id;
          await refreshExamsFromApi(true);
        } else {
          examId = `imported-${Date.now()}`;
          exams.push({ id: examId, ...examInput, questions: drafts });
          save("csca-exams", exams);
        }
      } else {
        const exam = exams.find((item) => item.id === examId);
        if (!exam) throw new Error("Choose an exam destination.");
        if (apiEnabled()) { await window.CrosslineApi.importQuestions(examId, drafts); await refreshExamsFromApi(true); }
        else { exam.questions.push(...drafts); save("csca-exams", exams); }
      }
      showQuestionEditor(examId);
    } catch (error) {
      if (button) button.disabled = false;
      const messageBox = document.getElementById("import-message");
      if (messageBox) messageBox.textContent = error.message || "The imported questions could not be saved.";
    }
  });
}

async function showAdminNotifications(message = "") {
  message = typeof message === "string" ? message : "";
  if (!apiEnabled()) {
    app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Student communication</p><h1>Notifications</h1><p class="muted">Notifications are available when the production API is connected.</p></div></div><section class="panel"><p class="form-note">Use the deployed administrator client to send a notification to students.</p></section>`, "notifications");
    bindAdminShell();
    return;
  }
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Student communication</p><h1>Notifications</h1><p class="muted">Loading sent updates...</p></div></div>${adminSkeleton(3)}`, "notifications");
  bindAdminShell();
  try {
    const payload = await window.CrosslineApi.adminNotifications();
    const notifications = payload.notifications || [];
    const content = `<div class="admin-toolbar"><div><p class="admin-kicker">Student communication</p><h1>Notifications</h1><p class="muted">Send concise updates about new exams, released results, or important account notices.</p></div></div><section class="panel"><form id="admin-notification-form" class="editor-grid"><div class="field"><label>Notification type</label><select id="notification-kind"><option value="info">General update</option><option value="exam">New exam</option><option value="result">Result release</option><option value="update">App update</option></select></div><div class="field"><label>Audience</label><select id="notification-audience"><option value="students">All students</option><option value="all">Everyone</option></select></div><div class="field wide"><label>Title</label><input id="notification-title" maxlength="140" required /></div><div class="field wide"><label>Message</label><textarea id="notification-body" maxlength="1000" required></textarea></div><p class="form-message">${escapeHtml(message)}</p><button class="primary-button">Send notification</button></form></section><section class="admin-notification-list">${notifications.length ? notifications.map((item) => `<article class="admin-card"><p class="admin-kicker">${escapeHtml(item.kind)} · ${escapeHtml(item.audience)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p><small>${escapeHtml(formatDateTime(item.createdAt))}</small></article>`).join("") : `<section class="panel"><p class="form-note">No notifications have been sent.</p></section>`}</section>`;
    app.innerHTML = adminShell(content, "notifications");
    bindAdminShell();
    bind("admin-notification-form", "submit", async (event) => { event.preventDefault(); try { await window.CrosslineApi.createNotification({ kind: document.getElementById("notification-kind").value, audience: document.getElementById("notification-audience").value, title: document.getElementById("notification-title").value.trim(), body: document.getElementById("notification-body").value.trim() }); showAdminNotifications("Notification sent."); } catch (error) { showAdminNotifications(error.message); } });
  } catch (error) { showAdminNotifications(error.message || "Notifications could not be loaded."); }
}

async function deleteExam(examId) {
  const exam = exams.find((item) => item.id === examId);
  if (!exam || !confirm(`Delete "${exam.title}" and all its questions?`)) return;
  if (apiEnabled()) {
    try {
      await window.CrosslineApi.deleteExam(examId);
      await refreshExamsFromApi(true);
      return showAdminDashboard();
    } catch (error) {
      return showAdminDashboard();
    }
  }
  exams = exams.filter((item) => item.id !== examId);
  save("csca-exams", exams);
  showAdminDashboard();
}
async function showAdminSubmissions(message = "") {
  message = typeof message === "string" ? message : "";
  if (!apiEnabled()) {
    app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>Student submissions</h1><p class="muted">Live submissions require the production API.</p></div></div><section class="panel"><p class="form-note">Local prototype mode does not have server-side student attempts. In production this page lists recent attempts, answers, event logs, and result email status.</p></section>`, "submissions");
    bindAdminShell();
    return;
  }

  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>Student submissions</h1><p class="muted">Loading recent exam attempts...</p></div></div>${adminSkeleton(4)}`, "submissions");
  bindAdminShell();
  try {
    const payload = await window.CrosslineApi.adminSubmissions();
    const submissions = payload.submissions || [];
    app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>Student submissions</h1><p class="muted">Latest ${submissions.length} attempts with answer review and result email status.</p></div><button id="refresh-submissions" class="secondary-button">Refresh</button></div>${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}${submissions.length ? submissions.map((submission) => `<article class="admin-card"><h3>${escapeHtml(submission.studentEmail)}</h3><p>${escapeHtml(submission.examTitle)}</p><div class="exam-meta"><span>Created: ${escapeHtml(formatDateTime(submission.createdAt))}</span><span>Submitted: ${escapeHtml(formatDateTime(submission.submittedAt))}</span><span>Result email: ${escapeHtml(resultEmailStatus(submission))}</span><span>Events: ${submission.eventCount}</span></div><div class="admin-card-actions"><button class="secondary-button review-submission" data-id="${escapeHtml(submission.id)}">Review attempt</button></div></article>`).join("") : `<section class="panel"><p class="form-note">No student attempts have been recorded yet.</p></section>`}`, "submissions");
    bindAdminShell();
    bind("refresh-submissions", "click", showAdminSubmissions);
    document.querySelectorAll(".review-submission").forEach((button) => button.addEventListener("click", () => showAdminSubmissionDetail(button.dataset.id)));
  } catch (error) {
    app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>Student submissions</h1><p class="muted">Could not load recent exam attempts.</p></div><button id="refresh-submissions" class="secondary-button">Retry</button></div><section class="panel"><p class="form-message">${escapeHtml(error.message)}</p></section>`, "submissions");
    bindAdminShell();
    bind("refresh-submissions", "click", showAdminSubmissions);
  }
}
async function showAdminSubmissionDetail(submissionId) {
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>Student submission</h1><p class="muted">Loading answers and result status...</p></div><button id="back-submissions" class="ghost-button">Back</button></div>${adminSkeleton(3)}`, "submissions");
  bindAdminShell();
  bind("back-submissions", "click", showAdminSubmissions);
  try {
    const payload = await window.CrosslineApi.adminSubmission(submissionId);
    const { submission, questions = [], events = [] } = payload;
    app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>${escapeHtml(submission.studentEmail)}</h1><p class="muted">${mathHtml(submission.examTitle)} · Score ${formatScore(submission.score.earned)} / ${formatScore(submission.score.total)}</p></div><button id="back-submissions" class="ghost-button">Back to submissions</button></div><section class="admin-card submission-summary"><div><strong>Started</strong><span>${escapeHtml(formatDateTime(submission.startedAt || submission.createdAt))}</span></div><div><strong>Submitted</strong><span>${escapeHtml(formatDateTime(submission.submittedAt))}</span></div><div><strong>Phone camera</strong><span>${escapeHtml(formatDateTime(submission.phoneConnectedAt))}</span></div><div><strong>Result email</strong><span>${escapeHtml(resultEmailStatus(submission))}</span></div><div><strong>Session ID</strong><span>${escapeHtml(submission.id)}</span></div></section><section class="panel"><h2>MCQ review</h2>${questions.map((question) => `<article class="answer-review ${question.correct === true ? "correct" : question.correct === false ? "wrong" : ""}"><h3>Question ${question.position}</h3><p>${mathHtml(question.text)}</p><div class="exam-meta"><span>Student answer: ${question.selected === null ? "Not answered" : mathHtml(question.answers?.[Number(question.selected)] || letterLabels[Number(question.selected)])}</span><span>Correct answer: ${mathHtml(question.answers?.[question.correctIndex] || letterLabels[question.correctIndex])}</span><span>Marks: ${formatScore(question.earnedMarks)} / ${formatScore(question.marks)}</span><span>${question.correct === null ? "Unanswered" : question.correct ? "Correct" : "Wrong"}</span></div>${question.explanation || question.explanationImage ? `<div class="explanation-box"><strong>Explanation</strong>${question.explanation ? `<p>${mathHtml(question.explanation)}</p>` : ""}${question.explanationImage ? `<img class="question-preview-image" src="${escapeHtml(question.explanationImage)}" alt="Explanation image" />` : ""}</div>` : ""}</article>`).join("")}</section><section class="panel"><h2>Security/event log</h2>${events.length ? `<ul class="event-list">${events.map((event) => `<li><strong>${escapeHtml(event.type)}</strong><span>${escapeHtml(formatDateTime(event.createdAt))}</span></li>`).join("")}</ul>` : `<p class="form-note">No events recorded.</p>`}</section>`, "submissions");
    bindAdminShell();
    bind("back-submissions", "click", showAdminSubmissions);
    renderMath();
  } catch (error) {
    showAdminSubmissions(error.message);
  }
}
function showCreateExam() {
  app.innerHTML = adminShell(`<div class="admin-toolbar"><h1>Create exam</h1><button id="back-admin" class="ghost-button">Back</button></div><section class="panel"><form id="create-exam-form" class="editor-grid"><div class="field wide"><label>Exam title</label><input id="exam-title" required /></div><div class="field wide"><label>Description</label><textarea id="exam-description" required></textarea></div><div class="field"><label>Duration in minutes</label><input id="exam-duration" type="number" min="1" value="60" required /></div><p class="form-note wide">Every published exam is available to all registered students at no cost.</p><button class="primary-button">Create exam</button></form></section>`);
  bindAdminShell(); bind("back-admin", "click", showAdminDashboard); bind("create-exam-form", "submit", async (event) => {
    event.preventDefault();
    const title = document.getElementById("exam-title").value.trim();
    const exam = { id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, title, description: document.getElementById("exam-description").value.trim(), duration: Number(document.getElementById("exam-duration").value), questions: [] };
    if (apiEnabled()) {
      try {
        const payload = await window.CrosslineApi.createExam(exam);
        await refreshExamsFromApi(true);
        return showQuestionEditor(payload.exam.id);
      } catch (error) {
        return showAdminLogin(error.message);
      }
    }
    exams.push(exam); save("csca-exams", exams); showQuestionEditor(exam.id);
  });
}
function showQuestionEditor(examId) {
  editorExamId = examId; editorImage = ""; editorExplanationImage = ""; const exam = exams.find((item) => item.id === examId);
  if (!exam) return showAdminDashboard();
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>${mathHtml(exam.title)}</h1><p class="muted">${exam.questions.length} questions · ${formatScore(exam.questions.reduce((sum, question) => sum + normalizeMarks(question.marks), 0))} total marks</p></div><button id="back-admin" class="ghost-button">Back to papers</button></div><section class="panel"><h3>Add a question</h3><p class="form-note">LaTeX is supported in question text, options, and explanations. Example: \\(x^2 + y^2\\).</p><form id="question-form" class="editor-grid"><div class="field"><label>Subject</label><input id="question-subject" placeholder="Mathematics" /></div><div class="field"><label>Chapter</label><input id="question-chapter" placeholder="Algebra" /></div><div class="field"><label>Topic</label><input id="question-topic" placeholder="Quadratic equations" /></div><div class="field wide"><label>Question text</label><textarea id="new-question" required></textarea></div>${[0,1,2,3].map((index) => `<div class="field"><label>Option ${letterLabels[index]}</label><input id="option-${index}" required /></div>`).join("")}<div class="field"><label>Correct answer</label><select id="correct-answer">${letterLabels.map((label, index) => `<option value="${index}">${label}</option>`).join("")}</select></div><div class="field"><label>Marks for this question</label><input id="question-marks" type="number" min="0.1" step="0.1" value="1" required /></div><div class="field wide"><label>Optional question image</label><input id="question-image-input" type="file" accept="image/*" /><img id="editor-preview" class="question-preview-image hidden" alt="Question image preview" /></div><div class="field wide"><label>Answer explanation</label><textarea id="question-explanation" placeholder="Explain the correct answer. LaTeX supported."></textarea></div><div class="field wide"><label>Optional explanation image / graph</label><input id="explanation-image-input" type="file" accept="image/*" /><img id="explanation-preview" class="question-preview-image hidden" alt="Explanation image preview" /></div><button class="primary-button">Add question</button></form></section><div id="question-list">${exam.questions.map((question, index) => `<article class="admin-card"><p class="admin-kicker">${escapeHtml([question.subject, question.chapter, question.topic].filter(Boolean).join(" · ") || "Untitled topic")}</p><h3>Question ${index + 1}</h3><p>${mathHtml(question.text)}</p>${question.image ? `<img class="question-preview-image" src="${question.image}" alt="Attached question image" />` : ""}<div class="exam-meta"><span>Correct answer: ${letterLabels[Number(question.correctIndex || 0)]}</span><span>Marks: ${formatScore(question.marks)}</span>${question.explanation ? `<span>Explanation added</span>` : ""}${question.explanationImage ? `<span>Explanation image added</span>` : ""}</div><div class="admin-card-actions"><button class="secondary-button edit-question" data-index="${index}">Edit</button><button class="danger-button delete-question" data-index="${index}" data-question-id="${escapeHtml(question.backendId || "")}">Delete</button></div></article>`).join("")}</div>`);
  bindAdminShell(); bind("back-admin", "click", showAdminDashboard);
  bind("question-image-input", "change", (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { editorImage = reader.result; const preview = document.getElementById("editor-preview"); preview.src = editorImage; preview.classList.remove("hidden"); }; reader.readAsDataURL(file); });
  bind("explanation-image-input", "change", (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { editorExplanationImage = reader.result; const preview = document.getElementById("explanation-preview"); preview.src = editorExplanationImage; preview.classList.remove("hidden"); }; reader.readAsDataURL(file); });
  bind("question-form", "submit", async (event) => {
    event.preventDefault();
    const question = { type: "Single choice", subject: document.getElementById("question-subject").value.trim(), chapter: document.getElementById("question-chapter").value.trim(), topic: document.getElementById("question-topic").value.trim(), instruction: "Choose the best answer.", text: document.getElementById("new-question").value.trim(), answers: [0,1,2,3].map((index) => document.getElementById(`option-${index}`).value.trim()), correctIndex: Number(document.getElementById("correct-answer").value), marks: normalizeMarks(document.getElementById("question-marks").value), explanation: document.getElementById("question-explanation").value.trim(), explanationImage: editorExplanationImage, image: editorImage };
    if (apiEnabled()) {
      try {
        await window.CrosslineApi.createQuestion(examId, question);
        await refreshExamsFromApi(true);
        return showQuestionEditor(examId);
      } catch (error) {
        return showAdminLogin(error.message);
      }
    }
    exam.questions.push(question); save("csca-exams", exams); showQuestionEditor(examId);
  });
  document.querySelectorAll(".delete-question").forEach((button) => button.addEventListener("click", async () => {
    if (apiEnabled() && button.dataset.questionId) {
      try {
        await window.CrosslineApi.deleteQuestion(examId, button.dataset.questionId);
        await refreshExamsFromApi(true);
        return showQuestionEditor(examId);
      } catch (error) {
        return showAdminLogin(error.message);
      }
    }
    exam.questions.splice(Number(button.dataset.index), 1); save("csca-exams", exams); showQuestionEditor(examId);
  }));
  document.querySelectorAll(".edit-question").forEach((button) => button.addEventListener("click", () => showQuestionEdit(examId, Number(button.dataset.index))));
  renderMath();
}

function showQuestionEdit(examId, questionIndex) {
  const exam = exams.find((item) => item.id === examId);
  const question = exam?.questions[questionIndex];
  if (!exam || !question) return showQuestionEditor(examId);
  editorImage = question.image || "";
  editorExplanationImage = question.explanationImage || "";
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>Edit question ${questionIndex + 1}</h1><p class="muted">${mathHtml(exam.title)}</p></div><button id="back-questions" class="ghost-button">Back to questions</button></div><section class="panel"><form id="edit-question-form" class="editor-grid"><div class="field"><label>Subject</label><input id="edit-question-subject" value="${escapeHtml(question.subject || "")}" /></div><div class="field"><label>Chapter</label><input id="edit-question-chapter" value="${escapeHtml(question.chapter || "")}" /></div><div class="field"><label>Topic</label><input id="edit-question-topic" value="${escapeHtml(question.topic || "")}" /></div><div class="field wide"><label>Question text</label><textarea id="edit-question-text" required>${escapeHtml(question.text)}</textarea></div>${[0,1,2,3].map((index) => `<div class="field"><label>Option ${letterLabels[index]}</label><input id="edit-option-${index}" value="${escapeHtml(question.answers?.[index] || "")}" required /></div>`).join("")}<div class="field"><label>Correct answer</label><select id="edit-correct-answer">${letterLabels.map((label, index) => `<option value="${index}" ${Number(question.correctIndex || 0) === index ? "selected" : ""}>${label}</option>`).join("")}</select></div><div class="field"><label>Marks for this question</label><input id="edit-question-marks" type="number" min="0.1" step="0.1" value="${escapeHtml(formatScore(question.marks))}" required /></div><div class="field wide"><label>Question image</label><input id="edit-question-image-input" type="file" accept="image/*" />${editorImage ? `<img id="edit-editor-preview" class="question-preview-image" src="${escapeHtml(editorImage)}" alt="Question image preview" />` : `<img id="edit-editor-preview" class="question-preview-image hidden" alt="Question image preview" />`}<button type="button" id="clear-question-image" class="ghost-button">Clear question image</button></div><div class="field wide"><label>Answer explanation</label><textarea id="edit-question-explanation" placeholder="Explain the correct answer. LaTeX supported.">${escapeHtml(question.explanation || "")}</textarea></div><div class="field wide"><label>Explanation image / graph</label><input id="edit-explanation-image-input" type="file" accept="image/*" />${editorExplanationImage ? `<img id="edit-explanation-preview" class="question-preview-image" src="${escapeHtml(editorExplanationImage)}" alt="Explanation image preview" />` : `<img id="edit-explanation-preview" class="question-preview-image hidden" alt="Explanation image preview" />`}<button type="button" id="clear-explanation-image" class="ghost-button">Clear explanation image</button></div><button class="primary-button">Save question</button></form></section>`, "exams");
  bindAdminShell();
  bind("back-questions", "click", () => showQuestionEditor(examId));
  bind("clear-question-image", "click", () => { editorImage = ""; document.getElementById("edit-editor-preview").classList.add("hidden"); });
  bind("clear-explanation-image", "click", () => { editorExplanationImage = ""; document.getElementById("edit-explanation-preview").classList.add("hidden"); });
  bindImageInput("edit-question-image-input", "edit-editor-preview", (value) => { editorImage = value; });
  bindImageInput("edit-explanation-image-input", "edit-explanation-preview", (value) => { editorExplanationImage = value; });
  bind("edit-question-form", "submit", async (event) => {
    event.preventDefault();
    const updated = {
      type: question.type || "Single choice",
      subject: document.getElementById("edit-question-subject").value.trim(),
      chapter: document.getElementById("edit-question-chapter").value.trim(),
      topic: document.getElementById("edit-question-topic").value.trim(),
      instruction: question.instruction || "Choose the best answer.",
      text: document.getElementById("edit-question-text").value.trim(),
      answers: [0,1,2,3].map((index) => document.getElementById(`edit-option-${index}`).value.trim()),
      correctIndex: Number(document.getElementById("edit-correct-answer").value),
      marks: normalizeMarks(document.getElementById("edit-question-marks").value),
      explanation: document.getElementById("edit-question-explanation").value.trim(),
      explanationImage: editorExplanationImage,
      image: editorImage
    };
    if (apiEnabled() && question.backendId) {
      try {
        await window.CrosslineApi.updateQuestion(examId, question.backendId, updated);
        await refreshExamsFromApi(true);
        return showQuestionEditor(examId);
      } catch (error) {
        return showAdminLogin(error.message);
      }
    }
    exam.questions[questionIndex] = { ...question, ...updated };
    save("csca-exams", exams);
    showQuestionEditor(examId);
  });
  renderMath();
}

function bindImageInput(inputId, previewId, assign) {
  bind(inputId, "change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      assign(reader.result);
      const preview = document.getElementById(previewId);
      preview.src = reader.result;
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

if (isDesktopClient()) {
  registerUpdateProgressEvents();
  registerIntegrityEvents();
  registerOAuthListener();
  const hasRememberedSession = apiEnabled()
    ? Boolean(window.CrosslineApi?.getStudentToken?.())
    : Boolean(String(load(localSessionKey(), "")).trim());
  if (hasRememberedSession) {
    showClientLoading("Opening Crossline CSCA Practice");
    void restoreStudentSession().then((restored) => { if (!restored) showAuth(); });
  } else {
    showAuth();
  }
} else {
  const legalPage = legalPageFromPath();
  if (legalPage) showLegalPage(legalPage);
  else showDownloadLanding();
}
