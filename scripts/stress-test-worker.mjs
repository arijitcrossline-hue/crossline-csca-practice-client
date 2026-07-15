#!/usr/bin/env node

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(`
Crossline API stress test

Environment variables:
  CROSSLINE_API_BASE      API URL. Default: https://api.crosslinecscatest.com
  STRESS_USERS            Number of simulated users. Default: 50
  STRESS_CONCURRENCY      Max parallel requests. Default: 20
  STRESS_REPEAT           Rounds per simulated user. Default: 2
  STRESS_EMAIL            Optional student email for login + /exams test
  STRESS_PASSWORD         Optional student password for login + /exams test
  STRESS_ADMIN_EMAIL      Optional administrator email for /admin/login + /admin/exams
  STRESS_ADMIN_PASSWORD   Optional administrator password
  STRESS_EXAM_ID          Optional exam ID to exercise session creation (writes data)
  STRESS_ALLOW_WRITES     Set to true before STRESS_EXAM_ID is accepted
  STRESS_ALLOW_AUTH       Set to true before an authenticated production test runs

Examples:
  npm run stress:api
  STRESS_USERS=100 STRESS_CONCURRENCY=25 STRESS_REPEAT=1 npm run stress:api
  STRESS_ALLOW_AUTH=true STRESS_EMAIL=student@example.com STRESS_PASSWORD=demo123 npm run stress:api
  STRESS_ALLOW_AUTH=true STRESS_ALLOW_WRITES=true STRESS_EXAM_ID=exam-id STRESS_EMAIL=student@example.com STRESS_PASSWORD=demo123 npm run stress:api
`);
  process.exit(0);
}

const baseUrl = (process.env.CROSSLINE_API_BASE || "https://api.crosslinecscatest.com").replace(/\/$/, "");
const users = positiveInt(process.env.STRESS_USERS, 50);
const concurrency = positiveInt(process.env.STRESS_CONCURRENCY, 20);
const email = process.env.STRESS_EMAIL || "";
const password = process.env.STRESS_PASSWORD || "";
const adminEmail = process.env.STRESS_ADMIN_EMAIL || "";
const adminPassword = process.env.STRESS_ADMIN_PASSWORD || "";
const useStudentAuth = Boolean(email && password);
const useAdminAuth = Boolean(adminEmail && adminPassword);
const useAuth = useStudentAuth || useAdminAuth;
const repeat = positiveInt(process.env.STRESS_REPEAT, useAuth ? 1 : 2);
const examId = process.env.STRESS_EXAM_ID || "";
const allowAuth = String(process.env.STRESS_ALLOW_AUTH || "").toLowerCase() === "true";
const allowWrites = String(process.env.STRESS_ALLOW_WRITES || "").toLowerCase() === "true";
const jobs = [];
const results = [];

if (users > 100 && !args.has("--allow-over-100")) {
  console.error("Refusing more than 100 simulated users without --allow-over-100.");
  process.exit(2);
}
if (useAuth && baseUrl.includes("crosslinecscatest.com") && !allowAuth) {
  console.error("Refusing an authenticated production test. Set STRESS_ALLOW_AUTH=true after choosing a quiet test window.");
  process.exit(2);
}
if (examId && !allowWrites) {
  console.error("STRESS_EXAM_ID creates practice sessions. Set STRESS_ALLOW_WRITES=true to allow this write test.");
  process.exit(2);
}

for (let userIndex = 0; userIndex < users; userIndex += 1) {
  for (let round = 0; round < repeat; round += 1) {
    jobs.push(() => runScenario(userIndex, round));
  }
}

console.log(`Stress testing ${baseUrl}`);
console.log(`Users: ${users}, repeat: ${repeat}, requests/scenarios: ${jobs.length}, concurrency: ${concurrency}`);
console.log(useStudentAuth ? `Scenario: /health -> /auth/login -> /exams${examId ? " -> /sessions" : ""}` : useAdminAuth ? "Scenario: /health -> /admin/login -> /admin/exams" : "Scenario: /health only. Set student or admin stress credentials to include authenticated reads.");

await runPool(jobs, concurrency);
printSummary(results);

async function runScenario(userIndex, round) {
  await timed("health", () => request("/health"));
  if (useAdminAuth) {
    const login = await timed("admin-login", () => request("/admin/login", { method: "POST", body: { email: adminEmail, password: adminPassword } }));
    if (login.ok && login.payload?.token) await timed("admin-exams", () => request("/admin/exams", { headers: { authorization: `Bearer ${login.payload.token}` } }));
    else results.push({ route: "admin-exams", ok: false, status: 0, ms: 0, error: `Skipped after failed admin login for user ${userIndex}, round ${round}` });
    return;
  }
  if (!useStudentAuth) return;
  const login = await timed("login", () => request("/auth/login", {
    method: "POST",
    body: { email, password }
  }));
  if (login.ok && login.payload?.token) {
    await timed("exams", () => request("/exams", {
      headers: { authorization: `Bearer ${login.payload.token}` }
    }));
    if (examId) {
      await timed("create-session", () => request("/sessions", {
        method: "POST",
        headers: { authorization: `Bearer ${login.payload.token}` },
        body: { examId }
      }));
    }
  } else {
    results.push({ route: "exams", ok: false, status: 0, ms: 0, error: `Skipped after failed login for user ${userIndex}, round ${round}` });
  }
}

async function timed(route, task) {
  const startedAt = performance.now();
  try {
    const payload = await task();
    const ms = performance.now() - startedAt;
    results.push({ route, ok: payload.ok, status: payload.status, ms, error: payload.error || "" });
    return payload;
  } catch (error) {
    const ms = performance.now() - startedAt;
    results.push({ route, ok: false, status: 0, ms, error: error.message });
    return { ok: false, status: 0, error: error.message };
  }
}

async function request(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch {}
  return {
    ok: response.ok,
    status: response.status,
    payload,
    error: response.ok ? "" : payload.error || response.statusText
  };
}

async function runPool(queue, size) {
  let index = 0;
  const workers = Array.from({ length: Math.min(size, queue.length) }, async () => {
    while (index < queue.length) {
      const job = queue[index];
      index += 1;
      await job();
    }
  });
  await Promise.all(workers);
}

function printSummary(rows) {
  const total = rows.length;
  const failures = rows.filter((row) => !row.ok);
  const byRoute = Map.groupBy ? Map.groupBy(rows, (row) => row.route) : groupBy(rows, (row) => row.route);
  console.log("\nSummary");
  console.log(`Total requests: ${total}`);
  console.log(`Success: ${total - failures.length}`);
  console.log(`Failures: ${failures.length}`);
  for (const [route, routeRows] of byRoute.entries()) {
    const latencies = routeRows.map((row) => row.ms).sort((a, b) => a - b);
    const statuses = routeRows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    console.log(`${route}: count=${routeRows.length}, p50=${percentile(latencies, 50)}ms, p95=${percentile(latencies, 95)}ms, p99=${percentile(latencies, 99)}ms, statuses=${JSON.stringify(statuses)}`);
  }
  if (failures.length) {
    console.log("\nFirst failures");
    failures.slice(0, 10).forEach((failure) => {
      console.log(`${failure.route}: status=${failure.status}, error=${failure.error}`);
    });
    process.exitCode = 1;
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const index = Math.min(values.length - 1, Math.ceil((p / 100) * values.length) - 1);
  return Math.round(values[index]);
}

function positiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function groupBy(items, keyFn) {
  const grouped = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  return grouped;
}
