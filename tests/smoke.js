const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "src", "index.html"), "utf8");
const script = fs.readFileSync(path.join(__dirname, "..", "src", "app.js"), "utf8");

function createPortal({ desktop = true, pathname = "/src/index.html" } = {}) {
  const runtimeEvents = { enterKiosk: 0, leaveKiosk: 0, captureChanges: [], exitApp: 0 };
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: `http://localhost${pathname}`,
    beforeParse(window) {
      if (desktop) {
        window.examRuntime = {
          getInfo: async () => ({ platform: "test", practiceKiosk: false, contentProtection: true }),
          setScreenCaptureAllowed: async (allowed) => { runtimeEvents.captureChanges.push(Boolean(allowed)); return { contentProtection: !allowed, screenCaptureAllowed: Boolean(allowed), expiresAt: null }; },
          onContentProtectionChanged: () => () => {},
          enterKiosk: async () => { runtimeEvents.enterKiosk += 1; return true; },
          leaveKiosk: async () => { runtimeEvents.leaveKiosk += 1; return true; },
          exitApp: async () => { runtimeEvents.exitApp += 1; return true; },
          installDownloadedUpdate: async () => ({ installing: true }),
          onIntegrityEvent: () => () => {}
        };
      }
      window.navigator.mediaDevices = {
        enumerateDevices: async () => [],
        getUserMedia: async () => ({
          getTracks: () => [{ stop() {} }]
        }),
        addEventListener() {}
      };
      window.fetch = async () => ({
        ok: true,
        headers: { get: () => "application/json" },
        text: async () => JSON.stringify({ version: "test" }),
        json: async () => ({ version: "test" })
      });
      window.HTMLDialogElement.prototype.showModal = function showModal() {
        this.open = true;
      };
      window.HTMLDialogElement.prototype.close = function close() {
        this.open = false;
      };
      window.confirm = () => true;
      window.open = () => ({ closed: false });
      window.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0);
      window.cancelAnimationFrame = (id) => clearTimeout(id);
      window.matchMedia = (query) => ({
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
      });
    }
  });
  dom.window.eval(script);
  dom.runtimeEvents = runtimeEvents;
  return dom;
}

async function landingFlow() {
  const { window } = createPortal({ desktop: false });
  assert.match(window.document.body.textContent, /Preparing Windows app/);
  assert.doesNotMatch(window.document.body.textContent, /Student login/);
  assert.match(window.document.querySelector(".download-button").dataset.downloadUrl, /Crossline-CSCA-Practice-Setup\.exe/);
  await tick();
  window.close();
}

async function websiteRegistrationFieldsFlow() {
  const { window } = createPortal({ desktop: false });
  await tick();
  click(window, "[data-create-account]");
  assert.ok(window.document.querySelector("#website-register-first-name"));
  assert.ok(window.document.querySelector("#website-register-last-name"));
  assert.ok(window.document.querySelector("#website-register-username"));
  assert.ok(window.document.querySelector("#website-register-avatar"));
  assert.equal(window.document.querySelector("#website-register-first-name").placeholder, "Alex");
  assert.equal(window.document.querySelector("#website-register-last-name").placeholder, "Taylor");
  assert.equal(window.document.querySelector("#website-register-username").placeholder, "Example: alex.student");
  window.close();
}

