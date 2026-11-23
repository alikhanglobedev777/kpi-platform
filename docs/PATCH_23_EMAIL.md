# Patch 23 — Password recovery, approval notices and scheduled reminders

**Requires SQL migration** `0023_notification_recovery.sql` via `node --env-file=.env.local scripts/apply-feature-migrations.mjs --apply`. Make a Neon backup first. Do not send real email from development unless all recipients have consented and the sender domain is verified.

## Configuration

### Gmail SMTP — no domain required
- Use Google 2-Step Verification and a dedicated Gmail account's 16-character App Password.
- Add `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=your-account@gmail.com` and `SMTP_APP_PASSWORD` (secret) in Vercel Production environment.
- Set `NOTIFY_FROM` to the same Gmail address (or omit it); Gmail will rewrite mismatched sender addresses.
- Set `AUTH_URL=https://kpi-platform-phi.vercel.app` and redeploy so links use the live host.
- Gmail SMTP is preferred when SMTP credentials are set; Resend remains as an optional fallback.
- Port 587 is also supported with mandatory STARTTLS; connections have explicit timeouts.
- Gmail may block logins from serverless IPs and imposes sending limits. This is intended for a low-volume pilot, not a guaranteed production email service.
- Gmail SMTP offers no provider idempotency key. Investigate uncertain or duplicate deliveries rather than automatically retrying.
- Never commit your Gmail App Password, publish reset links, or send clinical/client details by email.
- If the page returns a generic server error, inspect Vercel Runtime Logs and validate `DATABASE_URL`, `AUTH_URL`, and database migrations.

### Resend (optional existing transport)
- `RESEND_API_KEY`: server-only API key from a verified Resend account.
- `NOTIFY_FROM`: verified sender address.
- `AUTH_URL`: exact app origin; use HTTPS in production.
- `NOTIFY_ADMIN_EMAIL`: optional verified admin inbox for non-sensitive Red-status counts.
- `CRON_SECRET`: strong random 32+ character secret, never expose to browsers.

`/forgot-password` sends generic responses for unknown accounts; approved accounts receive a hashed, single-use, 20-minute token link. `/reset-password` changes the password, invalidates all sessions and existing reset tokens, and never reveals tokens in server logs. Administrators can still use the previously installed CLI reset. Approval notices never include a temporary password; administrators deliver onboarding credentials out of band.

`POST /api/cron/notifications` requires `Authorization: Bearer <CRON_SECRET>`. Configure your scheduler (such as a Railway cron service) to call it on Mondays *after* the reporting cutoff, using the local reporting timezone. The endpoint sends generic missing-submission reminders to approved users with create permissions and non-sensitive Red-status summary to `NOTIFY_ADMIN_EMAIL`; it does **not** expose any client notes, values or PHI. At-most-once delivery keys are stored in Neon, with Resend idempotency keys when using Resend; Gmail SMTP has no such guarantee. Delivery providers cannot promise exactly-once under every network failure; monitor and reconcile errors.

Test reset link issuance, invalid/expired/reused tokens, revocation, unauthorized cron, and approval notices using sandbox addresses before enabling real email. Email capability will remain unavailable until provider credentials are configured.
