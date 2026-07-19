import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const worker = fs.readFileSync(path.join(root, "worker", "src", "index.js"), "utf8");
const renderer = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const api = fs.readFileSync(path.join(root, "src", "api.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "worker", "migrations", "0022_bug_reports.sql"), "utf8");

assert.match(worker, /\/support\/bug-reports/);
assert.match(worker, /\/admin\/bug-reports/);
assert.match(worker, /title\.length < 4 \|\| details\.length < 10/);
assert.match(renderer, /student-bug-report-form/);
assert.match(renderer, /showAdminBugReports/);
assert.match(api, /reportBug/);
assert.match(api, /adminBugReports/);
assert.match(api, /updateBugReport/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS bug_reports/);
assert.match(migration, /idx_bug_reports_status_created/);

console.log("Bug report workflow tests passed.");
