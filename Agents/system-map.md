# System Map

## Deployed Architecture

```mermaid
flowchart LR
  Browser["Browser landing page"] --> Pages["Cloudflare Pages: src/"]
  Windows["Windows Electron client"] --> Worker["Cloudflare Worker API"]
  Browser --> Worker
  Phone["Secondary phone browser"] --> Worker
  Worker --> D1["Cloudflare D1"]
  Worker --> Resend["Resend email API"]
  Worker --> Relay["Authenticated VPS relay"]
  Relay --> OpenCode["OpenCode on 127.0.0.1"]
  OpenCode --> GLM["GLM 5.2 provider"]
  Browser --> Media["VPS stable installer"]
  Windows --> GitHub["GitHub Releases updater"]
```

## Component Boundaries

### Shared web frontend

`src/` is deployed to Cloudflare Pages and bundled into Electron. The same HTML, CSS, and JavaScript select a different entry screen at runtime:

- `window.examRuntime` exists: Electron client, login, dashboard, exams, and admin tools.
- `window.examRuntime` is absent: public landing page, account registration/verification, and legal pages.

The UI is vanilla JavaScript. Screen functions replace `#app` with HTML and then attach listeners. There is no React, Vue, router package, or frontend build step.

### Electron main process

`electron/main.js` owns operating-system capabilities that the sandboxed renderer cannot use directly:

- window creation and kiosk/fullscreen state
- focus guard and blocked keyboard shortcuts
- camera and microphone permission policy
- CSP headers for local files
- Google OAuth child window
- local file extraction/OCR IPC
- updater IPC
- controlled app exit

`electron/preload.js` exposes a narrow `window.examRuntime` API through `contextBridge`. Node integration is disabled, context isolation and the Chromium sandbox are enabled.

### Cloudflare Worker

`worker/src/index.js` is a single Worker containing routing, validation, authorization, D1 queries, result scoring, phone pairing, email delivery, and AI relay calls. `src/api.js` is the renderer-side wrapper around those routes.

### D1

D1 stores accounts, OAuth links, bearer sessions, exams, questions, attempts, answers, setup/security events, notifications, and notification receipts. Media recordings do not exist in the schema.

### VPS

The VPS has two unrelated jobs behind Caddy:

- serve the stable Windows installer and transition update files
- run the private OpenCode service and an authenticated relay

OpenCode and its relay listen only on loopback. Caddy exposes `/admin-ai/*`, but the relay rejects requests without the shared secret that only the Worker knows.

### GitHub Releases

Installed clients from `0.1.35` onward use `electron-updater`. GitHub releases provide `latest.yml`, the versioned NSIS installer, and a versioned blockmap. Differential downloads are attempted first; a full installer download is the supported fallback.

## Student Flow

```mermaid
flowchart TD
  Open["Open Windows client"] --> Auth["Restore session or authenticate"]
  Auth --> Dashboard["Student dashboard"]
  Dashboard --> Select["Select a free exam"]
  Select --> Kiosk["Enter kiosk mode"]
  Kiosk --> Equipment["Camera, microphone, network"]
  Equipment --> Face["Facial-recognition simulation"]
  Face --> Pair["Pair secondary phone"]
  Pair --> Scan["360-degree room scan confirmation"]
  Scan --> Terms["Privacy terms"]
  Terms --> Stop["Stop every media stream"]
  Stop --> Exam["Timed MCQ exam"]
  Exam --> Submit["Confirm submission"]
  Submit --> Score["Worker scores and releases result"]
  Score --> Dashboard
```

## AI Import Flow

```mermaid
flowchart LR
  File["Admin file or ZIP"] --> Extract["Electron parser and local OCR"]
  Extract --> Text["Extracted text, metadata, image markers"]
  Text --> WorkerAI["Authenticated Worker AI endpoint"]
  WorkerAI --> RelayAI["Secret-protected VPS relay"]
  RelayAI --> Model["OpenCode with GLM 5.2"]
  Model --> Draft["Markdown reply or structured JSON"]
  Draft --> Rebind["Renderer rebinds local image data"]
  Rebind --> Review["Administrator review"]
  Review --> Deploy["Validated D1 batch write"]
```

The chat route and the deploy route are deliberately separate. A model reply cannot directly modify D1.