async function browserGoogleOAuthFlow() {
  const portal = createPortal({ desktop: false });
  const { window } = portal;
  let openedUrl = "";
  let savedToken = "";
  let tokenCleared = false;
  const popup = { closed: false, close() { this.closed = true; } };
  window.CrosslineApi = {
    enabled: () => true,
    get baseUrl() { return "https://api.crosslinecscatest.com"; },
    setStudentToken: (token) => { savedToken = token; },
    clearStudentToken: () => { tokenCleared = true; },
    exams: async () => ({ exams: [] })
  };
  window.open = (url) => { openedUrl = url; return popup; };
  window.eval('showAuth("login")');
  click(window, "#google-sign-in");
  assert.equal(openedUrl, "https://api.crosslinecscatest.com/auth/oauth/google/start");

  window.dispatchEvent(new window.MessageEvent("message", {
    origin: "https://example.com",
    data: { type: "crossline-oauth-complete", token: "wrong-origin", user: { email: "wrong@example.com" } }
  }));
  assert.equal(savedToken, "");

  window.dispatchEvent(new window.MessageEvent("message", {
    origin: "https://api.crosslinecscatest.com",
    data: { type: "crossline-oauth-complete", token: "google-token", user: { email: "google@example.com" } }
  }));
  await tick();
  assert.equal(savedToken, "google-token");
  assert.equal(tokenCleared, true);
  assert.equal(popup.closed, true);
  assert.match(window.document.body.textContent, /Continue in the Windows app/);
  assert.ok(window.document.querySelector("#cta-download"));
  assert.doesNotMatch(window.document.body.textContent, /Student dashboard/);
  window.close();
}

function legalPagesFlow() {
  for (const [pathname, title] of [["/privacy", "Privacy Policy"], ["/terms", "Terms of Service"], ["/data-deletion", "Data Deletion Instructions"]]) {
    const { window } = createPortal({ desktop: false, pathname });
    assert.match(window.document.querySelector(".legal-document h1").textContent, new RegExp(title));
    assert.match(window.document.body.textContent, /verify@crosslinecscatest\.com/);
    assert.doesNotMatch(window.document.body.textContent, /Preparing Windows app/);
    window.close();
  }
}

function click(window, selector) {
  const element = window.document.querySelector(selector);
  assert.ok(element, `Expected ${selector}`);
  element.click();
}

function submit(window, selector) {
  const form = window.document.querySelector(selector);
  assert.ok(form, `Expected ${selector}`);
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
}

function fill(window, selector, value) {
  const input = window.document.querySelector(selector);
  assert.ok(input, `Expected ${selector}`);
  input.value = value;
}

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitFor(window, selector, timeoutMs = 3500) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const element = window.document.querySelector(selector);
    if (element) return element;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.fail(`Timed out waiting for ${selector}`);
}

async function waitUntil(assertion, timeoutMs = 3500) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      assertion();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  assertion();
}

