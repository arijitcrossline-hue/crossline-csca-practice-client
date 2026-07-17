# Login and Authentication

Student and administrator authentication share the D1 `sessions` table but have different credential checks, token roles, and localStorage keys.

## Student Registration

The website and Windows client can both register an account.

1. UI collects first name, last name, username, optional profile picture, email, and password.
2. `CrosslineApi.register()` calls `POST /auth/register`.
3. Worker normalizes fields, hashes the password, and upserts the account as unverified.
4. A random six-digit code is hashed and stored for 15 minutes.
5. Resend emails the plaintext code to the student.
6. UI collects the code and calls `POST /auth/verify`.
7. Worker compares hashes, marks the account verified, deletes the code, creates a student session, and returns the user/token.

Registering an email that already exists resets its password/profile and returns it to unverified state. Treat this as current behavior when considering account-takeover hardening.

## Password Login and Restore

`POST /auth/login` requires a verified account and matching password hash. The token is stored in `crossline-api-token`.

At Electron startup, `restoreStudentSession()` calls `GET /auth/me`. A valid session restores the profile and dashboard; failure clears the token and shows login.

Student logout removes only the local token. There is currently no server logout/revocation endpoint, so that token remains valid until expiry unless a password reset revokes it.

## Password Reset

1. `POST /auth/password-reset/request` always returns the same generic success response.
2. For a verified account, it emails a six-digit code valid for 15 minutes.
3. `POST /auth/password-reset/confirm` checks email/code/new password.
4. On success it updates the password hash, consumes the code, and deletes every session for that user.

The generic request response reduces email-address discovery.

## Password and Code Hashing

`hashSecret()` uses SHA-256 over a value combined with `PASSWORD_PEPPER`. Verification and reset codes use the same helper. This is stronger than plaintext storage but weaker for passwords than a slow password hash such as Argon2id. A future auth migration should use a dedicated identity provider or a slow password KDF.

## Google OAuth

The current client exposes Google sign-in. Backend code also supports Facebook configuration, but the Facebook button is intentionally absent.

Desktop sequence:

1. Renderer calls `examRuntime.startOAuth("google")`.
2. Electron opens a sandboxed modal child window at `/auth/oauth/google/start?desktop=1`.
3. Worker creates a signed, ten-minute OAuth state containing provider and desktop mode.
4. Google redirects to `/auth/oauth/google/callback`.
5. Worker verifies state, exchanges the code, loads the verified Google profile, and upserts `users` plus `oauth_accounts`.
6. Worker creates a student token and redirects to `/auth/oauth/complete` with encoded token/user data.
7. Electron intercepts only that allowlisted API URL, sends `oauth-complete` to the renderer, and closes the child window.
8. Renderer stores the student token and opens the dashboard.

Required secrets:

- `OAUTH_STATE_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Callback: `https://api.crosslinecscatest.com/auth/oauth/google/callback`.

## Profile Data

`GET /auth/me` returns public fields only. `PATCH /auth/profile` updates username, names, and avatar. Avatar input is compressed client-side before sync; OAuth may use a provider HTTPS image URL.

## Administrator Authentication

Administrators use the same verified student account as the dashboard. The creator account is `arijitsumit123@gmail.com`; additional verified users can be granted `is_admin = 1` from the protected Admin access screen.

`GET /admin/mfa/status`, `POST /admin/mfa/setup`, and `POST /admin/mfa/enable` configure authenticator-based TOTP. Secrets are encrypted with `ADMIN_MFA_ENCRYPTION_KEY`. `POST /admin/session` requires a valid student token plus a current six-digit code and returns a two-hour admin token stored in `crossline-admin-api-token`.

Admin and student authorization are not interchangeable. Every protected handler calls `requireAuth()` with the expected role.

## Token Model

- opaque token: two random UUIDs joined by a dot
- stored server-side in D1
- TTL: 30 days
- sent as `Authorization: Bearer ...`
- role checked on every protected request
- privileged tokens expire after two hours

Do not log tokens or include them in documentation/screenshots.

## Local Demo Mode

When no API base URL is configured, `src/app.js` uses localStorage demo accounts and a fixed verification code. This is test behavior, not the production auth system.
