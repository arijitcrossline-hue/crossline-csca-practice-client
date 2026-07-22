const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT || 8080);
const STORAGE_DIR = process.env.STORAGE_DIR || "/var/crossline-media";
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(STORAGE_DIR, "downloads");
const QUESTION_IMAGE_DIR = process.env.QUESTION_IMAGE_DIR || path.join(STORAGE_DIR, "question-images");
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const MEDIA_UPLOAD_SECRET = String(process.env.MEDIA_UPLOAD_SECRET || "");
const MAX_QUESTION_IMAGE_BYTES = 800 * 1024;

fs.mkdirSync(STORAGE_DIR, { recursive: true });
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
fs.mkdirSync(QUESTION_IMAGE_DIR, { recursive: true });

app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", allowedCorsOrigin(request));
  response.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "range");
  if (request.method === "OPTIONS") return response.sendStatus(204);
  next();
});

app.get("/health", (request, response) => {
  response.json({ ok: true, service: "crossline-media-server", questionImages: "ready" });
});

app.put(
  "/internal/question-images/:questionId/:filename",
  requireMediaUpload,
  express.raw({ type: ["image/png", "image/jpeg", "image/webp"], limit: MAX_QUESTION_IMAGE_BYTES }),
  async (request, response) => {
    const questionId = String(request.params.questionId || "");
    const filename = String(request.params.filename || "");
    if (!/^[a-f0-9-]{36}$/i.test(questionId) || !/^(?:question|explanation)-[a-f0-9-]{36}\.(?:png|jpg|webp)$/i.test(filename)) {
      return response.status(404).json({ error: "Image path is invalid." });
    }

    const bytes = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
    const contentType = String(request.get("content-type") || "").toLowerCase().split(";")[0];
    if (!bytes.length || bytes.length > MAX_QUESTION_IMAGE_BYTES || !validImageBytes(bytes, contentType, filename)) {
      return response.status(400).json({ error: "Image must be a valid PNG, JPEG, or WebP file no larger than 800 KB." });
    }

    const directory = path.join(QUESTION_IMAGE_DIR, questionId);
    const filePath = path.join(directory, filename);
    await fs.promises.mkdir(directory, { recursive: true, mode: 0o750 });
    try {
      await fs.promises.writeFile(filePath, bytes, { flag: "wx", mode: 0o640 });
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const existing = await fs.promises.readFile(filePath);
      if (!crypto.timingSafeEqual(crypto.createHash("sha256").update(existing).digest(), crypto.createHash("sha256").update(bytes).digest())) {
        return response.status(409).json({ error: "Image already exists." });
      }
    }
    return response.status(201).json({ stored: true });
  }
);

app.get("/question-images/:questionId/:filename", (request, response) => {
  const questionId = String(request.params.questionId || "");
  const filename = String(request.params.filename || "");
  if (!/^[a-f0-9-]{36}$/i.test(questionId) || !/^(?:question|explanation)-[a-f0-9-]{36}\.(?:png|jpg|webp)$/i.test(filename)) {
    return response.status(404).json({ error: "Image not found." });
  }
  const filePath = path.join(QUESTION_IMAGE_DIR, questionId, filename);
  if (!fs.existsSync(filePath)) return response.status(404).json({ error: "Image not found." });
  response.setHeader("Content-Type", imageContentType(filename));
  response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  response.setHeader("Content-Security-Policy", "default-src 'none'");
  response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.sendFile(filePath);
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

function validUploadSecret(value) {
  const supplied = Buffer.from(String(value || ""));
  const expected = Buffer.from(MEDIA_UPLOAD_SECRET);
  return expected.length >= 32 && supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

function requireMediaUpload(request, response, next) {
  if (!validUploadSecret(request.get("x-crossline-media-secret"))) {
    return response.status(401).json({ error: "Unauthorized." });
  }
  next();
}

function validImageBytes(bytes, contentType, filename) {
  const extension = path.extname(filename).toLowerCase();
  if (contentType === "image/png" && extension === ".png") {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (contentType === "image/jpeg" && extension === ".jpg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/webp" && extension === ".webp") {
    return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

function imageContentType(filename) {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
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

app.use((error, _request, response, _next) => {
  if (error?.type === "entity.too.large") return response.status(413).json({ error: "Image is too large." });
  console.error(error);
  return response.status(500).json({ error: "Server error." });
});

if (require.main === module) {
  if (MEDIA_UPLOAD_SECRET.length < 32) {
    console.error("MEDIA_UPLOAD_SECRET must contain at least 32 characters.");
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Crossline media server listening on ${PORT}.`);
  });
}

module.exports = { app, validImageBytes, validUploadSecret };
