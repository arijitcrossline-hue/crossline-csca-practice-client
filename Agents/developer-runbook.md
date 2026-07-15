# Developer Runbook

This file is for the next developer who needs to run, test, build, or deploy the app.

## Install

```bash
npm install
```

## Run Locally on macOS

Normal windowed development:

```bash
npm start
```

Kiosk/fullscreen preview:

```bash
npm run start:kiosk
```

The app behaves differently depending on whether it runs in Electron or a browser:

- Electron: full student/admin app.
- Browser: landing page with Windows download link.

## API Config

Default API is set in:

```text
src/config.js
```

Production:

```text
https://api.crosslinecscatest.com
```

Temporary override from browser/devtools:

```js
localStorage.setItem("crossline-api-base", "https://your-test-api.example.com");
```

## Run Smoke Tests

```bash
npm test
```

The smoke test uses JSDOM and checks:

- browser landing page does not show student login
- student login and dashboard
- no Chinese text
- no `[object PointerEvent]` in dashboard
- kiosk starts only after exam setup begins
- equipment check flow
- facial recognition flow
- phone pairing to room scan
- privacy terms
- exam submit confirmation
- registration username
- admin create/edit question flow
- public privacy, terms, and data-deletion routes

Public legal routes required by the OAuth providers:

- `https://exam.crosslinecscatest.com/privacy`
- `https://exam.crosslinecscatest.com/terms`
- `https://exam.crosslinecscatest.com/data-deletion`

## Production Migrations

The base schema command is appropriate for a new database. For the existing production D1 database, apply each new migration once, in order:

```bash
npm run worker:migrate:0007
npm run worker:migrate:0008
npm run worker:migrate:0009
```

Then deploy the Worker:

```bash
npm run worker:deploy
```

Configure Google sign-in and the model secrets only when ready:

```bash
npx wrangler secret put OAUTH_STATE_SECRET --config worker/wrangler.toml
npx wrangler secret put GOOGLE_CLIENT_ID --config worker/wrangler.toml
npx wrangler secret put GOOGLE_CLIENT_SECRET --config worker/wrangler.toml
npx wrangler secret put GLM_API_KEY --config worker/wrangler.toml
npx wrangler secret put OPENCODE_RELAY_SECRET --config worker/wrangler.toml
```

Provider callback URLs:

```text
Google: https://api.crosslinecscatest.com/auth/oauth/google/callback
```

After adding credentials, verify the Google start route returns an OAuth redirect rather than HTTP 503:

```bash
curl -I https://api.crosslinecscatest.com/auth/oauth/google/start
```

`GLM_API_URL`, `GLM_MODEL`, and `OPENCODE_RELAY_URL` are set in `worker/wrangler.toml`. Production requests prefer the private OpenCode relay and use direct GLM only as an emergency fallback.

## OpenCode Service

Versioned production files are in `services/opencode/`. The Tencent VPS runs:

- `crossline-opencode.service`: OpenCode 1.17.18 on `127.0.0.1:4096`
- `crossline-opencode-relay.service`: authenticated relay on `127.0.0.1:8090`
- Caddy route `https://media.crosslinecscatest.com/admin-ai/*`

Secrets live only in `/etc/crossline-opencode.env` and the matching `OPENCODE_RELAY_SECRET` Worker secret. OpenCode permits only the `glm` provider and denies file, shell, editing, web, task, skill, and other tools. The relay creates and deletes one short-lived session per request.

Check service health without printing secrets:

```bash
sudo systemctl status crossline-opencode crossline-opencode-relay
sudo bash -c 'set -a; . /etc/crossline-opencode.env; set +a; curl -fsS -H "x-crossline-relay-secret: $OPENCODE_RELAY_SECRET" http://127.0.0.1:8090/health'
```

The Tencent VPS pings the Worker `/health` endpoint every five minutes. Submission queues email immediately; the health ping provides a retry sweep if an earlier email attempt failed. The cron file is `/etc/cron.d/crossline-result-sweep` on the VPS.

## Stress Test the API

Health-only test:

```bash
npm run stress:api
```

To simulate 100 clients without writes:

```bash
STRESS_USERS=100 STRESS_CONCURRENCY=25 STRESS_REPEAT=1 npm run stress:api
```

To include authenticated administrator login and exam-library reads, set `STRESS_ALLOW_AUTH=true`, `STRESS_ADMIN_EMAIL`, and `STRESS_ADMIN_PASSWORD`. Credentials are read from the environment and must never be committed.

An authenticated production test is intentionally opt-in. Run it during a quiet window and start with a small number of users:

```bash
STRESS_ALLOW_AUTH=true STRESS_USERS=25 STRESS_CONCURRENCY=10 \
STRESS_EMAIL="student@example.com" STRESS_PASSWORD="..." npm run stress:api
```

The optional session-creation test writes practice sessions, so it needs `STRESS_ALLOW_WRITES=true` as well. Never use the stress tool as a public-load test or point it at an unrelated service.

Authenticated test:

