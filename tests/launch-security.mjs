import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workerSource = fs.readFileSync(path.join(root, "worker/src/index.js"), "utf8");
const uploadedQuestionImages = new Map();
const mf = new Miniflare({
  modules: true,
  unsafeTriggerHandlers: true,
  scriptPath: path.join(root, "worker/src/index.js"),
  compatibilityDate: "2026-06-01",
  d1Databases: { DB: "launch-security" },
  serviceBindings: {
    async QUESTION_IMAGE_UPLOAD(request) {
      assert.equal(request.method, "PUT");
      assert.equal(request.headers.get("x-crossline-media-secret"), "test-media-upload-secret-that-is-at-least-thirty-two-characters");
      uploadedQuestionImages.set(new URL(request.url).pathname, {
        contentType: request.headers.get("content-type"),
        bytes: new Uint8Array(await request.arrayBuffer())
      });
      return new Response(JSON.stringify({ stored: true }), { status: 201, headers: { "content-type": "application/json" } });
    }
  },
  bindings: {
    APP_ORIGIN: "https://exam.crosslinecscatest.com",
    CONNECT_ORIGIN: "https://api.crosslinecscatest.com",
    PASSWORD_PEPPER: "test-password-pepper-that-is-at-least-thirty-two-characters",
    SESSION_TOKEN_SECRET: "test-session-secret-that-is-at-least-thirty-two-characters",
    OAUTH_STATE_SECRET: "test-oauth-secret-that-is-at-least-thirty-two-characters",
    MAINTENANCE_SECRET: "test-maintenance-secret-that-is-at-least-thirty-two-characters",
    MEDIA_UPLOAD_SECRET: "test-media-upload-secret-that-is-at-least-thirty-two-characters",
    QUESTION_IMAGE_UPLOAD_URL: "https://media.crosslinecscatest.com/internal/question-images",
    QUESTION_IMAGE_ORIGIN: "https://media.crosslinecscatest.com",
    EMAIL_DELIVERY_MODE: "log",
    DISABLE_RATE_LIMIT: "true"
  }
});

const db = await mf.getD1Database("DB");
const schema = fs.readFileSync(path.join(root, "worker/schema.sql"), "utf8");
for (const statement of schema.split(/;\s*(?:\n|$)/).map((value) => value.trim()).filter(Boolean)) await db.prepare(statement).run();

let maintenance = await mf.dispatchFetch("https://api.crosslinecscatest.com/internal/maintenance", { method: "POST" });
assert.equal(maintenance.status, 404);
maintenance = await mf.dispatchFetch("https://api.crosslinecscatest.com/internal/maintenance", {
  method: "POST",
  headers: { "x-crossline-maintenance-secret": "test-maintenance-secret-that-is-at-least-thirty-two-characters" }
});
assert.equal(maintenance.status, 200);
assert.equal((await maintenance.json()).ok, true);