async function studentFlow() {
  const portal = createPortal();
  const { window, runtimeEvents } = portal;
  assert.match(window.document.body.textContent, /Welcome back/);
  assert.match(window.document.querySelector(".auth-v2-brand img").src, /crossline-icon\.png/);
  assert.match(window.document.querySelector(".auth-v2-brand").textContent, /Crossline/);
  assert.match(window.document.querySelector(".auth-v2-brand").textContent, /CSCA Practice/);
  assert.equal(window.document.querySelector("#facebook-sign-in"), null);
  click(window, "#auth-privacy");
  assert.equal(window.document.querySelector("#auth-legal-modal"), null);
  assert.equal(window.document.querySelector("#admin-entry"), null);
  assert.doesNotMatch(window.document.body.textContent, /[\u3400-\u9fff]/);
  submit(window, "#login-form");
  assert.match(window.document.body.textContent, /Student dashboard/);
  await waitFor(window, "#start-exam-dashboard");
  assert.match(window.document.body.textContent, /Welcome back, Demo Student/);
  assert.doesNotMatch(window.document.body.textContent, /\[object PointerEvent\]/);
  assert.match(window.document.body.textContent, /Subject performance/);
  click(window, "#exit-app");
  assert.ok(window.document.querySelector("#exit-app-confirm"));
  click(window, "[data-confirm-cancel]");
  assert.equal(runtimeEvents.exitApp, 0);
  click(window, "#exit-app");
  click(window, "[data-confirm-accept]");
  await tick();
  assert.equal(runtimeEvents.exitApp, 1);
  window.eval(`showUpdatePanel({ kind: "info", message: "Downloading update...", progress: 45, speed: "2.4 MB/s" })`);
  const progressPanel = window.document.querySelector(".update-panel");
  assert.equal(progressPanel.querySelectorAll(".update-progress-segment").length, 20);
  assert.equal(progressPanel.querySelectorAll(".update-progress-segment.filled").length, 9);
  assert.equal(progressPanel.querySelector("[data-update-percent]").textContent, "45%");
  window.eval(`showUpdatePanel({ kind: "info", message: "Downloading update...", progress: 70, speed: "2.1 MB/s" })`);
  assert.equal(window.document.querySelector(".update-panel"), progressPanel);
  assert.equal(progressPanel.querySelectorAll(".update-progress-segment.filled").length, 14);
  assert.equal(progressPanel.querySelector("[data-update-percent]").textContent, "70%");
  click(window, "#dismiss-update");
  assert.equal(window.document.querySelector("#dashboard-profile"), null);
  assert.doesNotMatch(window.document.body.textContent, /Quick Actions|Study Plan|Bookmarks/);
  assert.equal(runtimeEvents.enterKiosk, 0);
  window.eval(`pushLocalNotification({ id: "update-test", title: "Test update", body: "Notification preview", kind: "update" })`);
  click(window, "#dashboard-notifications");
  await waitFor(window, "#notification-popover");
  assert.match(window.document.querySelector("#notification-popover nav").textContent, /AllUnreadArchived/);
  assert.doesNotMatch(window.document.querySelector("#notification-popover").textContent, /Mark read/);
  click(window, ".notification-archive-action");
  click(window, '[data-notification-filter="archived"]');
  assert.match(window.document.querySelector(".notification-popover-list").textContent, /Test update/);
  click(window, "#close-notification-popover");
  click(window, "#start-exam-dashboard");
  assert.match(window.document.body.textContent, /Choose a subject/);
  assert.match(window.document.body.textContent, /Physics|Chemistry|Mathematics|Academic Chinese/);
  assert.ok(window.document.querySelector(".icon-atom"));
  assert.ok(window.document.querySelector(".icon-flask-conical"));
  assert.ok(window.document.querySelector(".icon-calculator"));
  assert.ok(window.document.querySelector(".icon-languages"));
  click(window, ".choose-subject");
  assert.match(window.document.body.textContent, /Change subject/);
  assert.match(window.document.body.textContent, /3 attempts remaining/);
  assert.doesNotMatch(window.document.body.textContent, /Free exam for every student|3 of 3 attempts remaining/);
  assert.doesNotMatch(window.document.body.textContent, /Buy for|Free trial|Premium|\$\d/);
  click(window, ".begin-exam");
  assert.equal(runtimeEvents.enterKiosk, 1);
  assert.match(window.document.body.textContent, /Equipment Check/);
  assert.equal(window.document.querySelector("#demo-pass"), null);
  click(window, "#camera-check");
  await waitUntil(() => assert.match(window.document.querySelector("#camera-status").textContent, /Webcam connected/));
  click(window, "#microphone-check");
  await waitUntil(() => assert.equal(window.document.querySelector("#microphone-check").textContent, "Stop recording"));
  click(window, "#microphone-check");
  await waitUntil(() => assert.match(window.document.querySelector("#microphone-status").textContent, /Microphone recording checked/));
  click(window, "#network-check");
  await waitUntil(() => assert.equal(window.document.querySelector("#pairing-next").disabled, false));
  click(window, "#pairing-next");
  assert.match(window.document.body.textContent, /Facial recognition/);
  click(window, "#start-face-check");
  const qrImage = await waitFor(window, ".qr-box img");
  assert.match(qrImage.src, /api\.qrserver\.com/);
  assert.equal(window.document.querySelector("#simulate-phone"), null);
  await waitFor(window, "#room-scan-done");
  assert.match(window.document.body.textContent, /360-degree room scan/);
  click(window, "#room-scan-done");
  await waitFor(window, "#accept-terms");
  assert.match(window.document.body.textContent, /Privacy terms/);
  assert.match(window.document.body.textContent, /No webcam recording/);
  assert.equal(window.document.querySelector("#launch-exam").disabled, true);
  click(window, "#accept-terms");
  assert.equal(window.document.querySelector("#launch-exam").disabled, false);
  click(window, "#launch-exam");
  assert.match(window.document.body.textContent, /Exam in progress/);
  click(window, "#exit-button");
  assert.ok(window.document.querySelector("#exit-practice-confirm"));
  click(window, "[data-confirm-cancel]");
  assert.match(window.document.body.textContent, /Exam in progress/);
  assert.doesNotMatch(window.document.body.textContent, /Camera status/);
  click(window, 'input[name="answer"]');
  assert.equal(window.document.querySelector("#progress-ratio").textContent, "1 / 48");
  click(window, "#flag-button");
  click(window, "#submit-button");
  assert.match(window.document.querySelector("#submit-copy").textContent, /Are you sure/);
  click(window, "#confirm-submit");
  await waitFor(window, ".result-option");
  assert.match(window.document.body.textContent, /Result review/);
  assert.match(window.document.body.textContent, /You chose/);
  assert.ok(window.document.querySelector(".result-status"));
  assert.doesNotMatch(window.document.querySelector(".answer-review").className, /border-left/);
  assert.ok(!window.document.querySelector(".answer-review").style.borderLeftWidth);
  click(window, "#side-dashboard");
  await waitFor(window, "#start-exam-dashboard");
  assert.match(window.document.body.textContent, /Welcome back/);
  assert.match(window.document.body.textContent, /Latest score/);
  assert.doesNotMatch(window.document.body.textContent, /Question ID:/);
  const trendPoint = window.document.querySelector(".subject-trend-point");
  assert.ok(trendPoint);
  assert.equal(trendPoint.querySelector("small").textContent, "First");
  assert.ok(window.document.querySelector(".subject-trend-tooltip"));
  assert.equal(window.document.querySelector(".subject-chart-scale"), null);
  trendPoint.dispatchEvent(new window.MouseEvent("mouseenter", { bubbles: true }));
  assert.ok(trendPoint.classList.contains("is-hovered"));
  assert.equal(trendPoint.closest(".subject-trend-card").querySelector("[data-subject-trend-value]").textContent, trendPoint.dataset.score);
  trendPoint.closest(".subject-trend-chart").dispatchEvent(new window.MouseEvent("mouseleave", { bubbles: true }));
  assert.ok(!trendPoint.classList.contains("is-hovered"));
  click(window, "#side-results");
  assert.match(window.document.body.textContent, /Your results/);
  assert.doesNotMatch(window.document.body.textContent, /Loading results/);
  click(window, "#side-weakness");
  assert.match(window.document.body.textContent, /Weakness analysis/);
  assert.doesNotMatch(window.document.body.textContent, /Loading performance details/);
  click(window, "#side-leaderboard");
  assert.match(window.document.body.textContent, /Live leaderboard/);
  assert.doesNotMatch(window.document.body.textContent, /Loading leaderboard/);
  click(window, "#side-pricing");
  assert.match(window.document.body.textContent, /Pricing/);
  assert.equal(window.document.querySelectorAll(".pricing-plan").length, 3);
  assert.match(window.document.body.textContent, /Past papers \+ 3 Crossline mocks/);
  assert.match(window.document.body.textContent, /Past papers \+ 5 Crossline mocks/);
  assert.match(window.document.body.textContent, /USD \$17/);
  assert.equal(window.document.querySelector("[data-payment-method]"), null);
  click(window, "#side-settings");
  assert.match(window.document.body.textContent, /Profile, updates, and support/);
  assert.ok(window.document.querySelector("#student-bug-report-form"));
  fill(window, "#bug-title", "Dashboard chart issue");
  fill(window, "#bug-details", "The dashboard chart did not update after opening a released result.");
  submit(window, "#student-bug-report-form");
  await waitUntil(() => assert.match(window.document.querySelector("#bug-report-message").textContent, /Report sent/));
  assert.equal(window.document.querySelector("#admin-capture-toggle"), null);
  assert.ok(runtimeEvents.captureChanges.every((allowed) => allowed === false));
  click(window, "#side-exams");
  assert.match(window.document.body.textContent, /Physics exams|Choose a subject/);
  click(window, "#side-dashboard");
  assert.ok(window.document.querySelector("#start-exam-dashboard"));
  click(window, "#view-results-dashboard");
  await waitFor(window, ".subject-performance-card");
  assert.match(window.document.body.textContent, /correct out of/);
  click(window, ".weakness-review");
  assert.match(window.document.body.textContent, /Mistakes and skipped questions/);
  click(window, "#side-dashboard");
  await waitFor(window, "#review-skipped-dashboard");
  click(window, "#review-skipped-dashboard");
  await waitFor(window, ".answer-review-focus");
  assert.equal(window.document.querySelector(".answer-review-focus .result-option.selected"), null);
  assert.ok(window.document.querySelector(".answer-review-focus .result-option.correct"));
  click(window, "#logout");
  assert.match(window.document.querySelector("#student-logout-confirm").textContent, /Log out of Crossline/);
  click(window, "#cancel-student-logout");
  assert.equal(window.document.querySelector("#student-logout-confirm"), null);
  window.close();
}

