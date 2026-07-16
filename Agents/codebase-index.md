# Codebase Index

This is the ownership map for the repository. Generated artifacts such as `release/`, `node_modules/`, screenshots, and `outputs/` are not application source.

## Root Configuration

### `README.md`

Public project overview and quick-start notes. The `Agents/` guides are the deeper engineering handover.

### `.gitignore`

Keeps dependencies, build/release outputs, local environment files, Wrangler state, screenshots, and other generated artifacts out of commits.

### `package.json`

Defines Electron as the application entry point, development/test/build scripts, the NSIS target, GitHub publishing metadata, installer behavior, included files, and dependencies.

Important scripts:

- `npm start`: Electron in a normal development window.
- `npm run start:kiosk`: Electron with kiosk capability enabled.
- `npm test`: source-import, compatibility-updater, GitHub-updater, and UI smoke tests.
- `npm run worker:dev`: local Worker.
- `npm run worker:deploy`: production Worker deployment.
- `npm run dist:win`: local Windows build plus stable installer and transition ZIP generation.
- `npm run release:github`: build and publish installer metadata to GitHub Releases.
- `npm run stress:api`: bounded API load test.
- `npm run test:production`: opt-in admin/OpenCode/deployment verification.

### `package-lock.json`

Locks JavaScript dependencies. CI uses `npm ci`, so changes to dependencies must include this file.

### `.github/workflows/release.yml`

Runs on pure semantic-version tags such as `0.1.36`. It verifies that the tag equals `package.json` version, builds on Windows, and publishes with GitHub's repository token.

## `src/`: Shared Browser and Renderer UI

### `src/index.html`

The page shell. It loads MathJax, the stylesheet, API configuration, API wrapper, Markdown renderer, and the application script. Cache-busting query strings matter for the Pages deployment.

### `src/app.js`

The main stateful UI file. It owns:

- public landing, registration, verification, and legal pages
- student login, password reset, profile, dashboard, results, analytics, leaderboard, and notifications
- equipment checks and exam setup
- exam navigation, timer, answers, flags, and submission
- admin login, exam library, question editor, submissions, notifications, AI chat, and import review
- update panel and auto-update preference
- localStorage demo mode

Most screens are `show...()` functions. Shared mutable state is declared at the top. When changing a screen, inspect both its render function and every variable/helper it mutates.

### `src/api.js`

Creates `window.CrosslineApi`. It serializes JSON, attaches either the student or admin Bearer token, normalizes errors, and provides one method per Worker route. Student and admin tokens use different localStorage keys.

### `src/config.js`

Selects the API base URL. Production defaults to `https://api.crosslinecscatest.com`; localStorage can override it during development.

### `src/styles.css`

All website, auth, dashboard, exam, admin, import, setup, and responsive styling. It includes locally hosted Inter, Playfair Display, and handwriting fonts.

### `src/assets/`

Branding, dashboard illustrations, fonts, and SVG icons. Keep URLs relative so they work both on Pages and from Electron's local `file:` origin.

### `src/vendor/marked.umd.js`

Bundled Markdown parser used for AI replies. `markdownHtml()` in `src/app.js` sanitizes the generated DOM to a small element allowlist before display.

### `src/_headers`

Cloudflare Pages response headers.

### `src/downloads/README.md`

Documents the historical local destination used by the Windows build script. Production website downloads now come from the VPS stable URL rather than a large file committed under `src/`.

## `electron/`: Native Desktop Boundary

### `electron/main.js`

Electron entry point. Creates the window, enforces kiosk behavior, controls permissions/CSP, handles OAuth, runs local file extraction, initializes updates, and registers IPC handlers.

### `electron/preload.js`

The only bridge from the renderer to Electron. It exposes update, kiosk, OAuth, file extraction, external link, exit, and event-subscription functions as `window.examRuntime`.

### `electron/source-import.js`

Parses ZIP, HTML, PDF, Markdown, text, JSON, CSV, and images. It performs OCR with Tesseract, safely resolves local images, compresses stored images, assigns image markers, prevents ZIP path traversal, and removes temporary extraction directories.

### `electron/github-updater.js`

Wraps `electron-updater` so the existing in-app UI receives normalized status and progress events. It disables automatic downloading, enables install-on-quit, and supports explicit restart/install.

### `electron/update-helper.js`

Compatibility implementation for the one-time ZIP transition from pre-GitHub clients. It is still covered by a regression test but is not imported by the current `electron/main.js` runtime.

## `worker/`: Backend and Database

### `worker/src/index.js`

Single Worker module containing route dispatch and all backend handlers. Major sections are auth/OAuth, exams, results/leaderboards, notifications, AI, admin CRUD, sessions/phone pairing, email, validation, rate limiting, and response helpers.

### `worker/schema.sql`

Complete schema for a fresh D1 database.

### `worker/migrations/`

Incremental production changes. Apply each migration once and in numeric order. Migration `0012` forces all exams free.

### `worker/wrangler.toml`

Worker name, route, non-secret variables, and D1 binding. Secrets are configured with `wrangler secret put`, never committed.

### `worker/seed.sql`

Development/sample content.

## `services/opencode/`: Private AI Runtime

### `opencode.json`

Selects the OpenAI-compatible GLM endpoint and `glm-5.2`. Every OpenCode tool and filesystem/web capability is denied.

### `relay.mjs`

Validates the Worker relay secret, limits request size, limits concurrency, creates one short-lived OpenCode session, sends the transcript, returns text, and deletes the session.

### systemd units

`crossline-opencode.service` runs OpenCode on loopback. `crossline-opencode-relay.service` runs the relay on loopback under a restricted Linux user.

### `Caddyfile.production`

Serves installer/update paths and reverse-proxies `/admin-ai/*` to the relay.

## `media-server/`: Stable Download Origin

`media-server/server.js` is a small Express service for health checks, `.exe` downloads, `latest.json`, and supported transition update files. Caddy can serve the same directories directly before falling back to this process.

## `build/`: Windows Packaging

- `icon.png` and `icon.ico`: application, installer, and shortcut icon.
- `installer.nsh`: custom NSIS pages, process close, repair behavior, shortcut choices, and uninstall shortcut.

The root `eng.traineddata` is the English OCR language data used by the packaged Tesseract workflow.

## `scripts/`

- `build-update-patch.mjs`: copies the versioned installer to the website's stable filename and builds the pre-`0.1.35` transition ZIP/manifest.
- `prepare-win-native.mjs`: installs native Windows packages required by cross-platform packaging.
- `configure-github-repository.mjs`: updates GitHub publish metadata.
- `verify-production-backend.mjs`: opt-in end-to-end admin, OpenCode, image, taxonomy, and atomic-deployment check.
- `stress-test-worker.mjs`: bounded concurrent health/auth/read/session test.
- `push-to-windows.sh` and `scripts/windows/*`: Windows transfer/build and old-install cleanup utilities.

## `tests/`

- `source-import.js`: extraction, image naming, compression, HTML-relative images, and safe ZIP handling.
- `update-helper.js`: compatibility ZIP extraction and path safety.
- `github-updater.js`: GitHub updater event and state adapter.
- `smoke.js`: JSDOM tests for landing, auth, student setup/exam, results, legal pages, admin editing, and the import auto-builder helpers.
- `preview-admin.html`: browser harness that stubs `window.examRuntime` and forces local demo mode so admin screens can be previewed without Electron. Serve the repository root with any static server and open `/tests/preview-admin.html` (local admin login: admin@crossline.test / admin123).
