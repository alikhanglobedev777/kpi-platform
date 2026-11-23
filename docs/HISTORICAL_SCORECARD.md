# Patch 20 — Historical Executive Scorecard (read only)

Use `/admin/scorecard/history` or `/dashboard/scorecard/history`. A date picker requests
`GET /api/scorecard/history?week=YYYY-MM-DD`. Only approved users with scorecard read
access may retrieve results. The selected Saturday must exist in the workbook's
preconfigured HR weekly rows (currently through May 15, 2027).

- Reads the original 22 KPI source mappings from the six departmental worksheets.
- Computes previous-week values, trends and Green/Yellow/Red using existing
  scorecard rules. Does **not** write `Executive Scorecard!K12` or any department cell.
- Missing and zero values are distinct, and percentages are displayed correctly.
- Actual Payroll target uses the *selected week's* payroll budget (per scorecard formula).
- Uses **current** scorecard goals, not versioned historical goals. Targets that have
  changed since the selected date can make historical statuses differ from past reports.
- Clinical values are read from the Clinical Dashboard rather than the three hardcoded
  clinical display rows. Current scorecard may therefore differ until formula repair.
- Does not reconstruct the workbook's historical Top 3 priorities or corrective actions.

Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` locally; compare
three historical weeks manually against the development workbook before production use.
