const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const storage = fs.mkdtempSync(path.join(os.tmpdir(), "crossline-media-"));
process.env.STORAGE_DIR = storage;
process.env.MEDIA_UPLOAD_SECRET = "test-media-secret-that-is-at-least-32-characters";
const { app } = require("./server");

let server;
let baseUrl;
test.before(async () => {
  server = await new Promise((resolve) => {
    const running = app.listen(0, "127.0.0.1", () => resolve(running));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(storage, { recursive: true, force: true });
});

const questionId = "00000000-0000-4000-8000-000000000001";
const filename = "question-00000000-0000-4000-8000-000000000002.png";
const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test("rejects unauthenticated and malformed uploads", async () => {
  let response = await fetch(`${baseUrl}/internal/question-images/${questionId}/${filename}`, {
    method: "PUT",
    headers: { "content-type": "image/png" },
    body: tinyPng
  });
  assert.equal(response.status, 401);

  response = await fetch(`${baseUrl}/internal/question-images/${questionId}/${filename}`, {
    method: "PUT",
    headers: { "content-type": "image/png", "x-crossline-media-secret": process.env.MEDIA_UPLOAD_SECRET },
    body: Buffer.from("not an image")
  });
  assert.equal(response.status, 400);
});

test("stores and serves validated images with immutable headers", async () => {
  const upload = await fetch(`${baseUrl}/internal/question-images/${questionId}/${filename}`, {
    method: "PUT",
    headers: { "content-type": "image/png", "x-crossline-media-secret": process.env.MEDIA_UPLOAD_SECRET },
    body: tinyPng
  });
  assert.equal(upload.status, 201);

  const image = await fetch(`${baseUrl}/question-images/${questionId}/${filename}`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.match(image.headers.get("cache-control"), /immutable/);
  assert.equal(image.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), tinyPng);
});

test("does not expose arbitrary files", async () => {
  const response = await fetch(`${baseUrl}/question-images/${questionId}/../../downloads/latest.json`);
  assert.equal(response.status, 404);
});
