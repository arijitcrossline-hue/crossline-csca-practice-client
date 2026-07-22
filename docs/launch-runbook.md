# Crossline Public Launch Runbook

Run this checklist against the production environment before announcing a public release. Payment activation is intentionally excluded until the payment provider is configured.

## 1. Secrets and identity providers

Confirm these Worker secrets exist and are independently generated high-entropy values:

- `PASSWORD_PEPPER` (at least 32 characters)
- `SESSION_TOKEN_SECRET` (at least 32 characters and different from the password pepper)
- `OAUTH_STATE_SECRET` (at least 32 characters)
- `ADMIN_MFA_ENCRYPTION_KEY`
- `RESEND_API_KEY`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` only if Facebook sign-in is visible
- `GLM_API_KEY` only if the administrator assistant is enabled

Restrict OAuth redirect URIs to the exact production callback URLs. Remove development callbacks from the production OAuth applications. Verify the Google consent screen, application name, domain ownership, privacy URL, and terms URL.

## 2. Database backup and migrations

Deploy the authenticated question-image endpoint on the media VPS before deploying the launch Worker. Confirm `/etc/crossline-media.env` is root-readable only and contains the same independently generated `MEDIA_UPLOAD_SECRET` configured on the Worker:

```bash
sudo systemctl status crossline-media
curl -fsS https://media.crosslinecscatest.com/health
```

Before migration, record the current D1 Time Travel bookmark:

```bash
npx wrangler d1 time-travel info crossline-mocks --config worker/wrangler.toml
```

Verify the ordered migration set, then apply launch migrations one at a time in numerical order:

```bash
npm run test:migrations
npx wrangler d1 execute crossline-mocks --remote --config worker/wrangler.toml --file worker/migrations/0023_auth_and_exam_integrity.sql
npx wrangler d1 execute crossline-mocks --remote --config worker/wrangler.toml --file worker/migrations/0024_oauth_pkce_exchange.sql
npx wrangler d1 execute crossline-mocks --remote --config worker/wrangler.toml --file worker/migrations/0025_durable_rate_limits.sql
npx wrangler d1 execute crossline-mocks --remote --config worker/wrangler.toml --file worker/migrations/0026_email_delivery_retries.sql
npx wrangler d1 execute crossline-mocks --remote --config worker/wrangler.toml --file worker/migrations/0027_admin_mfa_recovery.sql
npx wrangler d1 execute crossline-mocks --remote --config worker/wrangler.toml --file worker/migrations/0028_exam_lifecycle.sql
npx wrangler d1 execute crossline-mocks --remote --config worker/wrangler.toml --file worker/migrations/0029_legal_and_deletion.sql
npx wrangler d1 execute crossline-mocks --remote --config worker/wrangler.toml --file worker/migrations/0030_remap_additional_official_topics.sql
```

Do not reapply an `ALTER TABLE` migration that has already succeeded. Keep the pre-migration bookmark until the release has been stable for at least seven days. Test restoration against a non-production database before launch.

After the Worker is deployed, call `POST /admin/assets/migrate` with an active administrator bearer token until the response reports `complete: true`. This moves existing embedded question and explanation images out of D1 in batches of 20; new uploads are stored on the VPS automatically. Verify that `/var/crossline-media/question-images` is included in encrypted off-server backups.

## 3. API and email verification

```bash
npm test
npx wrangler deploy --dry-run --config worker/wrangler.toml
npm run worker:deploy
npm run test:production
```

Confirm `crossline-healthcheck.timer` checks `https://api.crosslinecscatest.com/health` and the media health endpoint from the VPS every minute. Treat a non-200 response, `ok: false`, or API `database` not equal to `ready` as a failure. Confirm structured Worker error logs are retained and that `crossline-maintenance.timer` runs on the VPS every five minutes. The maintenance timer calls the secret-protected Worker endpoint because this Cloudflare account does not permit Cron Trigger creation.

Using a non-administrator test account, verify registration, verification-code resend after closing the app, verification, password reset, Google sign-in, logout, exam start, active-attempt resume after restart, forced timer expiry, submission, result detail, and account-deletion request/cancellation. Confirm verification, password-reset, result, and support emails render correctly in mobile and desktop mail clients. Inspect the email queue for `failed_at` rows after each test.

## 4. Exam publishing

- Confirm imported and newly created exams begin as drafts.
- Review title, subject, duration, price/access plan, every answer key, mark value, and explanation.
- Preview the full exam as a student before publishing.
- Confirm unpublished and archived exams cannot be started by students.
- Submit a test attempt, edit the live exam afterward, and confirm the submitted result still uses its frozen snapshot.
- Archive instead of deleting exams that have attempt history.

## 5. Administrator security

- Enroll every administrator in authenticator MFA and store recovery codes offline.
- Confirm a current authenticator code is required when granting or revoking administrator access.
- Review the administrator audit log after role, plan, exam-publishing, and screen-capture changes.
- Keep daily-use student accounts non-administrative. Grant the minimum number of administrator accounts needed for operations.

## 6. Windows release

Add the release certificate and password to the release environment as `WINDOWS_CERTIFICATE_BASE64` and `WINDOWS_CERTIFICATE_PASSWORD`. The release job refuses to publish without them and checks the generated installer with Windows Authenticode.

Install the candidate on a clean Windows 11 standard-user account. Verify installation does not request elevation, the publisher is Crossline's expected certificate owner, SmartScreen recognizes the signature, Google sign-in returns to the app, secure login persists across restarts, update download/install works, and uninstall removes the application cleanly.

Test normal and kiosk launches on 1366x768, 1920x1080, and a scaled display. Test camera/microphone denial, no-device, offline, slow-network, expired-pairing, and submit-retry paths.

## 7. Legal and support

- Publish the privacy, terms, and data-deletion pages at the exact URLs linked by the app.
- Ensure the policy describes what is actually collected: account details, answers, attempt metadata, device-check events, and bug reports.
- Clearly state that face framing and the room walkthrough do not identify faces, analyse rooms, upload camera video, or continue during the exam.
- Test the 30-day account-deletion workflow and document the support escalation path.
- Put a real monitored support address and response target on the public site.

## 8. Launch gate

Launch only when the full test suite, migration verifier, production smoke test, health monitor, email tests, clean-machine Windows test, signed installer check, and backup-restore rehearsal all pass. Keep payment buttons disabled until the payment provider, webhook signature verification, refund handling, receipts, and entitlement reconciliation are complete.
