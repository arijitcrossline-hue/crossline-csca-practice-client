import http from "node:http";
import crypto from "node:crypto";

const port = Number(process.env.RELAY_PORT || 8090);
const relaySecret = String(process.env.OPENCODE_RELAY_SECRET || "");
const serverUrl = String(process.env.OPENCODE_SERVER_URL || "http://127.0.0.1:4096").replace(/\/$/, "");
const serverUser = String(process.env.OPENCODE_SERVER_USERNAME || "opencode");
const serverPassword = String(process.env.OPENCODE_SERVER_PASSWORD || "");
const providerID = String(process.env.OPENCODE_PROVIDER_ID || "glm");
const modelID = String(process.env.OPENCODE_MODEL_ID || "glm-5.2");
const maxConcurrent = Math.max(1, Number(process.env.RELAY_MAX_CONCURRENT || 4));
const maxQueue = Math.max(maxConcurrent, Number(process.env.RELAY_MAX_QUEUE || 24));
const timeoutMs = Math.max(15000, Number(process.env.RELAY_TIMEOUT_MS || 120000));
let activeRequests = 0;
const waiters = [];

if (!relaySecret || !serverPassword) throw new Error("OpenCode relay secrets are required.");

function json(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}

function secretMatches(value) {
  const incoming = Buffer.from(String(value || ""));
  const expected = Buffer.from(relaySecret);
  return incoming.length === expected.length && crypto.timingSafeEqual(incoming, expected);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 512 * 1024) throw Object.assign(new Error("Request is too large."), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); }
  catch { throw Object.assign(new Error("Request must be valid JSON."), { status: 400 }); }
}

async function acquireSlot() {
  if (activeRequests < maxConcurrent) {
    activeRequests += 1;
    return;
  }
  if (waiters.length >= maxQueue) throw Object.assign(new Error("The assistant is busy. Try again shortly."), { status: 503 });
  await new Promise((resolve) => waiters.push(resolve));
  activeRequests += 1;
}

function releaseSlot() {
  activeRequests = Math.max(0, activeRequests - 1);
  waiters.shift()?.();
}

function opencodeHeaders() {
  return {
    authorization: `Basic ${Buffer.from(`${serverUser}:${serverPassword}`).toString("base64")}`,
    "content-type": "application/json"
  };
}

async function opencode(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${serverUrl}${path}`, { ...options, headers: { ...opencodeHeaders(), ...(options.headers || {}) }, signal: controller.signal });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`OpenCode returned ${response.status}${payload?.message ? `: ${payload.message}` : ""}`);
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function transcript(messages) {
  return messages.map((message) => `${message.role === "assistant" ? "ASSISTANT" : "ADMINISTRATOR"}:\n${message.content}`).join("\n\n");
}

async function generate(body) {
  const system = String(body.system || "").trim().slice(0, 12000);
  const messages = (Array.isArray(body.messages) ? body.messages : []).slice(-16).map((message) => ({
    role: message?.role === "assistant" ? "assistant" : "user",
    content: String(message?.content || "").trim().slice(0, 240000)
  })).filter((message) => message.content);
  if (!messages.length || messages.at(-1).role !== "user") throw Object.assign(new Error("A final administrator message is required."), { status: 400 });

  await acquireSlot();
  let sessionId = "";
  try {
    const session = await opencode("/session", { method: "POST", body: JSON.stringify({ title: "Crossline admin assistant" }) });
    sessionId = String(session?.id || "");
    if (!sessionId) throw new Error("OpenCode did not create a session.");
    const response = await opencode(`/session/${encodeURIComponent(sessionId)}/message`, {
      method: "POST",
      body: JSON.stringify({
        model: { providerID, modelID },
        system,
        tools: {},
        parts: [{ type: "text", text: transcript(messages) }]
      })
    });
    const reply = (response?.parts || []).filter((part) => part?.type === "text").map((part) => part.text).join("\n").trim();
    if (!reply) throw new Error("OpenCode returned an empty response.");
    return { reply: reply.slice(0, 64000), model: modelID, runtime: "opencode" };
  } finally {
    if (sessionId) await opencode(`/session/${encodeURIComponent(sessionId)}`, { method: "DELETE" }).catch(() => {});
    releaseSlot();
  }
}

const server = http.createServer(async (request, response) => {
  try {
    if (!secretMatches(request.headers["x-crossline-relay-secret"])) return json(response, 401, { error: "Unauthorized." });
    if (request.method === "GET" && request.url === "/health") {
      const status = await opencode("/session/status", { method: "GET" });
      return json(response, 200, { ok: true, runtime: "opencode", model: modelID, activeRequests, sessions: Object.keys(status || {}).length });
    }
    if (request.method !== "POST" || request.url !== "/generate") return json(response, 404, { error: "Not found." });
    return json(response, 200, await generate(await readJson(request)));
  } catch (error) {
    console.error(error);
    return json(response, Number(error.status || 502), { error: error.status ? error.message : "The OpenCode assistant is temporarily unavailable." });
  }
});

server.listen(port, "127.0.0.1", () => console.log(`Crossline OpenCode relay listening on 127.0.0.1:${port}`));
