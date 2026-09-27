# Atlas AI

Next.js 16 (App Router) + React 19 + TypeScript.

## Honest status

Atlas has a large interactive product surface. Much of it is still a **sophisticated simulation** when credentials are unset:

- Keyword Brain fallback in `src/lib/commands.ts` when no LLM key is set
- **Backend V1:** `DATABASE_URL` makes PostgreSQL (Drizzle) the source of truth — hydrate once, write-through, no per-request demo reseed
- Without `DATABASE_URL`, `.data/*.json` remains the adapter so demos/tests still run
- `REDIS_URL` → BullMQ workers + session cache; Supabase Auth when URL + anon key are set
- Many studios mock phone/calendar/invoices unless integration env vars are set

**North star:** stop adding feature pages; make one beachhead real. See `docs/NORTH_STAR.md`.

API identity comes from the `atlas_session` httpOnly cookie — never from body `userId` / `organizationId`. Home KPIs should label DEMO vs LIVE data honestly.

## Shipped on this branch (production program)

These are **in the tree** (not aspirational):

- **Tenant projects/settings** — `GET`/`PUT /api/projects` and `/api/settings` gated by `workspace.read` / `workspace.write`; localStorage is a cache only. Workspace domains include `projects` and `settings` (mirrored to Postgres `workspace_domains` when `DATABASE_URL` is set).
- **Employee portal auth** — field login creates a real `atlas_session` via `createSession`; access codes are stored as `accessCodeHash` (scrypt), never plaintext.
- **Identity** — invitations (`POST /api/invitations`, `/invite`), password reset (`/forgot-password` → `/api/auth/forgot`, `/reset-password` → `/api/auth/reset`), org switch (`GET`/`POST /api/organizations`).
- **Integrations** — Twilio webhooks require `X-Twilio-Signature` (`src/lib/integrations/twilio-security.ts`); calendar OAuth is tenant-scoped with consume-once state; `POST /api/integrations/verify` for sandbox credential checks; `/api/health` includes a `reliability` snapshot.
- **Owner→worker loop** — assign tasks with `projectLabel` / assignee, worker completion audits, Brain `mass_sms` stages `SEND_SMS`, approval executes Twilio.
- **Consolidation** — duplicate studios redirect (see table below + `next.config.ts`); tests in `tests/consolidation.test.ts`.
- **Tests** — `tests/identity-onboarding.test.ts`, `tests/owner-worker-workflow.test.ts`, `tests/server-projects-settings.test.ts`, `tests/production-boundaries.test.ts`, plus `tests/safety.test.ts` / `tests/beachhead-accounts.test.ts`.

Seed accounts (after `resetDatabase`): owner `demo@atlas.ai` / `atlas-demo`; manager `alex@atlas.ai` / `atlas-manager`; worker `sam@atlas.ai` / `atlas-worker`; field codes MARCUS / SARAH1 / JORDAN.

## Atlas Brain (Phase 0+)

- Command Center talks to `POST /api/ai/chat`
- If `ATLAS_LLM_API_KEY` is set → live OpenAI-compatible LLM + tool calling
- If unset → simulation/keyword fallback (demos still work)
- Tools: business brief, search_business_context, plan_business_goal, answer_from_context, memory, tasks/schedule/invoice/SMS (strict + approvals), propose risky action, remember standing order, run_business_goal
- Evidence: permission-filtered retrieval (tasks, projects, customers, calendar, transactions, documents, policies, communications, memories) with citations + gaps; simulation uses evidence-fallback for named operational questions
- Memory: server `/api/memory` with conflict detection, owner correct/delete; feedback via `/api/feedback` → memory outcomes
- Live model: allowlisted models, timeouts, token/cost/latency metering on replies + `GET /api/health` → `brain`
- Orchestrator: `POST /api/orchestrator` with `{ runId, answer }` resumes ask_owner waits
- Postgres schema: `supabase/schema.sql`

## Commercial beachhead (`/app/commercial`)

| System | Live when | Routes |
| --- | --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | store dual-write |
| Twilio | `TWILIO_ACCOUNT_SID` + token + number | `/api/webhooks/twilio/*` (signature + idempotency required) |
| Google/Microsoft calendar | OAuth client ids/secrets | `/api/calendar/oauth/*` (session + consume-once state) |
| SMS / invoice | Twilio (+ approval flag) | `/api/actions/*` |
| Stripe | `STRIPE_SECRET_KEY` (+ price id) | `/api/billing/*` (live webhooks need `STRIPE_WEBHOOK_SECRET`) |
| Verify / status | owner/admin session | `POST /api/integrations/verify`, `GET /api/integrations/status` |

Copy `.env.example` → `.env.local` and fill credentials to go live. Without them, actions run in simulation and write audit trails locally.

## Autonomy engine

- Levels 1–4 + kill switch + spending limits live in `src/lib/autonomy` (file DB today; `autonomy_policies` in `supabase/schema.sql`)
- `GET`/`PUT /api/autonomy` — policy and pending owner cards
- `POST /api/autonomy/work` — submit work or `{ "demo": "vendor_payment" }`
- `GET`/`POST /api/autonomy/tick` — drain the queue (session or `Authorization: Bearer $CRON_SECRET`)
- Chat “I’m going on vacation. Run the company.” raises Autopilot
- UI: `/app/autonomous` (not a new studio). Goal: Atlas runs the routine company; humans handle exceptions.

## Backend today

