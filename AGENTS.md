# Atlas AI

Next.js 15 (App Router) + React 19 + TypeScript.

## Honest status

Atlas has a large interactive product surface. Much of it is still a **sophisticated simulation**:

- Keyword Brain fallback in `src/lib/commands.ts` when no LLM key is set
- File-backed JSON under `.data/` is still the **sync read path**
- When `DATABASE_URL` is set, saves **dual-write** into Postgres via Drizzle
- When `REDIS_URL` is set, jobs also go to BullMQ (`npm run worker`)
- Many studios mock phone/calendar/invoices unless integration env vars are set

**North star:** stop adding feature pages; make one beachhead real. See `docs/NORTH_STAR.md`.

API identity comes from the `atlas_session` httpOnly cookie — never from body `userId` / `organizationId`. Home KPIs should label DEMO vs LIVE data honestly.

## Atlas Brain (Phase 0+)

- Command Center talks to `POST /api/ai/chat`
- If `ATLAS_LLM_API_KEY` is set → live OpenAI-compatible LLM + tool calling
- If unset → simulation/keyword fallback (demos still work)
- Tools: business brief, propose risky action (approval), remember standing order
- Postgres schema: `supabase/schema.sql`

## Commercial beachhead (`/app/commercial`)

| System | Live when | Routes |
| --- | --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | store dual-write |
| Twilio | `TWILIO_ACCOUNT_SID` + token + number | `/api/webhooks/twilio/*` |
| Google/Microsoft calendar | OAuth client ids/secrets | `/api/calendar/oauth/*` |
| SMS / invoice | Twilio (+ approval flag) | `/api/actions/*` |
| Stripe | `STRIPE_SECRET_KEY` (+ price id) | `/api/billing/*` |

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
- Architecture DB → `.data/atlas-db.json` (reads); Postgres dual-write when `DATABASE_URL` is set
- Event bus → `src/lib/events` (`appointment.cancelled`, `call.missed`, `invoice.overdue`, …)
- Queue → file jobs, or BullMQ `atlas-jobs` when Redis is up
- Workspace domains → `.data/workspace.json`
- Open `/app/backend` for health checks; `GET /api/health` reports postgres / redis / queue driver

## Cursor Cloud specific instructions

- Package manager is npm (`package-lock.json`); Node 20+ works (verified on Node 22). After pulling, run `npm install` so `zod` and `vitest` are present.
- Standard scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm start`, `npm test`. Setup: `npm install`.
- Optional local stack: `docker compose up -d postgres redis`, then `npm run db:migrate`, `npm run worker`, `npm run dev`.
- Dev server: `http://localhost:3000` via `npm run dev`.
- Optional env: copy `.env.example` → `.env.local`. `ATLAS_LLM_API_KEY` for live Brain; `DATABASE_URL` / `REDIS_URL` for Postgres + workers.
- Interactive hello world: open `/app`, Talk to Atlas. Try “How is business?” or “Going home — handle tonight”.
- Autonomy: open `/app/autonomous`. Try Level 1 vs 4, kill switch, and “Simulate $18,420 vendor payment”.
- Commercial beachhead: open `/app/commercial` to see live vs simulation integrations; `curl http://localhost:3000/api/integrations/status`.
- Backend smoke: `curl http://localhost:3000/api/health` or `curl -X POST http://localhost:3000/api/ai/chat -H 'content-type: application/json' -d '{"message":"How is business?"}'`.
- Seed login (after `resetDatabase`): `demo@atlas.ai` / `atlas-demo`. Dev `GET /api/session` mints a cookie for the seeded owner.
- Do **not** prioritize new `/app/*` feature studios over Brain / Postgres / receptionist / autonomy-engine work.
