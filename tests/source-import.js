const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { createCanvas } = require("@napi-rs/canvas");
const AdmZip = require("adm-zip");
const { extractQuestionSource, extractHtmlQuestionSource, questionNumberFromFilename, storedImageData } = require("../electron/source-import");

(async () => {
  assert.equal(questionNumberFromFilename("Q19.png"), 19);
  assert.equal(questionNumberFromFilename("Question-48-diagram.png"), 48);
  assert.equal(questionNumberFromFilename("19.png"), 19);
  assert.equal(questionNumberFromFilename("random-diagram.png"), null);
  const largeCanvas = createCanvas(900, 900);
  const largeContext = largeCanvas.getContext("2d");
  const noisyImage = largeContext.createImageData(900, 900);
  crypto.randomFillSync(noisyImage.data);
  for (let index = 3; index < noisyImage.data.length; index += 4) noisyImage.data[index] = 255;
  largeContext.putImageData(noisyImage, 0, 0);
  const resizedPng = await storedImageData(await largeCanvas.encode("png"), "image/png");
  assert.match(resizedPng, /^data:image\/png;base64,/);
  assert.ok(Buffer.from(resizedPng.split(",")[1], "base64").length <= 700 * 1024);
  const markdown = Buffer.from("Question 1: What is 2 + 2?\nA. 3\nB. 4\nC. 5\nD. 6\nAnswer: B");
  const result = await extractQuestionSource({ name: "questions.md", type: "text/markdown", data: markdown });
  assert.equal(result.method, "text");
  assert.match(result.text, /What is 2 \+ 2/);
  assert.equal(result.pages, 1);

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "crossline-html-import-"));
  try {
    const canvas = createCanvas(500, 180);
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, 500, 180);
    context.fillStyle = "black";
    context.font = "bold 48px sans-serif";
    context.fillText("Graph y = x + 1", 30, 105);
    await fs.writeFile(path.join(directory, "graph.png"), await canvas.encode("png"));
    const htmlPath = path.join(directory, "exam.html");
    await fs.writeFile(htmlPath, `<!doctype html><html><head><title>HTML Mathematics Mock</title></head><body><h1>HTML Mathematics Mock</h1><p>Duration: 60 minutes</p><article><h2>Question 1</h2><p>Which graph is shown?</p><img src="graph.png" alt="Linear graph" /><ol><li>A line</li><li>A circle</li><li>A square</li><li>A triangle</li></ol><p>Answer: A</p><p>Marks: 2.5</p></article></body></html>`);
    const htmlResult = await extractHtmlQuestionSource(htmlPath);
    assert.equal(htmlResult.method, "html");
    assert.equal(htmlResult.metadata.title, "HTML Mathematics Mock");
    assert.equal(htmlResult.metadata.duration, 60);
    assert.match(htmlResult.text, /CROSSLINE_IMAGE_1/);
    assert.match(htmlResult.text, /Marks: 2\.5/);
    assert.equal(htmlResult.images.length, 1);
    assert.match(htmlResult.images[0].dataUrl, /^data:image\//);

    const zip = new AdmZip();
    zip.addFile("bank/exam.html", Buffer.from(`<!doctype html><html><head><title>Zipped Physics Mock</title></head><body><h1>Zipped Physics Mock</h1><p>Duration: 60 minutes</p><p>Question 1: Which graph is shown?</p><img src="graph.png" alt="Linear graph" /><p>A. Linear<br>B. Circular<br>C. Square<br>D. None</p><p>Answer: A</p></body></html>`));
    zip.addFile("bank/graph.png", await fs.readFile(path.join(directory, "graph.png")));
    zip.addFile("bank/Q2.png", await fs.readFile(path.join(directory, "graph.png")));
    zip.addFile("bank/questions.md", Buffer.from("Question 2: What is force?\nA. Mass\nB. Acceleration\nC. Mass times acceleration\nD. Energy\nAnswer: C"));
    const zipResult = await extractQuestionSource({ name: "question-bank.zip", type: "application/zip", data: zip.toBuffer() });
    assert.equal(zipResult.method, "zip");
    assert.equal(zipResult.metadata.title, "Zipped Physics Mock");
    assert.equal(zipResult.metadata.duration, 60);
    assert.match(zipResult.text, /questions\.md/);
    assert.match(zipResult.text, /CROSSLINE_IMAGE_1/);
    assert.match(zipResult.text, /Attach to question 2/);
    assert.equal(zipResult.images.length, 2);
    const numberedImage = zipResult.images.find((image) => image.name === "Q2.png");
    assert.equal(numberedImage.questionNumber, 2);
    assert.equal(numberedImage.mimeType, "image/png");
    assert.match(numberedImage.dataUrl, /^data:image\/png;base64,/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }

  await assert.rejects(
    extractQuestionSource({ name: "questions.exe", type: "application/octet-stream", data: Buffer.from("not a source") }),
    /Use a ZIP, HTML, PDF, Markdown, text, JSON, CSV/
  );
  console.log("Question source import test passed.");
})();
