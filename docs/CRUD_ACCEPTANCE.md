# Patch 18 — CRUD acceptance checklist (development workbook only)

Patch 18 extracts the existing weekly/list record-selection rules for deterministic unit tests.
It intentionally does **not** change spreadsheet schema, formulas, or external credentials.

Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` locally.
Automated tests do not prove that your live service account can write protected ranges.

## Manual read/write acceptance

1. Use the sanitized DEVELOPMENT workbook and make a backup. Ensure nobody is editing it directly.
2. Sign in as Super Admin and open HR. Choose an unused past Saturday using "All completed weeks".
3. Record original row A and E formulas, then enter caregivers=50, separations=2,
   call-outs=0, training compliance=95. Verify the matching Sheet row and E turnover=4%.
4. Refresh and edit caregivers=55. Verify E is recalculated and zero remains an explicit zero.
5. Clear that record. Verify only editable inputs cleared; A date and E formula remain intact.
6. Test each of the five other weekly departments in a separate unused week.
7. Test Weekly KPI Report, Compliance and Quarterly Goals with temporary list rows.
8. Open two browser windows on the same row. Save in one, then attempt the stale edit in the
   other; expect HTTP 409 and a reload instruction.
9. Test role restrictions for employee, viewer, admin, suspended employee, and an unauthenticated client.
10. Review the Audit log. A pending entry after API failure must be reconciled against the workbook.

**Known limitation:** The single-process lock does not coordinate direct Google Sheets editors,
multiple Railway replicas or Vercel serverless instances. Do not treat this as database atomicity.
