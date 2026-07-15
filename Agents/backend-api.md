# Backend API

The backend is a Cloudflare Worker in `worker/src/index.js`. It exposes JSON endpoints for accounts, exams, attempts, phone pairing, and results. All published exams are available to every authenticated student; the API does not expose prices or enforce purchase, premium, or completed-exam limits.

The frontend calls these endpoints through `src/api.js`, which exposes `window.CrosslineApi`.

## Base URL

Production:

```text
https://api.crosslinecscatest.com
```

Configured in:

```text
src/config.js
```

## Shared API Behavior

The Worker:

- returns JSON for API routes
- handles CORS with `APP_ORIGIN`
- sets security headers like `x-content-type-options`, `x-frame-options`, and `referrer-policy`
- applies request size protection with `MAX_JSON_BODY_BYTES = 128 * 1024`
- rate-limits requests per IP and route group
- triggers result email sweeps in the background at most once per minute

Authentication uses Bearer tokens:

```http
Authorization: Bearer <token>
```

Student tokens and admin tokens are separate in frontend localStorage.

The AI import route is allowed a 2 MiB request body for extracted source text. Source files and images never reach the Worker. Other JSON routes retain the 128 KiB limit.

## Public/Health

### `GET /health`

Returns basic service status:

```json
{ "ok": true, "service": "crossline-mocks-api" }
```

Used by stress tests and health checks.

## Student Auth

### `POST /auth/register`

Request:

```json
{
  "email": "student@example.com",
  "password": "secret123",
  "username": "Arijit"
}
```

The request can also include `firstName`, `lastName`, and `avatarUrl`.

### `GET /auth/me` and `PATCH /auth/profile`

Restores a signed-in student and updates first name, last name, username, or avatar.

### OAuth

- `GET /auth/oauth/google/start`
- `GET /auth/oauth/google/callback`

These Google routes are used by Electron's social sign-in child window. Facebook sign-in is intentionally not exposed in the current client.

## Student Dashboard

- `GET /leaderboard?mode=exam&examId=...`: latest-attempt ranking for one exam.
- `GET /leaderboard?mode=average&subject=...`: last-five average ranking, recalculated from questions in the selected subject.
- `GET /notifications`: student broadcast notifications and unread count.
- `POST /notifications/:id/read`: records a read receipt.

## Admin Additions

- `GET` / `POST /admin/notifications`
- `POST /admin/ai/import`
- `POST /admin/ai/chat`
- `POST /admin/exams/:examId/questions/import`

The AI import endpoint sends extracted source text through an authenticated HTTPS relay to a restricted OpenCode 1.17.18 server using GLM 5.2. ZIP expansion, PDF parsing, HTML parsing, and Tesseract OCR happen locally in the Windows client. AI output remains an editable draft.

The chat endpoint accepts a bounded administrator conversation plus optional locally extracted attachment text and returns Markdown. The OpenCode runtime has file, shell, editing, web, and tool access denied. Reviewed drafts are deployed only through the separate authenticated `POST /admin/ai/deploy` endpoint.

The batch question endpoint validates every question first and saves up to 100 questions with one D1 batch. `POST /admin/ai/deploy` atomically creates a new exam and all reviewed questions.

What it does:

- normalizes email and username
- hashes password with `PASSWORD_PEPPER`
- creates or resets the user
- creates a six-digit email verification code
- sends the code through Resend if `RESEND_API_KEY` is configured

### `POST /auth/verify`

Request:

```json
{
  "email": "student@example.com",
  "code": "123456"
}
```

What it does:

- checks the code hash
- checks expiry
- marks the user as verified
- deletes the verification row
- creates a student session token

Returns:

```json
{
  "user": { "email": "student@example.com", "username": "Arijit" },
  "token": "..."
}
```

### `POST /auth/login`

Checks verified user credentials and returns a student token.

### `POST /auth/password-reset/request`

