const app = document.getElementById("app");
const letterLabels = ["A", "B", "C", "D"];
const streams = [];
const DEMO_CODE = "246810";
const WINDOWS_CLIENT_URL = "https://media.crosslinecscatest.com/downloads/Crossline-CSCA-Practice-Setup.exe";
const PRIVACY_POLICY_URL = "https://exam.crosslinecscatest.com/privacy";
const TERMS_OF_SERVICE_URL = "https://exam.crosslinecscatest.com/terms";
const OFFICIAL_WEBSITE_URL = "https://www.crosslineedu.com/";
const defaultQuestions = [
  {
    type: "Single choice",
    subject: "Physics",
    chapter: "Circular Motion and Gravitation",
    topic: "Circular Motion and Gravitation",
    instruction: "Each question has four options, among which only one is correct.",
    text: "As shown in the figure, if two objects A and B with equal mass are placed on a horizontal disk rotating uniformly around the vertical axis, and the two objects remain stationary relative to the disk, then ( )",
    diagram: true,
    answers: ["the angular velocity of A is the same as B", "the angular velocity of A is greater than that of B", "the linear velocity of A is the same as B", "the angular velocity of A is smaller than that of B"]
  },
  { type: "Single choice", subject: "Physics", chapter: "Kinematics", topic: "Kinematics", instruction: "Choose the best answer.", text: "A particle moves with constant acceleration. Its velocity changes from 2 m/s to 10 m/s in 4 seconds. What is its acceleration?", answers: ["1 m/s²", "2 m/s²", "3 m/s²", "4 m/s²"] },
  { type: "Single choice", subject: "Mathematics", chapter: "Functions and Basic Elementary Functions", topic: "Functions and Basic Elementary Functions", instruction: "Choose the best answer.", text: "Which expression is equivalent to (x + 3)(x - 3)?", answers: ["x² - 9", "x² + 9", "x² - 6x + 9", "x² + 6x + 9"] },
  { type: "Single choice", subject: "Mathematics", chapter: "Functions and Basic Elementary Functions", topic: "Functions and Basic Elementary Functions", instruction: "Choose the best answer.", text: "If f(x) = 2x + 1, what is the value of f(4)?", answers: ["7", "8", "9", "10"] }
];
const EXAM_SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Academic Chinese"];
const EXAM_CATEGORIES = [
  { id: "official", label: "Official CSCA past papers" },
  { id: "original", label: "Cross-Line original exams" }
];
const TOPIC_CATALOG = {
  Physics: [
    "Kinematics",
    "Forces and Newton's Laws of Motion",
    "Circular Motion and Gravitation",
    "Work and Energy",
    "Momentum",
    "Oscillations and Mechanical Waves",
    "Electrostatics",
    "Direct-Current Circuits",
    "Magnetic Fields",
    "Electromagnetic Induction",
    "Thermodynamics",
    "Optics"
  ],
  Chemistry: [
    "Basic Concepts and Classification of Matter",
    "Chemical Language",
    "Chemical Calculations",
    "Solutions and pH",
    "Oxidation and Reduction",
    "Acids, Bases, Salts and Ionic Reactions",
    "Atomic Structure, Periodicity and Chemical Bonding",
    "Reaction Rates and Equilibrium",
    "Fundamentals of Organic Chemistry",
    "Chemical Experiments and Applications"
  ],
  Mathematics: [
    "Sets and Inequalities",
    "Functions and Basic Elementary Functions",
    "Sequences",
    "Trigonometric Functions",
    "Analytic Geometry",
    "Vectors",
    "Complex Numbers",
    "Probability"
  ],
  "Academic Chinese": []
};
const TOPIC_KEYWORDS = {
  Physics: {
    "Kinematics": ["kinematics", "velocity", "acceleration", "displacement", "projectile", "motion graph", "free fall"],
    "Forces and Newton's Laws of Motion": ["newton", "force", "friction", "tension", "laws of motion", "net force"],
    "Circular Motion and Gravitation": ["circular motion", "centripetal", "orbit", "gravitation", "satellite", "angular velocity"],
    "Work and Energy": ["work", "energy", "power", "kinetic", "potential energy", "mechanical energy"],
    "Momentum": ["momentum", "collision", "impulse"],
    "Oscillations and Mechanical Waves": ["oscillation", "simple harmonic", "shm", "wave", "frequency", "wavelength", "sound"],
    "Electrostatics": ["electrostatic", "coulomb", "electric field", "electric potential", "point charge"],
    "Direct-Current Circuits": ["direct current", "resistor", "resistance", "ohm", "circuit", "kirchhoff"],
    "Magnetic Fields": ["magnetic field", "lorentz", "ampere force", "magnet"],
    "Electromagnetic Induction": ["induction", "faraday", "lenz", "magnetic flux", "transformer", "induced emf"],
    "Thermodynamics": ["temperature", "heat", "gas law", "ideal gas", "thermodynamic"],
    "Optics": ["lens", "mirror", "refraction", "reflection", "optics", "focal"]
  },
  Chemistry: {
    "Basic Concepts and Classification of Matter": ["matter", "mixture", "element", "compound"],
    "Chemical Language": ["chemical equation", "formula", "nomenclature", "symbol"],
    "Chemical Calculations": ["chemical calculation", "mole", "molar mass", "stoichiometry", "yield"],
    "Solutions and pH": ["solution", "concentration", "ph", "solubility", "molarity"],
    "Oxidation and Reduction": ["oxidation", "reduction", "redox", "oxidation number"],
    "Acids, Bases, Salts and Ionic Reactions": ["acid", "base", "salt", "ionic", "neutralization"],
    "Atomic Structure, Periodicity and Chemical Bonding": ["atomic", "electron", "periodic", "bond", "orbital"],
    "Reaction Rates and Equilibrium": ["reaction rate", "equilibrium", "le chatelier", "catalyst"],
    "Fundamentals of Organic Chemistry": ["organic", "hydrocarbon", "alkane", "alkene", "functional group"],
    "Chemical Experiments and Applications": ["experiment", "laboratory", "titration", "indicator", "apparatus"]
  },
  Mathematics: {
    "Sets and Inequalities": ["empty set", "subset", "union", "intersection", "inequality", "solution set", "interval notation"],
    "Functions and Basic Elementary Functions": ["function", "domain", "range", "exponential", "logarithm", "inverse function", "even function", "odd function", "f(x)", "monotonic"],
    "Sequences": ["sequence", "series", "arithmetic progression", "geometric progression", "common difference", "common ratio", "recursive", "a_n"],
    "Trigonometric Functions": ["trigonometric", "sine", "cosine", "tangent", "radian", "identity", "sin", "cos", "tan", "degree", "angle"],
    "Analytic Geometry": ["coordinate", "analytic geometry", "parabola", "ellipse", "hyperbola", "slope", "quadrant", "distance formula", "midpoint", "circle equation", "straight line"],
    "Vectors": ["vector", "dot product", "cross product", "magnitude", "unit vector"],
    "Complex Numbers": ["complex", "imaginary", "argand", "modulus", "conjugate"],
    "Probability": ["probability", "random", "permutation", "combination", "binomial", "sample space"]
  }
};
const defaultExams = [
  { id: "physics-mock", title: "CSCA Physics Mock", description: "Full practice paper covering physics fundamentals.", duration: 60, subject: "Physics", category: "official", free: true, freeSample: true, priceCents: 0, canStart: true, accessLabel: "3 attempts remaining", attemptsUsed: 0, attemptsRemaining: 3, questions: Array.from({ length: 48 }, (_, index) => ({ ...defaultQuestions[index % 2] })) },
  { id: "math-short", title: "CSCA Mathematics Quick Practice", description: "A shorter warm-up paper for testing the examination workflow.", duration: 35, subject: "Mathematics", category: "official", free: false, freeSample: false, priceCents: 0, canStart: false, accessLabel: "Package required", accessReason: "Ask a Crossline administrator to assign an access package.", attemptsUsed: 0, attemptsRemaining: 3, questions: defaultQuestions.slice(2).map((question) => ({ ...question })) },
  { id: "chemistry-mock", title: "CSCA Chemistry Practice", description: "Chemistry fundamentals for CSCA preparation.", duration: 60, subject: "Chemistry", category: "original", free: false, freeSample: false, priceCents: 0, canStart: false, accessLabel: "Package required", accessReason: "Ask a Crossline administrator to assign an access package.", attemptsUsed: 0, attemptsRemaining: 3, questions: defaultQuestions.slice(0, 2).map((question) => ({ ...question, subject: "Chemistry", chapter: "Solutions and pH", topic: "Solutions and pH" })) },
  { id: "chinese-mock", title: "Academic Chinese Practice", description: "Academic Chinese reading and language practice.", duration: 45, subject: "Academic Chinese", category: "original", free: false, freeSample: false, priceCents: 0, canStart: false, accessLabel: "Package required", accessReason: "Ask a Crossline administrator to assign an access package.", attemptsUsed: 0, attemptsRemaining: 3, questions: [{ type: "Single choice", subject: "Academic Chinese", chapter: "Reading", topic: "Comprehension", instruction: "Choose the best answer.", text: "Which option best completes the academic sentence?", answers: ["therefore", "because of", "in spite", "as if"], correctIndex: 0, marks: 1 }] }
];
const ACCESS_PLANS = Object.freeze([
  {
    id: "free",
    name: "Free starter",
    mockLimit: 1,
    priceUsd: 0,
    priceLabel: "Free",
    free: true,
    blurb: "Try Crossline free with one fully simulated practice exam.",
    feats: [
      "1 Fully simulated practice exam",
      "Browse and study the free past-paper library anytime",
      "Full marks-based results, explanations & weakness analysis",
      "Three submitted attempts for every included exam"
    ]
  },
  {
    id: "past-plus-3",
    name: "Past papers + 3 Crossline mocks",
    mockLimit: 3,
    priceUsd: 17,
    priceLabel: "$17–$40",
    popular: true,
    blurb: "All official past papers plus three Crossline original mock exams. Pick how many subjects you need.",
    subjectPrices: { 1: 17, 2: 27, 3: 34.99, 4: 40 }
  },
  {
    id: "past-plus-5",
    name: "Past papers + 5 Crossline mocks",
    mockLimit: 5,
    priceUsd: 27,
    priceLabel: "$27–$67",
    blurb: "All official past papers plus five Crossline original mock exams. Pick how many subjects you need.",
    subjectPrices: { 1: 27, 2: 47, 3: 59, 4: 67 }
  }
]);

function formatPlanUsd(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "-";
  if (Number.isInteger(n)) return `$${n}`;
  return `$${n.toFixed(2)}`;
}

function planSubjectCount(plan, subjects = 1) {
  const prices = plan?.subjectPrices;
  if (!prices) return 1;
  const key = Number(subjects);
  return prices[key] != null ? key : Number(Object.keys(prices)[0] || 1);
}

function planPriceForSubjects(plan, subjects = 1) {
  if (plan?.free || Number(plan?.priceUsd) === 0) return 0;
  const count = planSubjectCount(plan, subjects);
  if (plan?.subjectPrices && plan.subjectPrices[count] != null) return Number(plan.subjectPrices[count]);
  return Number(plan?.priceUsd);
}

function planFeatureList(plan, subjects = 1) {
  if (Array.isArray(plan.feats) && plan.feats.length) return plan.feats;
  if (plan.free) {
    return [
      "1 Fully simulated practice exam",
      "Browse and study the free past-paper library anytime",
      "Full marks-based results, explanations & weakness analysis",
      "Three submitted attempts for every included exam"
    ];
  }
  const count = planSubjectCount(plan, subjects);
  const subjectLabel = count === 1 ? "1 subject" : `${count} subjects`;
  const shared = [
    "Browse and study the free past-paper library anytime",
    "Full marks-based results, explanations & weakness analysis",
    "Three submitted attempts for every included exam"
  ];
  if (Number(plan.mockLimit)) {
    return [
      `All official past paper mocks for ${subjectLabel}`,
      `${plan.mockLimit} Crossline original mock exams`,
      ...shared
    ];
  }
  return [
    `All official past paper mocks for ${subjectLabel}`,
    ...shared
  ];
}

function planPriceLabel(plan, subjects) {
  if (plan.free || Number(plan.priceUsd) === 0) return { amount: "$0", note: "Free forever" };
  if (plan.subjectPrices && subjects == null) {
    return { amount: plan.priceLabel || formatPlanUsd(plan.priceUsd), note: "USD · one-time" };
  }
  return { amount: formatPlanUsd(planPriceForSubjects(plan, subjects ?? 1)), note: "USD · one-time" };
}

function planKicker(plan) {
  if (plan.free) return "Free";
  if (Number(plan.mockLimit)) return `${plan.mockLimit} Crossline mocks`;
  return "Past papers";
}

function paidAccessPlans() {
  return ACCESS_PLANS.filter((plan) => !plan.free);
}

