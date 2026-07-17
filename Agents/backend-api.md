# Backend API

The production backend is the Cloudflare Worker in `worker/src/index.js`. The renderer calls it through `window.CrosslineApi` in `src/api.js`.

## Shared Request Behavior

Production base URL: `https://api.crosslinecscatest.com`.

The API wrapper:

1. JSON-encodes request bodies.
2. Reads the correct token from localStorage.
3. Adds `Authorization: Bearer <token>`.
4. Parses JSON responses.
5. Throws the server's `error` string for non-2xx responses.

Token keys:

- student: `crossline-api-token`
- admin: `crossline-admin-api-token`

The Worker adds CORS and security headers through `json()`/`cors()`. The allowed browser origin comes from `APP_ORIGIN`.

## Body Limits

- Normal JSON routes: 128 KiB.
- AI chat/import: 2 MiB.
- Single question create/update: 2 MiB.
- Batch question import and atomic AI deployment: 64 MiB.

`readJson()` checks `content-length` and streamed text size before parsing.

## Rate Limits

The in-memory per-Worker-instance limiter groups requests by client IP for a one-minute window:

| Group | Limit/minute |
| --- | ---: |
| Health | 600 |
| Login/register/verify/admin login | 180 |
| Other auth | 900 |
| Admin | 240 |
| Session status polling | 6000 |
| Phone pair | 300 |
| Other session routes | 5000 |
| Other writes | 300 |
| Other reads | 600 |

This protects normal accidental bursts but is not a globally consistent distributed rate limiter. Cloudflare edge/WAF rate limiting is the stronger production layer for DDoS control.

## Route Reference

### Public

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | Service health JSON. |
| GET | `/connect?code=...` | Phone camera pairing HTML. |
| POST | `/pair-phone` | Mark a pairing code connected. |

### Student authentication and profile

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create/reset an unverified account and email a code. |
| POST | `/auth/verify` | Verify code and return a student token. |
| POST | `/auth/login` | Password login for a verified account. |
| POST | `/auth/password-reset/request` | Send a generic response and, when valid, a reset code. |
| POST | `/auth/password-reset/confirm` | Replace password and revoke old sessions. |
| GET | `/auth/me` | Restore the current student. |
| PATCH | `/auth/profile` | Update username, names, and avatar. |
| GET | `/auth/oauth/:provider/start` | Start Google/Facebook OAuth server flow. |
| GET | `/auth/oauth/:provider/callback` | Exchange provider code and upsert account. |
| GET | `/auth/oauth/complete` | Desktop OAuth completion page. |

The current UI exposes Google and intentionally hides Facebook.

### Student exams, attempts, and dashboard

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/exams` | Return all published exams with questions; all are free/startable. |
| POST | `/sessions` | Create an attempt and phone pairing code. |
| GET | `/sessions/:id/status` | Poll phone connection state. |
| POST | `/sessions/:id/events` | Store a bounded event type/payload. |
| POST | `/sessions/:id/answers` | Autosave answers/flags or submit and score. |
| GET | `/results` | List up to 50 submitted attempts. |
| GET | `/results/:id` | Full released answer breakdown for the owner. |
| GET | `/leaderboard` | Exam or last-five-average ranking. |
| GET | `/notifications` | Student notifications with read state/unread count. |
| POST | `/notifications/read` | Mark every visible notification read when the popover opens. |
| POST | `/notifications/:id/read` | Record a notification receipt. |
| POST | `/notifications/:id/archive` | Archive a notification for the signed-in student. |
| POST | `/notifications/:id/unarchive` | Restore an archived notification. |

### Administrator

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/admin/mfa/status` | Check authenticator setup for an administrator account. |
| POST | `/admin/mfa/setup` | Create an encrypted TOTP setup secret. |
| POST | `/admin/mfa/enable` | Verify the first code and enable 2FA. |
| POST | `/admin/session` | Exchange a student token plus TOTP code for a two-hour admin token. |
| GET/POST | `/admin/access` | List administrators or grant a verified student administrator access. |
| DELETE | `/admin/access/:email` | Revoke administrator access except for the creator account. |
| GET | `/admin/exams` | All exams, including unpublished. |
| POST | `/admin/exams` | Create a free published exam. |
| PATCH | `/admin/exams/:id` | Compatibility update that forces price to zero. |
| DELETE | `/admin/exams/:id` | Delete exam, questions, attempts, and events. |
| POST | `/admin/exams/:id/questions` | Create one validated question. |
| POST | `/admin/exams/:id/questions/import` | Validate and batch-insert up to 100 questions. |
| PUT | `/admin/exams/:id/questions/:questionId` | Replace editable question fields. |
| DELETE | `/admin/exams/:id/questions/:questionId` | Delete one question. |
| GET | `/admin/submissions` | Recent attempts with student/exam/email/event summary. |
| GET | `/admin/submissions/:id` | Full answer and event review. |
| GET | `/admin/notifications` | Broadcast history. |
| POST | `/admin/notifications` | Create a student broadcast. |
| POST | `/admin/ai/chat` | Bounded Markdown assistant reply. |
| POST | `/admin/ai/import` | Structured draft from extracted text. |
| POST | `/admin/ai/deploy` | Atomically create exam and reviewed questions. |

## Authentication Enforcement

`requireAuth(request, env, role)` looks up the opaque token in `sessions`, checks expiry, and requires the exact role. Tokens last 30 days. A student token cannot access admin routes, and an admin token cannot be used as a student token.

## Exam and Question Normalization

Every saved question must have:

- non-empty text
- exactly four non-empty answer strings
- explicit integer `correctIndex` from 0 to 3

Optional fields include type, subject, chapter, topic, instruction, marks, explanation, explanation image, question image, filename, and built-in diagram flag.

For exactly 48 imported/deployed questions, marks are forced by position:

- 1-12: 1.5 marks
- 13-38: 2 marks
- 39-48: 3 marks

Physics, Chemistry, and Mathematics are canonicalized and mapped to fixed chapter catalogs. Exact valid chapter names win; otherwise keyword matching chooses the closest catalog chapter.

Images can be HTTPS URLs or PNG/JPEG/WebP Base64 data URLs no longer than about 1 MiB each. Batch endpoints are intentionally larger to carry complete reviewed banks.

## Attempt Submission

Autosave writes `answers_json`, `flags_json`, and `updated_at`. Submission additionally:

- sets `submitted_at` once
- sets `result_released_at` immediately
- queues `result_email_after` immediately
- computes and stores `score_earned` and `score_total`
- schedules an asynchronous email sweep

Answer keys never rely on visible question numbers; the JSON object is keyed by D1 question UUID.

## Result Email Processing

`sendDueResultEmails()` processes up to 25 due attempts. It uses Resend when configured and marks `result_emailed_at` only after a successful send. It runs:

- immediately in `ctx.waitUntil()` after submission
- in a background sweep at most once per minute during normal requests
- from the Worker's scheduled handler when a trigger invokes it

Result visibility does not wait for email; `result_released_at` makes it available immediately.

## Error Shape

Expected errors return JSON such as:

```json
{ "error": "Unauthorized" }
```

Unexpected exceptions are logged server-side and returned as `Server error` with status 500. Rate-limit responses include `retryAfter` and a `Retry-After` header.

## Scaling Notes

Cloudflare Worker and D1 remove the single-VPS bottleneck from student login/exam traffic. The VPS AI relay is separate and admin-only. The Worker prunes attempts beyond the newest 50 per student when a new session is created, which bounds ordinary account growth but is not a full archival policy.