Accepts an email address and returns a generic success response. For a verified account, the Worker creates a hashed six-digit code, stores it for 15 minutes, and sends it through Resend. The generic response reduces account discovery.

### `POST /auth/password-reset/confirm`

Accepts the email, six-digit code, and new password. A successful reset updates the password hash, deletes the one-time code, and revokes every existing session for that user.

## Admin Auth

### `POST /admin/login`

Admin credentials are not stored as normal user passwords. The Worker checks:

- `ADMIN_EMAILS` or `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

If the admin email does not already exist in `users`, the Worker creates a verified admin user record for token ownership.

## Exams

### `GET /exams`

Requires student token.

Returns published exams with questions:

```json
{
  "exams": [
    {
      "id": "math-physics",
      "title": "...",
      "description": "...",
      "duration": 90,
      "questions": []
    }
  ]
}
```

### `GET /admin/exams`

Requires admin token.

Returns all exams, published or not.

### `POST /admin/exams`

Requires admin token.

Creates an exam with title, description, and duration.

### `DELETE /admin/exams/:examId`

Requires admin token.

Deletes the exam, its questions, related exam sessions, and related session events.

## Questions

### `POST /admin/exams/:examId/questions`

Requires admin token.

Creates one MCQ question. Current shape:

```json
{
  "text": "Question text",
  "answers": ["A", "B", "C", "D"],
  "correctIndex": 1,
  "marks": 2.5,
  "explanation": "Why B is correct",
  "explanationImage": "data:image/png;base64,...",
  "image": "data:image/png;base64,..."
}
```

Important: images are currently sent as data URLs inside JSON. Because the Worker has a 128 KB JSON body limit, large images will fail. A future production improvement should upload images to object storage and store URLs instead.

### `PUT /admin/exams/:examId/questions/:questionId`

Requires admin token.

Updates the question fields.

### `DELETE /admin/exams/:examId/questions/:questionId`

Requires admin token.

Deletes a question. It does not currently re-number remaining question positions.

## Exam Sessions and Answers

### `POST /sessions`

Requires student token.

Creates an `exam_sessions` row and returns:

```json
{
  "sessionId": "...",
  "pairingCode": "ABC123",
  "pairingUrl": "https://api.crosslinecscatest.com/connect?code=ABC123"
}
```

The desktop app turns `pairingUrl` into a QR code.

### `GET /sessions/:sessionId/status`

Requires student token.

Used by the desktop app while waiting for the phone to connect.

Returns whether `phoneConnectedAt` is set.

### `POST /sessions/:sessionId/events`

Requires student token.

Stores event logs such as:

- integrity events
- room scan completed
- exam started
- exam submitted

### `POST /sessions/:sessionId/answers`

Requires student token.

Saves answers and flags throughout the exam. When `submitted` is true, the Worker also sets:

- `submitted_at`
- `result_released_at`, set at submission
- `result_email_after`, set at submission so email delivery is queued immediately

## Phone Pairing

### `GET /connect?code=ABC123`

Returns the phone camera pairing page as HTML.

This page:

- asks the phone to use landscape mode
- uses the front camera
- calls `/pair-phone` when the user clicks the check button

### `POST /pair-phone`

Request:

```json
{ "code": "ABC123" }
```

What it does:

- finds the matching exam session by `pairing_code`
- sets `phone_connected_at`
- writes a `phone_connected` event

## Results

### `GET /results`

Requires student token.

Lists the student's submitted attempts. Pending results show `ready: false`. Released results include score.

### `GET /results/:id`

Requires student token.

Before release, returns no questions. After release, returns:

- score
- all questions
- all options
- selected answer
- correct answer
- marks
- explanation text/image

## Admin Submissions

### `GET /admin/submissions`

Requires admin token.

Returns recent exam attempts, result email status, and event counts.

### `GET /admin/submissions/:sessionId`

Requires admin token.

Returns full answer review and event log for a specific attempt.
