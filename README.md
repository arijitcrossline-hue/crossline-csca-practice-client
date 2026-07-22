# CSCA Practice Client

A Windows-ready mock exam client modeled after the supplied CSCA exam photo. It includes:

- English-only registration, email verification, persistent login, and Google OAuth
- Exam selection and administrator exam authoring pages
- Webcam, microphone, network, face-framing, guided room-walkthrough, and phone-camera setup steps
- 48-question navigation with answered, active, and flagged states
- Previous/next navigation and text zoom controls
- A timer, submission summary, and practice kiosk launch mode
- Topic-level weakness analysis, subject score graphs, notifications, and two leaderboard modes
- Admin HTML/PDF/Markdown/image import with local parsing, image preservation, and Tesseract OCR
- Restricted OpenCode/GLM 5.2 administrator assistant and batched question-bank saving
- One Windows `.exe` package for student download

## Run on macOS during development

```bash
npm install
npm start
```

Use `npm run start:kiosk` to preview the fullscreen practice experience. The exit button leaves kiosk mode.

Automated browser tests inject their own local-only fixtures. The packaged client and public website always use the production account service and do not contain fixed login or verification credentials.

## Backend milestone

The project now includes a low-cost Cloudflare backend in `worker/`:

- Cloudflare Worker API for login, registration, email verification, admin login, exams, questions, sessions, answer saving, result emails, and phone pairing
- D1 database schema for users, exams, questions, sessions, events, and answers
- VPS download server for the website's Windows installer
- Signed differential packages for in-app Windows updates
- Resend email support for `verify@crosslinecscatest.com`
- Frontend API bridge fixed to the production origin, with loopback-only overrides for development

Create the Cloudflare resources:

```bash
npx wrangler login
npx wrangler d1 create crossline-mocks
```

Paste the returned D1 `database_id` into `worker/wrangler.toml`. For a brand-new, empty database only, apply the consolidated schema and seed data:

```bash
npm run worker:migrate
npm run worker:seed
```

For an existing production database, do not run the consolidated schema. Follow [the public launch runbook](docs/launch-runbook.md), verify the migration chain, and apply every missing numbered migration once in order.

Set the production secrets:

```bash
npx wrangler secret put PASSWORD_PEPPER --config worker/wrangler.toml
npx wrangler secret put SESSION_TOKEN_SECRET --config worker/wrangler.toml
npx wrangler secret put ADMIN_MFA_ENCRYPTION_KEY --config worker/wrangler.toml
npx wrangler secret put RESEND_API_KEY --config worker/wrangler.toml
npx wrangler secret put OAUTH_STATE_SECRET --config worker/wrangler.toml
npx wrangler secret put GOOGLE_CLIENT_ID --config worker/wrangler.toml
npx wrangler secret put GOOGLE_CLIENT_SECRET --config worker/wrangler.toml
npx wrangler secret put GLM_API_KEY --config worker/wrangler.toml
```

`arijitsumit123@gmail.com` is the protected creator administrator. Sign in as that student, open Settings, and configure an authenticator before entering the admin panel. Additional administrators can then be granted access from the Admin access screen.

Deploy the API:

```bash
npm run worker:deploy
```

After deployment, point an API hostname such as `api.crosslinecscatest.com` to the Worker in Cloudflare. Local backend overrides are accepted only on `localhost` and loopback addresses:

```js
localStorage.setItem("crossline-api-base", "https://api.crosslinecscatest.com");
```

Run the download server on your VPS:

```bash
cd media-server
npm install
ALLOWED_ORIGIN="https://exam.crosslinecscatest.com" \
STORAGE_DIR="/var/crossline-media" \
PORT=8080 \
npm start
```

Put Nginx or Caddy in front of it with HTTPS, then point `media.crosslinecscatest.com` to the VPS.

The Windows app download is served from the media VPS because Cloudflare Pages has a 25 MiB per-file limit. Copy the built client to:

```bash
sudo mkdir -p /var/crossline-media/downloads
sudo cp "Crossline-CSCA-Practice-Setup.exe" /var/crossline-media/downloads/
```

The public download URL is:

```text
https://media.crosslinecscatest.com/downloads/Crossline-CSCA-Practice-Setup.exe
```

Suggested DNS layout:

- `api.crosslinecscatest.com`: Cloudflare Worker API
- `exam.crosslinecscatest.com`: account creation and Windows-client download landing page
- `media.crosslinecscatest.com`: VPS installer download and network-test metadata

## Build on a Windows PC over SSH

This avoids a virtual machine. On the Windows PC:

1. Install the current Node.js LTS release.
2. In Windows Settings, install **OpenSSH Server** from Optional Features.
3. Start the service in an Administrator PowerShell:

```powershell
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
```

4. Find the PC address with `ipconfig`.
5. From the Mac, test the connection:

```bash
ssh windows-user@192.168.1.40
```

6. Push the source and build the Windows packages:

```bash
chmod +x scripts/push-to-windows.sh
./scripts/push-to-windows.sh windows-user@192.168.1.40 'C:\Users\windows-user\Projects\csca-practice' --build
```

The Windows package appears in `release` on the Windows PC. Without `--build`, the script only transfers the source.

## Security boundary

`npm run start:kiosk` uses Electron kiosk mode, fullscreen display, always-on-top behavior, navigation blocking, DevTools shortcut blocking, and Electron's content-protection hint. These are appropriate for an opt-in practice client, but they are not a secure exam environment.

For an administered exam lab, configure restrictions outside this app through Windows management:

- Use a dedicated local exam account and Windows Assigned Access or Shell Launcher.
- Apply AppLocker or Windows Defender Application Control allowlists through Group Policy or MDM.
- Disable screen capture, remote assistance, and unapproved applications through lab policy.
- Keep an administrator-controlled recovery procedure.

The practice app intentionally does not terminate applications, install system hooks, disable Task Manager, interfere with remote-support software, or reject virtual machines. Those controls need explicit institutional policy, testing, and a recovery path.
