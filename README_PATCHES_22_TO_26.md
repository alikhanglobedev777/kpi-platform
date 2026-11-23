# Dawson KPI follow-up patches 22–26

Five commits, designed for sequential application **after patches 17–21**. The bundle contains real `.patch` files with application code, tests, migrations and instructions. Changes are not deployed and no external environment was modified.

- **22**: Admin priorities register and supervised Executive Scorecard goal proposals. Does not edit the independent protected Targets sheet.
- **23**: Secure email-based password recovery, approval notices and authenticated weekly reminders / non-sensitive Red-status alerts. Email requires verified Resend credentials and an external scheduler.
- **24**: Atomic DB write lease, post-write cell readback, pending-operation reconciliation and encrypted data-only backup script. Not a full transaction with Sheets or complete disaster recovery.
- **25**: Unit, browser and migration-contract tests; release configuration checks and acceptance checklist.
- **26**: Protected dependency readiness, remote smoke test and Railway deployment/rollback runbook.

**Database:** Apply the additive SQL scripts in `scripts/migrations` with the explicit runner **after** all patches are installed, with a development DB backup. `pnpm db:migrate` alone does NOT apply these feature tables. See `docs/PATCH_26_PRODUCTION.md`.

**Security:** Never publish `.env.local`, credentials, password reset tokens, backup snapshots or patient data. `main` branch is supported, but use clean working tree checks and stop on any error.