```bash
STRESS_EMAIL=student@example.com \
STRESS_PASSWORD=demo123 \
STRESS_USERS=100 \
STRESS_CONCURRENCY=30 \
npm run stress:api
```

The script prints p50/p95/p99 latency and status counts per route.

Production administrator/OpenCode and batch-import verification is opt-in because it logs in and briefly creates a temporary exam:

```bash
CROSSLINE_ADMIN_EMAIL="admin@example.com" \
CROSSLINE_ADMIN_PASSWORD="..." \
npm run test:production
```

The script verifies `runtime=opencode`, model `glm-5.2`, imports two questions in one batch, reads them back, and deletes the temporary exam in a `finally` cleanup.

## Cloudflare Worker Dev

Local Worker:

```bash
npm run worker:dev
```

Deploy:

```bash
npm run worker:deploy
```

Apply schema to remote D1:

```bash
npm run worker:migrate
```

Seed sample data:

```bash
npm run worker:seed
```

For existing production data, prefer migration files in `worker/migrations/` over destructive schema resets.

## Deploy the Website

The landing page and public legal pages are hosted by the `crossline-mocks` Cloudflare Pages project. Deploy the current `src/` directory with:

```bash
npx wrangler pages deploy src --project-name crossline-mocks --branch main
```

The production custom domain is `https://exam.crosslinecscatest.com`.

## Worker Secrets

Set secrets with Wrangler:

```bash
npx wrangler secret put ADMIN_PASSWORD --config worker/wrangler.toml
npx wrangler secret put PASSWORD_PEPPER --config worker/wrangler.toml
npx wrangler secret put RESEND_API_KEY --config worker/wrangler.toml
```

Important vars are in `worker/wrangler.toml`:

- `APP_ORIGIN`
- `CONNECT_ORIGIN`
- `VERIFY_FROM`
- `ADMIN_EMAILS`

## Build Windows Installer

The build target is NSIS through electron-builder:

```bash
npm run dist:win
```

Output goes to:

```text
release/
```

Installer config is in `package.json` and `build/installer.nsh`.

Current installer behavior:

- asks for install location
- asks whether to create Desktop shortcut
- asks whether to create Start Menu shortcut/uninstall shortcut
- closes old Crossline app processes before install
- preserves shortcuts during silent updates
- includes an uninstaller shortcut when Start Menu option is selected

## GitHub Releases and Updates

The installed app uses `electron-updater` with the public GitHub provider. A release must contain:

- `latest.yml`
- `Crossline-CSCA-Practice-Setup.exe`
- `Crossline-CSCA-Practice-Setup.exe.blockmap`

The filenames intentionally contain no spaces. `electron-updater` uses the blockmap for differential downloads when possible and falls back to the complete installer when required.

Configure the repository once:

```bash
npm run configure:github -- OWNER/crossline-csca-practice-client
git remote add origin https://github.com/OWNER/crossline-csca-practice-client.git
```

For a release, update the version in `package.json`, commit it, and create a pure semver tag without `v`:

```bash
git tag 0.1.36
git push origin main --tags
```

`.github/workflows/release.yml` builds on Windows and publishes a normal GitHub Release using the repository's built-in `GITHUB_TOKEN`. A manual local publish is also available when `GH_TOKEN` is set:

```bash
npm run release:github
```

The first GitHub-enabled release is also built by `npm run dist:win`. Its generated ZIP and `latest.json` are uploaded to the existing VPS once so installed `0.1.34` clients can cross over. Releases after that use GitHub only.

## VPS Download Server

Server code:

```text
media-server/server.js
```

Run:

```bash
cd media-server
npm install
ALLOWED_ORIGIN="https://exam.crosslinecscatest.com" \
STORAGE_DIR="/var/crossline-media" \
PORT=8080 \
npm start
```

Current purpose:

- serve `/downloads/Crossline-CSCA-Practice-Setup.exe`
- serve `/updates/latest.json`
- serve the one-time GitHub migration ZIP for pre-GitHub installations

## Common Gotchas

- `src/app.js` is large and stateful. When changing flows, search for the screen function and also check which helper updates shared variables.
- The frontend uses both visible question numbers and backend question IDs. Answer saving must use backend IDs.
- Result details are available when `result_released_at` is set during submission.
- Admin image uploads are data URLs and can hit the Worker 128 KB JSON limit.
- Profile pictures are compressed in the client and sync through `PATCH /auth/profile` when API mode is enabled.
- PDF and image question extraction runs in Electron through `electron/source-import.js`. macOS cross-builds run `npm run prepare:win-native` so the Windows PDF renderer is included.
- HTML imports support embedded images and relative image files located inside the HTML file's directory. Remote image URLs are deliberately not fetched. Export self-contained HTML or transfer its companion image folder with it.
- `npm run test:production` verifies assistant attachments and structured HTML-style metadata, including duration, decimal marks, correct answer, and image-marker preservation.
- Kiosk protection is best-effort Electron behavior, not OS-level lockdown.
- The browser website is intentionally not the exam app.
