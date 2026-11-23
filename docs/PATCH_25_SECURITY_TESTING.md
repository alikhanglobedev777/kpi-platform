# Patch 25 — Automated tests and release security gates

Run from the repository root:

```
node scripts/check-repo-secrets.mjs
node scripts/release-preflight.mjs
pnpm lint
pnpm typecheck
pnpm test
node --test tests/scripts/*.test.mjs
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Unit and unauthenticated browser tests cover target-goal allowlists, email tokens, cron authentication, migration safety, row write verification and API access restrictions. They do **not** simulate Neon and Google Sheets for live end-to-end verification.

## Required manual development acceptance
1. Migrate the sanitized **development** Neon branch and verify new tables.
2. As Super Admin, create, edit, finish a priority; confirm optimistic revision failure from two browsers.
3. Request a percent goal, approve as Super Admin and inspect the exact allowed scorecard cell; reject another proposal; test a stale target after editing the sheet directly. Never alter protected formulas.
4. Request password reset for approved, nonexistent and deactivated accounts; verify generic outcome, 20-minute expiry, token reuse rejection, revoked sessions and login with new password.
5. Verify approval notification never contains a temporary password. Trigger cron with wrong and correct keys in a development environment with sandbox email addresses. No PHI in email.
6. Submit, edit and clear a test week in all six weekly modules, then all three list modules. Verify every input and protected formula in Sheets and audit receipts in Neon.
7. Confirm stale edits, direct Sheet edit conflict (not transaction-safe), user permission restrictions, role revocation and concurrent app writes. Test two app instances only against the development copy.
8. Simulate a Sheets outage. Verify pending operations, then reconcile after checking actual cells. Never blindly retry uncertain writes.
9. Export encrypted data-only backup outside the Git checkout, verify decrypt, restore separately to an isolated test environment using an approved runbook. Test full Drive copy and Neon PITR as separate independent backups.
10. Test browser UI at narrow widths, keyboard navigation, screen-reader labels, session expiry and logout.
11. Obtain business approval for scorecard directions, target thresholds, finance frequency and clinical formulas. Run the optional Patch 15 development formula repair only after review.
12. No real client/patient content in development tests. Before production, complete organizational privacy and legal compliance review and restrict access to notes.

Only authorize production release once manual acceptance is signed off and provider credentials are configured. These tests are not proof of HIPAA or other regulatory compliance.
