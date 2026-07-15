# Login and Auth

There are two login systems: student auth and admin auth. Both end with a Bearer token stored in localStorage by `src/api.js`.

## Frontend Auth Files

- `src/app.js`: UI flow.
- `src/api.js`: API calls and token storage.
- `src/config.js`: API base URL.

Frontend functions:

- `showAuth()`
- `showVerification()`
- `showStudentDashboard()`
- `showAdminLogin()`

## Student Registration Flow

1. Student opens the Windows app.
2. `showAuth("register")` shows first name, last name, username, optional profile picture, email, and password fields.
3. Frontend calls:

```js
window.CrosslineApi.register(email, password, username, profile)
```

4. Worker `POST /auth/register`:

- normalizes email
- normalizes username
- hashes password
- upserts the user with `verified_at = NULL`
- creates a six-digit verification code
- stores a hash in `email_verifications`
- emails the code through Resend

5. Frontend shows `showVerification()`.
6. Student enters code.
7. Frontend calls:

```js
window.CrosslineApi.verify(email, code)
```

8. Worker `POST /auth/verify`:

- checks code hash and expiry
- sets `users.verified_at`
- deletes the verification code
- creates a student session token

9. Frontend stores the token:

```js
window.CrosslineApi.setStudentToken(payload.token)
```

10. Student lands on `showStudentDashboard()`. A valid token is restored on the next app launch, so students do not need to sign in again until the session expires or they log out.

## Password Recovery

The **Forgot password?** control opens a two-step recovery flow. `POST /auth/password-reset/request` sends a six-digit code to a verified account without revealing whether an address exists. `POST /auth/password-reset/confirm` validates the code, replaces the password hash, consumes the code, and revokes old sessions. Codes expire after 15 minutes.

## Student Login Flow

1. Student enters email and password.
2. Frontend calls `POST /auth/login`.
3. Worker checks:

- user exists
- user is verified
- password hash matches

4. Worker returns:

```json
{
  "user": {
    "email": "student@example.com",
    "username": "Arijit"
  },
  "token": "..."
}
```

## Social Sign-In

The Windows client starts Google OAuth through a temporary Electron child window. The Worker owns the redirect and token exchange, then sends the completed account profile back through Electron IPC. Facebook is intentionally skipped and has no visible client button.

Required Worker secrets:

- `OAUTH_STATE_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

OAuth accounts populate the student name, username, and provider profile photo. Do not add these values to frontend source files.

5. Frontend stores the token in localStorage key:

```text
crossline-api-token
```

## Admin Login Flow

Admin login is intentionally separate.

Frontend:

```js
window.CrosslineApi.adminLogin(email, password)
```

Worker checks environment variables:

- `ADMIN_EMAILS` or `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

If valid, it creates an admin token with role `admin`. The frontend stores it in:

```text
crossline-admin-api-token
```

Admin-only endpoints require this admin token.

## Token Behavior

Tokens are stored in the `sessions` table.

Important values:

- token TTL: 30 days
- role: `student` or `admin`
- auth header: `Authorization: Bearer <token>`

The Worker helper `requireAuth(request, env, role)` enforces role and expiry.

## Local Prototype Mode

If `window.CrosslineApi.enabled()` is false, the app runs in localStorage demo mode.

Demo credentials:

- student: `student@example.com` / `demo123`
- admin: `admin@crossline.test` / `admin123`
- verification code: `246810`

Production should use the API. Local mode is mostly useful for frontend-only testing.

## Environment Variables and Secrets

Important Worker vars/secrets:

- `APP_ORIGIN`: allowed browser origin for CORS.
- `CONNECT_ORIGIN`: base URL used in phone pairing links.
- `VERIFY_FROM`: sender address for Resend emails.
- `ADMIN_EMAILS`: comma-separated admin emails.
- `ADMIN_PASSWORD`: admin login password.
- `PASSWORD_PEPPER`: extra secret used in password/code hashing.
- `RESEND_API_KEY`: sends verification and result emails.

## Security Notes

- Password hashing is simple SHA-256 plus pepper. For a lightweight mock app this is workable, but a future production-grade auth system should use a stronger password hashing approach or delegate auth to a dedicated provider.
- There is no password reset flow yet.
- Profile pictures are stored locally in the app/browser storage per device, not in the backend.
