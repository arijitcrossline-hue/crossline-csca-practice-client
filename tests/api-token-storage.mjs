import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const source = fs.readFileSync(path.join(process.cwd(), "src", "api.js"), "utf8");

function createApi({ secure = false, vault = new Map() } = {}) {
  const calls = [];
  const dom = new JSDOM("<!doctype html><body></body>", {
    runScripts: "dangerously",
    url: "https://app.crosslinecscatest.com",
    beforeParse(window) {
      window.CROSSLINE_API_BASE = "https://api.crosslinecscatest.com";
      if (secure) {
        window.examRuntime = {
          secureTokenGet: async (slot) => vault.get(slot) || "",
          secureTokenSet: async (slot, token) => {
            calls.push({ slot, token });
            if (token) vault.set(slot, token);
            else vault.delete(slot);
          }
        };
      }
    }
  });
  dom.window.eval(source);
  return { dom, api: dom.window.CrosslineApi, calls, vault };
}

const browser = createApi();
browser.api.setStudentToken("persistent-token", true);
assert.equal(browser.dom.window.localStorage.getItem("crossline-api-token"), "persistent-token");
assert.equal(browser.dom.window.sessionStorage.getItem("crossline-api-token"), null);
browser.api.setStudentToken("session-token", false);
assert.equal(browser.dom.window.localStorage.getItem("crossline-api-token"), null);
assert.equal(browser.dom.window.sessionStorage.getItem("crossline-api-token"), "session-token");
browser.api.clearStudentToken();
assert.equal(browser.api.getStudentToken(), "");
browser.dom.window.close();

const vault = new Map();
const desktop = createApi({ secure: true, vault });
desktop.api.setStudentToken("remember-me", true);
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(vault.get("student"), "remember-me");
desktop.api.setStudentToken("memory-only", false);
assert.equal(desktop.api.getStudentToken(), "memory-only");
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(vault.has("student"), false);
desktop.dom.window.close();

const restarted = createApi({ secure: true, vault });
assert.equal(await restarted.api.getStudentTokenAsync(), "");
restarted.dom.window.close();

console.log("API token storage tests passed.");