- Route Handlers under `src/app/api/**` — Next.js stays the API (no second HTTP server)
- Architecture DB → PostgreSQL when `DATABASE_URL` is set (JSON fallback otherwise)
- Event bus → `src/lib/events` (`appointment.cancelled`, `call.missed`, `invoice.overdue`, …)
- Queue → file jobs, or BullMQ `atlas-jobs` when Redis is up
- Workspace domains → `.data/workspace.json` (tenant-scoped; includes `projects` / `settings`)
- Open `/app/backend` for health checks; `GET /api/health` reports postgres / redis / queue driver / **reliability**
- Tenant APIs: `/api/projects`, `/api/settings`, `/api/organizations`, `/api/invitations`

## Cursor Cloud specific instructions

- Package manager is npm (`package-lock.json`); Node 20+ works (verified on Node 22). After pulling, run `npm install` so `zod` and `vitest` are present.
- Standard scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm start`, `npm test`. Setup: `npm install`.
- Optional local stack: `docker compose up -d postgres redis`, then `npm run db:migrate`, `npm run worker`, `npm run dev`.
- Staging drills (no cloud sandbox keys required): `npm run drill:trust`; with Postgres/Redis + running app, `npm run smoke:staging`.
- Dev server: `http://localhost:3000` via `npm run dev`.
- Optional env: copy `.env.example` → `.env.local`. `ATLAS_LLM_API_KEY` for live Brain; `DATABASE_URL` / `REDIS_URL` for Postgres + workers.
- Interactive hello world: open `/app`, Talk to Atlas. Try “How is business?” or “Going home — handle tonight”.
- Autonomy: open `/app/autonomous`. Try Level 1 vs 4, kill switch, and “Simulate $18,420 vendor payment”.
- Commercial beachhead: open `/app/commercial` to see live vs simulation integrations; `curl http://localhost:3000/api/integrations/status`. Owner/admin: `POST /api/integrations/verify`.
- Backend smoke: `curl http://localhost:3000/api/health` or `curl -X POST http://localhost:3000/api/ai/chat -H 'content-type: application/json' -d '{"message":"How is business?"}'`.
- Seed login (after `resetDatabase`): `demo@atlas.ai` / `atlas-demo` (also alex/sam — see “Shipped on this branch”). Dev `GET /api/session` mints a cookie for the seeded owner.
- Do **not** prioritize new `/app/*` feature studios over Brain / Postgres / receptionist work.

## Production safety (trust with a real company)

Automated rails live in `src/lib/safety`, `src/lib/billing/entitlements.ts`, and `tests/safety.test.ts`. They prove Atlas cannot overspend, self-approve, fire staff, leak tenants, retry payments forever, or spam a customer after a worker crash. Sensitive actions always write an audit row.

- Privacy: `GET`/`DELETE /api/privacy` (export / owner delete)
- Support snapshot: `GET /api/admin/support` (owner/admin, this org only)
- Worker heartbeat + dead letters + reliability snapshot: `GET /api/health` (and org-scoped DLQ on `GET /api/admin/support`)
- Integration sandbox verify: `POST /api/integrations/verify` (owner/admin; `{ "dryRun": true }` for CI)
- Backups: `npm run db:backup` / `npm run db:restore` (JSON locally; `pg_dump` when `DATABASE_URL` is set)
- CI: `.github/workflows/atlas-ci.yml` runs `tsc`, `npm test`, and `npm audit`
- Environments: `ATLAS_ENV=development|staging|production` (see `docs/PRODUCTION_SAFETY.md`)

## Atlas Orchestrator

The Brain is not the execution engine. `src/lib/orchestrator` plans a goal, checks the **capability registry** (`src/lib/capabilities`) and **business rules** (`src/lib/rules` — distinct from `src/lib/auth/permissions`), then sends work through **existing** Atlas Actions, Approvals, Audit, and Jobs.

- `POST /api/orchestrator` `{ "goal": "Get Johnson Construction's overdue invoice paid." }`
- Persistent runs + technical traces: `.data/orchestrator.json` (audit stays the governance log)
- Event router (`src/lib/events/router.ts`) decides which existing job, automation, or orchestrator intent cares about an event
- Integration adapters wrap Twilio / Stripe / Calendar / Resend — not a second integration engine
- BullMQ remains `atlas-jobs` with worker **lanes** (sms, email, payment, …)

Do **not** add a new `/app/*` studio. Inspect runs via the API or `/api/health` → `orchestrator`. Owners already have `/app/autonomous` and `/app/commercial`.

## Product consolidation (one place per capability)

Before adding another Atlas feature, check: **Does Atlas already have this somewhere?**

Do not add a second page that does the same job. Redirect or wrap instead.

| Keep | Redirect / parent |
| --- | --- |
| `/app/approvals` | `/app/confirmations` |
| `/app/marketplace` | `/app/app-store`, `/app/apps` |
| `/app` (`CommandDashboard`) | `AtlasV1Home` / `CustomizableHome` wrappers |
| `/app/tax` (`TaxCenter`) | no separate “Advanced Tax Center” page |
| `/app/ask` | `/app/chat` — `/app/chatbot` is the **customer** website widget |
| Money group | `/app/money`, `/app/finance`, `/app/payments`, `/app/tax`, `/app/accountant` |
| Atlas Memory | `/app/memory` and children |
| Trust & Governance | `/app/governance` and Security / Risk / Compliance / Privacy / Audit |

Dashboard = current status. Mission Control = live Atlas ops. Executive = strategy. Board Advisor = strategic AI. Mission = company goals.

API routes should use `withWorkspace` / `withAuth` / `withPermission`, `parseBody`, `apiSuccess` in `src/lib/api/http.ts` instead of copying session + try/catch on every file.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
