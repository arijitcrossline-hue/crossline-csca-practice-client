import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ACCESS_PLANS } from "../worker/src/index.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const renderer = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const api = fs.readFileSync(path.join(root, "src", "api.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "worker", "migrations", "0020_student_access_plans.sql"), "utf8");

assert.deepEqual(ACCESS_PLANS.map((plan) => [plan.id, plan.mockLimit]), [
  ["free", 1],
  ["past-plus-3", 3],
  ["past-plus-5", 5]
]);
assert.deepEqual(ACCESS_PLANS.find((plan) => plan.id === "past-plus-3").subjectPrices, {
  1: 17,
  2: 27,
  3: 34.99,
  4: 40
});
assert.deepEqual(ACCESS_PLANS.find((plan) => plan.id === "past-plus-5").subjectPrices, {
  1: 27,
  2: 47,
  3: 59,
  4: 67
});
for (const plan of ACCESS_PLANS) assert.match(renderer, new RegExp(plan.id.replaceAll("-", "\\-")));
assert.match(renderer, /canStart: exam\.canStart !== false/);
assert.doesNotMatch(renderer, /canStart: exam\.canStart !== false && priceCents === 0/);
assert.match(api, /adminStudentPlans/);
assert.match(api, /grantStudentPlan/);
assert.match(api, /revokeStudentPlan/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS student_plans/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS student_mock_unlocks/);

console.log("Student access plan tests passed.");