async function adminCaptureNavigationFlow() {
  const portal = createPortal();
  const { window, runtimeEvents } = portal;
  let adminTokenClears = 0;
  window.CrosslineApi = {
    enabled: () => false,
    clearStudentToken: () => {},
    clearAdminToken: () => { adminTokenClears += 1; }
  };
  window.eval('currentUser = { email: "arijitsumit123@gmail.com", username: "Creator Admin", isAdmin: true }');

  await window.examRuntime.setScreenCaptureAllowed(true, "verified-admin");
  window.eval('app.innerHTML = adminShell("<p>Admin panel</p>"); bindAdminShell();');
  click(window, "#admin-logout");
  await tick();

  assert.equal(window.document.querySelector("#admin-capture-toggle"), null);
  assert.deepEqual(runtimeEvents.captureChanges, [true]);
  assert.equal(adminTokenClears, 0);

  await window.eval("showStudentDashboard()");
  window.eval("ensureKiosk()");
  assert.deepEqual(runtimeEvents.captureChanges, [true]);

  window.eval("clearStudentSession()");
  await tick();
  assert.deepEqual(runtimeEvents.captureChanges, [true, false]);
  assert.equal(adminTokenClears, 1);
  window.close();
}

async function registrationFlow() {
  const { window } = createPortal();
  click(window, "[data-create-account]");
  fill(window, "#website-register-first-name", "Arijit");
  fill(window, "#website-register-last-name", "Sumit");
  fill(window, "#website-register-username", "Arijit");
  fill(window, "#website-register-email", "new.student@example.com");
  fill(window, "#website-register-password", "secret12");
  submit(window, "#website-register-form");
  assert.match(window.document.body.textContent, /Verify your email/);
  fill(window, "#website-verify-code", "246810");
  submit(window, "#website-verify-form");
  assert.match(window.document.body.textContent, /Your account is ready/);
  click(window, "[data-sign-in]");
  fill(window, "#login-email", "new.student@example.com");
  fill(window, "#login-password", "secret12");
  submit(window, "#login-form");
  await waitFor(window, "#start-exam-dashboard");
  assert.match(window.document.body.textContent, /Welcome back, Arijit/);
  window.close();
}

