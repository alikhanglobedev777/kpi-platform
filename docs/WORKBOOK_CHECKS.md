# Patch 21 — Workbook checks (read only)

The Super Admin can open `/admin/workbook-checks` to inspect structural health of the **configured** Google Sheet. This check makes only metadata and `values:batchGet` requests, never writes, creates rows, changes goals or edits formulas.

Checks performed:

- Presence of 13 expected workbook tabs and the configured spreadsheet timezone.
- 30 consecutive Saturday date keys starting 2026-10-24 in columns A14:A43 of the six weekly tabs. It warns about missing, non-Saturday or non-consecutive dates and when the configured range ends before the selected reporting week.
- Presence of a formula in HR E, Business Development F and Financial E for rows with populated source inputs. The check does **not** verify mathematical semantics or production formulas.
- Whether the six Executive Scorecard clinical cells D28:E30 contain formulas, not manually entered numbers.
- Visible `#ERROR!`-style errors in Targets E11 and E57. The check cannot determine whether a target is correct or approved.

Manual review still required: finance payroll/revenue frequency, thresholds and target reconciliation, historical KPI semantics, privacy/security readiness, and operational verification of Create/Edit/Clear. A check marked **Checked** indicates only the particular structural assertion passed; it is not a submission attestation or compliance certification.

## Apply and verify

Apply patch 21 after patches 17–20. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`. Start `pnpm dev`, sign in as Super Admin, then navigate to `/admin/workbook-checks`. Confirm that findings agree with a **sanitized development** spreadsheet and no workbook changes occur.

For authorized development-only formula repair, use the existing `scripts/repair-development-workbook.mjs` dry run described in `docs/UI_PATCH_VERIFICATION.md`. Do not automate applying repairs or use production workbook without explicit approval and verified backups.
