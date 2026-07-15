# Crossline Mock Exam Handover

This folder is the handover guide for the Crossline CSCA mock exam app. The app started as a fast prototype, so the most important thing to understand is that it is not one neat framework app. It is a small Electron/vanilla-JavaScript client, a Cloudflare Worker API, a Cloudflare D1 database, and a small VPS download server.

## Read These First

1. [System Map](system-map.md) explains the main moving parts and how they connect.
2. [Frontend and Electron Client](frontend-electron-client.md) explains the Windows app, kiosk behavior, update UI, and main student flow.
3. [Backend API](backend-api.md) lists the Cloudflare Worker endpoints and what each one does.
4. [Database](database.md) explains the D1 tables and how data is related.
5. [Login and Auth](login-auth.md) explains student registration, email verification, admin login, and tokens.
6. [Admin and Exam Creation](admin-exam-creation.md) explains the admin dashboard, notifications, imports, exams, questions, marks, images, explanations, tags, and LaTeX support.
7. [Results System](results-system.md) explains answer saving, instant scoring, result emails, and student result review.
8. [OpenCode Exam Deployment](opencode-exam-deployment.md) explains file ingestion, review, and atomic exam deployment.
8. [Secondary Mobile Camera](secondary-mobile-camera.md) explains QR pairing, phone landscape/front-camera behavior, room scan, and setup privacy terms.
9. [Developer Runbook](developer-runbook.md) explains local dev, tests, builds, deployment, updater files, and common gotchas.

## Important Current Product Decisions

- Students should not take exams from the website. The browser website is a landing/download page only.
- The actual exam runs inside the Windows Electron client.
- The app simulates the real exam setup: webcam check, microphone check, network check, facial recognition step, secondary phone camera step, room scan, terms, then the exam.
- The backend saves accounts, exams, questions, answers, flags, attempt events, and result timing.
- Results are released immediately after submission; the result email is queued at the same time.
- The VPS serves the website's Windows installer download and a private OpenCode relay. In-app updates come from public GitHub Releases.
- Student dashboards derive results, subject weaknesses, and a privacy-safe leaderboard from released attempt data.
- AI question import is admin-only. The Worker calls a restricted OpenCode service running GLM 5.2 on the VPS; no AI or relay secret is stored in the Windows client.

## Main Code Locations

- Student/admin UI: `src/app.js`
- API wrapper used by the UI: `src/api.js`
- API base URL config: `src/config.js`
- Styling: `src/styles.css`
- Electron main process and GitHub updater bridge: `electron/main.js`, `electron/preload.js`, `electron/github-updater.js`
- Backend Worker: `worker/src/index.js`
- Database schema: `worker/schema.sql`
- Database migrations: `worker/migrations/`
- VPS installer download server: `media-server/server.js`
- Restricted OpenCode service and relay: `services/opencode/`
- Smoke tests: `tests/smoke.js`
- API stress test: `scripts/stress-test-worker.mjs`
