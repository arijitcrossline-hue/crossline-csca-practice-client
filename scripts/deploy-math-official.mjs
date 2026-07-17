#!/usr/bin/env node
/**
 * Deploy Math official question JSON banks to production via /admin/ai/deploy.
 * Usage: node scripts/deploy-math-official.mjs [zipOrDir]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceArg = process.argv[2] || "/Users/arijitbhowmik/Downloads/Math official questions.zip";
const API = process.env.CROSSLINE_API_ORIGIN || "https://api.crosslinecscatest.com";
const ADMIN_USER_ID = "4cf7cdbb-427a-4bf8-ab8c-72447e9f8f44";
const LETTER = { A: 0, B: 1, C: 2, D: 3 };

const MONTH_META = {
  january: { title: "Mathematics January Exam", description: "Official CSCA Mathematics practice paper for January." },
  march: { title: "Mathematics March Exam", description: "Official CSCA Mathematics practice paper for March." },
  april: { title: "Mathematics April Exam", description: "Official CSCA Mathematics practice paper for April." },
  october: { title: "Mathematics October Exam", description: "Official CSCA Mathematics practice paper for October." },
  december: { title: "Mathematics December Exam", description: "Official CSCA Mathematics practice paper for December." }
};

function escapeSql(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function wranglerSql(command) {
  const raw = execFileSync("npx", ["wrangler", "d1", "execute", "crossline-mocks", "--remote", "--json", "--command", command], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  return JSON.parse(raw);
}

function extractDir(sourcePath) {
  const resolved = path.resolve(sourcePath);
  if (fs.statSync(resolved).isDirectory()) return resolved;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "math-official-"));
  execFileSync("unzip", ["-o", resolved, "-d", dir], { stdio: "pipe" });
  return dir;
}

function normalizeQuestion(raw, fileKey) {
  const text = String(raw.q || "").trim();
  const answers = Array.isArray(raw.opts) ? raw.opts.map((item) => String(item ?? "").trim()) : [];
  let correctLetter = String(raw.correct || "").trim().toUpperCase();

  // Known source repair: Dec Q7 — (A) and (C) are equal; keep the simplified √2 form.
  if (fileKey === "december" && Number(raw.n) === 7 && !correctLetter) correctLetter = "C";

  const correctIndex = LETTER[correctLetter];
  if (!text || answers.length !== 4 || answers.some((answer) => !answer) || !Number.isInteger(correctIndex)) {
    return { skipped: true, reason: `Q${raw.n}: missing text, options, or unique correct answer`, n: raw.n };
  }

  return {
    skipped: false,
    question: {
      type: "Single choice",
      subject: "Mathematics",
      chapter: "",
      topic: "",
      instruction: "Choose the best answer.",
      text,
      answers,
      correctIndex,
      marks: Number(raw.m) || 1,
      explanation: String(raw.explanation || "").trim(),
      image: "",
      diagram: false
    },
    n: raw.n
  };
}

function loadBank(filePath) {
  const key = path.basename(filePath, ".json").toLowerCase();
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const list = Array.isArray(raw) ? raw : Object.values(raw);
  const questions = [];
  const skipped = [];
  for (const item of list.sort((a, b) => Number(a.n) - Number(b.n))) {
    const result = normalizeQuestion(item, key);
    if (result.skipped) skipped.push(result);
    else questions.push(result.question);
  }
  const meta = MONTH_META[key] || {
    title: `Mathematics ${key[0].toUpperCase()}${key.slice(1)} Exam`,
    description: `Official CSCA Mathematics practice paper (${key}).`
  };
  return { key, ...meta, questions, skipped, sourceCount: list.length };
}

async function mintAdminToken() {
  const token = `${randomUUID()}.${randomUUID()}`;
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  wranglerSql(`INSERT INTO sessions (token, user_id, role, expires_at, created_at) VALUES ('${escapeSql(token)}', '${escapeSql(ADMIN_USER_ID)}', 'admin', '${escapeSql(expires)}', '${escapeSql(now)}')`);
  return token;
}

async function deployExam(token, bank) {
  const response = await fetch(`${API}/admin/ai/deploy`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      exam: {
        title: bank.title,
        description: bank.description,
        duration: 90,
        subject: "Mathematics",
        free: true
      },
      questions: bank.questions
    })
  });
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { payload = { error: text.slice(0, 500) }; }
  if (!response.ok) throw new Error(`${bank.title}: ${payload.error || response.status}`);
  return payload;
}

const dir = extractDir(sourceArg);
const files = fs.readdirSync(dir).filter((name) => name.toLowerCase().endsWith(".json")).sort();
if (!files.length) throw new Error(`No JSON banks found in ${dir}`);

const banks = files.map((name) => loadBank(path.join(dir, name)));
console.log(JSON.stringify(banks.map((bank) => ({
  file: bank.key,
  title: bank.title,
  sourceCount: bank.sourceCount,
  deployCount: bank.questions.length,
  skipped: bank.skipped
})), null, 2));

const token = await mintAdminToken();
const results = [];
for (const bank of banks) {
  if (!bank.questions.length) {
    results.push({ title: bank.title, error: "No deployable questions" });
    continue;
  }
  const payload = await deployExam(token, bank);
  results.push({
    title: bank.title,
    examId: payload.exam?.id,
    deployed: payload.deployed,
    skipped: bank.skipped.map((item) => item.reason)
  });
  console.log(`Deployed ${bank.title}: ${payload.deployed} questions (${payload.exam?.id})`);
}

console.log(JSON.stringify({ ok: true, results }, null, 2));
