import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = fs.readFileSync(path.join(root, "src", "v2", "auth.js"), "utf8");

function portal(page, apiOverrides = {}) {
  const html = fs.readFileSync(path.join(root, "src", "v2", `${page}.html`), "utf8");
  const dom = new JSDOM(html, {
    url: `https://exam.crosslinecscatest.com/v2/${page}.html`,
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const calls = [];
  const window = dom.window;
  window.__CROSSLINE_AUTH_TEST__ = true;
  window.CROSSLINE_API_BASE = "https://api.crosslinecscatest.com";
  window.CrosslineApi = {
    enabled: () => true,
    login: async (...args) => { calls.push(["login", ...args]); return { token: "login-token", user: { email: args[0] } }; },
    register: async (...args) => { calls.push(["register", ...args]); return { ok: true }; },
    requestVerification: async (...args) => { calls.push(["verification-request", ...args]); return { ok: true }; },
    verify: async (...args) => { calls.push(["verify", ...args]); return { token: "verified-token", user: { email: args[0] } }; },
    requestPasswordReset: async (...args) => { calls.push(["reset-request", ...args]); return { ok: true }; },
    confirmPasswordReset: async (...args) => { calls.push(["reset-confirm", ...args]); return { ok: true }; },
    setStudentToken: (...args) => { calls.push(["set-token", ...args]); },
    ...apiOverrides
  };
  window.open = () => ({ closed: false, close() { this.closed = true; } });
  window.eval(script);
  return { dom, window, calls };
}

function fill(window, selector, value) {
  const input = window.document.querySelector(selector);
  input.value = value;
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
}

function submit(window, selector) {
  window.document.querySelector(selector).dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

{
  const { dom, window, calls } = portal("login");
  fill(window, "#email", "pending@example.com");
  window.document.querySelector("#resend-verification-login").click();
  await tick();
  assert.deepEqual(calls.find(([name]) => name === "verification-request"), ["verification-request", "pending@example.com"]);
  assert.ok(window.document.querySelector("#verification-form"));
  assert.match(window.document.body.textContent, /If this unverified account exists/);
  dom.window.close();
}

{
  const { dom, window, calls } = portal("login");
  fill(window, "#email", "student@example.com");
  fill(window, "#password", "secret12");
  window.document.querySelector("#remember-session").checked = false;
  submit(window, "#login-form");
  await tick();
  assert.deepEqual(calls.find(([name]) => name === "login"), ["login", "student@example.com", "secret12"]);
  assert.deepEqual(calls.find(([name]) => name === "set-token"), ["set-token", "login-token", false]);
  assert.equal(window.__crosslineAuthRedirect, "/?auth=complete");
  dom.window.close();
}

{
  const { dom, window, calls } = portal("login");
  window.document.querySelector("#forgot").click();
  fill(window, "#reset-email", "student@example.com");
  submit(window, "#reset-request-form");
  await tick();
  assert.deepEqual(calls.find(([name]) => name === "reset-request"), ["reset-request", "student@example.com"]);
  fill(window, "#reset-code", "123456");
  fill(window, "#reset-password", "new-secret12");
  fill(window, "#reset-confirm-password", "new-secret12");
  submit(window, "#reset-confirm-form");
  await tick();
  assert.deepEqual(calls.find(([name]) => name === "reset-confirm"), ["reset-confirm", "student@example.com", "123456", "new-secret12"]);
  assert.match(window.document.body.textContent, /Password updated/);
  dom.window.close();
}

{
  const { dom, window, calls } = portal("create-account");
  assert.equal(window.document.querySelector("#first-name").placeholder, "Alex");
  assert.equal(window.document.querySelector("#last-name").placeholder, "Taylor");
  assert.equal(window.document.querySelector("#username").placeholder, "Example: alex.student");
  fill(window, "#first-name", "Arijit");
  fill(window, "#last-name", "Bhowmik");
  fill(window, "#username", "Arijit");
  fill(window, "#email", "new.student@example.com");
  fill(window, "#password", "secure-pass-12");
  submit(window, "#register-form");
  await tick();
  assert.equal(calls.find(([name]) => name === "register")[1], "new.student@example.com");
  assert.ok(window.document.querySelector("#verification-form"));
  window.document.querySelector("#resend-verification").click();
  await tick();
  assert.deepEqual(calls.find(([name]) => name === "verification-request"), ["verification-request", "new.student@example.com"]);
  fill(window, "#verification-code", "246810");
  submit(window, "#verification-form");
  await tick();
  assert.deepEqual(calls.find(([name]) => name === "verify"), ["verify", "new.student@example.com", "246810"]);
  assert.deepEqual(calls.find(([name]) => name === "set-token"), ["set-token", "verified-token", true]);
  assert.match(window.document.body.textContent, /Continue in the Windows app/);
  assert.equal(window.document.querySelector("#continue-dashboard"), null);
  assert.match(window.document.querySelector(".account-actions a").href, /Crossline-CSCA-Practice-Setup\.exe/);
  dom.window.close();
}

{
  let openedUrl = "";
  const { dom, window, calls } = portal("login");
  const popup = { closed: false, close() { this.closed = true; } };
  window.open = (url) => { openedUrl = url; return popup; };
  window.document.querySelector("#google-auth").click();
  assert.equal(openedUrl, "https://api.crosslinecscatest.com/auth/oauth/google/start");
  window.dispatchEvent(new window.MessageEvent("message", {
    origin: "https://api.crosslinecscatest.com",
    data: { type: "crossline-oauth-complete", token: "google-token", user: { email: "google@example.com" } }
  }));
  assert.deepEqual(calls.find(([name]) => name === "set-token"), ["set-token", "google-token", true]);
  assert.equal(window.__crosslineAuthRedirect, "/?auth=complete");
  assert.equal(popup.closed, true);
  dom.window.close();
}

console.log("Standalone landing auth tests passed.");
