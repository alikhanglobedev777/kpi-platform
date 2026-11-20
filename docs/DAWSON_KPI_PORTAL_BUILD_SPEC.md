# Dawson and Dawson KPI Portal — Build Spec

This is the full build brief for a Next.js web app that lets Dawson and Dawson Home Care staff enter, edit, and clear their weekly KPI numbers through a UI, with the **existing Google Sheet "Dawson and Dawson KPI DASHBOARD v5" as the data store**. The sheet keeps doing all calculations (statuses, trends, Top 3 Priorities). The app writes only to input cells and reads calculated results back.

Read this whole file before writing code. Sections 4 and 5 (sheet map and write rules) are the most important: a wrong column mapping silently destroys formulas that the leadership scorecard depends on.

---

## 1. Goals and non-goals

**Goals**
- Seat owners sign in, see only their assigned tabs, and add / view / edit / clear their weekly numbers.
- Admins approve new users, assign roles and tabs, edit scorecard goals, and see an audit log of every change.
- Everyone with access can view the Executive Scorecard as calculated by the sheet.
- The Google Sheet stays the source of truth and keeps working for people who still open it directly.

**Non-goals (v1)**
- Re-implementing any scorecard math in code. Read the sheet's calculated values instead.
- Moving KPI data into Postgres. Postgres holds only users, permissions, and the audit log.
- Editing the Targets, Start Here, or KPI Guide tabs from the app (read-only display).

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript (strict) |
| Package manager | pnpm |
| UI | Tailwind CSS v4 + shadcn/ui (Radix primitives), lucide-react icons |
| Forms / validation | React Hook Form + Zod (one schema per tab, shared by client and server) |
| Data fetching | TanStack Query v5 (client), server actions or route handlers (server) |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Auth | Auth.js v5 (next-auth@beta): Google provider + Email (magic link) provider |
| App database | PostgreSQL (Neon) + Drizzle ORM + drizzle-kit migrations |
| Google Sheets | `googleapis` (Sheets API v4) with a service account (JWT auth) |
| Email | Resend (+ React Email templates) |
| Monitoring | Sentry (with PII scrubbing, see section 11) |
| Tests | Vitest (unit), Playwright (e2e) |
| Hosting | Vercel |
| Lint / format | ESLint (next config) + Prettier |

---

## 3. Environment variables

```
# Google Sheets
GOOGLE_SHEET_ID=                      # production: 1_IIHD2hMsgUuvZvFSD9CnLiXhbyBk-nX4u8v6rTsQaI
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=   # store with literal \n; replace(/\\n/g, "\n") when loading

# Auth.js
AUTH_SECRET=
AUTH_URL=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
ALLOWED_GOOGLE_DOMAIN=dawsonhomecare.com

# Seeding first admins (comma-separated). Placeholder until confirmed.
INITIAL_ADMIN_EMAILS=basil@dawsonhomecare.com

# Database
DATABASE_URL=

# Email
RESEND_API_KEY=
EMAIL_FROM=
ADMIN_NOTIFY_EMAILS=                  # who gets "new access request" emails

# Monitoring
SENTRY_DSN=

# Business
APP_TIMEZONE=America/New_York         # Dawson is in Beaufort, SC
```

**Development must never point at the production sheet.** Make a copy of the sheet in Google Drive for dev/staging, share it with the service account as Editor, and set `GOOGLE_SHEET_ID` to the copy's ID.

### Google access setup (one-time, by a human)
1. Create a Google Cloud project, enable the **Google Sheets API**.
2. Create a service account and a JSON key.
3. Share the sheet with the service account email as **Editor**.
   - The production sheet lives on a Dawson **shared drive**. If Dawson's Workspace blocks sharing with outside addresses (`*.gserviceaccount.com`), use the fallback in section 12 (Apps Script connector) and keep everything else the same.

---

## 4. Sheet map (source of truth: live sheet, checked 2026-11-20)

