import assert from "node:assert/strict";
import { buildPasswordResetEmail, buildVerificationEmail } from "../worker/src/transactional-email.mjs";

const verification = buildVerificationEmail({ code: "123456", appUrl: "https://exam.crosslinecscatest.com" });
assert.equal(verification.subject, "Verify your Crossline Education account");
assert.match(verification.html, /Crossline Education/);
assert.match(verification.html, /crossline-icon\.png/);
assert.match(verification.html, />123456</);
assert.match(verification.html, /expires in 15 minutes/i);
assert.match(verification.text, /123456/);
assert.doesNotMatch(verification.html, /border-(?:top|right|bottom|left):(?:3|4)px/);

const reset = buildPasswordResetEmail({ code: "654321" });
assert.equal(reset.subject, "Reset your Crossline Education password");
assert.match(reset.html, />654321</);
assert.match(reset.html, /did not request a reset/i);
assert.match(reset.text, /safely ignore this email/i);

const escaped = buildVerificationEmail({ code: "12<34>56", appUrl: "javascript:bad" });
assert.doesNotMatch(escaped.html, /javascript:/);
assert.match(escaped.html, /123456/);

console.log("Transactional email renderer tests passed.");
