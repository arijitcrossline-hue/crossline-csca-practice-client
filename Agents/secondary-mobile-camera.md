# Secondary Mobile Camera

The secondary phone camera is a simulation of the real exam setup. It verifies that the student's phone can open a front-facing camera in landscape mode, then moves the desktop app to a 360-degree room scan step.

The phone page confirms that the secondary device can open its front camera in the correct orientation. The backend only stores the pairing timestamp and setup events.

## Main Frontend Functions

Desktop app in `src/app.js`:

- `showPhonePairing()`
- `startPhonePairingPoll()`
- `markPhoneConnected()`
- `showRoomScan()`
- `showPrivacyTerms()`

Phone page in `worker/src/index.js`:

- `phoneConnectPage(url, env)`

Backend pairing:

- `createExamSession()`
- `sessionStatus()`
- `pairPhone()`

## Desktop Flow

After equipment check and facial recognition:

```text
showFacialRecognition()
  -> showPhonePairing()
  -> startPhonePairingPoll()
```

If the production API is available, `showPhonePairing()` calls:

```js
window.CrosslineApi.createSession(currentExam.id)
```

That creates an `exam_sessions` row and returns:

- `sessionId`
- `pairingCode`
- `pairingUrl`

The desktop app converts `pairingUrl` into a QR code using:

```text
https://api.qrserver.com/v1/create-qr-code/
```

Then the desktop polls:

```http
GET /sessions/:sessionId/status
```

When `phoneConnectedAt` appears, the desktop calls:

```js
markPhoneConnected()
```

That automatically continues to:

```js
showRoomScan()
```

## Phone Flow

The QR code opens:

```http
GET /connect?code=ABC123
```

The Worker returns a small HTML page. The page:

- displays the pairing code
- asks the student to keep the phone in landscape
- disables the check button until landscape is detected
- requests the front camera only
- shows a preview video
- calls `/pair-phone` after the camera opens

The camera constraint is:

```js
video: {
  facingMode: "user",
  width: { ideal: 960 },
  height: { ideal: 540 },
  aspectRatio: { ideal: 1.7777778 }
}
```

This requests the front camera in a landscape 16:9 shape.

## Pairing API

Phone page calls:

```http
POST /pair-phone
```

Payload:

```json
{ "code": "ABC123" }
```

Backend behavior:

- looks up `exam_sessions.pairing_code`
- sets `phone_connected_at`
- inserts a `phone_connected` event
- returns `{ "ok": true, "sessionId": "..." }`

The desktop app sees this on its next poll.

## Room Scan

After the phone connects, the desktop app shows:

```js
showRoomScan()
```

The student is instructed to rotate the phone 360 degrees around the room and click:

```text
Ok the scan is done
```

The app records an event:

```js
recordSessionEvent("room_scan_completed", { examId: currentExam?.id })
```

Then it shows privacy terms.

## Privacy Terms

`showPrivacyTerms()` tells the student:

- checks are for simulation of the real exam setup
- webcam/microphone/phone camera are not used after setup
- no webcam, microphone, screen, secondary-camera, or room-scan recording is saved
- answers and attempt details are saved for result delivery

After accepting terms, `startExam()` calls `stopMedia()`.