The workbook has 13 tabs. Tab names below are exact and must be quoted in A1 ranges (`'HR Dashboard'!B17`).

### 4.1 Common layout of the six weekly department tabs
- Rows 1–11: title, seat info, instructions. Never write here.
- Row 13: column headers.
- **Rows 14–43: 30 data rows.** Column A holds the week-ending date (pre-filled, every Saturday from **2026-10-24 to 2027-05-15**, format `mm/dd/yyyy`).
- Weeks run **Sunday to Saturday**. The "current reporting week" is the most recent Saturday strictly before or equal to today minus the weekday offset: `lastSaturday = today - (dayOfWeek(today) + 1) days` where Sunday = 0. On a Saturday this returns the previous Saturday, which matches the sheet formula `TODAY()-WEEKDAY(TODAY())`. Compute in `APP_TIMEZONE`.
- The Executive Scorecard finds a week by **exact match** on column A, so dates in column A must never change or be removed.
- Percent columns store fractions: `1` = 100%, `0.075` = 7.5%. The UI shows and accepts percentages (0–100) and converts.
- Number formats in the sheet: counts `0`, money `$#,##0`, percents `0%`, dates `mm/dd/yyyy`.

### 4.2 Column maps

Legend: **IN** = input the app may write; **AUTO** = formula, never write; **KEY** = week date, never write (except the admin "extend weeks" action).

**HR Dashboard** — owner Jilly (backup Michelle)
| Col | Header | Type | Notes |
|---|---|---|---|
| A | Week Ending | KEY | |
| B | Active Caregivers | IN int ≥0 | Exclude office staff and test accounts (Ayana, Jakayla, Monique, Shquina, any test caregiver). Show this as helper text. |
| C | New Hires | IN int ≥0 | |
| D | Separations | IN int ≥0 | |
| E | Turnover % (auto) | AUTO | `=IF(OR(B="",D=""),"",IFERROR(D/B,""))` |
| F | Call-Outs | IN int ≥0 | |
| G | Open Positions | IN int ≥0 | |
| H | Training Compliance % | IN percent 0–100 | |
| I | Corrective Actions | IN int ≥0 | Existing rows hold text `'0'`/`'1'`; parse defensively, always write numbers. |
| J | Declined Applicants | IN int ≥0 | Same text-number caveat. |
| K | Notes | IN text | |

**Business Development** — owner Ayana (backup Monique)
| Col | Header | Type |
|---|---|---|
| A | Week Ending | KEY |
| B | New Referrals | IN int ≥0 |
| C | Assessments Scheduled | IN int ≥0 |
| D | Assessments Completed | IN int ≥0 |
| E | New Starts | IN int ≥0 |
| F | Conversion % (auto) | AUTO `=IF(OR(B="",E=""),"",IFERROR(E/B,""))` |
| G | Active Clients | IN int ≥0 |
| H | Client Discharges | IN int ≥0 |
| I | Outreach Meetings | IN int ≥0 |
| J | Top Referral Source | IN text |
| K | Hot Opportunities | IN text |
| L | Next Action | IN text |

**Scheduling Dashboard** — owner Janelle (backup Shquina & Gene)
| Col | Header | Type |
|---|---|---|
| A | Week Ending | KEY |
| B | Open Shifts | IN int ≥0 (visits unassigned in next 3 weeks at Friday close-out) |
| C | Overtime Hours | IN decimal ≥0 (2 dp) |
| D | Shifts Unable to Cover | IN int ≥0 |
| E | Notes | IN text |

**Financial Dashboard** — owner Jenny (with Jawad; backup Monique)
| Col | Header | Type |
|---|---|---|
| A | Week Ending | KEY |
| B | Revenue | IN money ≥0 (2 dp) |
| C | Payroll Budget | IN money ≥0 (blank until FY2027 budget approved) |
| D | Actual Payroll | IN money ≥0 |
| E | Payroll % (auto) | AUTO `=IF(OR(B="",D=""),"",IFERROR(D/B,""))` |
| F | Overtime $ | IN money ≥0 (money, not hours) |
| G | A/R Outstanding | IN money ≥0 |
| H | Collections | IN money ≥0 |
| I | Other Expenses | IN money ≥0 |
| J | Cash Position | IN money (allow negative) |
| K | Notes | IN text |

