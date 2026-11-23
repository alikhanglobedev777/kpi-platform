# Patch 19 — Admin reporting coverage

`/admin/reporting` displays a read-only matrix of six weekly department worksheets
for the last eight completed Saturday periods.

- Counts explicit `0` as a recorded value and an empty cell as missing.
- Numeric-field counts are informational; optional fields and business definitions
  have not been approved as mandatory, so this is **not** a formal submission or compliance grade.
- Missing or inaccessible worksheets are shown as unavailable instead of as zero.
- Reads from the DEVELOPMENT workbook during local setup; this patch performs no writes.
- Review service-account permissions and note confidentiality before authorizing staff access.
