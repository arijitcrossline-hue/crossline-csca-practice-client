# Frontend and Electron Client

The frontend is a vanilla JavaScript single-page app inside `src/app.js`. It uses direct DOM rendering instead of a framework.

## Main Files

- `src/index.html`: page shell, loads MathJax, config, API wrapper, and app script.
- `src/config.js`: sets the production API base URL.
- `src/api.js`: wraps backend API calls and token storage.
- `src/app.js`: most UI screens and business flow.
- `src/styles.css`: all visual styling and animations.
- `electron/main.js`: creates the app window, kiosk behavior, blocked shortcuts, permissions, updater IPC.
- `electron/preload.js`: exposes safe APIs to the frontend as `window.examRuntime`.
- `electron/github-updater.js`: adapts `electron-updater` events to the existing in-app update panel.

## How Screens Are Rendered

Most screens are functions in `src/app.js` that replace the root `#app` element:

```js
app.innerHTML = `...html...`;
```

Then each screen binds event handlers using the helper:

```js
function bind(id, event, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener(event, handler);
}
```

For a frontend refactor, this file is the main thing to split up. The highest-value cleanup would be separating:

- auth screens
- dashboard/results screens
- setup/preflight screens
- exam-taking screen
- admin screens
- update panel
- shared rendering helpers

## Student UI Flow

Important functions:

- `showAuth()`: login/register page.
- `showVerification()`: six-digit email verification page.
- `showStudentDashboard()`: student home page after login.
- `showExamList()`: choose an exam.
- `showEquipmentCheck()`: camera, microphone, and network checks.
- `showFacialRecognition()`: simulated facial recognition step.
- `showPhonePairing()`: QR pairing for secondary phone camera.
- `showRoomScan()`: 360-degree room scan instruction screen.
- `showPrivacyTerms()`: setup privacy terms before the exam starts.
- `startExam()`: starts the timed exam and stops device streams.
- `renderExamShell()` and `renderQuestion()`: exam UI and question navigation.
- `submitExamAndExit()`: saves/submits answers and returns to dashboard.
- `showStudentResults()` and `showStudentResultDetail()`: result list and full answer review.

## Kiosk and Fullscreen Behavior

The app intentionally does not go fullscreen immediately on login. It enters kiosk mode when the user starts the exam setup:

```js
showExamList() -> showEquipmentCheck() -> ensureKiosk()
```

`ensureKiosk()` calls `window.examRuntime.enterKiosk()`, which is implemented in `electron/main.js`.

Electron kiosk controls include:

- `mainWindow.setKiosk(true)`
- `mainWindow.setFullScreen(true)`
- `mainWindow.setAlwaysOnTop(true, "screen-saver")`
- periodic focus enforcement
- global shortcut registration
- close/minimize prevention while kiosk is active

The app leaves kiosk on login/dashboard/results screens using `leaveKiosk()`.

## Device Checks

The equipment check has three required checks before moving forward:

- camera
- microphone
- network

The microphone check uses the Web Audio API. `startMicrophoneRecordingTest()` opens the selected mic, connects it to an analyser, and animates the wave bars. `stopMicrophoneRecordingTest(true)` stops the stream and marks the check passed.

The camera and facial recognition steps use `navigator.mediaDevices.getUserMedia`. After setup is complete, `startExam()` calls `stopMedia()`, so the camera and microphone are not kept active during the question section.

## Update UI

Update controls are only exposed on login and dashboard, not everywhere.

Frontend functions:

- `checkForUpdates()`
- `installUpdateNow()`
- `restartUpdateNow()`
- `registerUpdateProgressEvents()`
- `updatePanelHtml()`

Electron functions:

- `check-for-updates`
- `download-update`
- `install-downloaded-update`

`electron-updater` checks the latest public GitHub Release, reads `latest.yml`, and uses the installer blockmap for differential downloading when possible. It can fall back to the full installer if a differential update cannot be used. Download progress and errors are sent to the renderer over IPC, so update controls stay inside the app instead of opening a modal behind the kiosk window. The downloaded NSIS update is installed on quit or when the student clicks Restart and install.

```js
autoUpdater.disableDifferentialDownload = false;
```

Because NSIS updates the existing installation, desktop and Start menu shortcuts remain valid.

## Browser Landing Page

If the app runs in a normal browser, there is no `window.examRuntime`, so the frontend shows `showDownloadLanding()`. That landing page does not allow taking exams. It only checks whether the Windows setup file exists and activates the download link.

## Local Prototype Mode

If `window.CrosslineApi.enabled()` is false, the app falls back to localStorage demo data:

- demo student: `student@example.com` / `demo123`
- demo verification code: `246810`
- demo admin: `admin@crossline.test` / `admin123`

Production should use the Worker API.