Payroll/billing weeks: rows where `(weekEnding - 2026-10-24) mod 14 == 0` (Oct 24, Nov 7, Nov 21, …). Show a "Payroll week" badge on those rows, matching the sheet's green shading.

**Clinical Dashboard** — owner Shquina (until the RN seat is filled)
| Col | Header | Type |
|---|---|---|
| A | Week Ending | KEY |
| B | Assessments Due | IN int ≥0 |
| C | Assessments Completed | IN int ≥0 |
| D | Reassessments Due | IN int ≥0 |
| E | Reassessments Completed | IN int ≥0 |
| F | Incidents | IN int ≥0 |
| G | Complaints | IN int ≥0 |
| H | Care Plan Compliance % | IN percent 0–100 |
| I | Client Satisfaction % | IN percent 0–100 |
| J | Training Issues | IN text (initials only) |
| K | Follow-Up | IN text (initials only) |

Show a persistent warning on this tab's text fields: "Client initials only. Never full names." (see section 11).

**Founder Transition** — owner Monique (backup Ayana)
| Col | Header | Type |
|---|---|---|
| A | Week Ending | KEY |
| B | Escalations to Jay or Monique | IN int ≥0 |
| C | Seats That Escalated | IN text |
| D | Jay's Operations Hours | IN decimal ≥0 |
| E | Notes | IN text |

### 4.3 List tabs (rows 14–43, header row 13, no pre-filled keys)

**Weekly KPI Report** — every seat owner adds rows for their own off-target metrics
| Col | Header | Type |
|---|---|---|
| A | Week Ending | IN date |
| B | Department | IN enum: `Clinical, Operations, HR, Finance, Scheduling, Business Development, Compliance` |
| C | KPI | IN text |
| D | Goal | IN number |
| E | Actual | IN number |
| F | Status | IN enum: `Green, Yellow, Red` |
| G | Variance | IN number (the app should compute and write `Actual − Goal`) |
| H | Owner | IN text |
| I | Corrective Action | IN text |
| J | Due Date | IN date |

**Compliance Dashboard** — owner Monique (backup Ayana)
| Col | Header | Type |
|---|---|---|
| A | Requirement | IN text |
| B | Category | IN text |
| C | Responsible Leader | IN text |
| D | Frequency | IN text |
| E | Last Completed | IN date |
| F | Next Due | IN date |
| G | Status | IN enum: `Current, Due Soon, Past Due, In Progress` |
| H | Evidence Location | IN text |
| I | Action Required | IN text |
| J | Notes | IN text |

**Quarterly Goals** — owner Monique with leadership
| Col | Header | Type |
|---|---|---|
| A | Quarter | IN enum: `Q1, Q2, Q3, Q4` (A14 currently holds `Q4` with nothing else) |
| B | Strategic Pillar | IN text |
| C | Goal | IN text |
| D | Success Metric | IN text |
| E | Baseline | IN text/number |
| F | Target | IN text/number |
| G | Owner | IN text |
| H | Status | IN enum: `Not Started, On Track, At Risk, Complete` |
| I | Milestone Date | IN date |
| J | Progress Notes | IN text |

For list tabs, a "row" exists when any of A..J is non-empty. Create = write to the first fully empty row in 14–43; if none, return a clear "List is full (30 rows)" error. Delete = clear A..J of that row. Never delete sheet rows (it breaks the dropdown validations on 14–43).

### 4.4 Executive Scorecard (read mostly; a few admin inputs)