async function passwordResetFlow() {
  const { window } = createPortal();
  click(window, "#forgot-password");
  assert.match(window.document.body.textContent, /Reset your password/);
  fill(window, "#password-reset-email", "student@example.com");
  submit(window, "#password-reset-request-form");
  assert.match(window.document.body.textContent, /Choose a new password/);
  fill(window, "#password-reset-code", "246810");
  fill(window, "#password-reset-new", "changed123");
  fill(window, "#password-reset-confirm", "changed123");
  submit(window, "#password-reset-confirm-form");
  assert.match(window.document.body.textContent, /Password updated/);
  fill(window, "#login-email", "student@example.com");
  fill(window, "#login-password", "changed123");
  submit(window, "#login-form");
  await waitFor(window, "#start-exam-dashboard");
  window.close();
}

async function adminFlow() {
  const { window } = createPortal();
  window.eval("showAdminDashboard()");
  assert.match(window.document.body.textContent, /Exam library/);
  assert.match(window.document.body.textContent, /Edit details/);
  assert.doesNotMatch(window.document.body.textContent, /Student portal preview/);
  click(window, "#admin-overview");
  assert.match(window.document.body.textContent, /GLM question assistant/);
  assert.ok(window.document.querySelector("#admin-assistant-form"));
  click(window, "#admin-assistant");
  assert.match(window.document.body.textContent, /Question authoring assistant/);
  assert.match(window.document.querySelector("#admin-assistant-file").accept, /\.html/);
  assert.match(window.document.querySelector("#admin-assistant-file").accept, /application\/zip/);
  assert.equal(window.document.querySelector("#admin-assistant-file").multiple, true);
  assert.ok(window.document.querySelector("#assistant-drop-zone"));
  assert.ok(window.document.querySelector("#assistant-attach-trigger"));
  assert.match(window.document.body.textContent, /Attach source/);
  click(window, "#admin-exams");
  click(window, ".edit-exam-details");
  assert.match(window.document.body.textContent, /Edit exam/);
  assert.ok(window.document.querySelector("#exam-access"));
  assert.ok(window.document.querySelector("#exam-price-field"));
  click(window, "#back-admin");
  click(window, "#new-exam");
  assert.ok(window.document.querySelector("#exam-access"));
  assert.match(window.document.body.textContent, /Free sample for everyone/);
  assert.match(window.document.body.textContent, /three submitted attempts per student/i);
  fill(window, "#exam-title", "Demo Created Paper");
  fill(window, "#exam-description", "Created through the administrator workflow.");
  fill(window, "#exam-duration", "45");
  submit(window, "#create-exam-form");
  fill(window, "#new-question", "Which number is even?");
  fill(window, "#option-0", "1");
  fill(window, "#option-1", "2");
  fill(window, "#option-2", "3");
  fill(window, "#option-3", "5");
  fill(window, "#question-marks", "2.5");
  fill(window, "#question-explanation", "2 is even because it is divisible by \\\\(2\\\\).");
  submit(window, "#question-form");
  assert.match(window.document.body.textContent, /Which number is even/);
  assert.match(window.document.body.textContent, /Marks: 2.5/);
  assert.match(window.document.body.textContent, /Explanation added/);
  click(window, ".edit-question");
  assert.match(window.document.body.textContent, /Edit question 1/);
  fill(window, "#edit-question-text", "Which number is even after editing?");
  fill(window, "#edit-question-marks", "3");
  submit(window, "#edit-question-form");
  assert.match(window.document.body.textContent, /Which number is even after editing/);
  assert.match(window.document.body.textContent, /Marks: 3/);
  click(window, "#admin-import");
  assert.match(window.document.body.textContent, /Tesseract OCR/);
  assert.match(window.document.querySelector("#import-file").accept, /\.html/);
  assert.match(window.document.querySelector("#import-file").accept, /application\/zip/);
  assert.ok(window.document.querySelector("#import-drop-zone"));
  assert.ok(window.document.querySelector("#import-attach-trigger"));
  assert.equal(window.document.querySelector("#import-exam-price"), null);
  assert.equal(window.document.querySelector("#import-exam").value, "physics-mock");
  assert.match(window.document.querySelector("#import-exam").textContent, /Create a new exam from this source/);
  assert.equal(window.document.querySelector("#import-image"), null);
  fill(window, "#import-source", "Question 1: What is 2 + 2?\nA. 3\nB. 4\nC. 5\nD. 6");
  click(window, "#parse-import-locally");
  assert.equal(window.document.querySelector("#add-imported-questions").disabled, true);
  assert.match(window.document.querySelector("#import-message").textContent, /No valid four-option questions/);
  fill(window, "#import-source", "Question 1: What is 2 + 2?\nA. 3\nB. 4\nC. 5\nD. 6\nAnswer: B");
  click(window, "#parse-import-locally");
  assert.equal(window.document.querySelector("#add-imported-questions").disabled, false);
  assert.match(window.document.querySelector("#import-results").textContent, /Correct: B/);
  assert.ok(window.document.querySelector(".import-steps li.active"));
  assert.ok(window.document.querySelector("#autopilot-mode"));
  assert.ok(window.document.querySelector("#auto-build"));
  assert.match(window.document.querySelector("#autopilot-mode").textContent, /One exam per source file/);
  assert.match(window.document.querySelector("#autopilot-mode").textContent, /Combine everything into one exam/);
  const bigSource = Array.from({ length: 40 }, (_, index) => `Question ${index + 1}: sample ${"x".repeat(500)}\nA. 1\nB. 2\nC. 3\nD. 4\nAnswer: B`).join("\n");
  const chunks = window.eval(`splitSourceIntoChunks(${JSON.stringify(bigSource)}, 5000)`);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 5000));
  assert.ok(chunks.every((chunk) => /^Question \d+:/.test(chunk.trim())));
  const deduped = window.eval(`dedupeDraftQuestions([{ text: "Same  Q", answers: ["a", "b", "c", "d"] }, { text: "same q", answers: ["A", "B", "C", "D"] }, { text: "other", answers: ["a", "b", "c", "d"] }])`);
  assert.equal(deduped.length, 2);
  const htmlExplanation = window.eval(`contentHtml(${JSON.stringify("<b>Step 1 - Energy.</b><br>Use $E=mc^2$ with care.<script>bad</script>")})`);
  assert.match(htmlExplanation, /<b>Step 1 - Energy\.<\/b>/);
  assert.match(htmlExplanation, /\$E=mc\^2\$/);
  assert.doesNotMatch(htmlExplanation, /script/i);
  assert.match(window.eval(`contentHtml(${JSON.stringify("Plain $x^2$ line")})`), /Plain \$x\^2\$ line/);

  const grantedPlans = [];
  let studentPlanLoads = 0;
  window.CrosslineApi = {
    enabled: () => false,
    adminStudentPlans: async () => { studentPlanLoads += 1; return { plans: [
      { id: "past-plus-3", name: "Past papers + 3 Crossline mocks", mockLimit: 3, priceUsd: 17, priceLabel: "$17–$40" },
      { id: "past-plus-5", name: "Past papers + 5 Crossline mocks", mockLimit: 5, priceUsd: 27, priceLabel: "$27–$67" }
    ], assignments: [], paymentEnabled: false }; },
    grantStudentPlan: async (email, planId) => { grantedPlans.push({ email, planId }); return { ok: true }; },
    revokeStudentPlan: async () => ({ ok: true })
  };
  click(window, "#admin-student-plans");
  await waitFor(window, "#grant-student-plan-form");
  assert.equal(window.document.querySelectorAll(".admin-plan-option").length, 2);
  assert.match(window.document.body.textContent, /Assign student access/);
  fill(window, "#student-plan-email", "learner@example.com");
  fill(window, "#student-plan-id", "past-plus-5");
  submit(window, "#grant-student-plan-form");
  await waitUntil(() => assert.deepEqual(grantedPlans, [{ email: "learner@example.com", planId: "past-plus-5" }]));
  await waitUntil(() => assert.equal(studentPlanLoads, 2));
  window.close();
}

(async () => {
  await landingFlow();
  await websiteRegistrationFieldsFlow();
  await browserGoogleOAuthFlow();
  legalPagesFlow();
  await studentFlow();
  await adminCaptureNavigationFlow();
  await registrationFlow();
  await passwordResetFlow();
  await adminFlow();
  console.log("CSCA portal smoke test passed.");
})();
