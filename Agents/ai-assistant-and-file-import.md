# AI Assistant and File Import

This document explains the complete administrator AI system, including what model is used, where files are read, what crosses the network, how images are preserved, and how reviewed questions reach D1.

## What the Assistant Uses

Production prefers this chain:

```text
Admin renderer
  -> Cloudflare Worker
  -> HTTPS /admin-ai/generate on the VPS
  -> relay.mjs on 127.0.0.1:8090
  -> OpenCode on 127.0.0.1:4096
  -> GLM 5.2 through an OpenAI-compatible API
```

Configuration:

- Model: `glm-5.2`
- OpenCode provider ID: `glm`
- Provider API: `https://open.bigmodel.cn/api/coding/paas/v4`
- OpenCode config: `services/opencode/opencode.json`
- Worker relay URL: `OPENCODE_RELAY_URL`
- Worker-to-relay authentication: `OPENCODE_RELAY_SECRET`

If the relay fails and the Worker has `GLM_API_KEY`, `adminModelCompletion()` can call the configured GLM chat-completions endpoint directly. Responses report `runtime: "opencode"` or `runtime: "direct-fallback"` so production checks can tell which path was used.

## Two AI Features, One Model Boundary

### Conversational assistant

Admin UI: `showAdminAssistant()` and `bindAdminAssistant()`.

API: `POST /admin/ai/chat`.

Purpose:

- discuss an attached source
- plan an exam
- create an original four-option MCQ when explicitly requested
- check answer logic
- improve subject/chapter/topic labels
- format mathematics as LaTeX

It returns Markdown text only. It never writes an exam or a question.

### Structured importer

Admin UI: `showQuestionImport()`.

API: `POST /admin/ai/import`.

Purpose:

- losslessly turn extracted paper text into an `exam` object and a `questions` array
- preserve wording, numbering, marks, explicit answers, explanations, duration, and image markers
- omit questions whose correct answer is not explicitly present
- classify Physics, Chemistry, and Mathematics into the backend chapter catalog

It returns a draft. Saving is a separate administrator action.

## Supported Attachments

- ZIP question banks, up to 100 MB compressed
- HTML/HTM
- PDF
- Markdown
- plain text
- JSON
- CSV
- PNG, JPG/JPEG, WebP, BMP, and TIFF

Individual non-ZIP sources are limited to 25 MB. A selection can contain up to 64 files. A ZIP can contain up to 500 entries and 250 MB expanded data.

The UI supports both the file picker and drag-and-drop through `bindSourceDropZone()`.

## Exact File Transfer Flow

### 1. Renderer receives browser `File` objects

The admin drops files or chooses them from `<input type="file" multiple>`. `extractImportSourceFiles()` processes one or more files.

### 2. Renderer asks Electron to extract locally

For HTML, preload uses `webUtils.getPathForFile(file)` and sends the local path through `extract-html-question-source`. The path is necessary so relative image references such as `images/Q19.png` can be resolved beside the HTML file.

Other file types are read as a `Uint8Array` and sent through `extract-question-source` with the filename and MIME type.

The IPC surface is defined in `electron/preload.js`. Parsing runs in the main process through `electron/source-import.js`, not in the model service.

### 3. Electron parses and OCRs the source

- HTML: scripts/styles/templates are removed, DOM is converted to Markdown, embedded/relative images are read locally, and metadata such as title/duration is detected.
- PDF: selectable text is preferred. A scanned PDF is rendered page-by-page and OCRed, up to 40 pages.
- Images: Tesseract OCR runs locally.
- Markdown: local linked images are resolved and replaced with markers.
- ZIP: entries are normalized, unsafe paths are rejected, files are extracted to a temporary directory, supported documents are processed, loose images are matched, and the temporary directory is deleted.

Import progress is sent back over `source-import-progress` IPC so the UI can show PDF, ZIP, and OCR status.

### 4. Images become local assets plus text markers

Every preserved image receives a marker such as:

```text
CROSSLINE_IMAGE_7
```

The extraction result contains:

```json
{
  "text": "Question text with [[CROSSLINE_IMAGE_7]] and OCR notes",
  "metadata": { "title": "CSCA Mock", "duration": 60 },
  "images": [
    {
      "ref": "CROSSLINE_IMAGE_7",
      "name": "Q19.png",
      "mimeType": "image/png",
      "questionNumber": 19,
      "ocr": "text detected inside the image",
      "dataUrl": "data:image/png;base64,..."
    }
  ]
}
```

Large images are resized locally. Stored image bytes are targeted at 700 KB or less. The Base64 data remains in renderer memory while the draft is prepared.

Filename mapping recognizes `Q19.png`, `Question-19-diagram.png`, and `19.png`. If a question number cannot be inferred, the image stays visible for review but is not silently attached to an arbitrary question.

### 5. Only extracted text goes to AI

For chat, the renderer builds this attachment:

```json
{
  "name": "exam.html",
  "method": "html",
  "text": "extracted text, OCR text, and image markers",
  "metadata": { "title": "...", "duration": 60 }
}
```

