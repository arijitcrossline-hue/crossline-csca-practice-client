# Frontend and Electron Client

## Frontend Architecture

The frontend is a framework-free single-page application. `src/app.js` renders each screen by replacing `#app.innerHTML`, then attaches listeners with `bind()`. Shared state is held in module-level variables and localStorage.

There are two runtime modes:

- Browser: landing page, website registration/verification, legal pages, installer link.
- Electron: student and administrator application.

The final branch at the bottom of `src/app.js` selects the mode using `window.examRuntime`, which exists only when `electron/preload.js` has run.

## Public Website

`showDownloadLanding()` renders the marketing page and Windows dashboard preview. `hydrateDownloadLinks()` sends a `HEAD` request to the stable VPS installer and enables download buttons only when the file exists.

The website can create and verify an account with `showWebsiteRegister()` and `showWebsiteVerification()`. It does not expose exam-taking screens. Legal routes are selected from `window.location.pathname`:

- `/privacy`
- `/terms`
- `/data-deletion`

## Student Application

Main flow functions:

- `restoreStudentSession()`: calls `/auth/me` when a stored token exists.
- `showAuth()`: email login/registration and Google sign-in.
- `showPasswordReset()`: request and confirm one-time recovery code.
- `showStudentDashboard()`: profile, metrics, trend graphs, weaknesses, recent mistakes, notifications, and navigation.
- `showExamList()`: all published exams; all currently return `canStart: true`.
- `showStudentResults()` and `showStudentResultDetail()`: marks-based history and answer review.
- `showWeaknessAnalysis()`: subject/chapter/topic aggregation from result details.
- `showLeaderboard()`: latest-exam and last-five-average rankings.
- `showStudentSettings()`: profile and update settings.

Profile fields are synchronized through `PATCH /auth/profile`. Local mode uses per-email localStorage keys.

## Setup and Exam Flow

`showEquipmentCheck()` enters kiosk mode and manages three checks:

- camera preview using the selected `videoinput`
- microphone recording test using Web Audio analyser bars
- network test against API/media endpoints

`enumerateDevices()` initially sees limited labels until permission is granted. `scanAvailableDevices()` opens camera/microphone permission, enumerates again, and fills device selectors. Device-change events can refresh the list.

Next screens:

```text
showEquipmentCheck()
  -> showFacialRecognition()
  -> showPhonePairing()
  -> showRoomScan()
  -> showPrivacyTerms()
  -> startExam()
```

The facial-recognition screen is a simulation: it checks that a face is positioned for the practice flow, not biometric identity matching. The room scan is a user confirmation, not a recorded upload.

`startExam()` stops all media streams before rendering questions. `renderExamShell()` and `renderQuestion()` provide timer, previous/next, text zoom, flagging, option selection, and question grid. Answers are keyed by backend question ID. `submitExamAndExit()` asks for confirmation, submits, records an event, leaves kiosk, and returns to the dashboard.

## Electron Security Boundary

`electron/main.js` creates a BrowserWindow with:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- no menu
- denied new-window and navigation attempts
- content-protection hint
- restricted local-file CSP

Kiosk begins only when setup begins. While active, the main process:

- enables kiosk, fullscreen, and always-on-top
- focuses the window every second
- blocks close and minimize
- blocks common reload, DevTools, navigation, Alt+Tab, and Alt+F4 shortcuts where Electron/Windows permits
- prevents display sleep
- emits integrity events for blocked actions/focus loss

This does not make Alt+Tab universally impossible at the Windows security boundary. A truly locked exam machine requires managed Windows policies outside Electron.

## Preload IPC API

`window.examRuntime` exposes:

- runtime/version information
- check/download/install/reset update
- start OAuth
- open the allowlisted Discord link
- extract one or more question sources
- subscribe to source-import, OAuth, update, and integrity events
- enter/leave kiosk
- pause focus guard briefly for native dropdown interaction
- exit the app

No generic filesystem, shell, or arbitrary URL API is exposed.

## OAuth Window

`startOAuth("google")` asks the main process to open a modal child BrowserWindow. The Worker performs OAuth. When navigation reaches the allowlisted `/auth/oauth/complete` URL, the main process extracts token/user data, emits `oauth-complete`, and closes the child window.

## Rendering and Content

- `escapeHtml()` escapes ordinary UI values.
- `mathHtml()` preserves line breaks and lets MathJax process LaTeX afterward.
- `markdownHtml()` sanitizes AI Markdown through an element allowlist.
- `renderMath()` calls MathJax after question/result/admin screens render.
- `uiIcon()` loads local SVG icons; dashboard illustrations and fonts are local assets.

## Local Prototype Mode

If `window.CrosslineApi.enabled()` is false, auth, exams, and results use localStorage demo data. This is useful for UI tests but does not exercise email, D1, phone pairing, or production authorization.

## Main Maintenance Risk

`src/app.js` combines rendering, state, and orchestration in one large file. A future refactor should preserve behavior while splitting by domain: public site, auth, dashboard/results, setup/exam, admin/import, update UI, and shared helpers.
