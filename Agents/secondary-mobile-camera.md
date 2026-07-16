# Secondary Mobile Camera

The secondary phone step simulates the setup of a monitored exam. It verifies that a phone can open its front-facing camera in landscape orientation. It does not transmit or store the video feed.

## Session Creation

After facial-recognition setup, `showPhonePairing()` calls:

```http
POST /sessions
```

The Worker authenticates the student, verifies the exam, prunes old attempts beyond the newest 50, and creates:

- attempt/session UUID
- unique six-character pairing code
- `pairingUrl` based on `CONNECT_ORIGIN`

The desktop renders a QR image using `api.qrserver.com` and begins polling its own authenticated status endpoint.

## Phone Page

The QR code opens:

```text
https://api.crosslinecscatest.com/connect?code=ABC123
```

`phoneConnectPage()` returns standalone HTML/JavaScript. It:

- displays the pairing code
- detects landscape using viewport/screen orientation
- disables the check button in portrait
- requests `facingMode: "user"`
- requests ideal 960x540 and 16:9
- shows the camera locally in a `<video>` element
- posts only the pairing code to `/pair-phone`

The video stream remains inside the phone browser. No frames, chunks, audio, WebRTC connection, recording, or upload endpoint is created.

## Pairing State

`POST /pair-phone` is public because the phone has no student token. The random pairing code acts as the capability. The Worker looks up that code, sets `phone_connected_at`, writes a `phone_connected` event, and returns the session ID.

The desktop polls:

```http
GET /sessions/:sessionId/status
```

This endpoint requires the student's token and verifies session ownership. When `phoneConnectedAt` appears, `markPhoneConnected()` stops polling and automatically advances.

Pairing codes currently have no separate expiry column; they become irrelevant when the attempt is old/deleted. Adding an explicit expiry and one-time state would strengthen this public capability route.

## Room Scan

`showRoomScan()` instructs the student to rotate the phone around the room and click **Ok the scan is done**. The desktop records `room_scan_completed` with small metadata and moves to privacy terms.

This is a student-confirmed simulation. The desktop cannot see the phone preview, does not measure rotation, and does not receive room images.

## Privacy and Stream Shutdown

`showPrivacyTerms()` states that setup permissions simulate the real exam and that recordings are not saved. When the student accepts, `startExam()` calls `stopMedia()` and related cleanup helpers. Desktop webcam/microphone streams and analyser state are stopped before question-taking begins.

## Local Demo Behavior

When no production API is enabled, the setup can use local fallback behavior for UI testing. Real QR ownership/pairing state requires the Worker.
