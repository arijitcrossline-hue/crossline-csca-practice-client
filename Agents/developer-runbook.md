# Developer Runbook

## Install and Run

```bash
npm install
npm start
```

`npm start` passes `--windowed`, so kiosk capability is disabled for ordinary development. To exercise the full setup lock behavior:

```bash
npm run start:kiosk
```

Browser-only landing page:

```bash
npm run serve
```

Open `http://localhost:4173/src/` if serving from the repository root. The browser never shows exam-taking UI.

## API Configuration

Default: `https://api.crosslinecscatest.com` in `src/config.js`.

Temporary override:

```js
localStorage.setItem("crossline-api-base", "http://127.0.0.1:8787");
```

Remove the key to return to production.

## Test Suite

```bash
npm test
```

This runs migration-chain verification, source parsing, archive extraction, updater compatibility, security integrations, email rendering, and JSDOM UI flows.

Syntax-check focused files when editing large scripts:

```bash
node --check electron/main.js
node --check electron/source-import.js
node --check worker/src/index.js
```

## Local Worker and D1

For a fresh local Wrangler state only:

```bash
npm run worker:migrate:local
npm run worker:seed:local
npm run worker:dev
```

`worker/schema.sql` is the consolidated new-database schema. Do not apply it over an older local database. For an existing local database, apply its missing numbered migrations in order, or remove only the disposable local Wrangler state and recreate it.

Use a local API override in the UI. Email/model secrets may be absent; their routes will log/fail in controlled ways.

## Production Worker Deployment

For a new D1 database, apply `worker/schema.sql`. For an existing database, apply only unapplied numbered migrations in order. Do not rerun `ALTER TABLE ADD COLUMN` migrations.

Current package scripts expose selected migration shortcuts; missing ones can be applied explicitly:

```bash
npx wrangler d1 execute crossline-mocks --remote --config worker/wrangler.toml --file worker/migrations/0010_password_resets.sql
```

Deploy:

```bash
npm run worker:deploy
```

Required or feature-specific secrets:

```text
ADMIN_MFA_ENCRYPTION_KEY
PASSWORD_PEPPER
SESSION_TOKEN_SECRET
RESEND_API_KEY
OAUTH_STATE_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
OPENCODE_RELAY_SECRET
GLM_API_KEY
```

`GLM_API_KEY` is needed by the VPS provider and is also the Worker's emergency direct fallback when configured there. Never commit secret values.

`MEDIA_UPLOAD_SECRET` must match the root-only `/etc/crossline-media.env` value on the VPS. `QUESTION_IMAGE_UPLOAD_URL` and `QUESTION_IMAGE_ORIGIN` are non-secret Worker variables.

`MAINTENANCE_SECRET` must match the root-only `/etc/crossline-maintenance.env` value on the VPS. `crossline-maintenance.timer` invokes the Worker's internal maintenance endpoint every five minutes to finalize expired exams, deliver queued results, process deletion requests, clean expired security records, and migrate legacy embedded question images.

## Website Deployment

Cloudflare Pages project: `crossline-mocks`.

```bash
npx wrangler pages deploy src --project-name crossline-mocks --branch main
```

Verify:

- landing page and responsive layout
- website registration/verification
- `/privacy`, `/terms`, `/data-deletion`
- stable installer link returns 200
- cache-busting query strings in `src/index.html` reflect major frontend deployments

## OpenCode VPS Operations

Versioned service files are in `services/opencode/`. Production services:

- OpenCode on `127.0.0.1:4096`
- authenticated relay on `127.0.0.1:8090`
- Caddy `/admin-ai/*` reverse proxy

Secrets are loaded from `/etc/crossline-opencode.env`. Health check without printing secrets:

```bash
sudo systemctl status crossline-opencode crossline-opencode-relay
sudo bash -c 'set -a; . /etc/crossline-opencode.env; set +a; curl -fsS -H "x-crossline-relay-secret: $OPENCODE_RELAY_SECRET" http://127.0.0.1:8090/health'
```

After changing `relay.mjs` or service files, deploy to `/opt/crossline-opencode`, reload systemd when units changed, restart the affected service, and check logs with `journalctl`.

## Production Verification

The production test logs in as admin, calls the real assistant, imports source with marks/image markers, atomically creates a temporary draft exam, verifies its stored image, and archives it:

```bash
CROSSLINE_ADMIN_EMAIL="..." \
CROSSLINE_ADMIN_PASSWORD="..." \
CROSSLINE_ADMIN_TOTP="123456" \
npm run test:production
```

Run only with an approved test admin account.

## Bounded Stress Test

Health-only:

```bash
npm run stress:api
```

One hundred health scenarios:

```bash
STRESS_USERS=100 STRESS_CONCURRENCY=25 STRESS_REPEAT=1 npm run stress:api
```

Authenticated production testing requires `STRESS_ALLOW_AUTH=true`. Session creation additionally requires `STRESS_ALLOW_WRITES=true` and an exam ID. Start small during a quiet window. The script refuses more than 100 simulated users unless `--allow-over-100` is explicit.

It reports count, status distribution, failures, and p50/p95/p99 latency by route.

## Build Windows Installer

```bash
npm run dist:win
```

Artifacts go to `release/`. The important outputs are the versioned installer and blockmap plus the stable installer copy. `prepare-win-native` handles native Windows packaging dependencies.

Interactive installer behavior is controlled by `package.json` and `build/installer.nsh`.

## Publish an Application Update

See [Updates and Releases](updates-and-releases.md). Minimal sequence:

```bash
npm test
git push origin main
git tag 0.1.36
git push origin 0.1.36
```

Use the version actually present in `package.json`; never copy the example blindly. Verify the release workflow and uploaded assets before updating the VPS stable installer.

## VPS Download Service

Application root: `media-server/`. Production releases are stored in `/var/crossline-media/downloads`; question images are stored in `/var/crossline-media/question-images`.

```bash
cd media-server
npm install
ALLOWED_ORIGIN="https://exam.crosslinecscatest.com" \
MEDIA_UPLOAD_SECRET="..." \
STORAGE_DIR="/var/crossline-media" \
PORT=8080 \
npm start
```

Run `npm test` in `media-server/`. Verify `/health`, an unauthorized image upload returns 401, installer `HEAD`, content length, checksum, and Caddy TLS after replacing files. Keep the upload secret in `/etc/crossline-media.env`, never in the systemd unit.

## Deployment Order for a Full Release

1. Update source and documentation.
2. Run `npm test`.
3. Deploy Worker if backend changed; apply migration first if required.
4. Deploy OpenCode relay/service if AI backend changed.
5. Deploy Pages if `src/` changed.
6. Bump package version and push the matching release tag for Electron changes.
7. Verify the release assets and signature.
8. Replace the stable VPS installer.
9. Test website registration, Windows login, one setup flow, one submission/result, admin import, and update check.

## Common Gotchas

- `src/app.js` is stateful; changing a render function without its globals/listeners causes subtle regressions.
- Browser and Electron share `src/`; guard native calls with `window.examRuntime`.
- HTML relative images require the real file path, which is why there is a special HTML IPC method.
- Model chat does not receive image binaries; it sees OCR text and markers.
- Batch imports can be large, while normal API requests cannot.
- Results are immediately visible; email status is separate.
- Answer maps use question UUIDs, not visible positions.
- Kiosk is best-effort, not Windows policy enforcement.
- Differential updates may legally fall back to a full installer.
- GitHub filenames and `latest.yml` must stay in sync.
- Never run destructive D1 schema commands against production to apply one migration.
