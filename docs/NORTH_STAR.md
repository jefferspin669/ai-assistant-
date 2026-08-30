# Atlas North Star — Stop simulating. Ship the product.

## Honest status (today)

Atlas looks like an AI Operating System. Underneath, most “intelligence” is still:

- Keyword / rule replies in `src/lib/commands.ts` (`runOwnerCommand`)
- File-backed JSON under `.data/` (and browser `localStorage` for some client paths)
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

## Backend kernel (modular, not one file)

Preferred long-term stack is NestJS + Postgres + Redis/BullMQ. **This repo keeps Next.js as the API** until the five cores are real; Nest would extract `src/backend/**`, not a parallel product.

See [`docs/ARCHITECTURE.md`](ARCHITECTURE.md): Brain pipeline, automation engine, job queue contract, permission/approval table, audit lines. Do not call OpenAI from the React client.

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
