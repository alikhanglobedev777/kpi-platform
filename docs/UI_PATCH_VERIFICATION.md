# Patches 10–16: verification

These patches preserve existing API contracts and authentication. Patches 10–14 are shared UI changes. Patch 15 installs a **dry-run by default** development-only repair script; applying its Git patch never writes to Sheets. Patch 16 adds automated tests and this verification guide. No dependencies or package scripts were changed.

## Local checks (PowerShell)

```powershell
pnpm lint
pnpm typecheck
pnpm test
node --test tests/scripts/workbook-repair.test.mjs
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

The first two browser tests are unauthenticated. The read-only authenticated test is skipped unless `KPI_TEST_RUN_LIVE_READS=1`, `KPI_TEST_ADMIN_EMAIL`, and `KPI_TEST_ADMIN_PASSWORD` are supplied in the local environment. Only enable it against the sanitized development workbook. Playwright traces can contain session or dashboard information; do not publish them.

## Optional development workbook repair

Ensure that the service account has access to the development copy, no other user is editing it, and you have a backup. Protected cells may require the owner to authorize the service account for the exact six scorecard cells and two target cells; do not remove other protections. Do not run against production. Review the dry run first:

```powershell
node --env-file=.env.local scripts/repair-development-workbook.mjs
```

Only after reviewing and explicitly accepting the proposed changes:

```powershell
node --env-file=.env.local scripts/repair-development-workbook.mjs --apply --confirm=1VPalzJc2T_ZK1rbf9ixV7lUERcmmRMj-zclEMHF-lPg
```

It restores six known clinical lookups (`Executive Scorecard!D28:E30`) and two known target text errors (`Targets!E11`, `E57`) only. It refuses unknown workbook IDs or unexpected source values. It does not change reporting windows, approved thresholds, owner mappings, formula ranges, or production data. Google Sheets does not supply a conditional compare-and-swap write; run when nobody else is editing. If protections prevent the repair, stop and ask the workbook owner. Do not grant broader access than necessary.

## Manual acceptance checks

- Open each of the six weekly dashboards in both portals. Check latest submitted week, missing metrics, zero values, dates, currency and percentages.
- Reported weeks are default; choose **All completed weeks** or **All scheduled weeks** to locate an empty record. The primary submission button opens the previous Saturday's pre-existing row, if it exists and permission is granted.
- Test date/search filters, sorting and ten-row pagination. At 970px and mobile widths, confirm hidden columns remain visible through Details. Check keyboard focus, modal Escape, cancel, and independent scrolling.
- On a blank development HR week, submit 50 caregivers, 2 separations, 0 call-outs and 95 training compliance. Verify the Sheet formula in E is preserved and returns 4%; H is stored as 0.95. Edit 50 to 55, verify, then clear the same test row. Confirm column A and E are untouched, and the operation is audited.
- Create a test access request, approve only HR access, change the temporary password, and verify Financial and Admin access are denied. Revoke access while the employee is signed in, and verify subsequent API requests fail. Test stale record update using two open windows. Do not execute simultaneous writes on production.
- Inspect the Executive Scorecard for the selected sheet week. Verify displayed status and priorities match the workbook. Clinical values will remain manual until the optional repair succeeds.

Full integration, external data verification, business threshold reconciliation, finance reporting frequency, range extension, and healthcare compliance are not certified by these patches.