function landingPricingCardsHtml({ appContext = false, currentPlan = null, plans = ACCESS_PLANS } = {}) {
  const catalog = Array.isArray(plans) && plans.length ? plans : ACCESS_PLANS;
  const free = catalog.find((plan) => plan.free);
  const plus3 = catalog.find((plan) => plan.id === "past-plus-3");
  const plus5 = catalog.find((plan) => plan.id === "past-plus-5");
  const check = uiIcon("badge-check");
  const defaultSubjects = 1;
  const planOrder = { free: 0, "past-plus-3": 1, "past-plus-5": 2 };

  const planAction = (plan, landingLabel) => {
    if (!appContext) return { label: landingLabel, attr: "data-create-account", disabled: false };
    if (currentPlan?.id === plan.id) return { label: "Current plan", attr: "", disabled: true };
    if (currentPlan && Number(planOrder[plan.id] ?? 0) <= Number(planOrder[currentPlan.id] ?? 0)) {
      return { label: "Included", attr: "", disabled: true };
    }
    return { label: currentPlan ? "Upgrade" : "Get Started", attr: `data-pricing-plan="${escapeHtml(plan.id)}"`, disabled: false };
  };

  const subjectSwitcher = (plan) => {
    const prices = plan.subjectPrices || {};
    const options = [1, 2, 3, 4].map((count) => {
      const active = count === defaultSubjects;
      return `<button type="button" class="cx-price-tier ${active ? "is-active" : ""}" data-subjects="${count}" data-price="${Number(prices[count])}" aria-pressed="${active ? "true" : "false"}" aria-label="${count} ${count === 1 ? "subject" : "subjects"}">${count}</button>`;
    }).join("");
    return `<div class="cx-price-tier-row cx-price-subject-row" role="group" aria-label="Choose number of subjects"><span class="cx-price-tier-thumb" data-subject-thumb aria-hidden="true"></span>${options}</div><p class="cx-price-subject-hint">subjects</p>`;
  };

  const card = ({
    label,
    amount,
    unit,
    note,
    feats,
    cta,
    ctaClass,
    footer,
    popular = false,
    free = false,
    extras = "",
    amountAttr = "",
    featsAttr = "",
    noteAttr = "",
    magnetic = false,
    subjectCard = false,
    buttonAttr = "data-create-account",
    buttonDisabled = false
  }) => {
    const buttonClass = `cx-btn ${ctaClass} cx-btn-lg cx-price-cta${buttonDisabled ? " disabled-link" : ""}`;
    const disabledAttr = buttonDisabled ? 'disabled aria-disabled="true"' : buttonAttr;
    const button = magnetic
      ? `<span class="cx-magnetic" data-cx-magnetic><button class="${buttonClass}" ${disabledAttr} type="button">${cta}</button></span>`
      : `<button class="${buttonClass}" ${disabledAttr} type="button">${cta}</button>`;
    return `<article class="cx-price-card ${popular ? "cx-price-popular" : "cx-price-side"} ${free ? "cx-price-free" : ""}" ${subjectCard ? `data-subject-card data-plan-id="${escapeHtml(subjectCard)}"` : ""}>
      ${popular ? `<span class="cx-price-badge">★ Popular</span>` : ""}
      <p class="cx-price-label">${escapeHtml(label)}</p>
      ${extras}
      <div class="cx-price-amount">
        <strong class="number-font" ${amountAttr}>${escapeHtml(amount)}</strong>
        ${unit ? `<span class="cx-price-unit">${escapeHtml(unit)}</span>` : ""}
      </div>
      <p class="cx-price-note" ${noteAttr}>${escapeHtml(note)}</p>
      <ul class="cx-price-feats" ${featsAttr}>${feats.map((f) => `<li>${check}<span>${escapeHtml(f)}</span></li>`).join("")}</ul>
      <hr class="cx-price-rule" />
      ${button}
      <p class="cx-price-foot">${escapeHtml(footer)}</p>
    </article>`;
  };

  const freeAction = free ? planAction(free, "Start free") : null;
  const freeCard = free ? card({
    label: "FREE",
    amount: "$0",
    unit: "",
    note: "free forever",
    feats: planFeatureList(free),
    cta: freeAction.label,
    ctaClass: "cx-btn-ghost",
    footer: "Perfect for trying Crossline first",
    free: true,
    buttonAttr: freeAction.attr,
    buttonDisabled: freeAction.disabled
  }) : "";

  const plus3Action = plus3 ? planAction(plus3, "Get started") : null;
  const plus3Card = plus3 ? card({
    label: "PAST + 3",
    amount: formatPlanUsd(planPriceForSubjects(plus3, defaultSubjects)),
    unit: "/ one-time",
    note: "billed once",
    feats: planFeatureList(plus3, defaultSubjects),
    cta: plus3Action.label,
    ctaClass: "cx-btn-primary",
    footer: "Ideal for serious CSCA prep",
    popular: true,
    extras: subjectSwitcher(plus3),
    amountAttr: "data-subject-price",
    featsAttr: "data-subject-feats",
    noteAttr: "data-subject-note",
    magnetic: true,
    subjectCard: plus3.id,
    buttonAttr: plus3Action.attr,
    buttonDisabled: plus3Action.disabled
  }) : "";

  const plus5Action = plus5 ? planAction(plus5, "Get started") : null;
  const plus5Card = plus5 ? card({
    label: "PAST + 5",
    amount: formatPlanUsd(planPriceForSubjects(plus5, defaultSubjects)),
    unit: "/ one-time",
    note: "billed once",
    feats: planFeatureList(plus5, defaultSubjects),
    cta: plus5Action.label,
    ctaClass: "cx-btn-ghost",
    footer: "More Crossline mocks for deeper practice",
    extras: subjectSwitcher(plus5),
    amountAttr: "data-subject-price",
    featsAttr: "data-subject-feats",
    noteAttr: "data-subject-note",
    subjectCard: plus5.id,
    buttonAttr: plus5Action.attr,
    buttonDisabled: plus5Action.disabled
  }) : "";

  return `${freeCard}${plus3Card}${plus5Card}`;
}
let selectedExamSubject = load("csca-exam-subject", "");

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
let activeStudentView = "";
let activeSettingsSection = "profile";
let studentViewRevision = 0;
let studentExamsFetchedAt = 0;
const STUDENT_CACHE_TTL = 30000;
const studentDataCache = {
  resultData: null,
  resultDataFetchedAt: 0,
  resultDataPromise: null,
  leaderboards: new Map(),
  leaderboardFetchedAt: new Map(),
  leaderboardPromises: new Map(),
  notificationCount: null,
  notificationFetchedAt: 0,
  notificationPromise: null,
  planData: null,
  planFetchedAt: 0,
  planPromise: null
};
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
function looksLikeHtml(value = "") {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}
function looksLikeMarkdownTable(value = "") {
  const text = String(value || "");
  return /^\s*\|.+\|\s*$/m.test(text) && /^\s*\|?\s*:?-{3,}/m.test(text);
}
function sanitizeHtmlFragment(html = "") {
  const documentNode = new DOMParser().parseFromString(`<div>${String(html || "")}</div>`, "text/html");
  const allowed = new Set(["DIV", "P", "BR", "STRONG", "B", "EM", "I", "U", "DEL", "SUB", "SUP", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "BLOCKQUOTE", "PRE", "CODE", "A", "HR", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "SPAN", "IMG"]);
  documentNode.body.querySelectorAll("*").forEach((element) => {
    if (!allowed.has(element.tagName)) return element.replaceWith(...element.childNodes);
    const href = element.tagName === "A" ? String(element.getAttribute("href") || "") : "";
    const src = element.tagName === "IMG" ? String(element.getAttribute("src") || "") : "";
    [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
    if (element.tagName === "A") {
      if (/^https:\/\//i.test(href)) {
        element.setAttribute("href", href);
        element.setAttribute("rel", "noreferrer");
        element.setAttribute("target", "_blank");
      }
    }
    if (element.tagName === "IMG") {
      if (/^(https:\/\/|data:image\/(?:png|jpe?g|gif|webp);base64,)/i.test(src)) {
        element.setAttribute("src", src);
        element.setAttribute("alt", "");
        element.classList.add("question-preview-image");
      } else {
        element.remove();
      }
    }
  });
  return documentNode.body.firstElementChild?.innerHTML || "";
}
function contentHtml(value = "") {
  const text = String(value ?? "");
  if (!text) return "";
  if (looksLikeHtml(text)) return sanitizeHtmlFragment(text);
  // Keep GFM pipe tables readable in exam prompts (e.g. Chemistry operation tables).
  if (looksLikeMarkdownTable(text)) return markdownHtml(text);
  return mathHtml(text);
}
function markdownHtml(value = "") {
  if (!window.marked?.parse) return mathHtml(value);
  const parsed = window.marked.parse(String(value || ""), { breaks: true, gfm: true });
  return sanitizeHtmlFragment(parsed);
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
function updateProgressSegments(progress, count = 20) {
  const filled = Math.round((progress / 100) * count);
  return Array.from({ length: count }, (_, index) => `<span class="update-progress-segment${index < filled ? " filled" : ""}" aria-hidden="true"></span>`).join("");
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
  return `<div class="update-panel ${escapeHtml(state.kind)}" data-update-kind="${escapeHtml(state.kind)}" role="status" aria-live="polite">
    <div>
      <strong data-update-title>${state.kind === "available" ? "Update available" : state.kind === "error" ? "Update issue" : "Software updates"}</strong>
      <p data-update-message>${escapeHtml(state.message)}</p>
      ${canInstall ? `<small>Current version: ${escapeHtml(current)} · Latest version: ${escapeHtml(latest)}</small>` : ""}
      ${progress !== null ? `<div class="update-progress-meta"><span>Downloading update</span><b data-update-percent>${progress.toFixed(0)}%</b></div><div class="update-progress-segments" data-update-segments role="progressbar" aria-label="Update download progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.toFixed(0)}">${updateProgressSegments(progress)}</div><small data-update-progress-copy>${progress.toFixed(0)}% downloaded${state.speed ? ` · ${escapeHtml(state.speed)}` : ""}</small>` : ""}
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
  const existing = host.querySelector(".update-panel");
  if (existing?.dataset.updateKind === updateState.kind && updateState.kind === "info" && typeof updateState.progress === "number") {
    const progress = Math.max(0, Math.min(100, updateState.progress));
    const message = existing.querySelector("[data-update-message]");
    const segments = existing.querySelector("[data-update-segments]");
    const percentCopy = existing.querySelector("[data-update-percent]");
    const copy = existing.querySelector("[data-update-progress-copy]");
    if (message && segments && percentCopy && copy) {
      message.textContent = updateState.message;
      const filled = Math.round((progress / 100) * segments.children.length);
      [...segments.children].forEach((segment, index) => segment.classList.toggle("filled", index < filled));
      segments.setAttribute("aria-valuenow", progress.toFixed(0));
      percentCopy.textContent = `${progress.toFixed(0)}%`;
      copy.textContent = `${progress.toFixed(0)}% downloaded${updateState.speed ? ` · ${updateState.speed}` : ""}`;
      return;
    }
  }
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
    showUpdatePanel({ kind: "info", message: "Checking for updates again..." });
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
  showUpdatePanel({ kind: "info", message: "Downloading the verified update...", progress: 0 });
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
    noticeUpdateAvailable(result);
    showUpdatePanel({
      kind: "available",
      message: autoInstall ? "A new update is available. Auto-update is downloading it in the background." : "A new Crossline CSCA Practice Client update is available. Click Yes to download it.",
      result
    });
    if (autoInstall) await installUpdateNow();
    void hydrateNotificationBadge();
  } catch (error) {
    if (manual) showUpdatePanel({ kind: "error", message: `Update check failed: ${error.message}` });
  } finally {
    updateCheckRunning = false;
  }
}
function isDesktopClient() { return Boolean(window.examRuntime); }
function updateAdminCaptureUi(status = {}) {
  const toggle = document.getElementById("admin-capture-toggle");
  const label = document.getElementById("admin-capture-label");
  const message = document.getElementById("admin-capture-message");
  const allowed = Boolean(status.screenCaptureAllowed);
  if (toggle) toggle.checked = allowed;
  if (label) label.textContent = allowed ? "Capture allowed" : "Capture blocked";
  if (message) message.textContent = allowed
    ? `Screenshots, screen sharing, and recording are temporarily allowed on this device${status.expiresAt ? ` until ${formatDateTime(status.expiresAt)}` : ""}.`
    : "Windows content protection is active.";
}
async function disableAdminScreenCapture() {
  if (!window.examRuntime?.setScreenCaptureAllowed) return;
  try { return await window.examRuntime.setScreenCaptureAllowed(false, ""); } catch { return null; }
}
function registerContentProtectionEvents() {
  window.examRuntime?.onContentProtectionChanged?.((status) => updateAdminCaptureUi(status));
}
function header(actions = "") {
  return `<header class="portal-header"><div class="brand"><div class="brand-identity"><img class="brand-logo" src="assets/crossline-icon.png" alt="Crossline Education" /><span class="brand-name">Crossline Education</span></div><div class="brand-copy"><strong>CSCA Examination Portal</strong><small>INTERNATIONAL STUDENT ASSESSMENT</small></div></div><div class="header-actions">${actions}</div></header>`;
}
function desktopExitAction(extra = "", options = {}) {
  const updateButtons = options.updates ? `<button id="check-updates" class="header-link">Check updates</button><button id="auto-update-toggle" class="header-link">${autoUpdateEnabled() ? "Auto-update on" : "Enable auto-update"}</button>` : "";
  return `${extra}${isDesktopClient() ? `${updateButtons}<button id="exit-app" class="header-link">Exit app</button>` : ""}`;
}
function bindDesktopExit(options = {}) {
  bind("exit-app", "click", async () => {
    const confirmed = await requestConfirmation({
      id: "exit-app-confirm",
      kicker: "Exit application",
      title: "Exit Crossline?",
      message: "Are you sure you want to close the app?",
      cancelLabel: "Keep app open",
      confirmLabel: "Exit app"
    });
    if (confirmed) window.examRuntime?.exitApp?.();
  });
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
      noticeUpdateAvailable(event);
      showUpdatePanel({
        kind: "available",
        message: "A new Crossline CSCA Practice Client update is available.",
        result: event
      });
      void hydrateNotificationBadge();
      return;
    }
    if (event.type === "starting") {
      showUpdatePanel({ kind: "info", message: "Preparing the update download...", progress: 0 });
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
function beginStudentView(view) {
  activeStudentView = view;
  studentViewRevision += 1;
  closeNotificationPopover();
  return studentViewRevision;
}
function isCurrentStudentView(view, revision) {
  return activeStudentView === view && studentViewRevision === revision;
}
function resetStudentDataCache() {
  studentDataCache.resultData = null;
  studentDataCache.resultDataFetchedAt = 0;
  studentDataCache.resultDataPromise = null;
  studentDataCache.leaderboards.clear();
  studentDataCache.leaderboardFetchedAt.clear();
  studentDataCache.leaderboardPromises.clear();
  studentDataCache.notificationCount = null;
  studentDataCache.notificationFetchedAt = 0;
  studentDataCache.notificationPromise = null;
  studentDataCache.planData = null;
  studentDataCache.planFetchedAt = 0;
  studentDataCache.planPromise = null;
  studentExamsFetchedAt = 0;
}
function clearStudentSession() {
  void disableAdminScreenCapture();
  currentUser = null;
  activeSessionId = null;
  activeStudentView = "";
  studentViewRevision += 1;
  resetStudentDataCache();
  localStorage.removeItem(localSessionKey());
  window.CrosslineApi?.clearStudentToken?.();
  window.CrosslineApi?.clearAdminToken?.();
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

function requestConfirmation({ id = "crossline-confirm", kicker = "Please confirm", title, message, cancelLabel = "Cancel", confirmLabel = "Continue" }) {
  return new Promise((resolve) => {
    document.getElementById(id)?.remove();
    const modal = document.createElement("div");
    modal.id = id;
    modal.className = "logout-confirm-backdrop";
    modal.innerHTML = `<section class="logout-confirm-card" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(id)}-title"><p class="dash-card-kicker">${escapeHtml(kicker)}</p><h2 id="${escapeHtml(id)}-title">${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><div><button type="button" data-confirm-cancel class="dash-outline-button">${escapeHtml(cancelLabel)}</button><button type="button" data-confirm-accept class="danger-button">${escapeHtml(confirmLabel)}</button></div></section>`;
    const finish = (accepted) => {
      document.removeEventListener("keydown", onKeyDown);
      modal.remove();
      resolve(accepted);
    };
    const onKeyDown = (event) => { if (event.key === "Escape") finish(false); };
    modal.querySelector("[data-confirm-cancel]").addEventListener("click", () => finish(false));
    modal.querySelector("[data-confirm-accept]").addEventListener("click", () => finish(true));
    modal.addEventListener("click", (event) => { if (event.target === modal) finish(false); });
    document.addEventListener("keydown", onKeyDown);
    document.body.appendChild(modal);
    modal.querySelector("[data-confirm-cancel]").focus();
  });
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
  window.examRuntime.onOAuthComplete((payload = {}) => completeSocialLogin(payload));
}
async function completeSocialLogin(payload = {}) {
  if (!payload.token || !payload.user) {
    showAuth("login", "Social sign-in could not be completed.");
    return false;
  }
  window.CrosslineApi?.setStudentToken?.(payload.token, true);
  currentUser = payload.user;
  if (!isDesktopClient()) {
    window.CrosslineApi?.clearStudentToken?.();
    showWebsiteAccountReady();
    return true;
  }
  try {
    await refreshExamsFromApi(false);
    await showStudentDashboard("", { loading: true });
    return true;
  } catch (error) {
    showAuth("login", error.message || "Social sign-in completed, but your dashboard could not load.");
    return false;
  }
}
async function startSocialLogin(provider) {
  if (isDesktopClient()) {
    if (!window.examRuntime?.startOAuth) return showAuth("login", "Social sign-in is unavailable in this app version.");
    try {
      await window.examRuntime.startOAuth(provider);
    } catch (error) {
      showAuth("login", error.message || "Could not open social sign-in.");
    }
    return;
  }
  if (!apiEnabled()) return showAuth("login", "Account service is temporarily unavailable. Please try again shortly.");

  const apiBase = String(window.CrosslineApi?.baseUrl || "").replace(/\/$/, "");
  let expectedOrigin = "";
  try { expectedOrigin = new URL(apiBase).origin; } catch {}
  if (!expectedOrigin) return showAuth("login", "Account service is temporarily unavailable. Please try again shortly.");

  const popup = window.open(
    `${apiBase}/auth/oauth/${encodeURIComponent(provider)}/start`,
    `crossline-${provider}-sign-in`,
    "popup=yes,width=520,height=720,resizable=yes,scrollbars=yes"
  );
  if (!popup) return showAuth("login", "Your browser blocked the Google sign-in window. Allow pop-ups and try again.");

  let settled = false;
  let closedCheck = 0;
  const cleanup = () => {
    settled = true;
    window.removeEventListener("message", onMessage);
    if (closedCheck) window.clearInterval(closedCheck);
  };
  const onMessage = (event) => {
    if (event.origin !== expectedOrigin || event.data?.type !== "crossline-oauth-complete") return;
    if (event.source && event.source !== popup) return;
    cleanup();
    try { popup.close(); } catch {}
    void completeSocialLogin(event.data);
  };
  window.addEventListener("message", onMessage);
  closedCheck = window.setInterval(() => {
    if (!settled && popup.closed) {
      cleanup();
      showAuth("login", "Google sign-in was closed before it finished.");
    }
  }, 500);
}
async function openExternalUrl(url) {
  if (window.examRuntime?.openExternal) return window.examRuntime.openExternal(url);
  window.open(url, "_blank", "noopener,noreferrer");
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
        const scale = Math.min(1, 180 / longestEdge);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) return resolve("");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
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
function examPriceCents(exam = {}) {
  return Math.max(0, Math.round(Number(exam.priceCents ?? exam.price_cents ?? 0)));
}
function formatExamAccess(exam = {}) {
  if (exam.canStart !== false || exam.limitReached) {
    const remaining = Math.max(0, Number(exam.attemptsRemaining ?? 3));
    return `${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining`;
  }
  if (exam.accessLabel) return String(exam.accessLabel);
  const cents = examPriceCents(exam);
  if (!cents) return "Free for all students";
  const amount = (cents / 100).toFixed(2).replace(/\.00$/, "");
  return `${String(exam.currency || "USD").toUpperCase()} ${amount}`;
}
function normalizeExamSubjectValue(value) {
  const subject = String(value || "").trim().replace(/\s+/g, " ");
  if (/^physics$/i.test(subject)) return "Physics";
  if (/^chem(?:istry)?$/i.test(subject)) return "Chemistry";
  if (/^math(?:s|ematics)?$/i.test(subject)) return "Mathematics";
  if (/^academic\s*chinese$/i.test(subject) || /^chinese$/i.test(subject)) return "Academic Chinese";
  return EXAM_SUBJECTS.includes(subject) ? subject : "";
}
function normalizeExamCategoryValue(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (raw === "official" || raw.includes("past paper") || raw.includes("past school")) return "official";
  if (raw === "original" || raw.includes("cross")) return "original";
  return "original";
}
function examCategoryLabel(value) {
  const id = normalizeExamCategoryValue(value);
  return EXAM_CATEGORIES.find((item) => item.id === id)?.label || "Cross-Line original exams";
}
function classifyOfficialTopic(subject, requested = "", sourceText = "") {
  const catalog = TOPIC_CATALOG[subject] || [];
  const normalizedRequested = String(requested || "").trim().replace(/\s+/g, " ");
  if (!catalog.length) return normalizedRequested;
  const lower = normalizedRequested.toLowerCase();
  const exact = catalog.find((topic) => topic.toLowerCase() === lower);
  if (exact) return exact;
  if (lower.length >= 4) {
    const partial = catalog.find((topic) => {
      const name = topic.toLowerCase();
      return name.includes(lower) || lower.includes(name) || name.split(/\s+/).filter((part) => part.length > 3).some((part) => lower.includes(part));
    });
    if (partial) return partial;
  }
  const haystack = `${normalizedRequested} ${sourceText}`.toLowerCase();
  let best = catalog[0];
  let bestScore = -1;
  for (const topic of catalog) {
    const keywords = TOPIC_KEYWORDS[subject]?.[topic] || [];
    const nameBonus = haystack.includes(topic.toLowerCase()) ? topic.length * 2 : 0;
    const score = nameBonus + keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? keyword.length : 0), 0);
    if (score > bestScore) { best = topic; bestScore = score; }
  }
  return best;
}
function topicSelectHtml({ id = "", subject, selected = "", className = "", dataAttrs = "" }) {
  const catalogSubject = normalizeExamSubjectValue(subject);
  const catalog = TOPIC_CATALOG[catalogSubject] || [];
  if (!catalog.length) {
    return `<input ${id ? `id="${escapeHtml(id)}"` : ""} class="${escapeHtml(className)}" value="${escapeHtml(selected)}" ${dataAttrs} placeholder="Topic" autocomplete="off" />`;
  }
  const matched = classifyOfficialTopic(catalogSubject, selected) || catalog[0];
  return `<select ${id ? `id="${escapeHtml(id)}"` : ""} class="${escapeHtml(className)}" ${dataAttrs}>${catalog.map((topic) => `<option value="${escapeHtml(topic)}" ${topic === matched ? "selected" : ""}>${escapeHtml(topic)}</option>`).join("")}</select>`;
}
function examSubjectFieldsHtml(exam = {}) {
  const selected = normalizeExamSubjectValue(exam.subject) || "Mathematics";
  return `<div class="field"><label>Subject</label><select id="exam-subject" required>${EXAM_SUBJECTS.map((subject) => `<option value="${escapeHtml(subject)}" ${subject === selected ? "selected" : ""}>${escapeHtml(subject)}</option>`).join("")}</select></div>`;
}
function examCategoryFieldsHtml(exam = {}) {
  const selected = normalizeExamCategoryValue(exam.category);
  return `<div class="field"><label>Exam category</label><select id="exam-category" required>${EXAM_CATEGORIES.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selected ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>`;
}
function examAccessFieldsHtml(exam = {}) {
  const freeSample = Boolean(exam.freeSample ?? exam.free_sample);
  const dollars = examPriceCents(exam) ? (examPriceCents(exam) / 100).toFixed(2) : "";
  return `${examSubjectFieldsHtml(exam)}${examCategoryFieldsHtml(exam)}<div class="field"><label>Student access</label><select id="exam-access"><option value="free" ${freeSample ? "selected" : ""}>Free sample for everyone</option><option value="package" ${freeSample ? "" : "selected"}>Package access</option></select></div><div class="field" id="exam-price-field" ${freeSample ? 'hidden' : ""}><label>Placeholder price (USD)</label><input id="exam-price" type="number" min="0" max="10000" step="0.01" value="${escapeHtml(dollars)}" placeholder="Price later" /></div><p class="form-note wide">Every included exam allows three submitted attempts per student. Only one published exam can be the free sample.</p>`;
}
function localNotifications() {
  return load("csca-local-notifications", []);
}
function saveLocalNotifications(list) {
  save("csca-local-notifications", (list || []).slice(0, 40));
}
function pushLocalNotification({ id, title, body, kind = "update" }) {
  if (!id || !title || !body) return;
  const list = localNotifications();
  if (list.some((item) => item.id === id)) return;
  list.unshift({ id, title, body, kind, createdAt: new Date().toISOString(), readAt: null });
  saveLocalNotifications(list);
}
function markLocalNotificationRead(id) {
  saveLocalNotifications(localNotifications().map((item) => item.id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item));
}
function setLocalNotificationArchived(id, archived) {
  const now = new Date().toISOString();
  saveLocalNotifications(localNotifications().map((item) => item.id === id ? { ...item, readAt: item.readAt || now, archivedAt: archived ? now : null } : item));
}
function noticeUpdateAvailable(result = {}) {
  const latest = String(result.latest?.version || result.version || "").trim();
  if (!latest) return;
  pushLocalNotification({
    id: `update-${latest}`,
    kind: "update",
    title: `App update ${latest} is available`,
    body: `Crossline CSCA Practice Client ${latest} is ready. Open Updates to download and install it.`
  });
}
function readExamAccessFields() {
  const access = document.getElementById("exam-access")?.value === "free" ? "free" : "package";
  if (access === "free") return { access: "free", free: true, freeSample: true, price: 0 };
  const rawPrice = document.getElementById("exam-price")?.value;
  return { access: "package", free: false, freeSample: false, price: rawPrice === "" ? 0 : Number(rawPrice) };
}
function bindExamAccessFields() {
  const access = document.getElementById("exam-access");
  const priceField = document.getElementById("exam-price-field");
  const sync = () => { if (priceField) priceField.hidden = access?.value !== "package"; };
  access?.addEventListener("change", sync);
  sync();
}
function normalizeApiExam(exam) {
  const priceCents = examPriceCents(exam);
  return {
    ...exam,
    duration: Number(exam.duration || exam.duration_minutes || 60),
    subject: normalizeExamSubjectValue(exam.subject),
    category: normalizeExamCategoryValue(exam.category),
    freeSample: Boolean(exam.freeSample ?? exam.free_sample),
    priceCents,
    currency: String(exam.currency || "USD"),
    free: Boolean(exam.freeSample ?? exam.free_sample),
    canStart: exam.canStart !== false,
    attemptsUsed: Math.max(0, Number(exam.attemptsUsed || 0)),
    attemptsRemaining: Math.max(0, Number(exam.attemptsRemaining ?? 3)),
    limitReached: Boolean(exam.limitReached),
    accessLabel: exam.accessLabel || "",
    accessReason: exam.accessReason || "",
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
  if (!admin) studentExamsFetchedAt = Date.now();
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
  <main class="cx-landing">
    <nav class="cx-nav">
      <a class="cx-brand" href="#top" aria-label="Crossline CSCA Practice">
        <img class="cx-brand-mark" src="assets/crossline-icon.png" alt="" />
        <span class="cx-brand-word">Crossline<small>CSCA Practice</small></span>
      </a>
      <div class="cx-nav-right">
        <div class="cx-nav-links">
          <a href="#how">Features</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div class="cx-nav-actions">
          <button class="cx-btn cx-btn-ghost cx-btn-nav cx-nav-secondary" data-sign-in type="button">Sign in</button>
          <button class="cx-btn cx-btn-primary cx-btn-nav" data-create-account type="button"><span class="cx-nav-cta-full">Get started for free</span><span class="cx-nav-cta-short">Get started</span></button>
        </div>
      </div>
    </nav>

    <section class="cx-hero" id="top">
      <div class="cx-hero-center">
        <a class="cx-announce" href="${OFFICIAL_WEBSITE_URL}" target="_blank" rel="noopener noreferrer">
          <span class="cx-announce-badge">
            <svg class="cx-announce-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
            Announcement
          </span>
          <span class="cx-announce-text">Visit the official Crossline website</span>
          <svg class="cx-announce-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
        <h1 class="cx-hero-title" aria-label="Train for the real CSCA exam.">
          <span class="cx-word">Train</span>
          <span class="cx-word">for</span>
          <span class="cx-word">the</span>
          <span class="cx-word">real</span>
          <span class="cx-word cx-accent">CSCA</span>
          <span class="cx-word">exam.</span>
        </h1>
        <p class="cx-hero-sub">Two-camera pre-exam setup, a 48-question timed interface, and marks-based scoring built to feel like exam day.</p>

        <div class="cx-cta-row cx-cta-center">
          <a class="cx-btn cx-btn-primary cx-btn-lg download-button disabled-link" id="client-download" href="#" data-download-url="${WINDOWS_CLIENT_URL}" aria-disabled="true">${windowsDownloadLogo()}<span>Preparing Windows app</span></a>
        </div>

        <div class="cx-hero-frame">
          <div class="cx-hero-frame-inner">
            <img class="cx-shot" src="assets/landing/product/dashboard.png?v=2" alt="Crossline student dashboard with score cards, start-exam banner, and weakness summary" width="1280" height="800" />
          </div>
          <figure class="cx-hero-float">
            <img src="assets/landing/hero-exam-desk.png?v=2" alt="Student taking a Crossline CSCA physics mock on a laptop with working shown on a desk whiteboard" width="1024" height="768" />
          </figure>
        </div>
      </div>
      <div class="cx-hero-fade" aria-hidden="true"></div>
    </section>

    <section class="cx-band cx-band-paper" id="how">
      <div class="cx-band-inner">
        <div class="cx-band-head">
          <p class="cx-kicker cx-kicker-red">How it works</p>
          <h2>Three steps from setup to scored result</h2>
          <p class="cx-band-lead">Verify equipment, sit a timed mock, then see where you lost marks.</p>
        </div>

        <div class="cx-feature-flow" data-feature-flow>
          <div class="cx-feature-steps" role="tablist" aria-label="How Crossline works">
            <button type="button" class="cx-feature-step is-active" role="tab" aria-selected="true" data-feature-step="0">
              <span class="cx-feature-rail" aria-hidden="true"><span class="cx-feature-rail-fill"></span></span>
              <span class="cx-feature-icon">${uiIcon("square-check-big")}</span>
              <span class="cx-feature-copy">
                <strong>1. Set up like exam day</strong>
                <span>Webcam, mic, network check, phone camera, and room scan.</span>
              </span>
            </button>
            <button type="button" class="cx-feature-step" role="tab" aria-selected="false" data-feature-step="1">
              <span class="cx-feature-rail" aria-hidden="true"><span class="cx-feature-rail-fill"></span></span>
              <span class="cx-feature-icon">${uiIcon("layout-dashboard")}</span>
              <span class="cx-feature-copy">
                <strong>2. Sit the timed mock</strong>
                <span>Live clock, flag for review, and the same exam-day flow.</span>
              </span>
            </button>
            <button type="button" class="cx-feature-step" role="tab" aria-selected="false" data-feature-step="2">
              <span class="cx-feature-rail" aria-hidden="true"><span class="cx-feature-rail-fill"></span></span>
              <span class="cx-feature-icon">${uiIcon("target")}</span>
              <span class="cx-feature-copy">
                <strong>3. See where you lost marks</strong>
                <span>Scores, explanations, and topic-level weakness analysis.</span>
              </span>
            </button>
          </div>
          <div class="cx-feature-stage">
            <div class="cx-feature-panel is-active" data-feature-panel="0">
              <figure class="cx-photo-card" data-cx-lens>
                <img src="assets/landing/hero-dual-camera.png" alt="Student at a desk with laptop exam client and phone room camera on a tripod" width="1024" height="768" />
                <figcaption><span class="cx-cam-live">LIVE setup</span><span>Primary webcam · secondary phone on tripod</span></figcaption>
              </figure>
            </div>
            <div class="cx-feature-panel" data-feature-panel="1">
              <div class="cx-window" data-cx-lens>
                <img class="cx-shot" src="assets/landing/product/exam-interface.png?v=2" alt="Crossline timed CSCA mock exam interface" width="1280" height="800" />
              </div>
            </div>
            <div class="cx-feature-panel" data-feature-panel="2">
              <div class="cx-two-cards">
                <div class="cx-window cx-two-cards-back" data-cx-lens>
                  <img class="cx-shot" src="assets/landing/product/results.png?v=2" alt="Crossline results list with scores" width="1280" height="800" />
                </div>
                <div class="cx-window cx-two-cards-front" data-cx-lens>
                  <img class="cx-shot" src="assets/landing/product/weakness.png?v=2" alt="Crossline weakness analysis by topic" width="1280" height="800" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cx-band cx-band-navy" id="exam">
      <div class="cx-band-inner cx-band-split">
        <div class="cx-band-copy">
          <p class="cx-kicker cx-kicker-paper">Equipment check</p>
          <h2>Verify camera, mic, and network before you begin.</h2>
          <p class="cx-band-lead">Every mock starts with a device check inside the Windows client, just like the actual CSCA exam. Pick your webcam and microphone, test the network, then continue.</p>
          <ul class="cx-check-list">
            <li>${uiIcon("square-check-big")} Select and preview your Windows webcam</li>
            <li>${uiIcon("square-check-big")} Test your microphone and headset</li>
            <li>${uiIcon("square-check-big")} Confirm network readiness against the live API</li>
            <li>${uiIcon("square-check-big")} Continue to facial recognition, phone pairing, and room scan</li>
          </ul>
        </div>
        <div class="cx-window cx-exam-window" data-cx-lens>
          <img class="cx-shot" src="assets/landing/product/equipment-check.png?v=3" alt="Crossline equipment check screen for camera, microphone, and network" width="1280" height="800" />
        </div>
      </div>
    </section>

    <section class="cx-band cx-band-paper" id="results">
      <div class="cx-band-inner cx-band-split cx-band-split-rev">
        <div class="cx-band-copy">
          <p class="cx-kicker cx-kicker-red">Results &amp; analytics</p>
          <h2>See exactly where you lost marks.</h2>
          <p class="cx-band-lead">Scores are marks-based and available after you submit. Every question comes with the correct answer, your answer, and a written explanation. Weakness analysis turns that into topic-level study targets.</p>
          <div class="cx-result-stats">
            <div><strong class="number-font">82%</strong><small>Example latest score</small></div>
            <div><strong class="number-font">82/100</strong><small>Marks earned</small></div>
            <div><strong class="number-font">4</strong><small>Subjects tracked</small></div>
            <div><strong class="number-font">Topics</strong><small>Weakness breakdown</small></div>
          </div>
        </div>
        <div class="cx-result-shots">
          <div class="cx-window">
            <img class="cx-shot" src="assets/landing/product/results.png" alt="Crossline results list with scores and view-full-result actions" width="1280" height="800" />
          </div>
          <div class="cx-window cx-result-secondary">
            <img class="cx-shot" src="assets/landing/product/weakness.png" alt="Crossline weakness analysis by topic" width="1280" height="800" />
          </div>
        </div>
      </div>
    </section>

    <section class="cx-subjects">
      <div class="cx-band-inner">
        <div class="cx-band-head">
          <p class="cx-kicker cx-kicker-red">Four subjects</p>
          <h2>Physics, Chemistry, Mathematics &amp; Academic Chinese.</h2>
        </div>
        <div class="cx-subject-grid">
          <article class="cx-subject"><span class="cx-subject-icon">${uiIcon("atom")}</span><h3>Physics</h3><p>Mechanics, electricity, waves, optics, and modern physics with diagrams and LaTeX.</p></article>
          <article class="cx-subject"><span class="cx-subject-icon">${uiIcon("flask-conical")}</span><h3>Chemistry</h3><p>Organic, inorganic, and physical chemistry problems with full explanations.</p></article>
          <article class="cx-subject"><span class="cx-subject-icon">${uiIcon("calculator")}</span><h3>Mathematics</h3><p>Calculus, algebra, geometry, and probability, fully equation-rendered.</p></article>
          <article class="cx-subject"><span class="cx-subject-icon">${uiIcon("languages")}</span><h3>Academic Chinese</h3><p>Reading comprehension, grammar, and academic vocabulary drills.</p></article>
        </div>
      </div>
    </section>

    <section class="cx-price-grid-wrap" id="pricing">
      <div class="cx-band-inner">
        <div class="cx-band-head cx-price-head">
          <p class="cx-kicker cx-kicker-red">Pricing</p>
          <h2>Choose the plan that's right for you</h2>
        </div>
        <div class="cx-price-grid cx-price-grid-three">${landingPricingCardsHtml()}</div>
      </div>
    </section>

    <footer class="cx-foot">
      <div class="cx-band-inner cx-foot-inner">
        <div class="cx-foot-brand"><img src="assets/crossline-icon.png" alt="" /><div><b>Crossline</b><small>CSCA Practice</small></div></div>
        <p class="cx-foot-note">Crossline CSCA Practice is a mock-exam service. It is not the official CSCA examination system and does not guarantee admission, certification, or a particular result.</p>
        <div class="cx-foot-links"><a href="${OFFICIAL_WEBSITE_URL}" target="_blank" rel="noopener noreferrer">Official website</a><a href="#pricing">Pricing</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/data-deletion">Data deletion</a></div>
      </div>
    </footer>
  </main>`;
  hydrateDownloadLinks();
  wireLandingInteractions();
  wireLandingNavScroll();
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

function legalPageFromPath(pathname = window.location.pathname) {
  const normalized = String(pathname || "/").replace(/\/+$/, "") || "/";
  return normalized === "/privacy" ? "privacy" : normalized === "/terms" ? "terms" : normalized === "/data-deletion" ? "data-deletion" : "";
}

function wireLandingNavScroll() {
  const nav = document.querySelector(".cx-landing .cx-nav");
  if (!nav) return;

  const startPx = 16;
  const endPx = 120;
  let ticking = false;

  const update = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const progress = Math.min(1, Math.max(0, (y - startPx) / (endPx - startPx)));
    nav.style.setProperty("--cx-nav-solid", progress.toFixed(3));
    nav.classList.toggle("is-scrolled", progress > 0.08);
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function wireLandingInteractions() {
  requestAnimationFrame(() => {
    document.querySelector(".cx-hero")?.classList.add("cx-hero-ready");
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("in"); });
    }, { threshold: 0.12 });
    document.querySelectorAll(".cx-hero, .cx-band, .cx-subjects, .cx-price-grid-wrap, .cx-final-cta").forEach((el) => {
      el.classList.add("cx-reveal");
      io.observe(el);
    });
  }

  const flow = document.querySelector("[data-feature-flow]");
  if (!flow) return;

  const steps = [...flow.querySelectorAll("[data-feature-step]")];
  const panels = [...flow.querySelectorAll("[data-feature-panel]")];
  let index = 0;
  let timer = null;
  let paused = false;
  const dwellMs = 5200;

  const activate = (next, { restart = true } = {}) => {
    index = ((next % steps.length) + steps.length) % steps.length;
    steps.forEach((step, i) => {
      const on = i === index;
      step.classList.toggle("is-active", on);
      step.setAttribute("aria-selected", on ? "true" : "false");
      const fill = step.querySelector(".cx-feature-rail-fill");
      if (fill) {
        fill.style.transition = "none";
        fill.style.height = "0%";
        if (on) {
          void fill.offsetWidth;
          fill.style.transition = "";
          fill.style.height = "100%";
        }
      }
    });
    panels.forEach((panel, i) => panel.classList.toggle("is-active", i === index));
    if (restart && !paused) {
      clearInterval(timer);
      timer = setInterval(() => activate(index + 1, { restart: false }), dwellMs);
    }
  };

  steps.forEach((step) => {
    step.addEventListener("click", () => activate(Number(step.dataset.featureStep) || 0));
  });

  const setPaused = (next) => {
    paused = next;
    if (paused) clearInterval(timer);
    else activate(index);
  };

  wireFeatureLenses(flow, { onHoverChange: setPaused });
  wireFeatureLenses(document.querySelector("#exam"));
  wirePricingSubjectCards(document.querySelector("#pricing"));
  wireMagneticButtons(document.querySelector("#pricing"));

  const flowIo = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activate(index);
        else clearInterval(timer);
      });
    }, { threshold: 0.35 })
    : null;
  if (flowIo) flowIo.observe(flow);
  else activate(0);
}

function wirePricingSubjectCards(root) {
  if (!root) return;
  const cards = [...root.querySelectorAll("[data-subject-card]")];
  if (!cards.length) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  cards.forEach((card) => {
    const plan = ACCESS_PLANS.find((item) => item.id === card.dataset.planId);
    if (!plan?.subjectPrices) return;

    const row = card.querySelector(".cx-price-tier-row");
    const thumb = card.querySelector("[data-subject-thumb]");
    const priceEl = card.querySelector("[data-subject-price]");
    const featsEl = card.querySelector("[data-subject-feats]");
    const noteEl = card.querySelector("[data-subject-note]");
    const tiers = [...card.querySelectorAll(".cx-price-tier")];
    let contentTimer = 0;
    let inTimer = 0;
    let currentSubjects = Number(tiers.find((btn) => btn.classList.contains("is-active"))?.dataset.subjects || 1);

    const moveThumb = (activeBtn) => {
      if (!row || !thumb || !activeBtn) return;
      thumb.style.width = `${activeBtn.offsetWidth}px`;
      thumb.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
      thumb.classList.add("is-ready");
    };

    const render = (subjects) => {
      const count = planSubjectCount(plan, subjects);
      if (priceEl) priceEl.textContent = formatPlanUsd(planPriceForSubjects(plan, count));
      if (noteEl) noteEl.textContent = "billed once";
      if (featsEl) {
        featsEl.innerHTML = planFeatureList(plan, count)
          .map((f) => `<li>${uiIcon("badge-check")}<span>${escapeHtml(f)}</span></li>`)
          .join("");
      }
    };

    const apply = (subjects) => {
      const count = planSubjectCount(plan, subjects);
      if (count === currentSubjects) return;
      const activeBtn = tiers.find((btn) => Number(btn.dataset.subjects) === count);
      tiers.forEach((btn) => {
        const on = Number(btn.dataset.subjects) === count;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      currentSubjects = count;
      moveThumb(activeBtn);

      if (reduceMotion) {
        render(count);
        return;
      }

      window.clearTimeout(contentTimer);
      window.clearTimeout(inTimer);
      card.classList.remove("is-tier-in");
      card.classList.add("is-tier-out");
      contentTimer = window.setTimeout(() => {
        render(count);
        card.classList.remove("is-tier-out");
        void card.offsetWidth;
        card.classList.add("is-tier-in");
        inTimer = window.setTimeout(() => card.classList.remove("is-tier-in"), 320);
      }, 160);
    };

    tiers.forEach((btn) => {
      btn.addEventListener("click", () => apply(Number(btn.dataset.subjects)));
    });

    const syncThumb = () => {
      const active = tiers.find((btn) => btn.classList.contains("is-active")) || tiers[0];
      moveThumb(active);
    };
    syncThumb();
    window.requestAnimationFrame(syncThumb);
    window.addEventListener("resize", syncThumb);
  });
}

function wireMagneticButtons(root) {
  if (!root || window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

  const distance = 0.45;
  const ease = 0.18;

  root.querySelectorAll("[data-cx-magnetic]").forEach((wrap) => {
    if (wrap.dataset.magneticWired === "1") return;
    const target = wrap.querySelector("button, a, .cx-btn") || wrap;
    wrap.dataset.magneticWired = "1";
    wrap.classList.add("cx-magnetic");

    let hovered = false;
    let mx = 0;
    let my = 0;
    let sx = 0;
    let sy = 0;
    let raf = 0;

    const tick = () => {
      sx += (mx - sx) * ease;
      sy += (my - sy) * ease;
      target.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0)`;
      if (hovered || Math.abs(mx - sx) > 0.08 || Math.abs(my - sy) > 0.08) {
        raf = requestAnimationFrame(tick);
      } else {
        target.style.transform = "";
        raf = 0;
      }
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    wrap.addEventListener("mouseenter", () => {
      hovered = true;
      wrap.closest(".cx-price-card")?.classList.add("is-magnetic-active");
      start();
    });
    wrap.addEventListener("mouseleave", () => {
      hovered = false;
      mx = 0;
      my = 0;
      wrap.closest(".cx-price-card")?.classList.remove("is-magnetic-active");
      start();
    });
    wrap.addEventListener("mousemove", (event) => {
      const rect = wrap.getBoundingClientRect();
      mx = (event.clientX - (rect.left + rect.width / 2)) * distance;
      my = (event.clientY - (rect.top + rect.height / 2)) * distance;
      start();
    });
  });
}

