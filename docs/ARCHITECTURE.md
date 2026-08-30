# Atlas backend architecture

React never talks to the model. Every AI request goes through Atlas Brain on the server.

```
React / TypeScript
       ↓
Next.js route handlers  (NestJS extract later if the API splits out)
       ↓
src/backend/**  — modular kernel, not one giant file
       ↓
 PostgreSQL / Supabase          Redis / BullMQ (Phase 3)
 .data/*.json until then        file jobs until then
       ↓
 Stripe · Twilio · Calendar · Email · OpenAI
```

## Why not NestJS in this repo yet

The product already has a TypeScript Next.js App Router API (`src/app/api/**`). A second HTTP server would split sessions, env, and deploys before the five cores are real.

`src/backend/**` is the module boundary. Nest can later wrap the same packages. Do not call OpenAI from the React client.

## Five cores (build these, in this order)

| # | Core | Lives in | Today |
| --- | --- | --- | --- |
| 1 | **Atlas Brain** | `src/backend/ai/pipeline.ts` | `POST /api/ai/chat` → `runBrainPipeline` → `runAtlasBrain`. Steps: load context → intent → tools → permission → execute → store result. |
| 2 | **Automation engine** | `src/backend/automation/engine.ts` | Domain event → conditions → `addJob`. First rule: `appointment.cancelled` within 72h → `waitlist-contact`. |
| 3 | **Job queue** | `src/backend/jobs/queue.ts` | `addJob(ctx, name, payload)` — file-backed (`enqueueJob` / `processJobs`). Swap the body to BullMQ when Redis is wired. |
| 4 | **Permission / approval** | `src/backend/permissions/` | Risk table: send email / book appointment automatic; refund ≤ $100 automatic; vendor pay / bank transfer / termination always ask. |
| 5 | **Audit log** | `src/backend/audit/` + `src/lib/services/audit.ts` | Owner-readable lines (“08:16 Atlas Created customer: John Smith.”). |

## Event bus

`src/backend/events` persists to `.data/atlas-events.json` (not Postgres yet). Types include:

`customer.created`, `customer.missed_call`, `appointment.created`, `appointment.cancelled`, `invoice.overdue`, `payment.received`, `lead.created`, `employee.clocked_in`, `employee.late`, `inventory.low`, `review.received`, `brain.completed`.

Workspace writes and Twilio missed-call recovery emit. Handlers enqueue jobs even if nobody has the site open — as soon as a worker / cron drains the queue (`POST /api/jobs/run` or `drainQueue()`).

## Permission table (owner-tunable later)

```
action                 limit     mode
send_email             —         automatic
send_message           —         automatic
book_appointment       —         automatic
discount               10%       automatic
refund                 $100      automatic
vendor_payment         $1,000    approval
employee_termination   —         approval
bank_transfer          $500      approval
file_taxes             —         approval
sign_contract          —         approval
```

`$85` refund → `AUTO_ALLOWED`. `$1,800` refund → `OWNER_APPROVAL_REQUIRED`. Unknown actions default to approval.

## Phases (do not build all of this at once)

1. **Real data** — Supabase/Postgres → auth → orgs → customers → employees → appointments → tasks
2. **Brain** — this pipeline, chat, memory, tool calling (partially live)
3. **24/7 jobs** — Redis + BullMQ + workers + scheduled jobs + this event bus on Postgres
4. **Authority** — this permission table on Postgres + approvals UI + audit
5. **Outside world** — Twilio, Stripe, Google/Microsoft calendar, email (commercial stubs exist)
6. **Autopilot** — full automation builder + autonomous agents

## Target module map (Nest extract)

When the API leaves Next.js, keep these packages:

```
backend/
├── auth/  organizations/  users/  employees/  customers/
├── calendar/  tasks/  invoices/  payments/  finance/
├── receptionist/  notifications/  integrations/
├── ai/ { brain, memory, agents, tools }
├── automation/ { triggers, workflows, scheduler, workers }
├── permissions/  approvals/  audit/  analytics/
```

Today the five cores above are real TypeScript modules. The rest still live under `src/lib/services` and `src/app/api`. Do not duplicate them — move them.

## Operator endpoints

- `GET /api/health` — includes `kernel.queue`, `kernel.brain`, `kernel.events`
- `GET /api/backend/status` — phases, modules, policies, recent events, activity, queued jobs
- `POST /api/ai/chat` — Brain only (never a client OpenAI key)

## Not yet

- NestJS as a second HTTP server
- Kubernetes / Kafka
- Calling the model from the React frontend
