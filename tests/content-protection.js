const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createContentProtectionController } = require("../electron/content-protection");

async function run() {
  const protectionCalls = [];
  const timers = [];
  const window = {
    isDestroyed: () => false,
    setContentProtection: (value) => protectionCalls.push(value)
  };
  const controller = createContentProtectionController({
    getWindow: () => window,
    authorizeAdmin: async (token) => token === "verified-admin" ? { authorized: true, allowMs: 5000 } : { authorized: false },
    setTimer: (callback, delay) => { const timer = { callback, delay, unref() {} }; timers.push(timer); return timer; },
    clearTimer: () => {}
  });

  assert.deepEqual(controller.protect(), { contentProtection: true, screenCaptureAllowed: false, expiresAt: null });
  assert.equal(protectionCalls.at(-1), true);
  await assert.rejects(() => controller.setAllowed(true, ""), /administrator session/i);
  await assert.rejects(() => controller.setAllowed(true, "student-token"), /authorization was denied/i);
  assert.equal(protectionCalls.at(-1), true);

  const allowed = await controller.setAllowed(true, "verified-admin");
  assert.equal(allowed.contentProtection, false);
  assert.equal(allowed.screenCaptureAllowed, true);
  assert.ok(allowed.expiresAt);
  assert.equal(protectionCalls.at(-1), false);
  assert.equal(timers.at(-1).delay, 5000);

  timers.at(-1).callback();
  assert.deepEqual(controller.status(), { contentProtection: true, screenCaptureAllowed: false, expiresAt: null });
  assert.equal(protectionCalls.at(-1), true);

  const root = path.join(__dirname, "..");
  const main = fs.readFileSync(path.join(root, "electron", "main.js"), "utf8");
  const preload = fs.readFileSync(path.join(root, "electron", "preload.js"), "utf8");
  const worker = fs.readFileSync(path.join(root, "worker", "src", "index.js"), "utf8");
  const renderer = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
  const startFocusGuard = main.match(/function startFocusGuard\(\) \{([\s\S]*?)\n\}/)?.[1] || "";
  const beginStudentView = renderer.match(/function beginStudentView\(view\) \{([\s\S]*?)\n\}/)?.[1] || "";
  const clearStudentSession = renderer.match(/function clearStudentSession\(\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.match(main, /set-screen-capture-allowed/);
  assert.match(main, /desktop-capture\/authorize/);
  assert.match(main, /img-src[^;]*https:\/\/api\.crosslinecscatest\.com/);
  assert.match(main, /img-src[^;]*https:\/\/media\.crosslinecscatest\.com/);
  assert.match(main, /img-src[^;]*https:\/\/lh3\.googleusercontent\.com/);
  assert.doesNotMatch(startFocusGuard, /contentProtection\.protect/);
  assert.doesNotMatch(beginStudentView, /disableAdminScreenCapture/);
  assert.match(clearStudentSession, /disableAdminScreenCapture/);
  assert.match(clearStudentSession, /clearAdminToken/);
  assert.match(preload, /setScreenCaptureAllowed/);
  assert.match(worker, /authorizeAdminDesktopCapture[\s\S]*requireAdminAccount\(request, env, "admin"\)/);
  console.log("Content protection security tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
