const path = require("path");
const fs = require("fs/promises");
const os = require("os");
const { parse } = require("node-html-parser");
const { NodeHtmlMarkdown } = require("node-html-markdown");
const AdmZip = require("adm-zip");

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_PDF_PAGES = 40;
const MIN_USEFUL_PDF_TEXT = 120;
const MAX_HTML_IMAGES = 64;
const MAX_HTML_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 700 * 1024;
const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_ARCHIVE_EXPANDED_BYTES = 250 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 500;

function extensionFor(name = "") {
  return path.extname(String(name)).toLowerCase();
}

function cleanExtractedText(value = "") {
  return String(value)
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

async function recognizeImageList(images, notify) {
  const { createWorker } = require("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger(message) {
      if (message.status !== "recognizing text") return;
      notify({ stage: "ocr", progress: Math.round((Number(message.progress) || 0) * 100) });
    }
  });
  const pages = [];
  try {
    for (let index = 0; index < images.length; index += 1) {
      notify({ stage: "ocr", page: index + 1, pages: images.length, progress: 0 });
      const result = await worker.recognize(images[index], { rotateAuto: true });
      pages.push(cleanExtractedText(result.data?.text || ""));
    }
  } finally {
    await worker.terminate();
  }
  return pages;
}

async function recognizeImages(images, notify) {
  return (await recognizeImageList(images, notify)).filter(Boolean).join("\n\n");
}

function decodeImageDataUrl(src = "") {
  const match = String(src).match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  try { return { mime: match[1].toLowerCase(), buffer: Buffer.from(match[2].replace(/\s/g, ""), "base64") }; }
  catch { return null; }
}

function imageMime(filePath = "") {
  const extension = path.extname(filePath).toLowerCase();
  return ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".bmp": "image/bmp", ".tif": "image/tiff", ".tiff": "image/tiff" })[extension] || "image/png";
}

function questionNumberFromFilename(name = "") {
  const stem = path.basename(String(name), path.extname(String(name))).trim();
  const match = stem.match(/^(?:q(?:uestion)?[\s_.-]*)?(\d{1,3})(?:[\s_.-].*)?$/i);
  const number = Number(match?.[1]);
  return Number.isInteger(number) && number > 0 && number <= 500 ? number : null;
}

function imageAttachmentNote(image) {
  const question = image.questionNumber ? ` Attach to question ${image.questionNumber}.` : " Question number could not be inferred from the filename.";
  return `[[${image.ref}]] Filename: ${image.name}.${question} OCR text: ${image.ocr || "No readable text detected."}`;
}

