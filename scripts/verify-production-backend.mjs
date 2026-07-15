import assert from "node:assert/strict";

const baseUrl = String(process.env.CROSSLINE_API_BASE || "https://api.crosslinecscatest.com").replace(/\/$/, "");
const email = String(process.env.CROSSLINE_ADMIN_EMAIL || "").trim();
const password = String(process.env.CROSSLINE_ADMIN_PASSWORD || "");
if (!email || !password) throw new Error("Set CROSSLINE_ADMIN_EMAIL and CROSSLINE_ADMIN_PASSWORD before running this check.");

async function request(path, { method = "GET", token = "", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${path} failed (${response.status}): ${payload.error || "Unknown error"}`);
  return payload;
}

const login = await request("/admin/login", { method: "POST", body: { email, password } });
assert.ok(login.token, "Admin login did not return a token.");
const token = login.token;
const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const assistant = await request("/admin/ai/chat", {
  method: "POST",
  token,
  body: { messages: [{ role: "user", content: "Reply with exactly PRODUCTION-OPENCODE-OK and nothing else." }] }
});
assert.equal(assistant.runtime, "opencode");
assert.equal(assistant.model, "glm-5.2");
assert.match(assistant.reply, /PRODUCTION-OPENCODE-OK/);

const attachedSource = `HTML Mathematics Mock\nDuration: 60 minutes\nQuestion 1: What value is shown in the graph?\n[[CROSSLINE_IMAGE_1]] OCR text: y = 4\nA. 2\nB. 4\nC. 6\nD. 8\nAnswer: B\nMarks: 2.5\nExplanation: The graph shows y = 4.`;
const attachmentChat = await request("/admin/ai/chat", {
  method: "POST",
  token,
  body: {
    messages: [{ role: "user", content: "State the exam duration and the mark value of Question 1. Do not change either value." }],
    attachment: { name: "exam.html", method: "html", text: attachedSource, metadata: { title: "HTML Mathematics Mock", duration: 60 } }
  }
});
assert.equal(attachmentChat.runtime, "opencode");
assert.match(attachmentChat.reply, /60/);
assert.match(attachmentChat.reply, /2\.5/);

const structured = await request("/admin/ai/import", {
  method: "POST",
  token,
  body: { sourceText: attachedSource, instructions: "Preserve the stated duration, marks, wording, and image reference." }
});
assert.equal(structured.runtime, "opencode");
assert.equal(structured.exam?.duration, 60);
assert.equal(structured.questions?.[0]?.marks, 2.5);
assert.equal(structured.questions?.[0]?.correctIndex, 1);
assert.equal(structured.questions?.[0]?.imageRef, "CROSSLINE_IMAGE_1");

let examId = "";
try {
  const created = await request("/admin/ai/deploy", {
    method: "POST",
    token,
    body: {
      exam: { title: `Production verification ${Date.now()}`, description: "Temporary automated verification exam.", duration: 5 },
      questions: [
        { questionNumber: 1, subject: "Mathematics", chapter: "Arithmetic", topic: "Addition", text: "What is 2 + 2?", answers: ["3", "4", "5", "6"], correctIndex: 1, marks: 2, explanation: "2 + 2 = 4.", imageFilename: "Q1.png", image: { filename: "Q1.png", mimeType: "image/png", dataUrl: tinyPng } },
        { subject: "Physics", chapter: "Units", topic: "SI units", text: "Which is the SI unit of force?", answers: ["Joule", "Pascal", "Newton", "Watt"], correctIndex: 2, marks: 1, explanation: "Force is measured in newtons." }
      ]
    }
  });
  examId = created.exam?.id || "";
  assert.ok(examId, "Temporary exam was not created.");
  assert.equal(created.deployed, 2);

  const library = await request("/admin/exams", { token });
  const exam = library.exams?.find((item) => item.id === examId);
  assert.equal(exam?.questions?.length, 2);
  assert.equal("priceCents" in exam, false);
  assert.equal("currency" in exam, false);
  assert.deepEqual(exam.questions.map((question) => question.correctIndex), [1, 2]);
  assert.deepEqual(exam.questions.map((question) => question.marks), [2, 1]);
  assert.equal(exam.questions[0].image, tinyPng);
  assert.equal(exam.questions[0].chapter, "Sets and Inequalities");
  assert.equal(exam.questions[1].chapter, "Forces and Newton's Laws of Motion");
} finally {
  if (examId) await request(`/admin/exams/${encodeURIComponent(examId)}`, { method: "DELETE", token }).catch(() => {});
}

console.log("Production backend verification passed: OpenCode/GLM 5.2, taxonomy, free exam access, and atomic exam deployment are live.");
