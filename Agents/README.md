# Crossline CSCA Codebase Guide

This folder documents the application as it exists in version `0.1.35`. It is intended for both human developers and coding agents. The source is the final authority; these guides explain the runtime boundaries, data flow, and the places most likely to be changed.

## Recommended Reading Order

1. [System Map](system-map.md) - the deployed components and how they communicate.
2. [Codebase Index](codebase-index.md) - what every source directory and important file owns.
3. [Frontend and Electron Client](frontend-electron-client.md) - website, Windows UI, kiosk, devices, and IPC.
4. [Backend API](backend-api.md) - every production route and shared API behavior.
5. [Database](database.md) - D1 tables, relationships, retention, and migrations.
6. [Login and Authentication](login-auth.md) - registration, verification, password reset, Google OAuth, and admin auth.
7. [Admin and Exam Creation](admin-exam-creation.md) - manual authoring, editing, imports, notifications, and submissions.
8. [AI Assistant and File Import](ai-assistant-and-file-import.md) - the complete GLM/OpenCode chat and attachment pipeline.
9. [Results System](results-system.md) - answer persistence, scoring, analytics, leaderboards, and email.
10. [Secondary Mobile Camera](secondary-mobile-camera.md) - QR pairing, front-camera check, landscape requirement, and room scan.
11. [Updates and Releases](updates-and-releases.md) - NSIS, GitHub Releases, blockmaps, installer behavior, and the old-client bridge.
12. [Developer Runbook](developer-runbook.md) - local development, testing, deployment, production checks, and common failures.

## Product Rules That Shape the Code

- The website is a landing page, account-registration surface, legal-page host, and Windows installer download page. Students do not take exams in the browser.
- The installed Electron client is the student exam application and also contains the administrator workspace.
- All published exams are currently free. Price columns remain in D1 for schema compatibility but are forced to zero and are not exposed to students.
- Results are released immediately when an exam is submitted. Result email delivery is attempted asynchronously.
- Webcam, microphone, front-facing phone camera, facial-recognition, and room-scan steps are simulations/checks. Device streams are stopped before questions begin, and no video, audio, screen, or room-scan recording is uploaded or stored.
- The kiosk layer is best-effort practice-exam behavior. It is not a substitute for Windows Assigned Access, AppLocker, or a managed institutional exam environment.
- AI features are admin-only. Original files are parsed locally; the model receives extracted text and image markers, not ZIP/PDF/image binaries.
- In-app updates use public GitHub Releases. The VPS keeps the stable website installer URL and the one-time bridge required by clients older than `0.1.35`.

## Production Addresses

- Landing page: `https://exam.crosslinecscatest.com`
- Worker API and phone page: `https://api.crosslinecscatest.com`
- Installer and private AI relay hostname: `https://media.crosslinecscatest.com`
- GitHub repository: `https://github.com/arijitcrossline-hue/crossline-csca-practice-client`

## Important Entry Points

- UI and client flow: `src/app.js`
- Browser API wrapper: `src/api.js`
- Electron process: `electron/main.js`
- Electron renderer bridge: `electron/preload.js`
- Local question-source parser: `electron/source-import.js`
- GitHub updater adapter: `electron/github-updater.js`
- Cloudflare Worker: `worker/src/index.js`
- D1 schema: `worker/schema.sql`
- OpenCode relay: `services/opencode/relay.mjs`
- Installer configuration: `package.json`, `build/installer.nsh`
- Release workflow: `.github/workflows/release.yml`

## Documentation Rule

When behavior changes, update the relevant guide in the same commit. Do not document secrets, real passwords, API keys, private SSH keys, or bearer tokens.
