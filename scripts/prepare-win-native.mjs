import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(npmCommand, [
  "install",
  "--no-save",
  "--force",
  "@napi-rs/canvas-win32-x64-msvc@0.1.80"
], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    npm_config_platform: "win32",
    npm_config_arch: "x64"
  }
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`npm was terminated by ${signal}.`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
