const fs = require("node:fs");
const path = require("node:path");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT || 8080);
const STORAGE_DIR = process.env.STORAGE_DIR || "/var/crossline-media";
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(STORAGE_DIR, "downloads");
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

fs.mkdirSync(STORAGE_DIR, { recursive: true });
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", allowedCorsOrigin(request));
  response.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "range");
  if (request.method === "OPTIONS") return response.sendStatus(204);
  next();
});

app.get("/health", (request, response) => {
  response.json({ ok: true, service: "crossline-download-server" });
});

app.get("/downloads/:filename", (request, response) => {
  const filename = cleanSegment(request.params.filename);
  if (!filename || !filename.endsWith(".exe")) {
    return response.status(404).json({ error: "Download not found." });
  }

  const filePath = path.join(DOWNLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return response.status(404).json({ error: "Download not found." });
  }

  response.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  response.setHeader("Content-Type", "application/vnd.microsoft.portable-executable");
  response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  response.sendFile(filePath);
});

app.get("/updates/latest.json", (request, response) => {
  const filePath = path.join(DOWNLOAD_DIR, "latest.json");
  if (!fs.existsSync(filePath)) {
    return response.status(404).json({ error: "Update metadata not found." });
  }
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.sendFile(filePath);
});

app.get("/updates/:filename", (request, response) => {
  const filename = cleanSegment(request.params.filename);
  if (!filename || !/\.(ya?ml|exe|blockmap|json|zip)$/i.test(filename)) {
    return response.status(404).json({ error: "Update file not found." });
  }
  const filePath = path.join(DOWNLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return response.status(404).json({ error: "Update file not found." });
  }
  response.setHeader("Content-Type", updateContentType(filename));
  response.sendFile(filePath);
});

function cleanSegment(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_.-]/g, "");
}

function allowedCorsOrigin(request) {
  const origin = request.headers.origin || "";
  if (ALLOWED_ORIGIN === "*") return "*";
  const allowed = ALLOWED_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean);
  if (origin === "null") return "null";
  if (origin && allowed.includes(origin)) return origin;
  return allowed[0] || "*";
}

function updateContentType(filename = "") {
  if (filename.endsWith(".yml") || filename.endsWith(".yaml")) return "text/yaml; charset=utf-8";
  if (filename.endsWith(".json")) return "application/json; charset=utf-8";
  if (filename.endsWith(".zip")) return "application/zip";
  if (filename.endsWith(".exe")) return "application/vnd.microsoft.portable-executable";
  return "application/octet-stream";
}

app.listen(PORT, () => {
  console.log(`Crossline download server listening on ${PORT}, serving files from ${DOWNLOAD_DIR}`);
});
