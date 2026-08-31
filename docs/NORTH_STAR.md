# Atlas North Star — Stop simulating. Ship the product.

## Honest status (today)

Atlas looks like an AI Operating System. Underneath, most “intelligence” is still:

- Keyword / rule replies in `src/lib/commands.ts` (`runOwnerCommand`)
- File-backed JSON under `.data/` is the fallback adapter when `DATABASE_URL` is unset. With Postgres configured, Atlas hydrates from Drizzle once per instance and write-throughs — it does not reseed demo data per request.
- UI studios that *simulate* phone, calendar, invoices, and payroll

That was the right way to explore the surface area. It is no longer the highest-leverage work.

**Do not add another 30 product pages.** More feature surface without a real brain and shared business state will make Atlas harder to sell and harder to finish.

## The product (one sentence)

A plumber can say:

> “Atlas, I’m going home. Handle anything routine tonight, don’t discount more than 10%, don’t schedule anything before 8 AM, and wake me up only if it’s an emergency.”

Atlas answers calls, texts customers, books jobs, updates CRM, proposes risky actions for approval, and leaves a morning summary.

## Beachhead vertical (ship this first)

Focus on **service businesses** (HVAC, plumbing, landscaping) and make **one path real**:

1. **Shared Postgres/Supabase backend** — orgs, users, customers, conversations, appointments, invoices, permissions, audit log
2. **Real Atlas Brain** — LLM + tool calling + business memory retrieval + conversation memory + DNA/role instructions
3. **AI receptionist** — real number (Twilio), intent, schedule, escalate
4. **Missed-call recovery** — missed → SMS → capture lead → follow-up → book
5. **Real calendar** — Google / Microsoft
6. **Real actions** — send SMS, create invoice, book appointment (with approvals)
7. **Approvals + audit log** — dangerous/expensive actions require owner confirm
8. **Stripe subscriptions** — Personal / Freelancer / Business / Tax Pro later; start with one paid “Atlas Business” seat

Tax Center, Marketplace, Simulator, etc. stay as *prototype surface* until the beachhead earns money.

## Phase plan

### Phase 0 — Truth + Brain switch ✅

- Document the pivot (this file)
- Route Command Center through `/api/ai/chat`
- Add OpenAI-compatible LLM provider when `ATLAS_LLM_API_KEY` is set
- Keep keyword fallback so demos still work offline
- Tool-calling stubs for propose/confirm risky actions
- Publish a Postgres/Supabase schema for the commercial core

### Phase 1–3 — Commercial wiring (in progress in repo)

- **Postgres + Drizzle + event bus + BullMQ** — dual-write schema in `drizzle/0000_init.sql`; events in `src/lib/events`; workers in `src/worker`
- **Supabase client** — `src/lib/integrations/supabase.ts` dual-writes live REST when configured, else `.data`
- **Twilio receptionist** — voice TwiML + SMS + missed-call recovery (`/api/webhooks/twilio/*`, `/api/receptionist/missed-call`)
- **Google / Microsoft calendar** — OAuth + event create (`/api/calendar/oauth/*`, `/api/calendar/sync`)
- **Real SMS / invoice send** — approval-gated (`/api/actions/send-sms`, `/api/actions/send-invoice`)
- **Stripe** — Checkout + portal + webhook (`/api/billing/*`, `/api/webhooks/stripe`)
- Operator UI: `/app/commercial`

Without credentials everything stays in **simulation mode** so demos never break.

## Safety (non-negotiable)

- Atlas **proposes**; the owner **approves** money movement, discounts over DNA caps, after-hours exceptions, and filing
- Every tool call and approval is written to an audit log
- Estimates / AI suggestions / accountant-reviewed / filed remain labeled when Tax ships for real

## Autonomy — Atlas runs the routine company. Humans handle the exceptions.

The React dashboard is not the brain. Permission checks and the action queue live **server-side** (`src/lib/autonomy`, `POST /api/autonomy/tick`) so work can continue when nobody has the site open.

| Level | Name | What Atlas does |
| --- | --- | --- |
| 1 | Assistant | Recommends. Nothing executes without approval. |
| 2 | Routine Autonomy | Scheduling, confirmations, reminders, follow-ups, receptionist, basic SMS/email, lead qualification, task assignment, invoice reminders, review requests |
| 3 | Business Manager | Operational calls inside owner rules (discounts ≤ cap, refunds below limit, fill canceled slots, marketing budget) |
| 4 | Autopilot | “I’m on vacation. Run the company.” Owner is contacted only for exceptions |

**Never unrestricted** (always ask, any level): payroll changes, firing, signing contracts, filing taxes, loans, large transfers, deleting major company data, ownership/security, and **payments above the auto-pay limit**.

Example owner card:

```
Atlas needs you
Vendor payment: $18,420
Your automatic-payment limit: $5,000
Approve | Reject | Ask Atlas
```

Kill switch pauses execution without wiping the queue. File DB is the beachhead; `autonomy_policies` in `supabase/schema.sql` is the Postgres contract. Cron: `GET /api/autonomy/tick` with `CRON_SECRET`.

Operator UI stays on existing routes: `/app/autonomous`, `/app/approvals`, `/app/commercial`.

## Trust ladder (how we finish)

Do not add more studios. Climb this path:

| Step | What “done” means |
| --- | --- |
| **7** Make the data real | `DATABASE_URL` → Postgres is source of truth (JSON is the adapter when unset) |
| **7.5** Run when nobody is online | Event bus + BullMQ/`/api/autonomy/tick` workers, heartbeat, dead letters |
| **8** Give Atlas its brain | Live LLM + tools when `ATLAS_LLM_API_KEY` is set |
| **8.5** Interact with the outside world | Twilio, calendar OAuth, Stripe — live when credentials exist |
| **9** Controlled authority | Autonomy levels 1–4, spending limits, human-only approval of restricted work |
| **9.5** Failures recoverable and observable | Retries with backoff, DLQ, backups + restore tests, `/api/health`, Sentry |
| **10** Safe enough to trust with a real company | Tenant isolation, plan enforcement, privacy export/delete, audit, **autonomy safety tests** |

Step 10 proofs live in `tests/safety.test.ts` and `docs/PRODUCTION_SAFETY.md`.

## How to work going forward

| Do | Don’t |
| --- | --- |
| Deepen receptionist + Brain + DB | Add new `/app/*` marketing studios |
| Make one command create a real side effect | Add more keyword replies that pretend side effects |
| Instrument approvals + audit | Silent autonomous money or filing |
| Charge for the beachhead | Build Tax Pro before Twilio books a job |

## Demo modes

- **Simulation** (default): no LLM key → keyword Brain + file DB
- **Live Brain**: `ATLAS_LLM_API_KEY` set → real model + tools, still file DB until Phase 1
- **Commercial**: Supabase URL + Twilio + Stripe + LLM → the product above
