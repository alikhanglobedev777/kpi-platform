# Dawson & Dawson KPI Portal

Next.js 15 / React 19 / TypeScript portal backed by the existing Dawson KPI workbook. Implementation follows `DAWSON_KPI_PORTAL_BUILD_SPEC.md` supplied by the project owner.

## Development

Use Node.js 22.15+ (Node 24 recommended) and pnpm 10.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. The initial page is explicitly a setup preview; it contains no fabricated KPI results or enabled data mutations.

Copy `.env.example` to `.env.local` when configuring integrations. Keep credentials out of source control. No credentials are required to build the initial shell; integration entry points validate their required configuration before connecting. Use a **development copy** of the workbook shared with the service account. The known production workbook ID is rejected outside a Vercel production deployment, including local builds where Next sets `NODE_ENV=production`.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:generate
# Only after configuring a development Neon database:
pnpm db:migrate
```

Playwright is configured for Chromium. Browser tests are added alongside functional flows in subsequent phases; no e2e coverage is claimed for the initial setup.

## Implementation status

- Phase 0: scaffold, styling, reusable Radix button, strict TypeScript, environment checks, Drizzle schema, migration configuration, Vitest and Playwright setup.
- Phase 1 next: typed Sheets maps, protected write ranges, date handling, conflict detection, and development-copy smoke test.
- Phases 2–7: authentication/approval, department CRUD, lists, scorecard/reference pages, admin operations, hardening and deployment.

Do not advance to the next phase until the current phase's checks pass. A generated database schema is not an applied migration. Authentication, authorization, auditing, and Sheets operations are not connected yet; this scaffold must not be used as a production portal.

## Integration inputs needed

1. Development workbook ID and service-account credentials (or confirmation that Apps Script is needed).
2. Development Neon connection string.
3. Google OAuth, Auth.js, and Resend configuration for Phase 2.
4. Confirmed initial admin email addresses; no suggested identity is automatically trusted.

The source workbook's known issues and the client's unresolved choices remain requirements for later phases. In particular, preserve manual clinical scorecard values, show missing-data counts, use Saturday reporting weeks, and keep all notes out of telemetry. Production deployment and workbook changes remain later work.