function wireFeatureLenses(root, { onHoverChange } = {}) {
  if (!root || window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

  const zoomFactor = 1.65;
  const lensSize = 168;

  root.querySelectorAll("[data-cx-lens]").forEach((container) => {
    if (container.dataset.lensWired === "1") return;
    const img = container.querySelector("img");
    if (!img) return;
    container.dataset.lensWired = "1";
    container.classList.add("cx-lens");

    const zoom = document.createElement("div");
    zoom.className = "cx-lens-zoom";
    zoom.setAttribute("aria-hidden", "true");
    const zoomImg = img.cloneNode(true);
    zoomImg.removeAttribute("loading");
    zoom.appendChild(zoomImg);

    const ring = document.createElement("div");
    ring.className = "cx-lens-ring";
    ring.style.width = `${lensSize}px`;
    ring.style.height = `${lensSize}px`;

    container.appendChild(zoom);
    container.appendChild(ring);

    const place = (x, y) => {
      const radius = lensSize / 2;
      const mask = `radial-gradient(circle ${radius}px at ${x}px ${y}px, #000 100%, transparent 100%)`;
      zoom.style.maskImage = mask;
      zoom.style.webkitMaskImage = mask;
      zoomImg.style.transformOrigin = `${x}px ${y}px`;
      zoomImg.style.transform = `scale(${zoomFactor})`;
      ring.style.transform = `translate(${x - radius}px, ${y - radius}px)`;
    };

    container.addEventListener("mouseenter", () => {
      container.classList.add("is-lens-on");
      onHoverChange?.(true);
    });
    container.addEventListener("mouseleave", () => {
      container.classList.remove("is-lens-on");
      onHoverChange?.(false);
    });
    container.addEventListener("mousemove", (event) => {
      const rect = container.getBoundingClientRect();
      place(event.clientX - rect.left, event.clientY - rect.top);
    });
  });
}

function bindLandingAccountButtons() {
  document.querySelectorAll("[data-sign-in]").forEach((button) => {
    button.addEventListener("click", () => showAuth("login"));
  });
  document.querySelectorAll("[data-create-account]").forEach((button) => {
    button.addEventListener("click", () => showWebsiteRegister());
  });
}

function authBrandMarkup({ action = "home" } = {}) {
  return `<button class="auth-v2-brand" type="button" data-auth-home data-auth-action="${escapeHtml(action)}">
    <img src="assets/crossline-icon.png" alt="" />
    <span class="auth-v2-brand-word"><b>Crossline</b><small>CSCA Practice</small></span>
  </button>`;
}

function landingBrandMarkup() {
  return `<a class="landing-brand" href="#top" aria-label="Crossline CSCA Practice">
    <img class="landing-brand-mark" src="assets/crossline-icon.png" alt="" />
    <span class="landing-brand-word">Crossline<small>CSCA Practice</small></span>
  </a>`;
}

function authIcon(name) {
  const icons = {
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
  };
  return icons[name] || "";
}

function authAvatarPreviewMarkup() {
  if (authAvatarData) return `<img src="${escapeHtml(authAvatarData)}" alt="Profile preview" />`;
  return `<span class="auth-v2-cam">${authIcon("camera")}</span>`;
}

function showWebsiteRegister(message = "") {
  stopMedia();
  message = typeof message === "string" ? message : "";
  app.innerHTML = `
  <main class="auth-v2">
    <section class="auth-v2-form">
      <div class="auth-v2-topbar">
        ${authBrandMarkup()}
        <button class="auth-v2-back" type="button" data-auth-home>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to home
        </button>
      </div>
      <div class="auth-v2-wrap">
        <span class="auth-v2-eyebrow">Get started</span>
        <h1>Create your account</h1>
        <p class="auth-v2-sub">Register here, verify your email, then sign in inside the Windows app to take your first mock.</p>
        <div class="auth-v2-steps" aria-hidden="true">
          <div class="auth-v2-step is-active"><span class="num">1</span><span class="label">Details</span></div>
          <span class="auth-v2-step-bar"></span>
          <div class="auth-v2-step"><span class="num">2</span><span class="label">Verify email</span></div>
          <span class="auth-v2-step-bar"></span>
          <div class="auth-v2-step"><span class="num">3</span><span class="label">Practice</span></div>
        </div>
        <button id="google-sign-in" class="auth-v2-google" type="button"><img src="assets/google-g.svg" alt="" />Sign up with Google</button>
        <div class="auth-v2-divider"><span>or sign up with email</span></div>
        <form id="website-register-form" class="auth-v2-fields" novalidate>
          <div class="auth-v2-avatar">
            <label class="auth-v2-avatar-pick" for="website-register-avatar">
              <span id="website-avatar-preview">${authAvatarPreviewMarkup()}</span>
              <input id="website-register-avatar" type="file" accept="image/*" />
            </label>
            <div class="auth-v2-avatar-meta"><b>Profile picture</b><small>Optional. You can change this later in Settings.</small></div>
          </div>
          <div class="auth-v2-name-grid">
            <div class="auth-v2-field">
              <label for="website-register-first-name">First name</label>
              <div class="auth-v2-input-wrap"><input id="website-register-first-name" type="text" maxlength="60" autocomplete="given-name" placeholder="Alex" required /></div>
            </div>
            <div class="auth-v2-field">
              <label for="website-register-last-name">Last name</label>
              <div class="auth-v2-input-wrap"><input id="website-register-last-name" type="text" maxlength="60" autocomplete="family-name" placeholder="Taylor" required /></div>
            </div>
          </div>
          <div class="auth-v2-field">
            <label for="website-register-username">Username</label>
            <div class="auth-v2-input-wrap with-icon">
              <span class="auth-v2-icon" aria-hidden="true">${authIcon("user")}</span>
              <input id="website-register-username" type="text" maxlength="40" placeholder="Example: alex.student" autocomplete="username" required />
            </div>
          </div>
          <div class="auth-v2-field">
            <label for="website-register-email">Email address</label>
            <div class="auth-v2-input-wrap with-icon">
              <span class="auth-v2-icon" aria-hidden="true">${authIcon("mail")}</span>
              <input id="website-register-email" type="email" autocomplete="email" placeholder="you@example.com" required />
            </div>
          </div>
          <div class="auth-v2-field">
            <label for="website-register-password">Create password</label>
            <div class="auth-v2-input-wrap with-icon">
              <span class="auth-v2-icon" aria-hidden="true">${authIcon("lock")}</span>
              <input id="website-register-password" type="password" minlength="6" autocomplete="new-password" placeholder="At least 6 characters" required />
              <button id="toggle-website-register-password" type="button">Show</button>
            </div>
            <div class="auth-v2-pw-strength" id="website-pw-strength" hidden>
              <div class="auth-v2-pw-bars" id="website-pw-bars"><span></span><span></span><span></span><span></span></div>
              <span class="auth-v2-pw-label" id="website-pw-label">Weak</span>
            </div>
            <span class="auth-v2-hint">Must be at least 6 characters.</span>
          </div>
          <p class="form-message">${escapeHtml(message)}</p>
          <button class="auth-v2-submit" type="submit">Create account ${authIcon("arrow")}</button>
        </form>
        <div class="auth-v2-verify-note">
          ${authIcon("mail")}
          <span>${apiEnabled() ? "We'll email a 6-digit verification code to confirm your address before your first exam." : "This prototype displays the verification code locally after you create the account."}</span>
        </div>
        <p class="auth-v2-switch">Already have an account? <button type="button" data-sign-in>Sign in</button></p>
      </div>
      <p class="auth-v2-legal">By continuing, you agree to our <button id="auth-terms" type="button">Terms</button> and <button id="auth-privacy" type="button">Privacy Policy</button>.</p>
    </section>
    <aside class="auth-v2-showcase" aria-hidden="true">
      <span class="auth-v2-blob auth-v2-blob-1"></span>
      <span class="auth-v2-blob auth-v2-blob-2"></span>
      <div class="auth-v2-show-copy">
        <h2>Start practicing <em>the smart way.</em></h2>
        <p>One account unlocks every official CSCA past-paper mock, marks-based scoring, and a dashboard built to show you exactly what to study next.</p>
        <div class="auth-v2-benefits">
          <div class="auth-v2-benefit"><span class="auth-v2-b-icon">${authIcon("mail")}</span><div><b>Full results &amp; explanations</b><small>Every question comes with the correct answer and a written explanation.</small></div></div>
          <div class="auth-v2-benefit"><span class="auth-v2-b-icon">${authIcon("target")}</span><div><b>Weakness analysis</b><small>See your accuracy broken down by subject, chapter, and topic.</small></div></div>
          <div class="auth-v2-benefit"><span class="auth-v2-b-icon">${authIcon("chart")}</span><div><b>Track your progress</b><small>Watch your scores climb across every mock you take.</small></div></div>
        </div>
      </div>
      <div class="auth-v2-show-foot"><span class="auth-v2-tick">${authIcon("check")}</span><div><b>Free to start.</b><small>Create your account now — pick a plan when you're ready.</small></div></div>
    </aside>
  </main>`;
  document.querySelectorAll("[data-auth-home]").forEach((el) => el.addEventListener("click", showDownloadLanding));
  document.querySelectorAll("[data-sign-in]").forEach((el) => el.addEventListener("click", () => showAuth("login")));
  bind("google-sign-in", "click", () => startSocialLogin("google"));
  bind("auth-terms", "click", () => openExternalUrl(TERMS_OF_SERVICE_URL));
  bind("auth-privacy", "click", () => openExternalUrl(PRIVACY_POLICY_URL));
  bind("toggle-website-register-password", "click", () => togglePasswordVisibility("website-register-password", "toggle-website-register-password"));
  bind("website-register-password", "input", () => {
    const value = document.getElementById("website-register-password")?.value || "";
    const strength = document.getElementById("website-pw-strength");
    const bars = document.getElementById("website-pw-bars");
    const label = document.getElementById("website-pw-label");
    if (!strength || !bars || !label) return;
    if (!value) {
      strength.hidden = true;
      return;
    }
    strength.hidden = false;
    let score = 0;
    if (value.length >= 6) score += 1;
    if (value.length >= 10) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;
    bars.className = `auth-v2-pw-bars s${score}`;
    label.className = `auth-v2-pw-label ${score <= 1 ? "weak" : score <= 3 ? "medium" : "strong"}`;
    label.textContent = score <= 1 ? "Weak" : score <= 3 ? "Medium" : "Strong";
  });
  bind("website-register-avatar", "change", async (event) => {
    authAvatarData = await readProfilePhoto(event.target.files?.[0]);
    const preview = document.getElementById("website-avatar-preview");
    if (preview) preview.innerHTML = authAvatarPreviewMarkup();
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
  <main class="auth-v2">
    <section class="auth-v2-form">
      <div class="auth-v2-topbar">
        ${authBrandMarkup()}
        <button class="auth-v2-back" type="button" id="back-register">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to details
        </button>
      </div>
      <div class="auth-v2-wrap">
        <span class="auth-v2-eyebrow">Step 2 of 3</span>
        <h1>Verify your email</h1>
        <p class="auth-v2-sub">Enter the six-digit code sent to <strong>${escapeHtml(pendingRegistration.email)}</strong>.</p>
        <div class="auth-v2-steps" aria-hidden="true">
          <div class="auth-v2-step"><span class="num">1</span><span class="label">Details</span></div>
          <span class="auth-v2-step-bar"></span>
          <div class="auth-v2-step is-active"><span class="num">2</span><span class="label">Verify email</span></div>
          <span class="auth-v2-step-bar"></span>
          <div class="auth-v2-step"><span class="num">3</span><span class="label">Practice</span></div>
        </div>
        <form id="website-verify-form" class="auth-v2-fields" novalidate>
          ${apiEnabled()
            ? "<p class=\"auth-v2-note\">Check your inbox for the verification code.</p>"
            : `<p class="auth-v2-note">Prototype verification code</p><div class="auth-v2-demo-code">${DEMO_CODE}</div>`}
          <div class="auth-v2-field"><label for="website-verify-code">Verification code</label><input id="website-verify-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required /></div>
          <p class="form-message">${escapeHtml(message)}</p>
          <button class="auth-v2-submit" type="submit">Verify email <span aria-hidden="true">→</span></button>
        </form>
      </div>
    </section>
    <aside class="auth-v2-showcase" aria-hidden="true">
      <span class="auth-v2-blob auth-v2-blob-1"></span>
      <span class="auth-v2-blob auth-v2-blob-2"></span>
      <div class="auth-v2-show-copy">
        <h2>Almost there.</h2>
        <p>Once your email is verified, download the Windows app and sign in to take your first mock.</p>
      </div>
    </aside>
  </main>`;
  document.querySelectorAll("[data-auth-home]").forEach((el) => el.addEventListener("click", showDownloadLanding));
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
  const desktop = isDesktopClient();
  app.innerHTML = `
  <main class="auth-v2">
    <section class="auth-v2-form">
      <div class="auth-v2-topbar">
        ${authBrandMarkup()}
        <button class="auth-v2-back" type="button" id="back-home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to home
        </button>
      </div>
      <div class="auth-v2-wrap">
        <span class="auth-v2-eyebrow">${desktop ? "Step 3 of 3" : "Account ready"}</span>
        <h1>${desktop ? "Your account is ready" : "Continue in the Windows app"}</h1>
        <p class="auth-v2-sub">${desktop ? "Sign in with the account you just verified to start practicing." : "Download Crossline CSCA Practice, then sign in with this same account to start your exams."}</p>
        <div class="auth-v2-steps" aria-hidden="true">
          <div class="auth-v2-step"><span class="num">1</span><span class="label">Details</span></div>
          <span class="auth-v2-step-bar"></span>
          <div class="auth-v2-step"><span class="num">2</span><span class="label">Verify email</span></div>
          <span class="auth-v2-step-bar"></span>
          <div class="auth-v2-step is-active"><span class="num">3</span><span class="label">Practice</span></div>
        </div>
        ${desktop
          ? `<button class="auth-v2-submit" type="button" data-sign-in>Sign in to the app ${authIcon("arrow")}</button>`
          : `<a class="auth-v2-submit auth-v2-download disabled-link" id="cta-download" href="#" data-download-url="${WINDOWS_CLIENT_URL}" aria-disabled="true">${windowsDownloadLogo()}<span>Preparing Windows app</span></a>`}
        <p class="auth-v2-switch"><button type="button" ${desktop ? "data-sign-in" : "data-auth-home"}>${desktop ? "Use another account" : "Back to website"}</button></p>
      </div>
    </section>
    <aside class="auth-v2-showcase" aria-hidden="true">
      <span class="auth-v2-blob auth-v2-blob-1"></span>
      <span class="auth-v2-blob auth-v2-blob-2"></span>
      <div class="auth-v2-show-copy">
        <h2>Practice starts in the app.</h2>
        <p>Two-camera setup, timed mocks, and marks-based results — all waiting once you sign in on Windows.</p>
      </div>
    </aside>
  </main>`;
  document.querySelectorAll("[data-auth-home]").forEach((el) => el.addEventListener("click", showDownloadLanding));
  document.querySelectorAll("[data-sign-in]").forEach((el) => el.addEventListener("click", () => showAuth("login")));
  bind("back-home", "click", showDownloadLanding);
  if (!desktop) hydrateDownloadLinks();
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

  if (typeof document === "undefined" || !document.getElementById) return;
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
  if (tab === "register") return showWebsiteRegister(message);

  const emailValue = apiEnabled() ? "" : "student@example.com";
  const passwordValue = apiEnabled() ? "" : "demo123";
  app.innerHTML = `
  <main class="auth-v2">
    <section class="auth-v2-form">
      <div class="auth-v2-topbar">
        ${authBrandMarkup()}
        <button class="auth-v2-back" type="button" data-auth-home>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to home
        </button>
      </div>
      <div class="auth-v2-wrap">
        <span class="auth-v2-eyebrow">Welcome back</span>
        <h1>Sign in to your account</h1>
        <p class="auth-v2-sub">Continue your CSCA mock exam practice right where you left off.</p>
        <button id="google-sign-in" class="auth-v2-google" type="button"><img src="assets/google-g.svg" alt="" />Continue with Google</button>
        <div class="auth-v2-divider"><span>or sign in with email</span></div>
        <form id="login-form" class="auth-v2-fields" novalidate>
          <div class="auth-v2-field">
            <label for="login-email">Email address</label>
            <div class="auth-v2-input-wrap with-icon">
              <span class="auth-v2-icon" aria-hidden="true">${authIcon("mail")}</span>
              <input id="login-email" type="email" autocomplete="email" placeholder="you@example.com" value="${escapeHtml(emailValue)}" required />
            </div>
          </div>
          <div class="auth-v2-field">
            <label for="login-password">Password</label>
            <div class="auth-v2-input-wrap with-icon">
              <span class="auth-v2-icon" aria-hidden="true">${authIcon("lock")}</span>
              <input id="login-password" type="password" autocomplete="current-password" placeholder="Enter your password" value="${escapeHtml(passwordValue)}" required />
              <button id="toggle-login-password" type="button">Show</button>
            </div>
          </div>
          <div class="auth-v2-row">
            <label class="auth-v2-remember"><input type="checkbox" checked /> Keep me signed in</label>
            <button id="forgot-password" class="auth-v2-forgot" type="button">Forgot password?</button>
          </div>
          <p class="form-message">${escapeHtml(message)}</p>
          <button class="auth-v2-submit" type="submit">Sign in ${authIcon("arrow")}</button>
        </form>
        ${localModeNote("<div class=\"auth-v2-demo\">Demo account — <code>student@example.com</code> / <code>demo123</code></div>")}
        <p class="auth-v2-switch">New to Crossline? <button type="button" data-create-account>Create an account</button></p>
      </div>
      <p class="auth-v2-legal">By continuing, you agree to our <button id="auth-terms" type="button">Terms</button> and <button id="auth-privacy" type="button">Privacy Policy</button>.</p>
    </section>
    <aside class="auth-v2-showcase" aria-hidden="true">
      <span class="auth-v2-blob auth-v2-blob-1"></span>
      <span class="auth-v2-blob auth-v2-blob-2"></span>
      <div class="auth-v2-show-copy">
        <h2>Ace every mock exam. <em>Track every step forward.</em></h2>
        <p>Two-camera pre-exam setup, a 48-question timed interface, marks-based scoring, and a dashboard that shows exactly where you lose marks.</p>
        <div class="auth-v2-stats">
          <div class="auth-v2-stat"><b>48</b><small>questions per mock</small></div>
          <div class="auth-v2-stat"><b>4</b><small>subjects covered</small></div>
          <div class="auth-v2-stat"><b>100%</b><small>marks-based</small></div>
        </div>
      </div>
      <div class="auth-v2-show-foot"><span class="auth-v2-tick">${authIcon("check")}</span><div><b>Your progress. Our priority.</b><small>Secure, private, and built for serious candidates.</small></div></div>
    </aside>
  </main>`;
  document.querySelectorAll("[data-auth-home]").forEach((el) => el.addEventListener("click", showDownloadLanding));
  document.querySelectorAll("[data-create-account]").forEach((el) => el.addEventListener("click", () => showWebsiteRegister()));
  bind("google-sign-in", "click", () => startSocialLogin("google"));
  bind("auth-terms", "click", () => openExternalUrl(TERMS_OF_SERVICE_URL));
  bind("auth-privacy", "click", () => openExternalUrl(PRIVACY_POLICY_URL));
  bind("forgot-password", "click", showPasswordReset);
  bind("toggle-login-password", "click", () => togglePasswordVisibility("login-password", "toggle-login-password"));
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
        if (!isDesktopClient()) {
          window.CrosslineApi.clearStudentToken?.();
          return showWebsiteAccountReady();
        }
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
}

function showPasswordReset(message = "", confirmStep = false) {
  leaveKiosk();
  stopMedia();
  message = typeof message === "string" ? message : "";
  const form = confirmStep
    ? `<form id="password-reset-confirm-form" class="auth-v2-fields" novalidate>
        <div class="auth-v2-field"><label>Email address</label><input value="${escapeHtml(pendingPasswordResetEmail)}" disabled /></div>
        <div class="auth-v2-field"><label for="password-reset-code">Six-digit reset code</label><input id="password-reset-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required /></div>
        <div class="auth-v2-field"><label for="password-reset-new">New password</label><div class="auth-v2-input-wrap"><input id="password-reset-new" type="password" autocomplete="new-password" minlength="6" required /><button id="toggle-reset-password" type="button">Show</button></div></div>
        <div class="auth-v2-field"><label for="password-reset-confirm">Confirm new password</label><input id="password-reset-confirm" type="password" autocomplete="new-password" minlength="6" required /></div>
        <p class="form-message">${escapeHtml(message)}</p>
        <button class="auth-v2-submit" type="submit">Reset password <span aria-hidden="true">→</span></button>
        <p class="auth-v2-switch"><button id="reset-request-again" type="button">Use another email</button></p>
      </form>`
    : `<form id="password-reset-request-form" class="auth-v2-fields" novalidate>
        <div class="auth-v2-field"><label for="password-reset-email">Email address</label><input id="password-reset-email" type="email" autocomplete="email" placeholder="you@example.com" required /></div>
        <p class="auth-v2-note">If the address belongs to a verified account, we will email a code that expires in 15 minutes.</p>
        <p class="form-message">${escapeHtml(message)}</p>
        <button class="auth-v2-submit" type="submit">Send reset code <span aria-hidden="true">→</span></button>
        <p class="auth-v2-switch"><button id="reset-back-login" type="button">Back to sign in</button></p>
      </form>`;
  app.innerHTML = `
  <main class="auth-v2">
    <section class="auth-v2-form">
      <div class="auth-v2-topbar">
        ${authBrandMarkup()}
        <button class="auth-v2-back" type="button" data-auth-home>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to home
        </button>
      </div>
      <div class="auth-v2-wrap">
        <span class="auth-v2-eyebrow">Account recovery</span>
        <h1>${confirmStep ? "Choose a new password" : "Reset your password"}</h1>
        <p class="auth-v2-sub">${confirmStep ? "Enter the code from your email and choose a new password." : "We'll help you safely regain access to your dashboard."}</p>
        ${form}
      </div>
    </section>
    <aside class="auth-v2-showcase" aria-hidden="true">
      <span class="auth-v2-blob auth-v2-blob-1"></span>
      <span class="auth-v2-blob auth-v2-blob-2"></span>
      <div class="auth-v2-show-copy">
        <h2>Return to your progress.</h2>
        <p>Your exams, results, and profile will be waiting after you sign in again.</p>
      </div>
      <div class="auth-v2-show-foot"><span>✓</span><div><b>One-time recovery code</b><small>The code expires after 15 minutes.</small></div></div>
    </aside>
  </main>`;
  document.querySelectorAll("[data-auth-home]").forEach((el) => el.addEventListener("click", showDownloadLanding));
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

function studentResultSnapshot() {
  if (!apiEnabled()) {
    const local = { results: getLocalResults(), details: getLocalResults() };
    studentDataCache.resultData = local;
    studentDataCache.resultDataFetchedAt = Date.now();
    return local;
  }
  return studentDataCache.resultData || { results: [], details: [] };
}

function refreshStudentResultData(force = false) {
  if (!apiEnabled()) return Promise.resolve(studentDataCache.resultData || studentResultSnapshot());
  if (!force && studentDataCache.resultData && Date.now() - studentDataCache.resultDataFetchedAt < STUDENT_CACHE_TTL) {
    return Promise.resolve(studentDataCache.resultData);
  }
  if (studentDataCache.resultDataPromise) return studentDataCache.resultDataPromise;
  studentDataCache.resultDataPromise = loadStudentResultData()
    .then((data) => {
      studentDataCache.resultData = data;
      studentDataCache.resultDataFetchedAt = Date.now();
      return data;
    })
    .finally(() => { studentDataCache.resultDataPromise = null; });
  return studentDataCache.resultDataPromise;
}

function leaderboardCacheKey(mode, value = "") {
  return `${mode}:${String(value || "")}`;
}

function leaderboardSnapshot(mode, value = "") {
  return studentDataCache.leaderboards.get(leaderboardCacheKey(mode, value)) || null;
}

function refreshStudentLeaderboard(mode, value = "", force = false) {
  if (!apiEnabled()) return Promise.resolve(null);
  const key = leaderboardCacheKey(mode, value);
  const fetchedAt = studentDataCache.leaderboardFetchedAt.get(key) || 0;
  if (!force && studentDataCache.leaderboards.has(key) && Date.now() - fetchedAt < STUDENT_CACHE_TTL) {
    return Promise.resolve(studentDataCache.leaderboards.get(key));
  }
  if (studentDataCache.leaderboardPromises.has(key)) return studentDataCache.leaderboardPromises.get(key);
  const filters = mode === "exam" ? { mode, examId: value } : { mode, subject: value };
  const request = window.CrosslineApi.leaderboard(filters)
    .then((payload) => {
      studentDataCache.leaderboards.set(key, payload);
      studentDataCache.leaderboardFetchedAt.set(key, Date.now());
      return payload;
    })
    .finally(() => { studentDataCache.leaderboardPromises.delete(key); });
  studentDataCache.leaderboardPromises.set(key, request);
  return request;
}

function questionTaxonomy(question = {}) {
  const subject = normalizeExamSubjectValue(question.subject) || String(question.subject || "General practice").trim() || "General practice";
  const topic = classifyOfficialTopic(subject, question.chapter || question.topic, `${question.topic || ""} ${question.text || ""}`);
  const fallback = String(question.topic || question.chapter || question.subject || "General practice").trim() || "General practice";
  const official = topic || fallback;
  return {
    subject,
    chapter: official,
    topic: official
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
    const key = [taxonomy.subject, taxonomy.topic].join("\u001f");
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
  return rows.map((stat) => `<div class="dash-weakness-row"><span>${escapeHtml(stat.topic)}<small>${escapeHtml(stat.subject)} · ${stat.correct}/${stat.total}</small></span><b class="number-font">${stat.weakness}%</b><i style="--w:${stat.weakness}%"></i></div>`).join("");
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
  return trends.map(({ subject, points }) => {
    const latestScore = points.at(-1)?.score ?? 0;
    const bars = points.map((point, index) => {
      const attemptLabel = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"][index] || `Attempt ${index + 1}`;
      return `<button class="subject-trend-point" data-result-id="${escapeHtml(point.resultId)}" data-score="${point.score}" style="--score:${Math.max(6, point.score)}%" aria-label="${escapeHtml(`${attemptLabel} attempt, ${point.examTitle}: ${point.score}%`)}"><span class="subject-trend-bar" aria-hidden="true"></span><small>${escapeHtml(attemptLabel)}</small><em class="subject-trend-tooltip" aria-hidden="true">${point.score}%</em></button>`;
    }).join("");
    return `<article class="dash-performance subject-trend-card"><div class="dash-section-title"><div><span class="subject-trend-live"><i></i>Activity</span><h2>${escapeHtml(subject)}</h2><p>${points.length} ${points.length === 1 ? "attempt" : "attempts"}</p></div><strong class="number-font"><span data-subject-trend-value>${latestScore}</span><small>%</small></strong></div><div class="subject-trend-chart" style="--point-count:${points.length}" aria-label="${escapeHtml(subject)} score history">${bars}</div></article>`;
  }).join("");
}

function bindSubjectTrendInteractions() {
  document.querySelectorAll(".subject-trend-chart").forEach((chart) => {
    const points = [...chart.querySelectorAll(".subject-trend-point")];
    const value = chart.closest(".subject-trend-card")?.querySelector("[data-subject-trend-value]");
    const latest = points.at(-1)?.dataset.score || "0";
    const setHovered = (hoveredIndex = null) => {
      points.forEach((point, index) => {
        point.classList.toggle("is-hovered", index === hoveredIndex);
        point.classList.toggle("is-neighbor", hoveredIndex !== null && Math.abs(index - hoveredIndex) === 1);
        point.classList.toggle("is-dimmed", hoveredIndex !== null && Math.abs(index - hoveredIndex) > 1);
      });
      chart.closest(".subject-trend-card")?.classList.toggle("is-hovering", hoveredIndex !== null);
      if (value) value.textContent = hoveredIndex === null ? latest : points[hoveredIndex].dataset.score;
    };
    points.forEach((point, index) => {
      point.addEventListener("mouseenter", () => setHovered(index));
      point.addEventListener("focus", () => setHovered(index));
    });
    chart.addEventListener("mouseleave", () => setHovered());
    chart.addEventListener("focusout", (event) => {
      if (!chart.contains(event.relatedTarget)) setHovered();
    });
  });
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
        <button id="side-pricing">${uiIcon("badge-check")}<span>Pricing</span></button>
        <button id="side-settings">${uiIcon("settings")}<span>Settings</span></button>
      </nav>
      <article class="dash-sidebar-note">
        <b>Stay consistent.</b>
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
          <h1>Good morning, ${escapeHtml(name)}!</h1>
          <p>Ready for your next exam?</p>
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
          <h2>Start your next exam</h2>
        </div>
        <button id="start-exam-dashboard" class="dash-start-button">Start Exam ${uiIcon("chevron-right")}</button>
        <div class="dash-start-paper" aria-hidden="true"></div>
      </section>

      <section class="dash-metrics" aria-label="Performance overview">
        <article class="dash-metric dash-metric-red"><i>${uiIcon("trophy")}</i><h3>Latest score</h3><strong class="number-font">${escapeHtml(latestPercent)}</strong><p>${mathHtml(latestTitle)}</p><em>${leaderboard?.own ? `Rank #${leaderboard.own.rank}` : "No rank yet"}</em></article>
        <article class="dash-metric dash-metric-orange"><i>${uiIcon("trending-up")}</i><h3>Improvement</h3><strong class="number-font">${escapeHtml(improvement)}</strong><p>Last 5 exams</p></article>
        <article class="dash-metric dash-metric-purple"><i>${uiIcon("file-text")}</i><h3>Attempts</h3><strong class="number-font">${attemptedCount}</strong><p>This month: ${summary.thisMonthCount}</p></article>
        <article class="dash-metric dash-metric-green"><i>${uiIcon("badge-check")}</i><h3>Average</h3><strong class="number-font">${average}%</strong><p>All exams</p></article>
      </section>

      <section class="dash-insights">
        <article class="dash-card"><div class="dash-card-head"><i>${uiIcon("target")}</i><div><h3>Biggest Weaknesses</h3></div></div><div class="dash-weakness">${dashboardWeaknessBars(details)}</div><button id="view-results-dashboard">View analysis ${uiIcon("chevron-right")}</button></article>
        <article class="dash-card"><div class="dash-card-head"><i>${uiIcon("play")}</i><div><h3>Last Skipped</h3></div></div>${dashboardQuestionSnippet(details, "skipped")}<button id="review-skipped-dashboard" ${skippedMatch ? `data-result-id="${escapeHtml(skippedMatch.resultId)}" data-question-id="${escapeHtml(skippedMatch.id)}"` : "disabled"}>Review ${uiIcon("chevron-right")}</button></article>
        <article class="dash-card dash-wrong-card"><div class="dash-card-head"><i>${uiIcon("circle-x")}</i><div><h3>Last Wrong</h3></div></div>${dashboardQuestionSnippet(details, "wrong")}<button id="review-wrong-dashboard" ${wrongMatch ? `data-result-id="${escapeHtml(wrongMatch.resultId)}" data-question-id="${escapeHtml(wrongMatch.id)}"` : "disabled"}>Review ${uiIcon("chevron-right")}</button></article>
        <article class="dash-card dash-results-card"><div class="dash-card-head"><i>${uiIcon("bar-chart-3")}</i><div><h3>Results</h3></div></div><button id="dash-results-cta">View results ${uiIcon("chevron-right")}</button><div class="dash-mini-bars" aria-hidden="true"><span></span><span></span><span></span><span></span></div></article>
      </section>

      <section class="dash-subject-graphs" aria-label="Subject performance graphs">${dashboardSubjectGraphs(details)}</section>
    </section>
  </main>`;
}

function renderStudentDashboardView(message, data, leaderboard) {
  const profile = getStudentProfile();
  const name = displayName();
  const results = data.results || [];
  const details = data.details || [];
  const summary = summarizeResults(results, details);
  const latestPercent = summary.latest ? `${resultPercent(summary.latest)}%` : "--";
  app.innerHTML = showDashboardAppLayout({ profile, name, results, details, summary, latestPercent, leaderboard, message });
  bind("logout", "click", requestStudentLogout);
  bind("side-start-exams", "click", showExamList);
  bind("side-results", "click", showStudentResults);
  bind("side-weakness", "click", showWeaknessAnalysis);
  bind("side-leaderboard", "click", showLeaderboard);
  bind("side-pricing", "click", showPricing);
  bind("side-settings", "click", showStudentSettings);
  bind("start-exam-dashboard", "click", showExamList);
  bind("view-results-dashboard", "click", showWeaknessAnalysis);
  bind("dash-results-cta", "click", showStudentResults);
  bind("dashboard-notifications", "click", toggleNotificationPopover);
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
  bindSubjectTrendInteractions();
  bindDesktopExit({ updates: true });
  renderMath();
}

async function showStudentDashboard(message = "", options = {}) {
  leaveKiosk();
  message = typeof message === "string" ? message : "";
  const revision = beginStudentView("dashboard");
  const emptyBoard = { entries: [], own: null, participantCount: 0 };
  let data = studentResultSnapshot();
  let summary = summarizeResults(data.results || [], data.details || []);
  let leaderboard = leaderboardSnapshot("exam", summary.latest?.examId || "") || emptyBoard;
  if (options.loading && !studentDataCache.resultData) {
    showClientLoading("Preparing your dashboard");
    bindDesktopExit({ updates: true });
    data = await refreshStudentResultData().catch(() => data);
    summary = summarizeResults(data.results || [], data.details || []);
    leaderboard = await refreshStudentLeaderboard("exam", summary.latest?.examId || "").catch(() => leaderboard) || leaderboard;
    void refreshStudentLeaderboard("average", "").catch(() => null);
    if (isCurrentStudentView("dashboard", revision)) renderStudentDashboardView(message, data, leaderboard);
    return;
  }
  renderStudentDashboardView(message, data, leaderboard);
  void refreshStudentResultData().then(async (freshData) => {
    const freshSummary = summarizeResults(freshData.results || [], freshData.details || []);
    const [freshBoard] = await Promise.all([
      refreshStudentLeaderboard("exam", freshSummary.latest?.examId || "").catch(() => leaderboard),
      refreshStudentLeaderboard("average", "").catch(() => null)
    ]);
    const resolvedBoard = freshBoard || leaderboard;
    if (isCurrentStudentView("dashboard", revision) && (freshData !== data || resolvedBoard !== leaderboard)) {
      renderStudentDashboardView(message, freshData, resolvedBoard);
    }
  }).catch(() => {});
}

function studentAvatarMarkup(profile = getStudentProfile()) {
  const photo = profile.photo || currentUser?.avatarUrl || "";
  return photo ? `<img src="${escapeHtml(photo)}" alt="Profile photo" />` : `<span>${escapeHtml(profileInitials())}</span>`;
}

function studentPageShell({ active = "dashboard", title, subtitle = "", content = "", action = "" }) {
  const name = displayName();
  const nav = [
    ["dashboard", "house", "Dashboard"], ["exams", "clipboard-list", "Exams"], ["results", "bar-chart-3", "Results"],
    ["weakness", "target", "Weakness Analysis"], ["leaderboard", "trophy", "Leaderboard"], ["pricing", "badge-check", "Pricing"], ["settings", "settings", "Settings"]
  ];
  return `<main class="dash-shell">
    <aside class="dash-sidebar"><div class="dash-logo"><img src="assets/crossline-icon.png" alt="" /><strong>Cross-Line</strong><span>Education</span></div>
      <nav class="dash-side-nav" aria-label="Student dashboard">${nav.map(([id, icon, label]) => `<button id="side-${id}" class="${active === id ? "active" : ""}">${uiIcon(icon)}<span>${label}</span></button>`).join("")}</nav>
      <article class="dash-sidebar-note"><b>Stay consistent.</b><i></i></article>
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
  bind("side-pricing", "click", showPricing);
  bind("side-settings", "click", showStudentSettings);
  bind("logout", "click", requestStudentLogout);
  bind("open-profile-settings", "click", showStudentSettings);
  bind("dashboard-notifications", "click", toggleNotificationPopover);
  void hydrateNotificationBadge();
}

async function hydrateNotificationBadge() {
  const localUnread = localNotifications().filter((item) => !item.readAt).length;
  const applyCount = (remoteUnread) => {
    const badge = document.getElementById("notification-count");
    const unread = Number(remoteUnread || 0) + localUnread;
    if (!badge) return;
    if (!unread) { badge.classList.add("hidden"); badge.textContent = ""; return; }
    badge.textContent = String(unread);
    badge.classList.remove("hidden");
  };
  if (!apiEnabled()) return applyCount(0);
  if (studentDataCache.notificationCount !== null) applyCount(studentDataCache.notificationCount);
  if (studentDataCache.notificationCount !== null && Date.now() - studentDataCache.notificationFetchedAt < STUDENT_CACHE_TTL) return;
  if (!studentDataCache.notificationPromise) {
    studentDataCache.notificationPromise = window.CrosslineApi.notifications()
      .then((payload) => {
        studentDataCache.notificationCount = Number(payload.unread || 0);
        studentDataCache.notificationFetchedAt = Date.now();
        return studentDataCache.notificationCount;
      })
      .finally(() => { studentDataCache.notificationPromise = null; });
  }
  try { applyCount(await studentDataCache.notificationPromise); } catch {}
}

function localPlanPayload() {
  return { plans: ACCESS_PLANS, plan: null, usage: { mockLimit: 0, mocksUsed: 0, mocksRemaining: 0 }, paymentEnabled: false };
}

function renderPricing(payload = localPlanPayload(), message = "") {
  const currentPlan = payload.plan || null;
  const plans = payload.plans?.length ? payload.plans : ACCESS_PLANS;
  const cards = landingPricingCardsHtml({ appContext: true, currentPlan, plans });
  const content = `<div class="cx-landing pricing-app"><section class="cx-price-grid cx-price-grid-three">${cards}</section><p id="pricing-action-message" class="pricing-action-message form-message" aria-live="polite">${escapeHtml(message)}</p></div>`;
  app.innerHTML = studentPageShell({ active: "pricing", title: "Pricing", subtitle: "Start free with one practice exam and the past-paper library, then upgrade for more simulated exams.", content });
  bindStudentShell();
  const pricingRoot = document.querySelector(".pricing-app");
  wirePricingSubjectCards(pricingRoot);
  wireMagneticButtons(pricingRoot);
  pricingRoot?.querySelectorAll("[data-pricing-plan]").forEach((button) => button.addEventListener("click", () => {
    const plan = plans.find((item) => item.id === button.dataset.pricingPlan);
    if (!plan) return;
    if (plan.free) return showExamList();
    const card = button.closest("[data-subject-card]");
    const subjects = Number(card?.querySelector(".cx-price-tier.is-active")?.dataset.subjects || 1);
    const status = document.getElementById("pricing-action-message");
    if (status) status.textContent = `Checkout for ${plan.name} (${subjects} ${subjects === 1 ? "subject" : "subjects"}) will be available soon.`;
  }));
}

async function showPricing(message = "") {
  message = typeof message === "string" ? message : "";
  const revision = beginStudentView("pricing");
  renderPricing(studentDataCache.planData || localPlanPayload(), message);
  if (!apiEnabled()) return;
  if (studentDataCache.planData && Date.now() - studentDataCache.planFetchedAt < STUDENT_CACHE_TTL) return;
  if (!studentDataCache.planPromise) {
    studentDataCache.planPromise = window.CrosslineApi.plans()
      .then((payload) => {
        studentDataCache.planData = payload;
        studentDataCache.planFetchedAt = Date.now();
        return payload;
      })
      .finally(() => { studentDataCache.planPromise = null; });
  }
  try {
    const payload = await studentDataCache.planPromise;
    if (isCurrentStudentView("pricing", revision)) renderPricing(payload, message);
  } catch (error) {
    if (isCurrentStudentView("pricing", revision)) renderPricing(studentDataCache.planData || localPlanPayload(), error.message || "Package status could not be refreshed.");
  }
}

function renderExamList(message = "") {
  message = typeof message === "string" ? message : "";
  const subject = selectedExamSubject === "__unassigned__" ? "__unassigned__" : normalizeExamSubjectValue(selectedExamSubject);
  if (!subject) {
    const counts = Object.fromEntries(EXAM_SUBJECTS.map((name) => [name, exams.filter((exam) => normalizeExamSubjectValue(exam.subject) === name).length]));
    const unassignedCount = exams.filter((exam) => !normalizeExamSubjectValue(exam.subject)).length;
    const subjectIcons = { Physics: "atom", Chemistry: "flask-conical", Mathematics: "calculator", "Academic Chinese": "languages" };
    const cards = EXAM_SUBJECTS.map((name) => `<article class="dash-page-card subject-choice-card"><span class="subject-choice-icon">${uiIcon(subjectIcons[name])}</span><div><h2>${escapeHtml(name)}</h2><p class="subject-exam-count number-font">${counts[name]} exam${counts[name] === 1 ? "" : "s"}</p></div><button class="dash-outline-button choose-subject" data-subject="${escapeHtml(name)}">View ${uiIcon("chevron-right")}</button></article>`).join("");
    const unassignedCard = unassignedCount ? `<article class="dash-page-card subject-choice-card"><span class="subject-choice-icon">${uiIcon("file-text")}</span><div><h2>Unassigned</h2><p class="subject-exam-count number-font">${unassignedCount} exam${unassignedCount === 1 ? "" : "s"}</p></div><button class="dash-outline-button choose-subject" data-subject="__unassigned__">View ${uiIcon("chevron-right")}</button></article>` : "";
    const content = `${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}<section class="dash-page-grid subject-choice-grid">${cards}${unassignedCard}</section>`;
    app.innerHTML = studentPageShell({ active: "exams", title: "Choose a subject", subtitle: "Select a subject.", content });
    bindStudentShell();
    document.querySelectorAll(".choose-subject").forEach((button) => button.addEventListener("click", () => {
      selectedExamSubject = button.dataset.subject;
      save("csca-exam-subject", selectedExamSubject);
      showExamList();
    }));
    return;
  }
  const filtered = subject === "__unassigned__"
    ? exams.filter((exam) => !normalizeExamSubjectValue(exam.subject))
    : exams.filter((exam) => normalizeExamSubjectValue(exam.subject) === subject);
  const subjectLabel = subject === "__unassigned__" ? "Unassigned" : subject;
  const examCardHtml = (exam) => {
    const canStart = exam.canStart !== false;
    const lockedLabel = exam.limitReached ? "Attempt limit reached" : "Package required";
    return `<article class="dash-page-card exam-choice-card ${canStart ? "" : "locked"}"><div><div class="exam-title-row"><p class="dash-card-kicker">${escapeHtml(subjectLabel)}</p></div><h2>${mathHtml(exam.title)}</h2><p>${mathHtml(exam.description)}</p><div class="exam-meta"><span>${exam.questions.length} questions</span><span>${exam.duration} minutes</span><span>${escapeHtml(formatExamAccess(exam))}</span></div>${canStart ? "" : `<p class="form-note">${escapeHtml(exam.accessReason || "This exam is not included in your current access package.")}</p>`}</div><button class="${canStart ? "dash-start-button begin-exam" : "dash-muted-button"}" data-id="${escapeHtml(exam.id)}" ${canStart ? "" : "disabled"}>${canStart ? `Begin attempt ${Number(exam.attemptsUsed || 0) + 1} ${uiIcon("chevron-right")}` : lockedLabel}</button></article>`;
  };
  const categorySections = EXAM_CATEGORIES.map((category) => {
    const list = filtered.filter((exam) => normalizeExamCategoryValue(exam.category) === category.id);
    if (!list.length) return "";
    return `<section class="exam-category-block"><div class="exam-category-heading"><p class="dash-card-kicker">Category</p><h3>${escapeHtml(category.label)}</h3></div><div class="dash-page-grid exam-page-grid">${list.map(examCardHtml).join("")}</div></section>`;
  }).join("");
  const examCards = filtered.length
    ? categorySections
    : `<article class="dash-page-card"><h2>No ${escapeHtml(subjectLabel)} exams yet</h2><p>Ask the Crossline team to publish a ${escapeHtml(subjectLabel)} practice paper, or choose another subject.</p></article>`;
  const content = `${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}<div class="subject-filter-bar"><div><p class="dash-card-kicker">Selected subject</p><h2>${escapeHtml(subjectLabel)}</h2></div><button id="change-exam-subject" class="dash-outline-button">Change subject</button></div>${examCards}`;
  app.innerHTML = studentPageShell({ active: "exams", title: `${subjectLabel} exams`, subtitle: "Official CSCA past papers and Cross-Line original exams are listed separately under this subject.", content });
  bindStudentShell();
  bind("change-exam-subject", "click", () => { selectedExamSubject = ""; save("csca-exam-subject", ""); showExamList(); });
  document.querySelectorAll(".begin-exam").forEach((button) => button.addEventListener("click", () => { currentExam = exams.find((exam) => exam.id === button.dataset.id); activeSessionId = null; preflight = { camera: false, microphone: false, network: false, face: false, phone: false, roomScan: false }; showEquipmentCheck(); }));
  renderMath();
}

function showExamList(message = "") {
  leaveKiosk();
  message = typeof message === "string" ? message : "";
  const revision = beginStudentView("exams");
  renderExamList(message);
  if (apiEnabled() && Date.now() - studentExamsFetchedAt >= STUDENT_CACHE_TTL) {
    void refreshExamsFromApi(false).then(() => {
      if (isCurrentStudentView("exams", revision)) renderExamList(message);
    }).catch(() => {});
  }
}

function renderStudentResults(results = [], message = "") {
  const content = `${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}<section class="dash-page-grid results-page-grid">${results.length ? results.map((result) => `<article class="dash-page-card result-choice-card"><div><p class="dash-card-kicker">${result.ready ? "Result" : "Finalizing result"}</p><h2>${mathHtml(result.examTitle)}</h2><p>${result.ready ? `Score ${formatScore(result.score?.earned)} / ${formatScore(result.score?.total)}` : "Your score is being finalized. Refresh in a moment."}</p><div class="exam-meta"><span>Submitted: ${escapeHtml(formatDateTime(result.submittedAt))}</span><span>${result.ready ? "Available now" : "Finalizing"}</span></div></div><button class="${result.ready ? "dash-outline-button" : "dash-muted-button"} view-result" data-id="${escapeHtml(result.id)}" ${result.ready ? "" : "disabled"}>${result.ready ? "View full result" : "Finalizing"}</button></article>`).join("") : `<article class="dash-page-card"><h2>No submitted mock results yet</h2><p>Your full score and answer review will appear immediately after you submit a mock.</p><button id="results-start-exam" class="dash-start-button">Choose an exam</button></article>`}</section>`;
  app.innerHTML = studentPageShell({ active: "results", title: "Your results", subtitle: "Review scores, every option you chose, correct answers, explanations, and marks.", content });
  bindStudentShell();
  bind("results-start-exam", "click", showExamList);
  document.querySelectorAll(".view-result").forEach((button) => button.addEventListener("click", () => showStudentResultDetail(button.dataset.id)));
  renderMath();
}

function showStudentResults(message = "") {
  leaveKiosk();
  message = typeof message === "string" ? message : "";
  const revision = beginStudentView("results");
  const snapshot = studentResultSnapshot();
  renderStudentResults(snapshot.results || [], message);
  void refreshStudentResultData().then((data) => {
    if (isCurrentStudentView("results", revision) && data !== snapshot) renderStudentResults(data.results || [], message);
  }).catch((error) => {
    if (isCurrentStudentView("results", revision)) renderStudentResults(snapshot.results || [], error.message || "Your results could not be refreshed.");
  });
}

function resultQuestionAnchor(questionId, prefix = "all") {
  return `result-question-${prefix}-${String(questionId || "question").replace(/[^a-z0-9_-]/gi, "-")}`;
}

async function showStudentResultDetail(resultId, focusQuestionId = "") {
  leaveKiosk();
  const revision = beginStudentView("result-detail");
  const cached = (studentResultSnapshot().details || []).find((detail) => (detail.result?.id || detail.id) === resultId);
  if (!cached) {
    app.innerHTML = studentPageShell({ active: "results", title: "Result review", subtitle: "Preparing your answers and explanations...", content: `<section class="dash-page-card"><p class="form-note">Preparing answer review...</p></section>` });
    bindStudentShell();
  }
  try {
    const payload = cached || (apiEnabled() ? await window.CrosslineApi.result(resultId) : getLocalResults().find((result) => result.id === resultId));
    if (!isCurrentStudentView("result-detail", revision)) return;
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
    if (isCurrentStudentView("result-detail", revision)) showStudentResults(error.message);
  }
}

function renderWeaknessAnalysis(details = []) {
  const stats = topicPerformance(details).filter((stat) => stat.wrong || stat.skipped);
  const content = stats.length ? `<section class="weakness-summary"><div><strong>${stats.length}</strong><span>topics need attention</span></div><div><strong>${stats.reduce((sum, stat) => sum + stat.wrong, 0)}</strong><span>incorrect answers</span></div><div><strong>${stats.reduce((sum, stat) => sum + stat.skipped, 0)}</strong><span>skipped answers</span></div></section><section class="subject-performance-list">${stats.map((stat, index) => `<article class="dash-page-card subject-performance-card"><div><p class="dash-card-kicker">${escapeHtml(stat.subject)}</p><h2>${escapeHtml(stat.topic)}</h2><p>${stat.correct} correct out of ${stat.total} · ${stat.wrong} incorrect · ${stat.skipped} skipped</p></div><div><div class="subject-meter"><i style="--score:${stat.accuracy}%"></i></div><small>${stat.accuracy}% accuracy</small></div><button class="dash-outline-button weakness-review" data-index="${index}">Review ${stat.wrong + stat.skipped} questions</button></article>`).join("")}</section>` : `<section class="dash-page-card"><h2>No weak topics yet</h2><p>Complete a mock to build topic-level analysis. If every released answer is correct, this page will stay clear.</p><button id="weakness-start-exam" class="dash-start-button">Choose an exam</button></section>`;
  app.innerHTML = studentPageShell({ active: "weakness", title: "Weakness analysis", subtitle: "Every topic is calculated from your real correct, incorrect, and skipped answers.", content });
  bindStudentShell();
  bind("weakness-start-exam", "click", showExamList);
  document.querySelectorAll(".weakness-review").forEach((button) => button.addEventListener("click", () => showWeaknessTopic(stats[Number(button.dataset.index)])));
  renderMath();
}

function showWeaknessAnalysis() {
  const revision = beginStudentView("weakness");
  const snapshot = studentResultSnapshot();
  renderWeaknessAnalysis(snapshot.details || []);
  void refreshStudentResultData().then((data) => {
    if (isCurrentStudentView("weakness", revision) && data !== snapshot) renderWeaknessAnalysis(data.details || []);
  }).catch(() => {});
}

function showWeaknessTopic(stat) {
  if (!stat) return showWeaknessAnalysis();
  beginStudentView("weakness-topic");
  const questions = stat.questions.filter((question) => question.correct !== true);
  const content = `<div class="dash-result-summary weakness-topic-summary"><div><p class="dash-card-kicker">${escapeHtml(stat.subject)}</p><h2>${escapeHtml(stat.topic)}</h2><p>${stat.correct} correct out of ${stat.total}. Review every mistake and skip below.</p></div><button id="back-weakness" class="dash-outline-button">Back to all topics</button></div><section class="dash-review-section"><h2>Mistakes and skipped questions</h2>${questions.map((question, index) => `<div class="weakness-question-wrap">${resultQuestionHtml(question, `topic-${index}`)}<button class="dash-outline-button open-question-result" data-result-id="${escapeHtml(question.resultId)}" data-question-id="${escapeHtml(question.id)}">Open in full result</button></div>`).join("")}</section>`;
  app.innerHTML = studentPageShell({ active: "weakness", title: stat.topic, subtitle: stat.subject, content });
  bindStudentShell();
  bind("back-weakness", "click", showWeaknessAnalysis);
  document.querySelectorAll(".open-question-result").forEach((button) => button.addEventListener("click", () => showStudentResultDetail(button.dataset.resultId, button.dataset.questionId)));
  renderMath();
}

function leaderboardTableHtml(payload, emptyMessage) {
  if (!payload?.entries?.length) return `<p class="dash-empty">${escapeHtml(emptyMessage)}</p>`;
  return `<ol class="leaderboard-table">${payload.entries.map((entry) => `<li class="${entry.isCurrentUser ? "current" : ""}"><b>#${entry.rank}</b><span>${escapeHtml(entry.name)}${payload.mode === "average" ? `<small>${entry.attempts} recent ${entry.attempts === 1 ? "exam" : "exams"}</small>` : ""}</span><strong>${entry.score}%</strong></li>`).join("")}</ol>`;
}

function renderLeaderboardPage(examBoard, averageBoard, examId = "", subject = "") {
  const filters = examBoard?.filters || averageBoard?.filters || { exams: [], subjects: [] };
  const content = examBoard || averageBoard ? `<section class="leaderboard-controls dash-page-card"><label>Exam leaderboard<select id="leaderboard-exam-filter">${filters.exams.map((exam) => `<option value="${escapeHtml(exam.id)}" ${exam.id === examBoard?.examId ? "selected" : ""}>${escapeHtml(exam.title)}</option>`).join("")}</select></label><label>Five-exam average subject<select id="leaderboard-subject-filter"><option value="">All subjects</option>${filters.subjects.map((item) => `<option value="${escapeHtml(item)}" ${item === (averageBoard?.subject === "All subjects" ? "" : averageBoard?.subject) ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></label></section><section class="leaderboard-board-grid"><article class="dash-page-card leaderboard-page-card"><div class="dash-section-title"><div><p class="dash-card-kicker">Latest attempt per student</p><h2>${escapeHtml(examBoard?.examTitle || "Exam leaderboard")}</h2><p>${examBoard?.own ? `Your rank is #${examBoard.own.rank} with ${examBoard.own.score}%.` : "Complete this exam to join its ranking."}</p></div><strong>${examBoard?.participantCount || 0} students</strong></div>${leaderboardTableHtml(examBoard, "No one has completed this exam yet.")}</article><article class="dash-page-card leaderboard-page-card"><div class="dash-section-title"><div><p class="dash-card-kicker">Last five average</p><h2>${escapeHtml(averageBoard?.subject || "All subjects")}</h2><p>${averageBoard?.own ? `Your average rank is #${averageBoard.own.rank} with ${averageBoard.own.score}%.` : "Complete released exams to join this ranking."}</p></div><strong>${averageBoard?.participantCount || 0} students</strong></div>${leaderboardTableHtml(averageBoard, "No eligible results are available for this subject yet.")}</article></section>` : `<section class="dash-page-card"><h2>The leaderboard is temporarily unavailable</h2><p>Try again after the exam service reconnects.</p></section>`;
  app.innerHTML = studentPageShell({ active: "leaderboard", title: "Live leaderboard", subtitle: "Compare each exam separately or rank the last five average by subject. Only shortened display names are shown.", content });
  bindStudentShell();
  bind("leaderboard-exam-filter", "change", (event) => showLeaderboard(event.target.value, subject));
  bind("leaderboard-subject-filter", "change", (event) => showLeaderboard(examBoard?.examId || examId, event.target.value));
}

function showLeaderboard(examId = "", subject = "") {
  examId = typeof examId === "string" ? examId : "";
  subject = typeof subject === "string" ? subject : "";
  const revision = beginStudentView("leaderboard");
  const resultSnapshot = studentResultSnapshot();
  const latestExamId = summarizeResults(resultSnapshot.results || [], resultSnapshot.details || []).latest?.examId || "";
  const examSnapshot = leaderboardSnapshot("exam", examId) || (!examId ? leaderboardSnapshot("exam", latestExamId) : null);
  const averageSnapshot = leaderboardSnapshot("average", subject);
  renderLeaderboardPage(examSnapshot, averageSnapshot, examId, subject);
  if (!apiEnabled()) return;
  void Promise.all([
    refreshStudentLeaderboard("exam", examId).catch(() => examSnapshot),
    refreshStudentLeaderboard("average", subject).catch(() => averageSnapshot)
  ]).then(([examBoard, averageBoard]) => {
    if (isCurrentStudentView("leaderboard", revision) && (examBoard !== examSnapshot || averageBoard !== averageSnapshot)) {
      renderLeaderboardPage(examBoard, averageBoard, examId, subject);
    }
  });
}

function notificationItemHtml(item) {
  const kind = String(item.kind || "info").toLowerCase();
  const icon = kind === "result" ? "bar-chart-3" : kind === "exam" ? "clipboard-list" : kind === "update" ? "download" : "bell";
  const archived = Boolean(item.archivedAt);
  const unread = Boolean(item.wasUnread);
  const archiveAction = item.transient ? "" : `<button class="notification-archive-action" data-notification-id="${escapeHtml(item.id)}" data-local="${String(item.id).startsWith("update-") ? "1" : "0"}" data-archived="${archived ? "1" : "0"}" title="${archived ? "Restore" : "Archive"}" aria-label="${archived ? "Restore" : "Archive"} ${escapeHtml(item.title)}">${uiIcon("archive")}</button>`;
  const updateAction = item.transient ? `<button class="notification-update-action" data-update-action="1">${updateState.kind === "ready" ? "Restart and install" : "Update now"}</button>` : "";
  return `<article class="notification-popover-item ${unread ? "unread" : ""}" data-notification-id="${escapeHtml(item.id)}"><span class="notification-popover-icon">${uiIcon(icon)}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><small>${escapeHtml(formatDateTime(item.createdAt))}</small>${updateAction}</div>${archiveAction}</article>`;
}

function closeNotificationPopover() {
  document.getElementById("notification-popover")?.remove();
  document.removeEventListener("keydown", closeNotificationOnEscape);
}

function closeNotificationOnEscape(event) {
  if (event.key === "Escape") closeNotificationPopover();
}

async function toggleNotificationPopover(event) {
  if (document.getElementById("notification-popover")) return closeNotificationPopover();
  const trigger = event?.currentTarget || document.getElementById("dashboard-notifications");
  const panel = document.createElement("section");
  panel.id = "notification-popover";
  panel.className = "notification-popover";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Notifications");
  panel.innerHTML = `<header><div><strong>Notifications</strong><small>New notifications are marked read when you open this panel.</small></div><button id="close-notification-popover" aria-label="Close">×</button></header><nav aria-label="Notification filters"><button class="active" data-notification-filter="all">All</button><button data-notification-filter="unread">Unread</button><button data-notification-filter="archived">Archived</button></nav><div class="notification-popover-list"><p class="notification-popover-empty">Loading notifications...</p></div>`;
  document.body.appendChild(panel);
  const rect = trigger?.getBoundingClientRect?.();
  if (rect) {
    panel.style.setProperty("--notification-top", `${Math.min(window.innerHeight - 20, rect.bottom + 10)}px`);
    panel.style.setProperty("--notification-right", `${Math.max(12, window.innerWidth - rect.right)}px`);
  }
  bind("close-notification-popover", "click", closeNotificationPopover);
  document.addEventListener("keydown", closeNotificationOnEscape);
  const badge = document.getElementById("notification-count");
  badge?.classList.add("hidden");
  studentDataCache.notificationCount = 0;
  studentDataCache.notificationFetchedAt = Date.now();
  const localBeforeRead = localNotifications();
  saveLocalNotifications(localBeforeRead.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
  const payload = apiEnabled() ? await window.CrosslineApi.notifications().catch(() => ({ notifications: [] })) : { notifications: [] };
  if (apiEnabled()) void window.CrosslineApi.markAllNotificationsRead().catch(() => {});
  const notifications = [...localBeforeRead, ...(payload.notifications || [])].map((item) => ({ ...item, wasUnread: !item.readAt && !item.archivedAt })).sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
  if (["available", "ready"].includes(updateState.kind) && !notifications.some((item) => String(item.id).startsWith("update-") && !item.archivedAt)) notifications.unshift({ id: "current-update", kind: "update", title: updateState.kind === "ready" ? "Update ready to install" : "A new app update is available", body: updateState.message, createdAt: new Date().toISOString(), transient: true, wasUnread: false });
  const list = panel.querySelector(".notification-popover-list");
  if (!list) return;
  let activeFilter = "all";
  const renderList = () => {
    const visible = notifications.filter((item) => activeFilter === "archived" ? item.archivedAt : activeFilter === "unread" ? item.wasUnread && !item.archivedAt : !item.archivedAt);
    const emptyCopy = activeFilter === "archived" ? ["No archived notifications", "Archived items will remain available here."] : activeFilter === "unread" ? ["No unread notifications", "You have seen every new update."] : ["You are all caught up", "Exam results and important Crossline updates will appear here."];
    list.innerHTML = visible.length ? visible.map(notificationItemHtml).join("") : `<div class="notification-popover-empty"><span>${uiIcon(activeFilter === "archived" ? "archive" : "bell")}</span><strong>${emptyCopy[0]}</strong><p>${emptyCopy[1]}</p></div>`;
    list.querySelectorAll(".notification-archive-action").forEach((button) => button.addEventListener("click", async () => {
      const item = notifications.find((candidate) => candidate.id === button.dataset.notificationId);
      if (!item) return;
      const archived = button.dataset.archived !== "1";
      item.archivedAt = archived ? new Date().toISOString() : null;
      item.wasUnread = false;
      if (button.dataset.local === "1") setLocalNotificationArchived(item.id, archived);
      else if (apiEnabled()) await (archived ? window.CrosslineApi.archiveNotification(item.id) : window.CrosslineApi.unarchiveNotification(item.id)).catch(() => {});
      renderList();
    }));
    const updateButton = list.querySelector("[data-update-action]");
    updateButton?.addEventListener("click", () => { closeNotificationPopover(); return updateState.kind === "ready" ? restartUpdateNow() : installUpdateNow(); });
  };
  panel.querySelectorAll("[data-notification-filter]").forEach((button) => button.addEventListener("click", () => {
    activeFilter = button.dataset.notificationFilter;
    panel.querySelectorAll("[data-notification-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderList();
  }));
  renderList();
}

function showStudentSettings(message = "", section = activeSettingsSection) {
  beginStudentView("settings");
  message = typeof message === "string" ? message : "";
  const profile = getStudentProfile();
  const desktop = isDesktopClient();
  const admin = Boolean(currentUser?.isAdmin);
  const sections = ["profile", ...(desktop ? ["updates"] : []), "support", ...(admin ? ["admin"] : [])];
  activeSettingsSection = sections.includes(section) ? section : "profile";
  const active = (name) => activeSettingsSection === name;
  const firstName = currentUser?.firstName || currentUser?.first_name || "";
  const lastName = currentUser?.lastName || currentUser?.last_name || "";
  const email = currentUser?.email || "Student account";
  const settingsNavButton = (name, icon, label, badge = "") => `<button type="button" class="settings-nav-item ${active(name) ? "active" : ""}" data-settings-target="${name}" aria-current="${active(name) ? "page" : "false"}">${uiIcon(icon)}<span>${label}</span>${badge ? `<small ${name === "updates" ? "data-settings-version" : ""}>${badge}</small>` : ""}</button>`;
  const sectionHead = (name, title, copy) => `<header class="settings-detail-head"><p><button type="button" data-settings-target="profile">Settings</button><span>/</span>${escapeHtml(name)}</p><h2>${escapeHtml(title)}</h2><span>${escapeHtml(copy)}</span></header>`;
  const profileSection = `<section class="settings-section ${active("profile") ? "active" : ""}" data-settings-section="profile" ${active("profile") ? "" : "hidden"}>${sectionHead("Profile", "Profile", "Your name and username appear on the dashboard, results, and leaderboard.")}<form id="student-settings-form" class="settings-profile-form"><div class="settings-list-card"><div class="settings-photo-row"><label class="settings-avatar-picker" for="settings-avatar"><span id="settings-avatar-preview">${studentAvatarMarkup(profile)}</span><input id="settings-avatar" type="file" accept="image/*" /></label><div><b>Profile photo</b><small>JPG or PNG. Shown on your dashboard and leaderboard entry.</small></div><label class="settings-row-action" for="settings-avatar">${uiIcon("upload")}<span>Change</span></label></div><label class="settings-list-row" for="settings-first-name"><span class="settings-row-icon">${uiIcon("user")}</span><span class="settings-row-copy"><b>First name</b><small>Used on results and emails</small></span><input id="settings-first-name" value="${escapeHtml(firstName)}" required /></label><label class="settings-list-row" for="settings-last-name"><span class="settings-row-icon">${uiIcon("user")}</span><span class="settings-row-copy"><b>Last name</b><small>Used on result emails</small></span><input id="settings-last-name" value="${escapeHtml(lastName)}" required /></label><label class="settings-list-row" for="settings-username"><span class="settings-row-icon">${uiIcon("circle-user-round")}</span><span class="settings-row-copy"><b>Username</b><small>Shown publicly on the leaderboard</small></span><input id="settings-username" maxlength="40" value="${escapeHtml(currentUser?.username || "")}" required /></label><div class="settings-list-row"><span class="settings-row-icon">${uiIcon("circle-user-round")}</span><span class="settings-row-copy"><b>Email address</b><small>Used to sign in. Contact an administrator to change it.</small></span><span class="settings-static-value">${escapeHtml(email)}</span></div></div><p class="form-message settings-form-message">${escapeHtml(message)}</p><div class="settings-save-bar"><button class="dash-start-button">Save profile</button><span>Changes apply across your dashboard and results.</span></div></form></section>`;
  const updatesSection = desktop ? `<section class="settings-section ${active("updates") ? "active" : ""}" data-settings-section="updates" ${active("updates") ? "" : "hidden"}>${sectionHead("Updates", "Windows app updates", "Updates are verified before installation. Reset an interrupted download here.")}<div class="settings-list-card"><div class="settings-list-row"><span class="settings-row-icon">${uiIcon("badge-check")}</span><span class="settings-row-copy"><b>Current version</b><small>Installed Crossline Windows client</small></span><span class="settings-status-pill" data-settings-version>Checking...</span></div><div class="settings-list-row"><span class="settings-row-icon">${uiIcon("download")}</span><span class="settings-row-copy"><b>Check for updates</b><small>Compare this app with the latest available version</small></span><button id="settings-check-updates" type="button" class="settings-row-action">Check now ${uiIcon("chevron-right")}</button></div><div class="settings-list-row"><span class="settings-row-icon">${uiIcon("settings")}</span><span class="settings-row-copy"><b>Auto-update</b><small>Download verified updates automatically</small></span><button id="settings-auto-update" type="button" class="settings-toggle ${autoUpdateEnabled() ? "" : "off"}" role="switch" aria-checked="${autoUpdateEnabled() ? "true" : "false"}" aria-label="Auto-update"><i></i></button></div><div class="settings-list-row"><span class="settings-row-icon">${uiIcon("circle-x")}</span><span class="settings-row-copy"><b>Reset download</b><small>Clear a stuck or interrupted update</small></span><button id="settings-reset-update" type="button" class="settings-row-action">Reset</button></div></div></section>` : "";
  const supportSection = `<section class="settings-section ${active("support") ? "active" : ""}" data-settings-section="support" ${active("support") ? "" : "hidden"}>${sectionHead("Report a bug", "Report a bug", "Tell us what happened and how to reproduce it. We read every report.")}<form id="student-bug-report-form" class="settings-bug-form"><div class="settings-bug-grid"><label class="auth-field"><span>Category</span><select id="bug-category"><option value="app">App</option><option value="exam">Exam content</option><option value="camera">Camera or setup</option><option value="account">Account</option><option value="other">Other</option></select></label><label class="auth-field"><span>Short title</span><input id="bug-title" maxlength="120" placeholder="What went wrong?" required /></label></div><label class="auth-field"><span>Details</span><textarea id="bug-details" maxlength="4000" rows="6" placeholder="What did you do, what happened, and what did you expect?" required></textarea></label><div class="settings-save-bar"><button id="submit-bug-report" class="dash-start-button">Send report</button><p id="bug-report-message" class="form-message" aria-live="polite"></p></div></form></section>`;
  const adminSection = admin ? `<section class="settings-section ${active("admin") ? "active" : ""}" data-settings-section="admin" ${active("admin") ? "" : "hidden"}>${sectionHead("Admin & 2FA", "Administrator security", "Privileged access uses your student account plus a six-digit authenticator code.")}<div class="settings-list-card"><div class="settings-list-row"><span class="settings-row-icon">${uiIcon("badge-check")}</span><span class="settings-row-copy"><b>Two-factor authentication</b><small>Required before privileged controls open</small></span><span class="settings-status-pill">Protected</span></div><div class="settings-list-row"><span class="settings-row-icon">${uiIcon("settings")}</span><span class="settings-row-copy"><b>Admin panel</b><small>Manage exams, access, plans, reports, and security</small></span><button id="open-admin-panel" type="button" class="settings-row-action">Open panel ${uiIcon("chevron-right")}</button></div></div></section>` : "";
  const content = `<div class="settings-split-layout"><aside class="settings-section-nav"><div class="settings-section-nav-scroll"><h3>Account</h3>${settingsNavButton("profile", "circle-user-round", "Profile")}${desktop ? settingsNavButton("updates", "download", "Updates") : ""}<h3>Help &amp; security</h3>${settingsNavButton("support", "circle-x", "Report a bug")}${admin ? settingsNavButton("admin", "badge-check", "Admin & 2FA") : ""}</div></aside><div class="settings-detail">${profileSection}${updatesSection}${supportSection}${adminSection}</div></div>`;
  app.innerHTML = studentPageShell({ active: "settings", title: "Settings", subtitle: "Profile, updates, and support.", content });
  bindStudentShell();
  const selectSettingsSection = (name) => {
    if (!sections.includes(name)) return;
    activeSettingsSection = name;
    document.querySelectorAll("[data-settings-target]").forEach((button) => {
      const selected = button.dataset.settingsTarget === name;
      button.classList.toggle("active", selected);
      if (button.classList.contains("settings-nav-item")) button.setAttribute("aria-current", selected ? "page" : "false");
    });
    document.querySelectorAll("[data-settings-section]").forEach((panel) => {
      const selected = panel.dataset.settingsSection === name;
      panel.hidden = !selected;
      panel.classList.toggle("active", selected);
    });
  };
  document.querySelectorAll("[data-settings-target]").forEach((button) => button.addEventListener("click", () => selectSettingsSection(button.dataset.settingsTarget)));
  let nextPhoto = profile.photo || currentUser?.avatarUrl || "";
  let photoChanged = false;
  bind("settings-avatar", "change", async (event) => { nextPhoto = await readProfilePhoto(event.target.files?.[0]); photoChanged = Boolean(nextPhoto); const preview = document.getElementById("settings-avatar-preview"); if (preview && nextPhoto) preview.innerHTML = `<img src="${escapeHtml(nextPhoto)}" alt="Profile photo" />`; });
  bind("settings-check-updates", "click", () => checkForUpdates(true));
  bind("settings-reset-update", "click", resetUpdateNow);
  bind("settings-auto-update", "click", () => { setAutoUpdateEnabled(!autoUpdateEnabled()); showStudentSettings("", "updates"); });
  bind("open-admin-panel", "click", showAdminAccessGate);
  bind("student-settings-form", "submit", async (event) => { event.preventDefault(); const next = { username: document.getElementById("settings-username").value.trim(), firstName: document.getElementById("settings-first-name").value.trim(), lastName: document.getElementById("settings-last-name").value.trim(), ...(photoChanged ? { avatarUrl: nextPhoto } : {}) }; try { if (apiEnabled()) { const payload = await window.CrosslineApi.updateProfile(next); currentUser = payload.user; } else { currentUser = { ...currentUser, ...next }; users = users.map((user) => user.email === currentUser.email ? currentUser : user); save("csca-users", users); } saveStudentProfile({ ...getStudentProfile(), photo: nextPhoto }); showStudentSettings("Profile saved.", "profile"); } catch (error) { showStudentSettings(error.message || "Your profile could not be saved.", "profile"); } });
  if (desktop && window.examRuntime?.getInfo) {
    void Promise.resolve(window.examRuntime.getInfo()).then((info) => {
      const version = String(info?.version || "").trim();
      document.querySelectorAll("[data-settings-version]").forEach((label) => { label.textContent = version ? `v${version.replace(/^v/, "")}` : "Windows"; });
    }).catch(() => {});
  }
  bind("student-bug-report-form", "submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = document.getElementById("submit-bug-report");
    const status = document.getElementById("bug-report-message");
    const report = { category: document.getElementById("bug-category").value, title: document.getElementById("bug-title").value.trim(), details: document.getElementById("bug-details").value.trim(), context: "Student settings", appVersion: "" };
    if (report.title.length < 4 || report.details.length < 10) { status.textContent = "Add a short title and a little more detail."; return; }
    button.disabled = true;
    button.textContent = "Sending...";
    status.textContent = "Sending your report...";
    try {
      const runtimeInfo = window.examRuntime?.getInfo ? await window.examRuntime.getInfo().catch(() => null) : null;
      report.appVersion = String(runtimeInfo?.version || "");
      if (apiEnabled()) await window.CrosslineApi.reportBug(report);
      else save("csca-local-bug-reports", [...load("csca-local-bug-reports", []), { ...report, id: `local-${Date.now()}`, createdAt: new Date().toISOString(), status: "open" }]);
      form.reset();
      status.textContent = "Report sent. Thank you for helping us improve Crossline.";
    } catch (error) {
      status.textContent = error.message || "The report could not be sent. Please try again.";
    } finally {
      button.disabled = false;
      button.textContent = "Send report";
    }
  });
}

async function showAdminAccessGate(message = "") {
  if (!apiEnabled()) return showStudentSettings("Administrator MFA requires the production API.");
  app.innerHTML = studentPageShell({ active: "settings", title: "Administrator security", subtitle: "Verify your identity before opening privileged controls.", content: `<section class="dash-page-card admin-access-gate"><p class="form-note">Checking two-factor authentication...</p></section>` });
  bindStudentShell();
  try {
    const status = await window.CrosslineApi.adminMfaStatus();
    const content = status.enabled
      ? `<section class="dash-page-card admin-access-gate"><p class="dash-card-kicker">Two-factor authentication</p><h2>Enter your authenticator code</h2><p>Use the current six-digit code from your authenticator app. Admin sessions expire after two hours.</p><form id="admin-session-form"><label class="auth-field"><span>Authentication code</span><input id="admin-session-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required autofocus /></label><p class="form-message">${escapeHtml(message)}</p><button class="dash-start-button">Verify and continue</button></form></section>`
      : `<section class="dash-page-card admin-access-gate"><p class="dash-card-kicker">Required security setup</p><h2>Protect the admin panel with 2FA</h2><p>Connect an authenticator app before the first privileged session. The setup key is shown once and stored encrypted by the API.</p><p class="form-message">${escapeHtml(message)}</p><button id="begin-admin-mfa" class="dash-start-button">Set up authenticator</button></section>`;
    app.innerHTML = studentPageShell({ active: "settings", title: "Administrator security", subtitle: "Verify your identity before opening privileged controls.", content });
    bindStudentShell();
    bind("begin-admin-mfa", "click", beginAdminMfaSetup);
    bind("admin-session-form", "submit", async (event) => {
      event.preventDefault();
      try {
        const payload = await window.CrosslineApi.createAdminSession(document.getElementById("admin-session-code").value);
        window.CrosslineApi.setAdminToken(payload.token);
        await refreshExamsFromApi(true);
        showAdminDashboard();
      } catch (error) { showAdminAccessGate(error.message); }
    });
  } catch (error) {
    showStudentSettings(error.message || "Administrator access could not be verified.");
  }
}

async function beginAdminMfaSetup() {
  try {
    const setup = await window.CrosslineApi.setupAdminMfa();
    const content = `<section class="dash-page-card admin-access-gate"><p class="dash-card-kicker">Authenticator setup</p><h2>Add Crossline to your authenticator</h2><p>In Google Authenticator, Microsoft Authenticator, or 1Password, choose to enter a setup key.</p><div class="admin-mfa-secret"><span>Account</span><strong>${escapeHtml(setup.account)}</strong><span>Setup key</span><code>${escapeHtml(setup.secret)}</code></div><form id="admin-mfa-enable-form"><label class="auth-field"><span>Current six-digit code</span><input id="admin-mfa-enable-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required autofocus /></label><p class="form-message"></p><button class="dash-start-button">Enable 2FA and continue</button></form></section>`;
    app.innerHTML = studentPageShell({ active: "settings", title: "Administrator security", subtitle: "Complete the one-time authenticator setup.", content });
    bindStudentShell();
    bind("admin-mfa-enable-form", "submit", async (event) => {
      event.preventDefault();
      const code = document.getElementById("admin-mfa-enable-code").value;
      try {
        await window.CrosslineApi.enableAdminMfa(code);
        const payload = await window.CrosslineApi.createAdminSession(code);
        window.CrosslineApi.setAdminToken(payload.token);
        await refreshExamsFromApi(true);
        showAdminDashboard();
      } catch (error) {
        const note = document.querySelector("#admin-mfa-enable-form .form-message");
        if (note) note.textContent = error.message;
      }
    });
  } catch (error) { showAdminAccessGate(error.message); }
}

function resultQuestionHtml(question, prefix = "all") {
  const selected = question.selected === undefined ? null : question.selected;
  const hasSelection = selected !== null && selected !== undefined && Number.isInteger(Number(selected));
  const correctIndex = Number(question.correctIndex || 0);
  const answers = question.answers || [];
  const status = question.correct === true ? "correct" : question.correct === false ? "wrong" : "skipped";
  const statusLabel = status === "correct" ? "Correct" : status === "wrong" ? "Incorrect" : "Skipped";
  const optionState = (index) => {
    const isCorrect = correctIndex === index;
    const isSelected = hasSelection && Number(selected) === index;
    if (isCorrect && isSelected) return "correct selected";
    if (isCorrect) return "correct";
    if (isSelected) return "selected";
    return "";
  };
  const optionBadge = (index) => {
    const isCorrect = correctIndex === index;
    const isSelected = hasSelection && Number(selected) === index;
    if (isCorrect && isSelected) return `<em class="result-badge correct">Your answer · Correct</em>`;
    if (isCorrect) return `<em class="result-badge correct">Correct</em>`;
    if (isSelected) return `<em class="result-badge selected">Your answer</em>`;
    return "";
  };
  return `<article id="${resultQuestionAnchor(question.id, prefix)}" class="answer-review ${status}"><header class="answer-review-head"><div><p class="answer-review-kicker">Question ${question.position}</p><h3>${formatScore(question.earnedMarks)} / ${formatScore(question.marks)} marks</h3></div><span class="result-status ${status}" aria-label="${statusLabel}">${statusLabel}</span></header>${question.image ? `<img class="question-preview-image" src="${escapeHtml(question.image)}" alt="Question image" />` : ""}<div class="rich-content answer-review-prompt">${contentHtml(question.text)}</div><div class="result-options" role="list">${answers.map((answer, index) => `<div class="result-option ${optionState(index)}" role="listitem"><strong>${letterLabels[index]}</strong><span>${contentHtml(answer)}</span>${optionBadge(index)}</div>`).join("")}</div><div class="result-verdict"><span>You chose ${hasSelection ? `<b>(${letterLabels[Number(selected)]})</b> ${contentHtml(answers[Number(selected)] || "")}` : "<b>no option</b>"}</span><span>Correct answer is <b>(${letterLabels[correctIndex]})</b> ${contentHtml(answers[correctIndex] || "")}</span></div><div class="explanation-box"><p class="explanation-label">Explanation</p>${question.explanation ? `<div class="explanation-body rich-content">${markdownHtml(question.explanation)}</div>` : `<p class="explanation-empty">No explanation has been added for this question yet.</p>`}${question.explanationImage ? `<img class="question-preview-image" src="${escapeHtml(question.explanationImage)}" alt="Explanation image" />` : ""}</div></article>`;
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
  app.innerHTML = `<div class="app-shell"><header class="top-strip"><div class="brand"><div class="brand-identity"><img class="brand-logo" src="assets/crossline-icon.png" alt="Crossline Education" /><span class="brand-name">Crossline Education</span></div><div class="brand-copy"><strong>${escapeHtml(currentExam.title)}</strong><small>CSCA PRACTICE EXAMINATION</small></div></div><div class="session-meta"><span><i class="status-dot"></i> Exam in progress</span><span id="clock">00:00:00</span><button class="exit-button" id="exit-button">Exit practice</button></div></header><main class="exam-layout"><aside class="sidebar"><section class="candidate-card"><div class="avatar">${escapeHtml(currentUser.email[0].toUpperCase())}</div><div><strong>${escapeHtml(currentUser.email)}</strong><p>${escapeHtml(currentExam.id.toUpperCase())}</p></div></section><section class="side-section"><div class="section-heading"><h2>Answer sheet</h2><span id="progress-ratio"></span></div><div class="progress-track"><div id="progress-fill"></div></div><div class="question-grid" id="question-grid"></div><div class="legend"><span><i class="legend-box answered"></i>Answered</span><span><i class="legend-box current"></i>Current</span><span><i class="legend-box flagged"></i>Flagged</span><span><i class="legend-box"></i>Unanswered</span></div></section><section class="integrity-panel"><strong>Practice controls</strong><p>Device checks are complete. Camera and microphone streams are no longer active during the question section.</p><ul id="integrity-events"></ul></section></aside><section class="workspace"><nav class="question-toolbar"><button class="flag-button" id="flag-button"><span id="flag-icon">☆</span> Flag</button><div class="question-position">Question <strong id="current-number"></strong></div><div class="nav-buttons"><button id="previous-button">&lt; Previous</button><button id="next-button">Next &gt;</button></div><div class="zoom-controls"><button id="zoom-out" aria-label="Decrease text size">A<sup>-</sup></button><button id="zoom-in" aria-label="Increase text size">A<sup>+</sup></button></div></nav><div class="instruction-bar" id="instruction"></div><article class="question-card"><div class="question-type" id="question-type"></div><div class="question-text rich-content" id="question-text" role="heading" aria-level="1"></div><div class="diagram" id="diagram"><div class="disc"><span class="object object-b">B</span><span class="axis"></span><span class="object object-a">A</span></div><span class="omega">↻ ω</span></div><img id="question-image" class="question-preview-image hidden" alt="Question reference" /><div class="answers" id="answers"></div></article><footer class="workspace-footer"><span>Use the answer sheet to jump between questions.</span><button class="submit-button" id="submit-button">Submit practice exam</button></footer></section></main></div><dialog id="submit-dialog"><div class="dialog-content"><h2>Submit practice exam?</h2><p id="submit-copy">Are you sure you want to submit your answers? Your score and full answer review will be available immediately.</p><div class="dialog-actions"><button class="ghost-button" id="cancel-submit">Cancel</button><button class="primary-button" id="confirm-submit">Submit exam</button></div></div></dialog>`;
  bind("previous-button", "click", () => navigate(-1)); bind("next-button", "click", () => navigate(1));
  bind("flag-button", "click", () => { questions[currentIndex].flagged = !questions[currentIndex].flagged; saveSessionAnswers(false); renderQuestion(); });
  bind("zoom-in", "click", () => { questionScale = Math.min(1.35, questionScale + .1); document.documentElement.style.setProperty("--question-scale", questionScale); });
  bind("zoom-out", "click", () => { questionScale = Math.max(.85, questionScale - .1); document.documentElement.style.setProperty("--question-scale", questionScale); });
  bind("exit-button", "click", async () => {
    const confirmed = await requestConfirmation({
      id: "exit-practice-confirm",
      kicker: "Active practice",
      title: "Exit this practice?",
      message: "Your current answers will remain saved, but this attempt will not be submitted.",
      cancelLabel: "Continue practice",
      confirmLabel: "Exit practice"
    });
    if (!confirmed) return;
    clearInterval(clockTimer);
    await recordSessionEvent("practice_exit", { elapsedSeconds });
    stopMedia();
    leaveKiosk();
    showExamList();
  });
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
  studentDataCache.resultData = null;
  studentDataCache.resultDataFetchedAt = 0;
  studentDataCache.leaderboards.clear();
  studentDataCache.leaderboardFetchedAt.clear();
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
  document.getElementById("current-number").textContent = `${question.id} of ${questions.length}`; document.getElementById("instruction").innerHTML = contentHtml(question.instruction); document.getElementById("question-type").textContent = question.type; document.getElementById("question-text").innerHTML = contentHtml(question.text);
  // Demo BA/ω placeholder only when a question explicitly requests it and has no real figure.
  document.getElementById("diagram").classList.toggle("hidden", !question.diagram || Boolean(question.image));
  const image = document.getElementById("question-image"); image.classList.toggle("hidden", !question.image); if (question.image) image.src = question.image;
  document.getElementById("flag-icon").textContent = question.flagged ? "★" : "☆"; document.getElementById("previous-button").disabled = currentIndex === 0; document.getElementById("next-button").disabled = currentIndex === questions.length - 1;
  document.getElementById("progress-ratio").textContent = `${answered} / ${questions.length}`; document.getElementById("progress-fill").style.width = `${answered / questions.length * 100}%`;
  document.getElementById("question-grid").innerHTML = questions.map((item, index) => `<button class="question-cell ${item.answer !== null ? "answered" : ""} ${item.flagged ? "flagged" : ""} ${index === currentIndex ? "current" : ""}" data-index="${index}">${item.id}</button>`).join("");
  document.querySelectorAll(".question-cell").forEach((button) => button.addEventListener("click", () => { currentIndex = Number(button.dataset.index); renderQuestion(); }));
  document.getElementById("answers").innerHTML = question.answers.map((answer, index) => `<label class="answer-label"><input type="radio" name="answer" value="${index}" ${question.answer === index ? "checked" : ""} /><span>(${letterLabels[index]}) ${contentHtml(answer)}</span></label>`).join("");
  document.querySelectorAll('input[name="answer"]').forEach((input) => input.addEventListener("change", () => { question.answer = Number(input.value); saveSessionAnswers(false); renderQuestion(); }));
  renderMath();
}

function showAdminLogin(message = "") {
  void disableAdminScreenCapture();
  window.CrosslineApi?.clearAdminToken?.();
  if (currentUser) return showStudentSettings(message || "Your administrator session expired. Verify with 2FA to continue.");
  showAuth("login", message || "Sign in with your account, then open the admin panel from Settings.");
}
function adminSkeleton(rows = 3) {
  return `<section class="admin-skeleton" aria-hidden="true">${Array.from({ length: rows }, () => `<div class="skeleton-card"><div class="skeleton-line w35"></div><div class="skeleton-line w70"></div><div class="skeleton-line w55"></div></div>`).join("")}</section>`;
}
function adminShell(content, active = "exams") {
  return `${header(desktopExitAction(`<span>Crossline administration</span><button id="admin-logout" class="header-link">Return to student settings</button>`, { updates: true }))}<main class="admin-layout admin-layout-modern"><aside class="admin-nav"><div class="admin-nav-brand"><img src="assets/crossline-icon.png" alt="" /><div><strong>Admin workspace</strong><small>2FA protected</small></div></div><button id="admin-overview" class="${active === "overview" ? "active" : ""}">${uiIcon("layout-dashboard")} Overview</button><button id="admin-assistant" class="${active === "assistant" ? "active" : ""}">${uiIcon("star")} GLM assistant</button><button id="admin-exams" class="${active === "exams" ? "active" : ""}">${uiIcon("clipboard-list")} Exam library</button><button id="admin-import" class="${active === "import" ? "active" : ""}">${uiIcon("file-text")} Import questions</button><button id="admin-submissions" class="${active === "submissions" ? "active" : ""}">${uiIcon("bar-chart-3")} Student attempts</button><button id="admin-notifications" class="${active === "notifications" ? "active" : ""}">${uiIcon("bell")} Notifications</button><button id="admin-bug-reports" class="${active === "bug-reports" ? "active" : ""}">${uiIcon("circle-x")} Bug reports</button><button id="admin-student-plans" class="${active === "student-plans" ? "active" : ""}">${uiIcon("badge-check")} Student plans</button><button id="admin-security" class="${active === "security" ? "active" : ""}">${uiIcon("settings")} Admin access</button><button id="admin-updates" class="${active === "updates" ? "active" : ""}">${uiIcon("download")} Updates</button></aside><section class="admin-workspace">${content}</section></main>`;
}
function bindAdminShell() {
  bind("admin-logout", "click", showStudentSettings);
  bind("admin-overview", "click", showAdminOverview);
  bind("admin-assistant", "click", showAdminAssistant);
  bind("admin-exams", "click", showAdminDashboard);
  bind("admin-import", "click", showQuestionImport);
  bind("admin-submissions", "click", showAdminSubmissions);
  bind("admin-notifications", "click", showAdminNotifications);
  bind("admin-bug-reports", "click", showAdminBugReports);
  bind("admin-student-plans", "click", showAdminStudentPlans);
  bind("admin-security", "click", showAdminSecurity);
  bind("admin-updates", "click", showAdminUpdates);
  bindDesktopExit({ updates: true });
}
async function showAdminStudentPlans(message = "") {
  message = typeof message === "string" ? message : "";
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Manual access</p><h1>Student plans</h1><p class="muted">Assign access packages to verified student accounts while online payments are being prepared.</p></div></div><section class="admin-card"><p class="form-note">Loading package assignments...</p></section>`, "student-plans");
  bindAdminShell();
  try {
    const payload = await window.CrosslineApi.adminStudentPlans();
    const plans = payload.plans?.length ? payload.plans : ACCESS_PLANS;
    const catalog = plans.map((plan) => `<article class="admin-card admin-plan-option"><p class="admin-kicker">${plan.free ? "Free plan" : "Access package"}</p><h3>${escapeHtml(plan.name)}</h3><strong>${escapeHtml(plan.priceLabel || (plan.priceUsd != null ? `$${plan.priceUsd}` : "USD --"))}</strong><small>${plan.free ? "Included with account" : "One-time"}</small><p>${plan.free ? "One simulated practice exam with three attempts, plus free past-paper questions and explanations. Upgrade for more full simulated exams." : `Includes every official past-paper simulated test${plan.mockLimit ? ` and ${plan.mockLimit} Crossline original mocks` : ""}, with three attempts for each included exam.`}</p></article>`).join("");
    const assignments = (payload.assignments || []).map((assignment) => {
      const plan = plans.find((item) => item.id === assignment.planId);
      const usage = Number(assignment.mockLimit || 0) ? `${Number(assignment.mocksUsed || 0)} of ${Number(assignment.mockLimit || 0)} mocks used` : "Past papers only";
      return `<li><div><strong>${escapeHtml(assignment.username || assignment.email)}</strong><small>${escapeHtml(assignment.email)}</small></div><div><b>${escapeHtml(plan?.name || assignment.planId)}</b><small>${escapeHtml(usage)}</small></div><button class="danger-button revoke-student-plan" data-email="${escapeHtml(assignment.email)}">Revoke</button></li>`;
    }).join("");
    const content = `<div class="admin-toolbar"><div><p class="admin-kicker">Manual access</p><h1>Student plans</h1><p class="muted">Assign access packages to verified student accounts while online payments are being prepared.</p></div></div>${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}<section class="admin-plan-catalog">${catalog}</section><section class="admin-card admin-plan-grant"><div><p class="admin-kicker">Grant or replace package</p><h2>Assign student access</h2><p>Reassigning a package resets that student's selected Crossline mock slots.</p></div><form id="grant-student-plan-form"><label class="auth-field"><span>Verified student email</span><input id="student-plan-email" type="email" placeholder="student@example.com" required /></label><label class="auth-field"><span>Access package</span><select id="student-plan-id">${plans.map((plan) => `<option value="${escapeHtml(plan.id)}">${escapeHtml(plan.name)}</option>`).join("")}</select></label><button class="primary-button">Assign package</button></form></section><section class="admin-card admin-plan-assignments"><div><p class="admin-kicker">Active assignments</p><h2>Student access</h2></div><ul>${assignments || `<li class="admin-plan-empty"><p class="form-note">No student packages have been assigned yet.</p></li>`}</ul></section>`;
    app.innerHTML = adminShell(content, "student-plans");
    bindAdminShell();
    bind("grant-student-plan-form", "submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("student-plan-email").value.trim().toLowerCase();
      const planId = document.getElementById("student-plan-id").value;
      try {
        await window.CrosslineApi.grantStudentPlan(email, planId);
        showAdminStudentPlans(`Access package assigned to ${email}.`);
      } catch (error) { showAdminStudentPlans(error.message); }
    });
    document.querySelectorAll(".revoke-student-plan").forEach((button) => button.addEventListener("click", async () => {
      if (!confirm(`Revoke the access package for ${button.dataset.email}?`)) return;
      try {
        await window.CrosslineApi.revokeStudentPlan(button.dataset.email);
        showAdminStudentPlans(`Access package revoked for ${button.dataset.email}.`);
      } catch (error) { showAdminStudentPlans(error.message); }
    }));
  } catch (error) { showAdminLogin(error.message); }
}
async function showAdminSecurity(message = "") {
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Privileged accounts</p><h1>Admin access</h1><p class="muted">Grant access only to verified student accounts. Every administrator must configure their own authenticator.</p></div></div><section class="admin-card"><p class="form-note">Loading administrator accounts...</p></section>`, "security");
  bindAdminShell();
  try {
    const [payload, runtimeInfo] = await Promise.all([
      window.CrosslineApi.adminAccess(),
      window.examRuntime?.getInfo?.().catch(() => null)
    ]);
    const rows = (payload.admins || []).map((admin) => `<li><div><strong>${escapeHtml(admin.username || admin.email)}</strong><small>${escapeHtml(admin.email)}</small></div><span class="admin-mfa-badge ${admin.mfaEnabled ? "enabled" : "pending"}">${admin.mfaEnabled ? "2FA enabled" : "2FA setup pending"}</span>${admin.email === "arijitsumit123@gmail.com" ? `<small>Creator</small>` : `<button class="danger-button revoke-admin" data-email="${escapeHtml(admin.email)}">Remove</button>`}</li>`).join("");
    const captureControl = isDesktopClient() && window.examRuntime?.setScreenCaptureAllowed ? `<section class="admin-card admin-capture-card"><div><p class="admin-kicker">Device privacy</p><h2>Screen capture</h2><p>Temporarily allow this administrator to take screenshots or use screen sharing and recording tools across both admin and student panels. Protection returns automatically after 30 minutes, when it is turned off, when the account signs out, or when the app closes.</p><p id="admin-capture-message" class="form-note"></p></div><label class="admin-capture-switch" for="admin-capture-toggle"><input id="admin-capture-toggle" type="checkbox" ${runtimeInfo?.screenCaptureAllowed ? "checked" : ""} /><span aria-hidden="true"><i></i></span><strong id="admin-capture-label">${runtimeInfo?.screenCaptureAllowed ? "Capture allowed" : "Capture blocked"}</strong></label></section>` : "";
    const content = `<div class="admin-toolbar"><div><p class="admin-kicker">Privileged accounts</p><h1>Admin access</h1><p class="muted">Grant access only to verified student accounts. Every administrator must configure their own authenticator.</p></div></div>${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}${captureControl}<section class="admin-card admin-access-manager"><form id="grant-admin-form"><label class="auth-field"><span>Verified student email</span><input id="grant-admin-email" type="email" placeholder="name@example.com" required /></label><button class="primary-button">Grant admin access</button></form><ul>${rows || `<li><p class="form-note">No administrator accounts found.</p></li>`}</ul></section>`;
    app.innerHTML = adminShell(content, "security");
    bindAdminShell();
    updateAdminCaptureUi(runtimeInfo || {});
    bind("admin-capture-toggle", "change", async (event) => {
      const toggle = event.currentTarget;
      const requested = toggle.checked;
      toggle.disabled = true;
      const status = document.getElementById("admin-capture-message");
      if (status) status.textContent = requested ? "Verifying your administrator session..." : "Restoring Windows content protection...";
      try {
        const next = await window.examRuntime.setScreenCaptureAllowed(requested, window.CrosslineApi.getAdminToken());
        updateAdminCaptureUi(next);
      } catch (error) {
        toggle.checked = !requested;
        if (status) status.textContent = error.message || "Screen-capture protection could not be changed.";
      } finally {
        toggle.disabled = false;
      }
    });
    bind("grant-admin-form", "submit", async (event) => {
      event.preventDefault();
      try {
        const email = document.getElementById("grant-admin-email").value.trim().toLowerCase();
        await window.CrosslineApi.grantAdminAccess(email);
        showAdminSecurity(`Administrator access granted to ${email}.`);
      } catch (error) { showAdminSecurity(error.message); }
    });
    document.querySelectorAll(".revoke-admin").forEach((button) => button.addEventListener("click", async () => {
      if (!confirm(`Remove administrator access from ${button.dataset.email}?`)) return;
      try { await window.CrosslineApi.revokeAdminAccess(button.dataset.email); showAdminSecurity("Administrator access removed."); }
      catch (error) { showAdminSecurity(error.message); }
    }));
  } catch (error) { showAdminLogin(error.message); }
}
function showAdminUpdates(message = "") {
  message = typeof message === "string" ? message : "";
  if (!isDesktopClient()) {
    app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Desktop updates</p><h1>App updates</h1><p class="muted">Software updates are available in the Windows desktop client.</p></div></div><section class="admin-card"><p>Open the Crossline Windows app as an administrator to check for and install updates.</p></section>`, "updates");
    bindAdminShell();
    return;
  }
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Desktop updates</p><h1>App updates</h1><p class="muted">Check for new versions, enable auto-update, or reset an interrupted download.</p></div></div>${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}<section class="admin-card"><div class="settings-update-copy"><b>Windows app updates</b><p>Updates are verified before installation. Use the same controls available in the student portal.</p></div><div class="admin-card-actions"><button id="admin-check-updates" type="button" class="primary-button">Check for updates</button><button id="admin-auto-update" type="button" class="secondary-button">${autoUpdateEnabled() ? "Auto-update enabled" : "Enable auto-update"}</button><button id="admin-reset-update" type="button" class="ghost-button">Reset update download</button></div></section>`, "updates");
  bindAdminShell();
  bind("admin-check-updates", "click", () => checkForUpdates(true));
  bind("admin-auto-update", "click", () => { setAutoUpdateEnabled(!autoUpdateEnabled()); showAdminUpdates("Auto-update preference saved."); });
  bind("admin-reset-update", "click", resetUpdateNow);
}
function showAdminDashboard(message = "") {
  message = typeof message === "string" ? message : "";
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Exam authoring</p><h1>Exam library</h1><p class="muted">Edit paper details, subject, category, pricing, and questions for every published exam.</p></div><div class="admin-toolbar-actions"><button id="import-questions" class="secondary-button">Import questions</button><button id="new-exam" class="primary-button">Create exam</button></div></div>${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}<section class="admin-exam-grid">${exams.map((exam) => `<article class="admin-card"><div class="exam-title-row"><p class="admin-kicker">${escapeHtml(normalizeExamSubjectValue(exam.subject) || "Unassigned subject")} · ${escapeHtml(examCategoryLabel(exam.category))}</p></div><h3>${mathHtml(exam.title)}</h3><p>${mathHtml(exam.description)}</p><div class="exam-meta"><span>${exam.questions.length} questions</span><span>${exam.duration} minutes</span><span>${formatScore(exam.questions.reduce((sum, question) => sum + normalizeMarks(question.marks), 0))} marks</span><span>${escapeHtml(formatExamAccess(exam))}</span></div><div class="admin-card-actions"><button class="secondary-button edit-exam-details" data-id="${escapeHtml(exam.id)}">Edit details</button><button class="secondary-button edit-exam" data-id="${escapeHtml(exam.id)}">Edit questions</button><button class="danger-button delete-exam" data-id="${escapeHtml(exam.id)}">Delete exam</button></div></article>`).join("") || `<section class="panel"><p class="form-note">No exams exist yet. Create a paper to begin.</p></section>`}</section>`, "exams");
  bindAdminShell();
  bind("new-exam", "click", showCreateExam);
  bind("import-questions", "click", showQuestionImport);
  document.querySelectorAll(".edit-exam-details").forEach((button) => button.addEventListener("click", () => showEditExamDetails(button.dataset.id)));
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
        <div class="field"><label>Subject</label><select class="draft-subject" data-draft-index="${index}">${EXAM_SUBJECTS.map((subject) => `<option value="${escapeHtml(subject)}" ${normalizeExamSubjectValue(question.subject) === subject ? "selected" : ""}>${escapeHtml(subject)}</option>`).join("")}<option value="" ${normalizeExamSubjectValue(question.subject) ? "" : "selected"}>Other</option></select></div>
        <div class="field wide"><label>Official topic</label>${topicSelectHtml({ className: "draft-topic", subject: question.subject || "Physics", selected: question.topic || question.chapter || "", dataAttrs: `data-draft-index="${index}"` })}</div>
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
  root.querySelectorAll(".draft-subject").forEach((input) => input.addEventListener("change", () => {
    const question = questions[readIndex(input)];
    if (!question) return;
    question.subject = input.value;
    const topic = classifyOfficialTopic(normalizeExamSubjectValue(question.subject), question.topic || question.chapter, question.text || "");
    question.chapter = topic;
    question.topic = topic;
    const topicField = input.closest(".import-draft-fields")?.querySelector(".draft-topic");
    if (topicField) {
      const replacement = document.createElement("div");
      replacement.innerHTML = topicSelectHtml({ className: "draft-topic", subject: question.subject || "Physics", selected: topic, dataAttrs: `data-draft-index="${readIndex(input)}"` });
      topicField.replaceWith(replacement.firstElementChild);
      const next = input.closest(".import-draft-fields")?.querySelector(".draft-topic");
      next?.addEventListener("change", () => {
        const current = questions[readIndex(next)];
        if (!current) return;
        current.topic = next.value;
        current.chapter = next.value;
      });
    }
  }));
  root.querySelectorAll(".draft-topic").forEach((input) => input.addEventListener("change", () => {
    const question = questions[readIndex(input)];
    if (!question) return;
    question.topic = input.value;
    question.chapter = input.value;
  }));
  root.querySelectorAll(".draft-topic").forEach((input) => input.addEventListener("input", () => {
    const question = questions[readIndex(input)];
    if (!question) return;
    question.topic = input.value;
    question.chapter = input.value;
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

async function showAdminBugReports(message = "") {
  message = typeof message === "string" ? message : "";
  const renderReports = (reports) => {
    const categoryLabels = { app: "App", exam: "Exam content", camera: "Camera or setup", account: "Account", other: "Other" };
    const cards = reports.length ? reports.map((report) => `<article class="admin-card admin-bug-report ${report.status === "resolved" ? "resolved" : ""}"><header><div><p class="admin-kicker">${escapeHtml(categoryLabels[report.category] || "Other")}</p><h3>${escapeHtml(report.title)}</h3></div><span class="bug-status ${escapeHtml(report.status)}">${escapeHtml(report.status)}</span></header><p class="admin-bug-details">${mathHtml(report.details)}</p><div class="exam-meta"><span>${escapeHtml(report.studentName || report.studentEmail || "Local preview")}</span>${report.studentEmail ? `<span>${escapeHtml(report.studentEmail)}</span>` : ""}${report.appVersion ? `<span>App ${escapeHtml(report.appVersion)}</span>` : ""}<span>${escapeHtml(formatDateTime(report.createdAt))}</span></div><div class="admin-card-actions"><button class="${report.status === "resolved" ? "ghost-button" : "primary-button"} update-bug-report" data-id="${escapeHtml(report.id)}" data-status="${report.status === "resolved" ? "open" : "resolved"}">${report.status === "resolved" ? "Reopen" : "Mark resolved"}</button></div></article>`).join("") : `<section class="panel"><p class="form-note">No bug reports yet.</p></section>`;
    app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Student support</p><h1>Bug reports</h1><p class="muted">Review issues sent from student settings.</p></div></div>${message ? `<p class="form-message">${escapeHtml(message)}</p>` : ""}<section class="admin-bug-list">${cards}</section>`, "bug-reports");
    bindAdminShell();
    document.querySelectorAll(".update-bug-report").forEach((button) => button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        if (apiEnabled()) await window.CrosslineApi.updateBugReport(button.dataset.id, button.dataset.status);
        else {
          const localReports = load("csca-local-bug-reports", []).map((report) => report.id === button.dataset.id ? { ...report, status: button.dataset.status } : report);
          save("csca-local-bug-reports", localReports);
        }
        showAdminBugReports(button.dataset.status === "resolved" ? "Bug report resolved." : "Bug report reopened.");
      } catch (error) { showAdminBugReports(error.message || "The bug report could not be updated."); }
    }));
  };
  if (!apiEnabled()) return renderReports(load("csca-local-bug-reports", []));
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Student support</p><h1>Bug reports</h1><p class="muted">Loading student reports...</p></div></div>${adminSkeleton(3)}`, "bug-reports");
  bindAdminShell();
  try {
    const payload = await window.CrosslineApi.adminBugReports();
    renderReports(payload.reports || []);
  } catch (error) { showAdminLogin(error.message); }
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
    app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>${escapeHtml(submission.studentEmail)}</h1><p class="muted">${mathHtml(submission.examTitle)} · Score ${formatScore(submission.score.earned)} / ${formatScore(submission.score.total)}</p></div><button id="back-submissions" class="ghost-button">Back to submissions</button></div><section class="admin-card submission-summary"><div><strong>Started</strong><span>${escapeHtml(formatDateTime(submission.startedAt || submission.createdAt))}</span></div><div><strong>Submitted</strong><span>${escapeHtml(formatDateTime(submission.submittedAt))}</span></div><div><strong>Phone camera</strong><span>${escapeHtml(formatDateTime(submission.phoneConnectedAt))}</span></div><div><strong>Result email</strong><span>${escapeHtml(resultEmailStatus(submission))}</span></div><div><strong>Session ID</strong><span>${escapeHtml(submission.id)}</span></div></section><section class="panel admin-result-review"><h2>MCQ review</h2>${questions.map((question) => resultQuestionHtml(question, "admin")).join("")}</section><section class="panel"><h2>Security/event log</h2>${events.length ? `<ul class="event-list">${events.map((event) => `<li><strong>${escapeHtml(event.type)}</strong><span>${escapeHtml(formatDateTime(event.createdAt))}</span></li>`).join("")}</ul>` : `<p class="form-note">No events recorded.</p>`}</section>`, "submissions");
    bindAdminShell();
    bind("back-submissions", "click", showAdminSubmissions);
    renderMath();
  } catch (error) {
    showAdminSubmissions(error.message);
  }
}
function showCreateExam() {
  app.innerHTML = adminShell(`<div class="admin-toolbar"><h1>Create exam</h1><button id="back-admin" class="ghost-button">Back</button></div><section class="panel"><form id="create-exam-form" class="editor-grid"><div class="field wide"><label>Exam title</label><input id="exam-title" required /></div><div class="field wide"><label>Description</label><textarea id="exam-description" required></textarea></div><div class="field"><label>Duration in minutes</label><input id="exam-duration" type="number" min="1" max="480" value="60" required /></div>${examAccessFieldsHtml({ freeSample: false, priceCents: 0, category: "original" })}<p id="create-exam-message" class="form-message wide"></p><button class="primary-button">Create exam</button></form></section>`);
  bindAdminShell();
  bind("back-admin", "click", showAdminDashboard);
  bindExamAccessFields();
  bind("create-exam-form", "submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("create-exam-message");
    const title = document.getElementById("exam-title").value.trim();
    const description = document.getElementById("exam-description").value.trim();
    const duration = Number(document.getElementById("exam-duration").value);
    const subject = normalizeExamSubjectValue(document.getElementById("exam-subject")?.value);
    const category = normalizeExamCategoryValue(document.getElementById("exam-category")?.value);
    const access = readExamAccessFields();
    const exam = { title, description, duration, subject, category, ...access, questions: [] };
    if (!subject) {
      if (message) message.textContent = "Choose a subject for this exam.";
      return;
    }
    if (!Number.isFinite(access.price) || access.price < 0) {
      if (message) message.textContent = "Enter a valid placeholder price, or leave it blank.";
      return;
    }
    if (apiEnabled()) {
      try {
        const payload = await window.CrosslineApi.createExam(exam);
        await refreshExamsFromApi(true);
        return showQuestionEditor(payload.exam.id);
      } catch (error) {
        if (message) message.textContent = error.message || "The exam could not be created.";
        return;
      }
    }
    if (access.freeSample) exams.forEach((item) => { item.freeSample = false; item.free = false; });
    exams.push({ id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, ...exam, priceCents: Math.round(access.price * 100), currency: "USD", free: access.freeSample, attemptsUsed: 0, attemptsRemaining: 3 });
    save("csca-exams", exams);
    showQuestionEditor(exams.at(-1).id);
  });
}

function showEditExamDetails(examId, message = "") {
  message = typeof message === "string" ? message : "";
  const exam = exams.find((item) => item.id === examId);
  if (!exam) return showAdminDashboard("Exam not found.");
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><p class="admin-kicker">Paper details</p><h1>Edit exam</h1><p class="muted">Change the title, description, duration, category, and student access for this paper.</p></div><button id="back-admin" class="ghost-button">Back to library</button></div><section class="panel"><form id="edit-exam-form" class="editor-grid"><div class="field wide"><label>Exam title</label><input id="exam-title" value="${escapeHtml(exam.title || "")}" required /></div><div class="field wide"><label>Description</label><textarea id="exam-description" required>${escapeHtml(exam.description || "")}</textarea></div><div class="field"><label>Duration in minutes</label><input id="exam-duration" type="number" min="1" max="480" value="${escapeHtml(exam.duration || 60)}" required /></div>${examAccessFieldsHtml(exam)}<p id="edit-exam-message" class="form-message wide">${escapeHtml(message)}</p><div class="admin-card-actions wide"><button class="primary-button" type="submit">Save details</button><button id="edit-exam-questions" class="secondary-button" type="button">Edit questions</button></div></form></section>`, "exams");
  bindAdminShell();
  bind("back-admin", "click", showAdminDashboard);
  bind("edit-exam-questions", "click", () => showQuestionEditor(examId));
  bindExamAccessFields();
  bind("edit-exam-form", "submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("edit-exam-message");
    const title = document.getElementById("exam-title").value.trim();
    const description = document.getElementById("exam-description").value.trim();
    const duration = Number(document.getElementById("exam-duration").value);
    const subject = normalizeExamSubjectValue(document.getElementById("exam-subject")?.value);
    const category = normalizeExamCategoryValue(document.getElementById("exam-category")?.value);
    const access = readExamAccessFields();
    if (!title || !description || !Number.isFinite(duration) || duration < 1) {
      if (status) status.textContent = "Title, description, and a valid duration are required.";
      return;
    }
    if (!subject) {
      if (status) status.textContent = "Choose a subject for this exam.";
      return;
    }
    if (!Number.isFinite(access.price) || access.price < 0) {
      if (status) status.textContent = "Enter a valid placeholder price, or leave it blank.";
      return;
    }
    const updates = { title, description, duration, subject, category, ...access };
    if (apiEnabled()) {
      try {
        await window.CrosslineApi.updateExam(examId, updates);
        await refreshExamsFromApi(true);
        return showAdminDashboard("Exam details saved.");
      } catch (error) {
        if (status) status.textContent = error.message || "The exam details could not be saved.";
        return;
      }
    }
    if (access.freeSample) exams.forEach((item) => { item.freeSample = false; item.free = false; });
    Object.assign(exam, updates, { priceCents: Math.round(access.price * 100), currency: "USD", free: access.freeSample });
    save("csca-exams", exams);
    showAdminDashboard("Exam details saved.");
  });
}
function showQuestionEditor(examId) {
  editorExamId = examId; editorImage = ""; editorExplanationImage = ""; const exam = exams.find((item) => item.id === examId);
  if (!exam) return showAdminDashboard();
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>${mathHtml(exam.title)}</h1><p class="muted">${exam.questions.length} questions · ${formatScore(exam.questions.reduce((sum, question) => sum + normalizeMarks(question.marks), 0))} total marks</p></div><button id="back-admin" class="ghost-button">Back to papers</button></div><section class="panel"><h3>Add a question</h3><p class="form-note">Use the official CSCA topic list for Physics, Chemistry, and Mathematics. LaTeX is supported in question text, options, and explanations.</p><form id="question-form" class="editor-grid"><div class="field"><label>Subject</label><select id="question-subject">${EXAM_SUBJECTS.map((subject) => `<option value="${escapeHtml(subject)}" ${normalizeExamSubjectValue(exam.subject) === subject ? "selected" : ""}>${escapeHtml(subject)}</option>`).join("")}</select></div><div class="field"><label>Official topic</label><span id="question-topic-host">${topicSelectHtml({ id: "question-topic", subject: exam.subject || "Physics", selected: "" })}</span></div><div class="field wide"><label>Question text</label><textarea id="new-question" required></textarea></div>${[0,1,2,3].map((index) => `<div class="field"><label>Option ${letterLabels[index]}</label><input id="option-${index}" required /></div>`).join("")}<div class="field"><label>Correct answer</label><select id="correct-answer">${letterLabels.map((label, index) => `<option value="${index}">${label}</option>`).join("")}</select></div><div class="field"><label>Marks for this question</label><input id="question-marks" type="number" min="0.1" step="0.1" value="1" required /></div><div class="field wide"><label>Optional question image</label><input id="question-image-input" type="file" accept="image/*" /><img id="editor-preview" class="question-preview-image hidden" alt="Question image preview" /></div><div class="field wide"><label>Answer explanation</label><textarea id="question-explanation" placeholder="Explain the correct answer. LaTeX supported."></textarea></div><div class="field wide"><label>Optional explanation image / graph</label><input id="explanation-image-input" type="file" accept="image/*" /><img id="explanation-preview" class="question-preview-image hidden" alt="Explanation image preview" /></div><button class="primary-button">Add question</button></form></section><div id="question-list">${exam.questions.map((question, index) => `<article class="admin-card"><p class="admin-kicker">${escapeHtml([question.subject, question.topic || question.chapter].filter(Boolean).join(" · ") || "Untitled topic")}</p><h3>Question ${index + 1}</h3><p>${mathHtml(question.text)}</p>${question.image ? `<img class="question-preview-image" src="${question.image}" alt="Attached question image" />` : ""}<div class="exam-meta"><span>Correct answer: ${letterLabels[Number(question.correctIndex || 0)]}</span><span>Marks: ${formatScore(question.marks)}</span>${question.explanation ? `<span>Explanation added</span>` : ""}${question.explanationImage ? `<span>Explanation image added</span>` : ""}</div><div class="admin-card-actions"><button class="secondary-button edit-question" data-index="${index}">Edit</button><button class="danger-button delete-question" data-index="${index}" data-question-id="${escapeHtml(question.backendId || "")}">Delete</button></div></article>`).join("")}</div>`);
  bindAdminShell(); bind("back-admin", "click", showAdminDashboard);
  const syncQuestionTopicHost = () => {
    const host = document.getElementById("question-topic-host");
    const subject = document.getElementById("question-subject")?.value || exam.subject || "Physics";
    if (host) host.innerHTML = topicSelectHtml({ id: "question-topic", subject, selected: document.getElementById("question-topic")?.value || "" });
  };
  bind("question-subject", "change", syncQuestionTopicHost);
  bind("question-image-input", "change", (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { editorImage = reader.result; const preview = document.getElementById("editor-preview"); preview.src = editorImage; preview.classList.remove("hidden"); }; reader.readAsDataURL(file); });
  bind("explanation-image-input", "change", (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { editorExplanationImage = reader.result; const preview = document.getElementById("explanation-preview"); preview.src = editorExplanationImage; preview.classList.remove("hidden"); }; reader.readAsDataURL(file); });
  bind("question-form", "submit", async (event) => {
    event.preventDefault();
    const subject = document.getElementById("question-subject").value.trim();
    const topic = document.getElementById("question-topic").value.trim();
    const question = { type: "Single choice", subject, chapter: topic, topic, instruction: "Choose the best answer.", text: document.getElementById("new-question").value.trim(), answers: [0,1,2,3].map((index) => document.getElementById(`option-${index}`).value.trim()), correctIndex: Number(document.getElementById("correct-answer").value), marks: normalizeMarks(document.getElementById("question-marks").value), explanation: document.getElementById("question-explanation").value.trim(), explanationImage: editorExplanationImage, image: editorImage };
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
  app.innerHTML = adminShell(`<div class="admin-toolbar"><div><h1>Edit question ${questionIndex + 1}</h1><p class="muted">${mathHtml(exam.title)}</p></div><button id="back-questions" class="ghost-button">Back to questions</button></div><section class="panel"><form id="edit-question-form" class="editor-grid"><div class="field"><label>Subject</label><select id="edit-question-subject">${EXAM_SUBJECTS.map((subject) => `<option value="${escapeHtml(subject)}" ${normalizeExamSubjectValue(question.subject) === subject ? "selected" : ""}>${escapeHtml(subject)}</option>`).join("")}</select></div><div class="field"><label>Official topic</label><span id="edit-question-topic-host">${topicSelectHtml({ id: "edit-question-topic", subject: question.subject || exam.subject || "Physics", selected: question.topic || question.chapter || "" })}</span></div><div class="field wide"><label>Question text</label><textarea id="edit-question-text" required>${escapeHtml(question.text)}</textarea></div>${[0,1,2,3].map((index) => `<div class="field"><label>Option ${letterLabels[index]}</label><input id="edit-option-${index}" value="${escapeHtml(question.answers?.[index] || "")}" required /></div>`).join("")}<div class="field"><label>Correct answer</label><select id="edit-correct-answer">${letterLabels.map((label, index) => `<option value="${index}" ${Number(question.correctIndex || 0) === index ? "selected" : ""}>${label}</option>`).join("")}</select></div><div class="field"><label>Marks for this question</label><input id="edit-question-marks" type="number" min="0.1" step="0.1" value="${escapeHtml(formatScore(question.marks))}" required /></div><div class="field wide"><label>Question image</label><input id="edit-question-image-input" type="file" accept="image/*" />${editorImage ? `<img id="edit-editor-preview" class="question-preview-image" src="${escapeHtml(editorImage)}" alt="Question image preview" />` : `<img id="edit-editor-preview" class="question-preview-image hidden" alt="Question image preview" />`}<button type="button" id="clear-question-image" class="ghost-button">Clear question image</button></div><div class="field wide"><label>Answer explanation</label><textarea id="edit-question-explanation" placeholder="Explain the correct answer. LaTeX supported.">${escapeHtml(question.explanation || "")}</textarea></div><div class="field wide"><label>Explanation image / graph</label><input id="edit-explanation-image-input" type="file" accept="image/*" />${editorExplanationImage ? `<img id="edit-explanation-preview" class="question-preview-image" src="${escapeHtml(editorExplanationImage)}" alt="Explanation image preview" />` : `<img id="edit-explanation-preview" class="question-preview-image hidden" alt="Explanation image preview" />`}<button type="button" id="clear-explanation-image" class="ghost-button">Clear explanation image</button></div><button class="primary-button">Save question</button></form></section>`, "exams");
  bindAdminShell();
  bind("back-questions", "click", () => showQuestionEditor(examId));
  bind("edit-question-subject", "change", () => {
    const host = document.getElementById("edit-question-topic-host");
    const subject = document.getElementById("edit-question-subject")?.value || "Physics";
    if (host) host.innerHTML = topicSelectHtml({ id: "edit-question-topic", subject, selected: document.getElementById("edit-question-topic")?.value || "" });
  });
  bind("clear-question-image", "click", () => { editorImage = ""; document.getElementById("edit-editor-preview").classList.add("hidden"); });
  bind("clear-explanation-image", "click", () => { editorExplanationImage = ""; document.getElementById("edit-explanation-preview").classList.add("hidden"); });
  bindImageInput("edit-question-image-input", "edit-editor-preview", (value) => { editorImage = value; });
  bindImageInput("edit-explanation-image-input", "edit-explanation-preview", (value) => { editorExplanationImage = value; });
  bind("edit-question-form", "submit", async (event) => {
    event.preventDefault();
    const subject = document.getElementById("edit-question-subject").value.trim();
    const topic = document.getElementById("edit-question-topic").value.trim();
    const updated = {
      type: question.type || "Single choice",
      subject,
      chapter: topic,
      topic,
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

function renderPublicRoute() {
  const normalized = String(window.location.pathname || "/").replace(/\/+$/, "") || "/";
  if (normalized === "/pricing") {
    try { history.replaceState({}, "", "/#pricing"); } catch {}
  }
  const legalPage = legalPageFromPath();
  if (legalPage) { showLegalPage(legalPage); return; }
  showDownloadLanding();
  if (window.location.hash === "#pricing") {
    requestAnimationFrame(() => {
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function navigateTo(path) {
  if (!path || path === window.location.pathname + window.location.hash) return;
  try { history.pushState({}, "", path); } catch {}
  renderPublicRoute();
  if (window.location.hash === "#pricing") return;
  window.scrollTo({ top: 0 });
}

function isInternalNavigation(event, element) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (!element || element.target === "_blank" || element.hasAttribute("download")) return false;
  const href = element.getAttribute("href");
  if (!href || !href.startsWith("/")) return false;
  if (element.origin && element.origin !== window.location.origin) return false;
  return true;
}

function registerSpaNavigation() {
  if (window.__cxSpaNav) return;
  window.__cxSpaNav = true;
  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a") : null;
    if (!isInternalNavigation(event, link)) return;
    const href = link.getAttribute("href");
    if (href === "/pricing" || href === "/pricing/") {
      event.preventDefault();
      if (window.location.pathname === "/") {
        try { history.replaceState({}, "", "/#pricing"); } catch {}
        document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        navigateTo("/#pricing");
      }
      return;
    }
    const hashIndex = href.indexOf("#");
    const pathOnly = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
    const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
    const isHomeOrRoot = pathOnly === "/" || pathOnly === "";
    if (hash && isHomeOrRoot && window.location.pathname === "/") {
      return;
    }
    event.preventDefault();
    if (isHomeOrRoot) {
      if (window.location.pathname !== "/") {
        navigateTo("/");
      } else if (hash) {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigateTo(pathOnly);
    }
  });
  window.addEventListener("popstate", () => { renderPublicRoute(); window.scrollTo({ top: 0 }); });
}

if (isDesktopClient()) {
  registerUpdateProgressEvents();
  registerIntegrityEvents();
  registerContentProtectionEvents();
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
  const authComplete = new URLSearchParams(window.location.search).get("auth") === "complete";
  if (authComplete && apiEnabled() && window.CrosslineApi?.getStudentToken?.()) {
    try { history.replaceState({}, "", "/"); } catch {}
    window.CrosslineApi.clearStudentToken?.();
    showWebsiteAccountReady();
    registerSpaNavigation();
  } else {
    renderPublicRoute();
    registerSpaNavigation();
  }
}
