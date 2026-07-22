# Login and Authentication

Student and administrator authentication share the D1 `sessions` table but have different credential checks, token roles, and client-side secure-storage slots.

## Student Registration

The website and Windows client can both register an account.

1. UI collects first name, last name, username, optional profile picture, email, and password.
2. `CrosslineApi.register()` calls `POST /auth/register`.
3. Worker normalizes fields, hashes the password with PBKDF2-SHA-256, and inserts a new unverified account.
4. A random six-digit code is hashed and stored for 15 minutes.
5. Resend emails the plaintext code to the student.
6. UI collects the code and calls `POST /auth/verify`.
7. Worker compares hashes, marks the account verified, deletes the code, creates a student session, and returns the user/token.

Registering an existing email returns `409` and never changes that account. A pending user can call `POST /auth/verification/request`; the route returns the same generic response for pending, verified, and unknown addresses to reduce account discovery.

## Password Login and Restore

`POST /auth/login` requires a verified account and matching password hash. Electron stores persistent tokens through the operating system's protected credential storage; non-persistent desktop sessions stay in memory. Browser-only auth uses local or session storage only long enough to complete the website flow.

At Electron startup, `restoreStudentSession()` calls `GET /auth/me`. A valid session restores the profile and dashboard; failure clears the token and shows login.

Student logout calls `POST /auth/logout`, revokes the current server session, and clears the local token. Password resets revoke every session for that user.

## Password Reset

1. `POST /auth/password-reset/request` always returns the same generic success response.
2. For a verified account, it emails a six-digit code valid for 15 minutes.
3. `POST /auth/password-reset/confirm` checks email/code/new password.
4. On success it updates the password hash, consumes the code, and deletes every session for that user.

The generic request response reduces email-address discovery.

## Password and Code Hashing

Passwords use PBKDF2-SHA-256 with a unique random salt, 310,000 iterations, and `PASSWORD_PEPPER`. Successful login upgrades legacy hashes automatically. Verification codes, reset codes, session tokens, OAuth state, and OAuth exchange codes are stored as keyed hashes rather than plaintext.

## Google OAuth

The current client exposes Google sign-in. Backend code also supports Facebook configuration, but the Facebook button is intentionally absent.

Desktop sequence:

1. Renderer calls `examRuntime.startOAuth("google")`.
2. Electron opens a sandboxed modal child window at `/auth/oauth/google/start?desktop=1`.
3. Worker stores a hashed, single-use, ten-minute OAuth state and PKCE verifier in D1.
4. Google redirects to `/auth/oauth/google/callback`.
5. Worker consumes the state, completes the PKCE exchange, requires a verified provider email, and links or creates the user plus `oauth_accounts` row.
6. Worker redirects with a short-lived, one-time exchange code, never a session token in the URL.
7. Electron accepts only the allowlisted completion URL and gives the code to the renderer.
8. Renderer calls `POST /auth/oauth/exchange`, stores the returned student token, and opens the dashboard.

Required secrets:

- `OAUTH_STATE_SECRET`
- `SESSION_TOKEN_SECRET`
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

- opaque, high-entropy token returned once to the client
- only a keyed token hash is stored server-side in D1
- student TTL: 30 days
- sent as `Authorization: Bearer ...`
- role checked on every protected request
- privileged tokens expire after two hours

Do not log tokens or include them in documentation/screenshots.

## Local Demo Mode

Automated tests can inject a local demo account and fixed verification code. Packaged and hosted builds do not define those fixtures and use the production API.