async function api(pathname, { method = "GET", token = "", body } = {}) {
  const headers = { origin: "https://exam.crosslinecscatest.com" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await mf.dispatchFetch(`https://api.crosslinecscatest.com${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { response, payload: await response.json() };
}

async function hmacHex(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const account = { email: "launch-test@example.com", username: "Launch Test", password: "correct horse battery staple" };
assert.match(workerSource, /const PASSWORD_KDF_ITERATIONS = 100000;/);
let result = await api("/auth/register", { method: "POST", body: { ...account, email: "not-an-email" } });
assert.equal(result.response.status, 400);
result = await api("/auth/verification/request", { method: "POST", body: { email: "not-an-email" } });
assert.equal(result.response.status, 400);
result = await api("/auth/register", { method: "POST", body: account });
assert.equal(result.response.status, 200);
const originalVerification = await db.prepare("SELECT code_hash FROM email_verifications WHERE email = ?").bind(account.email).first();
result = await api("/auth/verification/request", { method: "POST", body: { email: "missing@example.com" } });
assert.equal(result.response.status, 200);
assert.equal(result.payload.message, "If this unverified account exists, a new code has been sent.");
result = await api("/auth/verification/request", { method: "POST", body: { email: account.email } });
assert.equal(result.response.status, 200);
assert.equal(result.payload.message, "If this unverified account exists, a new code has been sent.");
const refreshedVerification = await db.prepare("SELECT code_hash, failed_attempts FROM email_verifications WHERE email = ?").bind(account.email).first();
assert.notEqual(refreshedVerification.code_hash, originalVerification.code_hash);
assert.equal(refreshedVerification.failed_attempts, 0);
await db.prepare("UPDATE users SET verified_at = ? WHERE email = ?").bind(new Date().toISOString(), account.email).run();
await db.prepare("DELETE FROM email_verifications WHERE email = ?").bind(account.email).run();
result = await api("/auth/verification/request", { method: "POST", body: { email: account.email } });
assert.equal(result.response.status, 200);
assert.equal(result.payload.message, "If this unverified account exists, a new code has been sent.");
assert.equal(await db.prepare("SELECT email FROM email_verifications WHERE email = ?").bind(account.email).first(), null);

const original = await db.prepare("SELECT id, password_hash FROM users WHERE email = ?").bind(account.email).first();
result = await api("/auth/register", { method: "POST", body: { ...account, password: "attacker-password-that-is-long-enough" } });
assert.equal(result.response.status, 409);
const afterConflict = await db.prepare("SELECT id, password_hash, verified_at FROM users WHERE email = ?").bind(account.email).first();
assert.equal(afterConflict.id, original.id);
assert.equal(afterConflict.password_hash, original.password_hash);
assert.ok(afterConflict.verified_at);

result = await api("/auth/login", { method: "POST", body: { email: account.email, password: account.password } });
assert.equal(result.response.status, 200);
const token = result.payload.token;
assert.ok(token);
const storedSession = await db.prepare("SELECT token FROM sessions WHERE user_id = ?").bind(original.id).first();
assert.notEqual(storedSession.token, token);

const adminToken = "integration-admin-token";
const adminTokenHash = await hmacHex(adminToken, "test-session-secret-that-is-at-least-thirty-two-characters");
await db.batch([
  db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").bind(original.id),
  db.prepare("INSERT INTO sessions (token, user_id, role, expires_at, created_at) VALUES (?, ?, 'admin', ?, ?)")
    .bind(adminTokenHash, original.id, new Date(Date.now() + 3600000).toISOString(), new Date().toISOString())
]);

result = await api("/admin/exams", { method: "POST", token: adminToken, body: {
  title: "Lifecycle draft",
  description: "A draft that must be reviewed before students can see it.",
  duration: 45,
  subject: "Physics",
  category: "original"
} });
assert.equal(result.response.status, 201);
const lifecycleExamId = result.payload.exam.id;
assert.equal(result.payload.exam.published, false);

result = await api("/exams", { token });
assert.equal(result.payload.exams.some((exam) => exam.id === lifecycleExamId), false);
result = await api(`/admin/exams/${lifecycleExamId}/publish`, { method: "POST", token: adminToken });
assert.equal(result.response.status, 400);

result = await api(`/admin/exams/${lifecycleExamId}/questions`, { method: "POST", token: adminToken, body: {
  subject: "Physics",
  topic: "Kinematics",
  text: "Which option is the reviewed answer?",
  answers: ["A", "B", "C", "D"],
  correctIndex: 1,
  marks: 1,
  explanation: "B is the reviewed answer.",
  image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
} });
assert.equal(result.response.status, 201);
const lifecycleQuestionId = result.payload.questionId;
result = await api(`/admin/exams/${lifecycleExamId}/publish`, { method: "POST", token: adminToken });
assert.equal(result.response.status, 200);
result = await api("/exams", { token });
assert.equal(result.payload.exams.some((exam) => exam.id === lifecycleExamId), true);

result = await api(`/admin/exams/${lifecycleExamId}`, { method: "DELETE", token: adminToken });
assert.equal(result.response.status, 200);
result = await api("/exams", { token });
assert.equal(result.payload.exams.some((exam) => exam.id === lifecycleExamId), false);
result = await api("/admin/exams", { token: adminToken });
const archivedLifecycleExam = result.payload.exams.find((exam) => exam.id === lifecycleExamId);
assert.ok(archivedLifecycleExam.archivedAt);
assert.equal(archivedLifecycleExam.questionCount, 1);
assert.ok(archivedLifecycleExam.version >= 4);
const lifecycleQuestion = archivedLifecycleExam.questions.find((question) => question.id === lifecycleQuestionId);
assert.match(lifecycleQuestion.image, /^https:\/\/media\.crosslinecscatest\.com\/question-images\/[a-f0-9-]{36}\/question-[a-f0-9-]{36}\.png$/);
const storedImagePath = new URL(lifecycleQuestion.image.replace("/question-images/", "/internal/question-images/")).pathname;
assert.equal(uploadedQuestionImages.get(storedImagePath)?.contentType, "image/png");
assert.ok(uploadedQuestionImages.get(storedImagePath)?.bytes.length > 0);

const now = new Date().toISOString();
await db.prepare("INSERT INTO exams (id, title, description, duration_minutes, subject, category, is_published, is_free_sample, created_at, updated_at) VALUES ('secure-exam', 'Secure exam', 'Integration test', 60, 'Physics', 'official', 1, 1, ?, ?)").bind(now, now).run();
await db.prepare("INSERT INTO questions (id, exam_id, position, type, subject, chapter, topic, instruction, text, answers_json, correct_index, marks, explanation_text, created_at, updated_at) VALUES ('secure-q1', 'secure-exam', 1, 'Single choice', 'Physics', 'Motion', 'Speed', 'Choose one.', 'What is correct?', '[\"A\",\"B\",\"C\",\"D\"]', 2, 1, 'Because C is correct.', ?, ?)").bind(now, now).run();

result = await api("/exams", { token });
assert.equal(result.response.status, 200);
assert.equal(result.payload.exams[0].questionCount, 1);
assert.deepEqual(result.payload.exams[0].questions, []);
assert.equal(JSON.stringify(result.payload).includes("correctIndex"), false);
assert.equal(JSON.stringify(result.payload).includes("Because C is correct"), false);

result = await api("/sessions", { method: "POST", token, body: { examId: "secure-exam" } });
assert.equal(result.response.status, 201);
const sessionId = result.payload.sessionId;
assert.deepEqual(result.payload.exam.questions[0].answers, ["A", "B", "C", "D"]);
assert.equal("correctIndex" in result.payload.exam.questions[0], false);
assert.equal("explanation" in result.payload.exam.questions[0], false);

result = await api(`/sessions/${sessionId}/start`, { method: "POST", token });
assert.equal(result.response.status, 428);
assert.equal(result.payload.legalVersion, "2026-07-22");

result = await api("/legal/accept", { method: "POST", token, body: { version: result.payload.legalVersion } });
assert.equal(result.response.status, 200);

result = await api(`/sessions/${sessionId}/start`, { method: "POST", token });
assert.equal(result.response.status, 200);
assert.ok(result.payload.session.deadlineAt);

result = await api(`/sessions/${sessionId}/answers`, { method: "POST", token, body: { answers: { "secure-q1": 2, injected: 0 }, flags: ["secure-q1", "injected"], submitted: true } });
assert.equal(result.response.status, 200);
assert.deepEqual(result.payload.score, { earned: 1, total: 1 });
const submitted = await db.prepare("SELECT answers_json, flags_json, exam_snapshot_json FROM exam_sessions WHERE id = ?").bind(sessionId).first();
assert.deepEqual(JSON.parse(submitted.answers_json), { "secure-q1": 2 });
assert.deepEqual(JSON.parse(submitted.flags_json), ["secure-q1"]);

result = await api(`/sessions/${sessionId}/answers`, { method: "POST", token, body: { answers: { "secure-q1": 0 }, flags: [], submitted: false } });
assert.equal(result.response.status, 409);
result = await api(`/sessions/${sessionId}/answers`, { method: "POST", token, body: { answers: { "secure-q1": 0 }, flags: [], submitted: true } });
assert.equal(result.response.status, 200);
assert.equal(result.payload.alreadySubmitted, true);
assert.deepEqual(result.payload.score, { earned: 1, total: 1 });

await db.prepare("UPDATE questions SET correct_index = 0, explanation_text = 'Changed later.' WHERE id = 'secure-q1'").run();
result = await api(`/results/${sessionId}`, { token });
assert.equal(result.response.status, 200);
assert.deepEqual(result.payload.result.score, { earned: 1, total: 1 });
assert.equal(result.payload.questions[0].correctIndex, 2);
assert.equal(result.payload.questions[0].explanation, "Because C is correct.");

const timedSessionIds = [];
result = await api("/sessions", { method: "POST", token, body: { examId: "secure-exam" } });
assert.equal(result.response.status, 201);
timedSessionIds.push(result.payload.sessionId);
result = await api("/sessions", { method: "POST", token, body: { examId: "secure-exam" } });
assert.equal(result.response.status, 201);
const pendingSessionId = result.payload.sessionId;
result = await api(`/sessions/${timedSessionIds[0]}/start`, { method: "POST", token });
assert.equal(result.response.status, 200);
result = await api(`/sessions/${pendingSessionId}/start`, { method: "POST", token });
assert.equal(result.response.status, 409);
assert.equal(result.payload.activeSessionId, timedSessionIds[0]);
result = await api(`/sessions/${timedSessionIds[0]}/answers`, { method: "POST", token, body: { answers: { "secure-q1": 0 }, flags: ["secure-q1"], submitted: false } });
assert.equal(result.response.status, 200);
result = await api("/sessions/active", { token });
assert.equal(result.response.status, 200);
assert.equal(result.payload.session.id, timedSessionIds[0]);
assert.deepEqual(result.payload.answers, { "secure-q1": 0 });
assert.deepEqual(result.payload.flags, ["secure-q1"]);
assert.equal("correctIndex" in result.payload.exam.questions[0], false);
result = await api("/sessions", { method: "POST", token, body: { examId: "secure-exam" } });
assert.equal(result.response.status, 409);
await db.prepare("UPDATE exam_sessions SET deadline_at = ? WHERE id = ?").bind(new Date(Date.now() - 1000).toISOString(), timedSessionIds[0]).run();
const timeoutScheduledResponse = await mf.dispatchFetch("http://localhost/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*");
assert.equal(timeoutScheduledResponse.status, 200);
timedSessionIds.push(pendingSessionId);
result = await api(`/sessions/${pendingSessionId}/start`, { method: "POST", token });
assert.equal(result.response.status, 200);
await db.prepare("UPDATE exam_sessions SET deadline_at = ? WHERE id = ?").bind(new Date(Date.now() - 1000).toISOString(), timedSessionIds[1]).run();
const secondTimeoutResponse = await mf.dispatchFetch("http://localhost/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*");
assert.equal(secondTimeoutResponse.status, 200);
const timedSessions = await db.prepare("SELECT submitted_at, score_earned, score_total FROM exam_sessions WHERE id IN (?, ?) ORDER BY id").bind(...timedSessionIds).all();
assert.equal(timedSessions.results.every((session) => Boolean(session.submitted_at)), true);
assert.equal(timedSessions.results.some((session) => Number(session.score_earned) === 1 && Number(session.score_total) === 1), true);
result = await api("/sessions", { method: "POST", token, body: { examId: "secure-exam" } });
assert.equal(result.response.status, 409);

await db.prepare("UPDATE users SET is_admin = 0 WHERE id = ?").bind(original.id).run();
result = await api("/auth/deletion", { method: "POST", token, body: { confirmation: "delete" } });
assert.equal(result.response.status, 400);
result = await api("/auth/deletion", { method: "POST", token, body: { confirmation: "DELETE" } });
assert.equal(result.response.status, 200);
assert.equal(result.payload.emailSent, true);
assert.ok(await db.prepare("SELECT user_id FROM account_deletion_requests WHERE user_id = ?").bind(original.id).first());
result = await api("/auth/deletion", { method: "DELETE", token });
assert.equal(result.response.status, 200);
assert.equal(await db.prepare("SELECT user_id FROM account_deletion_requests WHERE user_id = ?").bind(original.id).first(), null);
result = await api("/auth/deletion", { method: "POST", token, body: { confirmation: "DELETE" } });
assert.equal(result.response.status, 200);
await db.prepare("UPDATE account_deletion_requests SET scheduled_for = ? WHERE user_id = ?").bind(new Date(Date.now() - 1000).toISOString(), original.id).run();
const scheduledResponse = await mf.dispatchFetch("http://localhost/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*");
assert.equal(scheduledResponse.status, 200);
assert.equal(await db.prepare("SELECT id FROM users WHERE id = ?").bind(original.id).first(), null);

await api("/auth/logout", { method: "POST", token });
result = await api("/auth/me", { token });
assert.equal(result.response.status, 401);

await mf.dispose();
console.log("Launch security integration tests passed.");