async function readHtmlImage(htmlPath, src = "") {
  const embedded = decodeImageDataUrl(src);
  if (embedded) return embedded.buffer.length <= MAX_HTML_IMAGE_BYTES ? embedded : null;
  if (!src || /^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith("//")) return null;
  let decoded;
  try { decoded = decodeURIComponent(src.split(/[?#]/)[0]); } catch { return null; }
  const base = path.dirname(path.resolve(htmlPath));
  const candidate = path.resolve(base, decoded);
  if (candidate !== base && !candidate.startsWith(`${base}${path.sep}`)) return null;
  try {
    const buffer = await fs.readFile(candidate);
    if (!buffer.length || buffer.length > MAX_HTML_IMAGE_BYTES) return null;
    return { mime: imageMime(candidate), buffer, name: path.basename(candidate) };
  } catch { return null; }
}

async function storedImageData(buffer, mime) {
  if (buffer.length <= MAX_STORED_IMAGE_BYTES) return `data:${mime};base64,${buffer.toString("base64")}`;
  const { createCanvas, loadImage } = require("@napi-rs/canvas");
  const image = await loadImage(buffer);
  const preservePng = mime === "image/png";
  let maximumDimension = 1400;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const scale = Math.min(1, maximumDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const compressed = preservePng ? await canvas.encode("png") : await canvas.encode("jpeg", 78);
    if (compressed.length <= MAX_STORED_IMAGE_BYTES) {
      const outputMime = preservePng ? "image/png" : "image/jpeg";
      return `data:${outputMime};base64,${Buffer.from(compressed).toString("base64")}`;
    }
    maximumDimension = Math.max(240, Math.round(maximumDimension * 0.78));
  }
  throw new Error("A question image remains too large after safe resizing.");
}

function htmlMetadata(text, root) {
  const durationMatch = String(text).match(/(?:duration|time\s*limit|exam\s*time)\s*[:\-]?\s*(\d{1,3}(?:\.\d+)?)\s*(?:minutes?|mins?)/i);
  const title = cleanExtractedText(root.querySelector("title")?.textContent || root.querySelector("h1")?.textContent || "").slice(0, 180);
  return { title, duration: durationMatch ? Number(durationMatch[1]) : null };
}

async function extractHtmlQuestionSource(htmlPath, notify = () => {}) {
  const resolved = path.resolve(String(htmlPath || ""));
  if (!/\.html?$/i.test(resolved)) throw new Error("Choose an HTML or HTM file.");
  const file = await fs.readFile(resolved);
  if (!file.length) throw new Error("The selected HTML file is empty.");
  if (file.length > MAX_SOURCE_BYTES) throw new Error("Question source files must be 25 MB or smaller.");

  notify({ stage: "html-parse", progress: 10 });
  const root = parse(file.toString("utf8"), { comment: false });
  root.querySelectorAll("script, style, noscript, template").forEach((element) => element.remove());
  const imageNodes = root.querySelectorAll("img").slice(0, MAX_HTML_IMAGES);
  const loaded = [];
  for (let index = 0; index < imageNodes.length; index += 1) {
    const node = imageNodes[index];
    const ref = `CROSSLINE_IMAGE_${index + 1}`;
    const src = node.getAttribute("src") || "";
    const alt = cleanExtractedText(node.getAttribute("alt") || node.getAttribute("title") || "");
    const asset = await readHtmlImage(resolved, src);
    node.replaceWith(parse(`<p>[[${ref}]]${alt ? ` Alt: ${alt.replace(/[<>]/g, "")}` : ""}</p>`));
    if (asset) loaded.push({ ref, alt, ...asset });
  }

  notify({ stage: "html-ocr", progress: 25, images: loaded.length });
  const ocrPages = loaded.length ? await recognizeImageList(loaded.map((asset) => asset.buffer), notify) : [];
  const images = [];
  for (let index = 0; index < loaded.length; index += 1) {
    images.push({
      ref: loaded[index].ref,
      alt: loaded[index].alt,
      ocr: ocrPages[index] || "",
      dataUrl: await storedImageData(loaded[index].buffer, loaded[index].mime),
      name: loaded[index].name || loaded[index].ref,
      mimeType: loaded[index].mime,
      questionNumber: questionNumberFromFilename(loaded[index].name || "")
    });
  }

  const markdown = cleanExtractedText(NodeHtmlMarkdown.translate(root.toString()));
  if (!markdown) throw new Error("No readable question text was found in this HTML file.");
  const imageNotes = images.map(imageAttachmentNote).join("\n\n");
  const text = cleanExtractedText([markdown, imageNotes].filter(Boolean).join("\n\n"));
  notify({ stage: "complete", progress: 100, method: "html" });
  return { text, method: "html", pages: 1, images, metadata: htmlMetadata(markdown, root) };
}

function remapImageRefs(result, nextImageNumber) {
  let text = result.text;
  const images = (result.images || []).map((image) => {
    const ref = `CROSSLINE_IMAGE_${nextImageNumber.value++}`;
    text = text.replaceAll(image.ref, ref);
    return { ...image, ref };
  });
  return { ...result, text, images };
}

async function extractMarkdownWithImages(filePath, notify) {
  let text = cleanExtractedText(await fs.readFile(filePath, "utf8"));
  const matches = [...text.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)].slice(0, MAX_HTML_IMAGES);
  const loaded = [];
  for (let index = 0; index < matches.length; index += 1) {
    const [syntax, alt, src] = matches[index];
    const ref = `CROSSLINE_IMAGE_${index + 1}`;
    const asset = await readHtmlImage(filePath, src);
    text = text.replace(syntax, `[[${ref}]]${alt ? ` Alt: ${alt}` : ""}`);
    if (asset) loaded.push({ ref, alt: cleanExtractedText(alt), ...asset });
  }
  const ocrPages = loaded.length ? await recognizeImageList(loaded.map((asset) => asset.buffer), notify) : [];
  const images = [];
  for (let index = 0; index < loaded.length; index += 1) {
    images.push({ ref: loaded[index].ref, alt: loaded[index].alt, ocr: ocrPages[index] || "", dataUrl: await storedImageData(loaded[index].buffer, loaded[index].mime), name: loaded[index].name || loaded[index].ref, mimeType: loaded[index].mime, questionNumber: questionNumberFromFilename(loaded[index].name || "") });
  }
  const notes = images.map(imageAttachmentNote).join("\n\n");
  return { text: cleanExtractedText([text, notes].filter(Boolean).join("\n\n")), method: "markdown", pages: 1, images, metadata: {} };
}

async function extractZip(buffer, notify = () => {}) {
  notify({ stage: "zip-open", progress: 5 });
  const archive = new AdmZip(buffer);
  const entries = archive.getEntries();
  if (!entries.length) throw new Error("The ZIP archive is empty.");
  if (entries.length > MAX_ARCHIVE_ENTRIES) throw new Error(`ZIP archives can contain at most ${MAX_ARCHIVE_ENTRIES} files and folders.`);
  const expandedBytes = entries.reduce((sum, entry) => sum + Number(entry.header?.size || 0), 0);
  if (expandedBytes > MAX_ARCHIVE_EXPANDED_BYTES) throw new Error("The expanded ZIP archive is larger than 250 MB.");

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "crossline-question-bank-"));
  try {
    for (const entry of entries) {
      const normalized = path.posix.normalize(String(entry.entryName || "").replace(/\\/g, "/"));
      if (!normalized || normalized === "." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) throw new Error("The ZIP archive contains an unsafe file path.");
      const destination = path.join(directory, ...normalized.split("/"));
      if (entry.isDirectory) await fs.mkdir(destination, { recursive: true });
      else {
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, entry.getData());
      }
    }

    const sourceFiles = entries.filter((entry) => !entry.isDirectory).map((entry) => path.join(directory, ...path.posix.normalize(entry.entryName.replace(/\\/g, "/")).split("/")));
    const documents = sourceFiles.filter((filePath) => /\.(html?|pdf|md|markdown|txt|json|csv)$/i.test(filePath)).slice(0, 80);
    const standaloneImages = sourceFiles.filter((filePath) => /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(filePath));
    if (!documents.length && !standaloneImages.length) throw new Error("The ZIP archive does not contain supported question files.");

    const parts = [];
    const images = [];
    const nextImageNumber = { value: 1 };
    let metadata = {};
    for (let index = 0; index < documents.length; index += 1) {
      const filePath = documents[index];
      const extension = extensionFor(filePath);
      notify({ stage: "zip-file", progress: 10 + Math.round(((index + 1) / Math.max(1, documents.length)) * 75), file: path.relative(directory, filePath) });
      let result;
      if ([".html", ".htm"].includes(extension)) result = await extractHtmlQuestionSource(filePath, notify);
      else if ([".md", ".markdown"].includes(extension)) result = await extractMarkdownWithImages(filePath, notify);
      else result = await extractQuestionSource({ name: path.basename(filePath), type: extension === ".pdf" ? "application/pdf" : "text/plain", data: await fs.readFile(filePath) }, notify);
      result = remapImageRefs(result, nextImageNumber);
      parts.push(`# Source file: ${path.relative(directory, filePath)}\n\n${result.text}`);
      images.push(...result.images);
      if (!metadata.title && result.metadata?.title) metadata = { ...metadata, ...result.metadata };
    }

    const alreadyLoadedNames = new Set(images.map((image) => String(image.name || "").toLowerCase()));
    const looseImages = standaloneImages.filter((filePath) => !alreadyLoadedNames.has(path.basename(filePath).toLowerCase())).slice(0, MAX_HTML_IMAGES - images.length);
    if (looseImages.length) {
      notify({ stage: "zip-images", progress: 86, images: looseImages.length });
      const buffers = await Promise.all(looseImages.map((filePath) => fs.readFile(filePath)));
      const ocrPages = await recognizeImageList(buffers, notify);
      const attachments = [];
      for (let index = 0; index < looseImages.length; index += 1) {
        const filePath = looseImages[index];
        const ref = `CROSSLINE_IMAGE_${nextImageNumber.value++}`;
        const mimeType = imageMime(filePath);
        attachments.push({
          ref,
          alt: "",
          ocr: ocrPages[index] || "",
          dataUrl: await storedImageData(buffers[index], mimeType),
          name: path.basename(filePath),
          mimeType,
          questionNumber: questionNumberFromFilename(filePath)
        });
      }
      images.push(...attachments);
      parts.push(`# Question image attachments\n\n${attachments.map(imageAttachmentNote).join("\n\n")}`);
    }

    notify({ stage: "complete", progress: 100, method: "zip" });
    return { text: cleanExtractedText(parts.join("\n\n")), method: "zip", pages: documents.length || standaloneImages.length, images, metadata, files: documents.length || standaloneImages.length };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

async function extractPdf(buffer, notify) {
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    notify({ stage: "pdf-text", progress: 10 });
    const textResult = await parser.getText({ first: MAX_PDF_PAGES });
    const selectableText = cleanExtractedText(textResult.text || "");
    if (selectableText.replace(/\s/g, "").length >= MIN_USEFUL_PDF_TEXT) {
      notify({ stage: "complete", progress: 100, method: "pdf-text" });
      return { text: selectableText, method: "pdf-text", pages: Number(textResult.total || textResult.pages?.length || 0) };
    }

    notify({ stage: "pdf-render", progress: 20 });
    const screenshots = await parser.getScreenshot({ first: MAX_PDF_PAGES, scale: 1.6, imageBuffer: true });
    const pageBuffers = (screenshots.pages || []).map((page) => Buffer.from(page.data || page.buffer || [])).filter((page) => page.length);
    if (!pageBuffers.length) throw new Error("This PDF has no selectable text and its pages could not be rendered for OCR.");
    const text = await recognizeImages(pageBuffers, notify);
    if (!text) throw new Error("No readable question text was found in this scanned PDF.");
    notify({ stage: "complete", progress: 100, method: "pdf-ocr" });
    return { text, method: "pdf-ocr", pages: pageBuffers.length };
  } finally {
    await parser.destroy();
  }
}

async function extractQuestionSource(payload = {}, notify = () => {}) {
  const name = String(payload.name || "source");
  const type = String(payload.type || "").toLowerCase();
  const buffer = Buffer.from(payload.data || []);
  if (!buffer.length) throw new Error("The selected source file is empty.");

  const extension = extensionFor(name);
  if (extension === ".zip" || type === "application/zip" || type === "application/x-zip-compressed") {
    if (buffer.length > MAX_ARCHIVE_BYTES) throw new Error("ZIP question banks must be 100 MB or smaller.");
    return extractZip(buffer, notify);
  }
  if (buffer.length > MAX_SOURCE_BYTES) throw new Error("Question source files must be 25 MB or smaller.");
  if ([".md", ".markdown", ".txt", ".json", ".csv"].includes(extension) || (type.startsWith("text/") && type !== "text/html")) {
    const text = cleanExtractedText(buffer.toString("utf8"));
    if (!text) throw new Error("No readable text was found in this file.");
    notify({ stage: "complete", progress: 100, method: "text" });
    return { text, method: "text", pages: 1 };
  }
  if (extension === ".pdf" || type === "application/pdf") return extractPdf(buffer, notify);
  if (type.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"].includes(extension)) {
    const text = await recognizeImages([buffer], notify);
    const ref = "CROSSLINE_IMAGE_1";
    const mimeType = imageMime(name);
    const image = { ref, alt: "", ocr: text, dataUrl: await storedImageData(buffer, mimeType), name: path.basename(name), mimeType, questionNumber: questionNumberFromFilename(name) };
    notify({ stage: "complete", progress: 100, method: "image-ocr" });
    return { text: imageAttachmentNote(image), method: "image-ocr", pages: 1, images: [image], metadata: {} };
  }
  throw new Error("Use a ZIP, HTML, PDF, Markdown, text, JSON, CSV, PNG, JPG, WebP, BMP, or TIFF question source.");
}

module.exports = { extractQuestionSource, extractHtmlQuestionSource, extractZip, questionNumberFromFilename, storedImageData };
