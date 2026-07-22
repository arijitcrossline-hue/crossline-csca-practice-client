import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_EXAM_ATTEMPTS, resolveExamAccess } from "../worker/src/access-plans.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const worker = fs.readFileSync(path.join(root, "worker", "src", "index.js"), "utf8");
const renderer = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "worker", "migrations", "0021_free_sample_and_attempt_limit.sql"), "utf8");

assert.equal(MAX_EXAM_ATTEMPTS, 3);
assert.deepEqual(resolveExamAccess({ freeSample: true }), {
  included: true, canStart: true, attemptsUsed: 0, attemptsRemaining: 3, limitReached: false
});
assert.equal(resolveExamAccess({ official: true }).canStart, false);
assert.equal(resolveExamAccess({ official: true, hasPlan: true, attemptsUsed: 2 }).attemptsRemaining, 1);
assert.deepEqual(resolveExamAccess({ official: true, hasPlan: true, attemptsUsed: 3 }), {
  included: true, canStart: false, attemptsUsed: 3, attemptsRemaining: 0, limitReached: true
});
assert.equal(resolveExamAccess({ hasPlan: true, mocksRemaining: 1 }).canStart, true);
assert.equal(resolveExamAccess({ hasPlan: true, unlocked: true, attemptsUsed: 1 }).attemptsRemaining, 2);
assert.match(worker, /COUNT\(\*\) FROM exam_sessions WHERE user_id = \? AND exam_id = \? AND submitted_at IS NOT NULL/);
assert.match(worker, /You have used all \$\{MAX_EXAM_ATTEMPTS\} attempts/);
assert.match(renderer, /Attempt limit reached/);
assert.match(renderer, /Begin attempt/);
assert.match(migration, /is_free_sample/);
assert.match(migration, /ORDER BY created_at ASC/);
assert.match(migration, /idx_exams_single_free_sample/);

console.log("Free sample and exam attempt tests passed.");
