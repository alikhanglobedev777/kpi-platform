# Patch 22 — Targets and priorities

- Run `node --env-file=.env.local scripts/apply-feature-migrations.mjs` (dry run), then `node --env-file=.env.local scripts/apply-feature-migrations.mjs --apply` **after backing up the development Neon database**. The custom additive migration runner is separate from the original Drizzle journal. Do not regenerate the initial Drizzle migration on a populated database. Migration SQL lives in `scripts/migrations` and is checksummed in `kpi_feature_migrations`.
- `/admin/management` lets Admins manage durable action priorities with optimistic version checks, and propose changes to **allowed Executive Scorecard goal cells**. Only a Super Admin may approve. Existing scorecard goals are compared against the proposal's originally formatted value before a write; formula cells are never overwritten.
- The independent Targets sheet remains read-only: its workbook ownership, protected cells, calculations and approval rules have not been agreed. This patch does not silently reconcile KPI thresholds, approved finance-frequency rules, or historical goal versions.
- A failed Sheets write can have an uncertain outcome. Check the operations log and workbook before retrying. Test every goal on the sanitized development workbook.
- No destructive DELETE for priorities. Mark an action `done` to preserve history.