- Metrics: rows **11–32**. Columns: A Metric, B Owner, C Goal, D Current Week, E Last Week, F Trend, G Status, H Notes.
- Hidden helper columns: M direction (`H` higher-is-better, `L` lower-is-better, `I` info only), N suggested next step, O priority score.
- `K12`: reporting week, formula `=TODAY()-WEEKDAY(TODAY())`. Never overwrite it from the app (a typed date would freeze the scorecard). The app shows its value.
- `K16`: Overall Status.
- Seat Accountability: names `J26:J32` (Ayana, Jenny, Gene, Jilly, Shquina, Monique, Jay), results `K26:K32`.
- Top 3 Priorities: rows 37–39. A Priority, B Owner, C Due Date (formulas). **D Status** (IN enum `Not Started, In Progress, Complete, Blocked`), **G Leader Notes** (IN text; G:H merged, write G only).
- **Biggest Win** `K17` (IN text; K17:K19 merged), **Biggest Risk** `K20` (IN text; K20:K22 merged).
- **Major Wins** `A42` (IN text; A42:C45 merged), **Key Risks** `E42` (IN text; E42:H45 merged), **COO Notes** `A48` (IN text; A48:H52 merged).
- **Goals `C11:C32` are admin-editable inputs, EXCEPT:**
  - `C17` holds the text `—` (Payroll Budget is info-only). Read-only.
  - `C18` is a formula `=IF(D17="","",D17)`. Never write.
