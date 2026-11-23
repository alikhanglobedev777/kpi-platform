# Patch 26 — Production release and operations

**Deployment is deliberately not performed by applying a Git patch.** Production credentials, a verified domain, the correct business workbook, a backup plan, and human approval are necessary. A live application containing clinical notes requires organizational privacy/security review; this package does not certify any regulatory compliance.

## 1. Prepare and validate, on sanitized DEVELOPMENT data

1. Apply patches 17–21 and 22–26 in numerical order, on your requested `main` branch. Check Git status before each application; never force a failing patch.
2. Back up your Neon development database and development spreadsheet. Run `node --env-file=.env.local scripts/apply-feature-migrations.mjs` (dry run). Inspect SQL `0022`, `0023`, `0024`, then run the script with `--apply`. These additive feature migrations are intentionally distinct from Drizzle's existing `0000` journal; do not rerun `db:generate` against a populated DB without a schema-reconciliation plan.
3. Run the full checks in `docs/PATCH_25_SECURITY_TESTING.md`; test permissions, HR formula preservation, login recovery, priorities, goal approvals, scheduler and encrypted backup manually.
4. Confirm business sign-off on goals, status directions, finance period logic, clinical values and 30-week range. Historical scorecard relies on CURRENT goals, not goal history.
5. Complete independent healthcare privacy, least-privilege, data retention, incident-response and vendor contract reviews. Keep real patient/client details out of development and email.

## 2. Railway application service (single replica)

- Create a Railway Node service linked to the private GitHub repo. Runtime Node 22+, run `pnpm install --frozen-lockfile` as installation, `pnpm build` for build and `pnpm start --hostname 0.0.0.0` for startup; `railway.json` pins one replica and `/api/health` as liveness.
- Supply secrets using Railway encrypted variables (not Git): `DATABASE_URL`, `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `AUTH_URL`, `APP_ENV`, `ALLOW_PRODUCTION_SHEET`, `SHEET_TIMEZONE`, `APP_TIMEZONE`, `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_ADMIN_EMAIL`, `CRON_SECRET` (32+ chars), `READINESS_TOKEN` (32+ chars). Use a staging workbook + separate Neon database for staging; do not point development/preview deployments at production.
- Ensure the Google Sheets API is enabled and the service-account email has only the approved access to the intended workbook. Do not grant general public sharing.
- Configure `AUTH_URL` to your final HTTPS origin and verify HTTPS-only, no test credentials, no PHI in logs, and the app's security headers. Restrict repository access; rotate credentials exposed in earlier commits.
- Ensure Neon initial Drizzle migration is applied exactly once to a fresh DB (`pnpm db:migrate`), and then run the additive feature migration runner in a controlled one-off job (not on every web startup). For production require `--confirm-production-migration`, after backup and explicit approval.
- Provision first Super Admin through the existing seed script after verifying authorized identity. Never send passwords or keys in ordinary email or logs.

## 3. Operations, alerts and backups

- Protected dependency readiness: `GET /api/ready` with `Authorization: Bearer <READINESS_TOKEN>` checks only that Neon and Sheets are reachable, returning no sensitive data. `node scripts/deploy-smoke.mjs` checks liveness and readiness against `AUTH_URL`.
- Configure a scheduler with a **POST** to `/api/cron/notifications` and `Authorization: Bearer <CRON_SECRET>` at an agreed weekly time. Do not use a public GET cron link. The app does not schedule itself.
- Verify transactional email provider sender domain, reset deliveries, subscription/provider limitations and recipient preferences. Make sure a missed cron, email-provider failure, or a pending write creates a visible operational incident.
- Use scheduled encrypted data-only backups via `scripts/encrypted-backup.mjs`, plus independent full Drive workbook copies and Neon point-in-time recovery. Test restore in an isolated environment. Store backup passphrase separately from files. Define retention, rotation and recovery owner.
- Monitor Railway logs and database/Sheets API errors. Investigate pending operations on `/admin/reconcile`; never blindly retry an uncertain write.

## 4. Go-live / rollback

1. Take a final snapshot and freeze direct Sheet editing. Verify production application uses the correct workbook ID and approved schema.
2. Run functional acceptance with test accounts on staging, then production with only non-sensitive test records in approved ranges.
3. Validate registration, department permissions, 401/403 handling, approval, reset, session revocation, scorecard, management, scheduling, backup, email and audit.
4. If deployment fails, roll back the Railway code release and disable scheduler; do **not** roll back additive migrations destructively or replay uncertain Sheets writes. Restore data only through a separately approved recovery runbook.

## Known remaining external decisions

Full patient-data compliance determination, complete workbook formula reconciliation, approved target thresholds, versioned historical goal baselines, weekly range extension, Drive-level full-fidelity restore, monitoring subscriptions, deliverability and multi-instance transactional guarantees require separate owner review and live infrastructure. No patch can verify these without access and approval.

## Accuracy and gap statement

The historical scorecard does not yet store goal revisions per week; the action register is an accountability tool, not a full incident-management system. Target proposals apply only to the explicitly allowlisted Executive Scorecard goal cells. The independent Targets sheet, and the finance/clinical/business rule conflicts, require business approval before automated editing. The scheduler endpoint is delivered, but a real external schedule and verified sender cannot be provisioned without account access. Password recovery is disabled until mail credentials are configured. All components need local build and live sanitized-workbook testing before release.