It deliberately removes the `images` array and every `dataUrl`. The Worker receives up to the last 12 chat messages plus this text attachment. The original file and image binaries are not uploaded to the Worker, relay, OpenCode, or GLM.

For structured import, the renderer sends only:

```json
{
  "sourceText": "extracted text, OCR text, and image markers",
  "instructions": "optional taxonomy or formatting guidance"
}
```

### 6. Worker validates and bounds the AI request

Both AI routes require an admin Bearer token. Their JSON limit is 2 MiB.

Chat limits:

- last 12 messages
- 4,000 characters per message
- 18,000 characters across conversation messages
- 220,000 attachment-text characters
- 16,000 returned reply characters

Import limits:

- 220,000 source characters
- 4,000 instruction characters
- at most 100 returned questions

The renderer-side exam auto-builder works within these limits by keeping one source group per dropped file and splitting each group into batches at question boundaries (`splitSourceIntoChunks()` in `src/app.js`, 150,000 characters per batch). It calls `/admin/ai/import` sequentially per batch, merges and de-duplicates the returned questions per group, and then deploys each group as its own exam through the existing `/admin/ai/deploy` route. No Worker or relay changes were needed.

The Worker adds system instructions. Chat uses temperature `0.2`; import uses temperature `0`.

### 7. Worker calls the private relay

`adminModelCompletion()` posts `{ system, messages }` to `/admin-ai/generate` with `x-crossline-relay-secret`.

`relay.mjs`:

- compares the secret with `timingSafeEqual`
- accepts at most 512 KB
- allows four active requests by default
- queues up to 24 by default
- uses a 120-second default timeout
- creates one temporary OpenCode session
- sends a text transcript with `tools: {}`
- returns the text reply
- deletes the OpenCode session in `finally`

OpenCode itself is configured to deny read, edit, glob, grep, list, shell, tasks, external directories, web access, language-server access, skills, and interactive questions. It can use only the configured GLM provider.

### 8. Structured JSON returns to the renderer

`adminAiImport()` strips markdown fences if needed, parses model JSON, validates each four-option MCQ, and returns normalized drafts. The model returns image references such as `imageRef: "CROSSLINE_IMAGE_7"`; it does not return or store PNG bytes.

### 9. Renderer reattaches local images

The renderer creates two maps:

- marker -> local image asset
- question number -> local image asset

For each returned draft, marker matching is tried first and filename/question-number matching is the fallback. The renderer adds the local `dataUrl`, filename, and MIME type to the draft preview.

### 10. Administrator reviews and saves

Nothing is written while chatting or structuring. The admin clicks **Save reviewed drafts**.

- New exam: `POST /admin/ai/deploy`
- Existing exam: `POST /admin/exams/:examId/questions/import`

`src/api.js` converts a question image string into an object with filename, MIME type, and data URL. These save endpoints can accept up to 64 MiB because a complete bank can contain many Base64 images.

The Worker validates every question before writing. A new exam and all of its questions are sent to D1 using one `DB.batch()`. If validation fails, no partial new exam is created.

## Question Image JSON

```json
{
  "questionNumber": 19,
  "text": "Question text",
  "answers": ["A", "B", "C", "D"],
  "correctIndex": 1,
  "marks": 2.5,
  "imageRef": "CROSSLINE_IMAGE_7",
  "imageFilename": "Q19.png",
  "image": {
    "filename": "Q19.png",
    "mimeType": "image/png",
    "dataUrl": "data:image/png;base64,..."
  }
}
```

The Worker accepts PNG, JPEG, and WebP data URLs up to about 1 MiB per encoded string, or an HTTPS image URL. It stores the normalized value in `questions.image_url`. This is simple but D1 is not ideal long-term image storage; R2 would be the natural future replacement.

## Conversation Storage

`adminAssistantMessages` and `adminAssistantAttachment` are renderer-memory variables. They survive navigation between admin sections while the renderer remains alive, but they are not written to D1 or localStorage and disappear when the app reloads or closes. Every model request is a new short-lived OpenCode session; continuity comes from resending the bounded recent transcript.

## Reply Rendering Safety

AI replies are parsed with bundled `marked`. `markdownHtml()` reparses the result and allows only basic text, list, heading, table, blockquote, code, link, and divider elements. All attributes are removed. Links are retained only for `https://` URLs and receive `rel="noreferrer"`.

## Failure Boundaries

- Extraction failure: remains local; no AI request is made.
- OCR quality issue: admin edits or replaces source text before structuring.
- Relay busy: returns 503 rather than creating unlimited concurrent sessions.
- Model returns invalid JSON: Worker returns 422 and writes nothing.
- Missing explicit correct answer: importer omits the question by design.
- Image marker mismatch: filename/question-number fallback is used; otherwise admin must fix it.
- Deploy validation failure: D1 is not modified.

## Production Verification

`scripts/verify-production-backend.mjs` verifies admin auth, OpenCode runtime/model identity, chat attachment values, structured import, marker preservation, image save, taxonomy normalization, free-exam behavior, and atomic deployment. It creates a temporary exam and removes it in `finally`.