- Rows 28–30 (Client Satisfaction %, Incidents, Care Plan Compliance %) have **hardcoded values in D and E**, not lookups. Read them as-is; flag them in the UI as "manual" (see section 13).
- Status values in G: `Green`, `Yellow`, `Red`, `Set goal`, `No data`, `—`. Trend values in F: `Improving`, `Declining`, `Stable`, or blank.
- Status colors (from the sheet's conditional formatting): Green bg `#E3EFD6` text `#3E6B1F`; Yellow bg `#FFF2D0` text `#7A5C00`; Red bg `#F7DCDC` text `#9C2B2B`.

### 4.5 Read-only tabs
- **Targets** (A6:G57): department targets and red-flag lines, plus a proposed-changes table from row 48. Display as a read-only reference page. Cells E11 and E57 contain the literal text `#ERROR!`; render it as "—" with a tooltip "Not set in sheet".
- **Start Here** and **KPI Guide**: render as in-app help. KPI Guide rows 11–32 map each metric to owner, tab/column, meaning, source system, readiness. Link each form field to its KPI Guide entry as helper text.

---

## 5. Write rules (non-negotiable)

1. **Only write cells listed as IN in section 4.** Build writes from a typed column map, never from raw user-supplied ranges.
2. **Never write AUTO columns:** HR E, Business Development F, Financial E, and any formula cell on the scorecard (D, E, F, G, O, K12, K16, K26:K32, A/B/C/E of rows 37–39, C18).
3. **Never write or clear column A on the six weekly tabs.** Never delete or insert sheet rows, except the admin "extend weeks" action (section 7.4).
4. Writing a week on a weekly tab = **one `values.batchUpdate`** with one range per contiguous block of IN columns (e.g. HR: `B{r}:D{r}` and `F{r}:K{r}`, skipping E).
5. Clearing a week = write empty strings to the IN columns only (same split ranges). Do not use `values.clear` on whole rows.
6. Use `valueInputOption: "RAW"` for numbers and text (prevents a note like `=SUM(...)` from becoming a formula, and prevents Sheets from re-parsing values). Write numbers as JS numbers, not strings. Write dates on list tabs as Google serial numbers (days since 1899-12-30) with `RAW`, so they stay real dates.
7. Prefix any text value that starts with `=`, `+`, `-`, or `@` with a `'` before writing, even under RAW, as defense in depth against formula injection if someone later edits the cell in the UI.
8. Resolve the target row by **reading column A and matching the date**, never by computing a row number from the date. Cache the date→row map per request only.
9. Optimistic concurrency: every edit form submits the values it loaded. Before writing, the server re-reads that row; if any IN cell differs from the loaded value, abort with HTTP 409 and show "This week was changed by someone else (in the app or directly in the sheet). Reload to see the latest values."
10. After every successful write, insert one audit row per changed cell (section 6) and invalidate the relevant TanStack Query keys.

---

## 6. App database (Drizzle schema)

```ts
// users
id              uuid pk
email           text unique not null      // lowercase
name            text
image           text
status          enum('pending','approved','rejected','deactivated') default 'pending'
role            enum('admin','seat_owner','viewer') null   // null until approved
approvedBy      uuid fk users.id null
approvedAt      timestamptz null
createdAt       timestamptz default now()
lastLoginAt     timestamptz null

// tab permissions (seat_owner only; admins can edit everything, viewers nothing)
userTabs
userId          uuid fk users.id
tab             enum of SheetTab keys (see below)
canEdit         boolean default true
primary key (userId, tab)

// audit log (append-only)
auditLog
id              bigserial pk
userId          uuid fk users.id
action          enum('create','update','clear','approve_user','reject_user','deactivate_user','change_role','change_tabs','edit_goal','extend_weeks')
tab             text null
cell            text null       // A1 notation, e.g. 'HR Dashboard'!B17
weekEnding      date null
field           text null       // human label, e.g. "Active Caregivers"
oldValue        text null
newValue        text null
createdAt       timestamptz default now()

// plus Auth.js Drizzle adapter tables: accounts, sessions, verificationTokens
```

`SheetTab` keys: `hr`, `business_development`, `scheduling`, `financial`, `clinical`, `founder_transition`, `weekly_kpi_report`, `compliance`, `quarterly_goals`. Map each key to its exact sheet tab name in one config file.

Seed: on first sign-in, any email in `INITIAL_ADMIN_EMAILS` becomes `approved` + `admin` automatically.

---

## 7. Features

### 7.1 Auth and approval
- Sign-in page with "Continue with Google" and "Email me a sign-in link".
- Google: pass `hd=dawsonhomecare.com` and **also verify on the server** in the `signIn` callback that `profile.email_verified === true` and the email ends with `@${ALLOWED_GOOGLE_DOMAIN}`. Reject anything else.
- Email magic link: allowed for any address, but the user still lands as `pending`.
- New user → `pending` → "Waiting for approval" page. Send Resend email to `ADMIN_NOTIFY_EMAILS`.
- Middleware protects every route except `/sign-in`, `/pending`, `/api/auth/*`. Re-check status and role from the DB on every server action and route handler (do not trust the session token alone), so deactivation takes effect immediately.
- On approval, email the user "You're approved" with a link.

### 7.2 Roles
| Role | Rights |
|---|---|
| admin | All tabs read/write, scorecard inputs, goals, user management, audit log, extend weeks |
| seat_owner | Read/write only their `userTabs`; read the scorecard, Targets, KPI Guide |
| viewer | Read-only scorecard, all department tabs, Targets, KPI Guide |

Suggested default tab assignments (admin confirms during approval):
Jilly → hr · Ayana → business_development · Janelle, Gene → scheduling · Jenny → financial · Shquina → clinical · Monique → founder_transition, compliance, quarterly_goals · every seat owner → weekly_kpi_report.

### 7.3 Pages
- `/` **Home**: "This week" card per assigned tab showing the current reporting week, whether it is filled (all numeric IN cells non-empty), and a button to fill/edit. Due reminder text: "Due every Monday by 10 AM".
- `/scorecard` **Executive Scorecard**: metrics table (Metric, Owner, Goal, Current, Last, Trend, Status chip), Overall Status, Seat Accountability, Top 3 Priorities (admins can set Status and Leader Notes inline), Biggest Win/Risk, Major Wins, Key Risks, COO Notes (admins edit). Show the reporting week from K12.
- `/tabs/[tab]` **Department tab**: TanStack Table of all 30 weeks, newest-first toggle, current week highlighted, payroll-week badge on Financial, auto columns shown read-only with an "auto" label. Row actions: Edit, Clear (with confirm dialog). Clicking an empty week opens the create form. Per-metric trend chart (Recharts line) above the table.
- `/tabs/[tab]/[weekEnding]` (or a side sheet/dialog): the entry form for one week. Helper text per field from KPI Guide.
- `/lists/[tab]` for Weekly KPI Report, Compliance, Quarterly Goals: table + add/edit/delete dialogs with enum dropdowns.
- `/targets`, `/help` (Start Here + KPI Guide): read-only.
- `/admin/users`: tabs for Pending / Approved / Deactivated. Approve (choose role + tabs), Reject, Deactivate, change role/tabs.
- `/admin/goals`: edit scorecard goals C11:C32 (except C17, C18), shown with direction (higher/lower is better) from column M.
- `/admin/audit`: filterable audit log (user, tab, week, date range), CSV export.
- `/admin/weeks`: shows the last week-ending date per tab and the "Extend weeks" action.

### 7.4 Extend weeks (admin)
The dated tabs end on **2027-05-15** (row 43). The scorecard's lookups use absolute ranges `$A$14:$A$43` etc. To add weeks without breaking them:
1. For each of the six weekly tabs, use `spreadsheets.batchUpdate` → `insertDimension` with `inheritFromBefore: true`, inserting N rows **at index 42 (above the last data row, 0-based)**, so every range ending at row 43 expands automatically.
2. Rewrite column A dates for the whole block so they stay continuous Saturdays, and copy the AUTO formulas into the new rows' auto columns.
3. Verify: re-read the scorecard and confirm D/E formulas now end at the new last row.
**Build and test this against the dev copy first.** If the expansion behaves unexpectedly, fall back to telling the admin to extend the sheet manually and disable the action.

### 7.5 Validation (Zod, shared)
- Integers: `z.number().int().min(0)`. Money: `min(0)`, max 2 decimals (Cash Position may be negative). Percent: UI 0–100, stored /100. Text: trim, max 500 chars. Enums exactly as listed in section 4.
- Empty input means "leave blank" (write `""`), not 0. Zero is a valid value and must be preserved.

---

## 8. Google Sheets integration layer

Create `lib/sheets/` with:
- `client.ts`: singleton `google.sheets({ version: 'v4', auth: JWT })`.
- `schema.ts`: typed column maps for every tab (section 4) — the single source of truth for which columns are IN/AUTO/KEY, their labels, types, and the Zod schema. Unit-test this file heavily.
- `read.ts`:
  - `readWeeklyTab(tab)`: one `values.batchGet` for `A14:<lastCol>43` with `valueRenderOption: 'UNFORMATTED_VALUE'` and `dateTimeRenderOption: 'SERIAL_NUMBER'`. Convert serials to ISO dates.
  - `readScorecard()`: one `values.batchGet` for `A11:H32`, `K12`, `K16`, `J26:K32`, `A37:G39`, `K17`, `K20`, `A42`, `E42`, `A48`, and `M11:M32` (direction).
- `write.ts`: `writeWeek(tab, weekEnding, values, loadedValues)`, `clearWeek(...)`, `upsertListRow(...)`, `deleteListRow(...)`, `writeScorecardInput(...)`, `writeGoal(...)`. Each implements section 5.
- Caching: no long-lived cache. Optional 15-second in-memory cache for scorecard reads only, busted on any write.
- Rate limits: Sheets allows about 300 read requests/min per project and 60/min per user. Use batch calls; add exponential backoff with jitter on 429/5xx (max 4 retries).

---

## 9. Project structure

```
app/
  (auth)/sign-in/page.tsx
  (auth)/pending/page.tsx
  (app)/layout.tsx                 # nav filtered by role/tabs
  (app)/page.tsx                   # Home
  (app)/scorecard/page.tsx
  (app)/tabs/[tab]/page.tsx
  (app)/lists/[tab]/page.tsx
  (app)/targets/page.tsx
  (app)/help/page.tsx
  (app)/admin/users/page.tsx
  (app)/admin/goals/page.tsx
  (app)/admin/audit/page.tsx
  (app)/admin/weeks/page.tsx
  api/auth/[...nextauth]/route.ts
auth.ts                            # Auth.js config
middleware.ts
db/schema.ts
db/index.ts
drizzle/                           # migrations
lib/sheets/{client,schema,read,write,dates}.ts
lib/permissions.ts                 # canView(user, tab), canEdit(user, tab), requireAdmin()
lib/audit.ts
lib/email/{templates/*,send.ts}
components/ui/*                    # shadcn
components/{week-form,week-table,status-chip,trend-chart,...}.tsx
tests/unit/*  tests/e2e/*
```

---

## 10. Design direction

- Original design. Do not copy a generic admin template look. Calm, clinical-but-warm, built for non-technical staff filling numbers once a week on a laptop or phone.
- Brand colors taken from the sheet:
  - Plum `#5E4B73` (primary, headers, nav) · Light plum `#7A6890` · Plum tint `#ECE6F2`
  - Sage `#DCE8CF` with text `#3E5A1E` (positive states)
  - Charcoal `#2F2838` (body text, dark surfaces)
  - White `#FFFFFF`
  - Auto/calculated cells: background `#F3F1F5` (as in the sheet); current-week highlight `#FFF6DD`
  - Status chips: see section 4.4.
- Large, forgiving numeric inputs; percent fields show a `%` suffix; money fields show `$`.
- Fully usable at 375px width. Light mode first; dark mode optional.
- Every empty state says what to do next ("No numbers for the week ending Nov 21 yet. Add them").

---

## 11. Security and privacy

- The Clinical tab's text fields can contain client information. Treat all note/text fields as sensitive:
  - UI reminder "Client initials only. Never full names." on Clinical, Weekly KPI Report, and any Notes field.
  - Never send field values to Sentry, logs, or analytics. Configure Sentry `beforeSend` to strip request bodies and breadcrumbs with form data.
  - The audit log stores old/new values. Restrict `/admin/audit` to admins.
  - Whether Dawson needs a BAA with Vercel/Neon/Resend for PHI is a business decision. Flag it to the client before production; do not decide it in code.
- Service account key only in server env vars. No Google calls from the browser.
- All mutations are server actions or POST route handlers with CSRF protection (Auth.js handles session CSRF; server actions are same-origin).
- Re-check permissions server-side on every request (section 7.1).

---

## 12. Fallback connector: Apps Script (only if service account sharing is blocked)

Keep `lib/sheets/read.ts` and `write.ts` behind an interface (`SheetGateway`). Provide a second implementation that calls a Google Apps Script web app:
- Apps Script deployed by a Dawson account with edit access ("Execute as: Me", "Who has access: Anyone"), exposing `doPost(e)` with actions `batchGet` and `batchUpdate` that mirror the Sheets API shapes.
- Authenticate requests with an HMAC-SHA256 signature over the body + timestamp using a shared secret (`APPS_SCRIPT_SECRET`), reject if older than 5 minutes.
- Select the implementation with `SHEET_GATEWAY=service_account|apps_script`.

---

## 13. Known issues in the current sheet (do not "fix" in code; surface to the admin)

These come from a full audit of the live sheet. The app must cope with them as-is and show them where noted. Fixing them requires editing the sheet, which the client decides.

1. **Seat Accountability names don't match owners.** J26:J32 uses Ayana, Jenny, Gene, Jilly, Shquina, Monique, Jay, but B11:B32 uses Finance, Leadership, Janelle, HR, Scheduler for many rows. Jenny/Jilly/Gene always show "No data yet" and Janelle's metrics never appear. The app should display K26:K32 as the sheet calculates it, and the admin page should list this as a known issue.
2. **Scorecard rows 28–30 are hardcoded** (D/E typed values, not lookups from Clinical). Show a "manual" badge on these three metrics.
3. **Overall Status ignores missing data.** One Red plus all "No data" reads Yellow. On the scorecard page, show a count of "No data" metrics next to Overall Status so it can't be misread.
4. **Text numbers** in HR columns I and J (`'0'`, `'3'`). Parse as numbers when reading.
5. **Targets E11 and E57** contain literal `#ERROR!` text (section 4.5).
6. Start Here says "week ending the Friday before"; the sheet actually uses Saturday. The app uses Saturday.
7. The Financial tab says Revenue and Payroll are entered on payroll weeks only, but every week is currently filled. Do not enforce payroll-week-only entry; just show the badge.

---

## 14. Build phases and acceptance criteria

Work phase by phase. Do not start the next phase until the current one's checks pass.

**Phase 0 — Setup**
- Next.js app, TypeScript strict, Tailwind, shadcn/ui, ESLint/Prettier, Vitest, Playwright, Drizzle + Neon, env validation with Zod (`env.ts`).
- ✅ `pnpm build`, `pnpm lint`, `pnpm test` pass on a blank app.

**Phase 1 — Sheets layer (no UI)**
- `lib/sheets/schema.ts` for all tabs, `read.ts`, `write.ts`, `dates.ts`.
- Unit tests: every tab's write ranges skip AUTO and KEY columns; date→row resolution; percent conversion; serial↔ISO dates; formula-injection prefixing; 409 conflict detection.
- Integration script `scripts/smoke-sheets.ts` against the **dev copy**: read every tab, write a test value to one week on each weekly tab, read back, verify the auto column still contains its formula (read with `valueRenderOption: 'FORMULA'`), clear it.
- ✅ All formulas still present after the smoke run (compare formula count before/after: the live workbook had 216 formulas on 2026-11-20).

**Phase 2 — Auth and approval**
- Auth.js with Google + magic link, Drizzle adapter, pending flow, admin seeding, middleware, `/admin/users`, Resend emails.
- ✅ Non-domain Google account is rejected; new domain user lands on `/pending`; admin approves with tabs; deactivated user is blocked on the next request.

**Phase 3 — Department tabs (CRUD)**
- `/tabs/[tab]` table + form for the six weekly tabs, with audit logging and conflict handling.
- ✅ Seat owner can create, edit, clear only their tabs; viewer cannot edit; editing a value directly in the sheet then saving a stale form returns the conflict message.

**Phase 4 — List tabs**
- Weekly KPI Report, Compliance, Quarterly Goals with add/edit/delete and enum dropdowns.
- ✅ Adding a row uses the first empty row; full list shows the "List is full" error; delete clears only A..J.

**Phase 5 — Scorecard and reference pages**
- `/scorecard` (read + admin inputs), `/admin/goals`, `/targets`, `/help`, trend charts, Home page.
- ✅ Values on `/scorecard` match the sheet exactly for the current reporting week; editing a goal changes the sheet's Status after reload.

**Phase 6 — Admin extras**
- `/admin/audit` with filters and CSV export, `/admin/weeks` with extend-weeks (tested on the dev copy).
- ✅ Extending by 4 weeks on the dev copy leaves the scorecard working for the new weeks.

**Phase 7 — Hardening and deploy**
- Sentry with scrubbing, rate-limit/backoff, Playwright e2e for the main flows, Vercel deploy (preview → production), production env pointing at the real sheet only after sign-off.
- ✅ e2e suite green on the preview deployment.

---

## 15. Open questions for the client (track, don't block on them)

1. Who are the admins (Monique and Basil? Asif?) — set `INITIAL_ADMIN_EMAILS`.
2. Can the service account be shared on the Dawson shared drive, or do we use the Apps Script connector?
3. Will staff keep editing the sheet directly after launch, or will the app become the only way in?
4. PHI handling for clinical notes: initials-only policy, or BAAs with the hosting vendors?
5. Should the sheet issues in section 13 be fixed in the sheet before launch?
