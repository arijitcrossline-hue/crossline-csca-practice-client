import assert from "node:assert/strict";
import { buildResultEmail } from "../worker/src/result-email.mjs";

const best = buildResultEmail({
  studentName: "Arijit <Admin>",
  subject: "Physics",
  examTitle: "January Physics Official Examination",
  earned: 94,
  total: 100,
  percent: 94,
  rank: 1,
  participants: 18,
  previousBest: 82,
  improvement: 12,
  isPersonalBest: true,
  submittedAt: "2026-01-25T08:30:00.000Z",
  appUrl: "https://exam.crosslinecscatest.com"
});

assert.equal(best.subject, "New Physics personal best: 94/100");
assert.match(best.html, /crossline-icon\.png/);
assert.match(best.html, /Arijit &lt;Admin&gt;/);
assert.doesNotMatch(best.html, /Arijit <Admin>/);
assert.match(best.html, /#1 of 18/);
assert.match(best.html, /\+12 pts/);
assert.match(best.html, /Previous best: 82%/);
assert.doesNotMatch(best.html, /border-(?:top|right|bottom|left):(?:3|4)px/);
assert.match(best.text, /Position: #1 of 18/);
assert.match(best.text, /New Physics best: \+12 pts/);

const first = buildResultEmail({
  studentName: "Student",
  subject: "Physics",
  earned: 75,
  total: 100,
  percent: 75,
  rank: 4,
  participants: 10,
  previousBest: null
});

assert.match(first.html, /First Physics score/);
assert.match(first.html, /Your new starting point/);
assert.match(first.text, /First Physics score: 75%/);

console.log("Result email renderer tests passed.");
