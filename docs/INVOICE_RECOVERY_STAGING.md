# Invoice recovery staging beachhead

Aspirational autonomy (full Brain self-learning, real bank imports, tax-law updates, undo history, customer automation builder, multi-worker overnight ops) is **not done**. This document freezes new feature pages until the overdue-invoice chase runs successfully overnight on one staging stack.

## Staging topology (one scheduler)

```bash
docker compose up -d postgres redis scheduler
export DATABASE_URL=postgres://atlas:atlas@127.0.0.1:5432/atlas
export REDIS_URL=redis://127.0.0.1:6379
export ATLAS_ENV=staging
export ATLAS_SCHEDULER_ID=primary
npm run db:migrate
npm run worker &          # BullMQ consumer — optional when REDIS_URL set
npm run dev               # API + Approvals + webhooks
```

- **Postgres** — source of truth (`DATABASE_URL`)
- **Redis** — BullMQ `atlas-jobs` + session cache
- **One scheduler** — `docker compose` service `scheduler` (or cron → `POST /api/autonomy/tick` with `Authorization: Bearer $CRON_SECRET`)
- Do **not** run multiple schedulers/workers until atomic claim + idempotency tests stay green under contention

Prove rails: `npm run drill:trust` and `npm run smoke:staging` (app must be running).

## Workflow under test

1. Atlas detects overdue invoice (`invoice.overdue` → orchestrator `recover_invoice`, or `POST /api/orchestrator`)
2. Drafts chase SMS from org customer + ledger data
3. Owner approves in `/app/approvals`
4. Provider delivers (Twilio live or simulation)
5. Delivery status webhook `POST /api/webhooks/twilio/sms/status` confirms
6. Audit log + activity notification update

Tests: `tests/invoice-recovery-staging.test.ts`, browser: `e2e/invoice-recovery.spec.ts`.

## Safety cases required before multi-worker

| Case | Expected |
| --- | --- |
| Two isolated businesses | No cross-tenant customers, runs, or SMS |
| Provider failure | Job retries with backoff; dead-letters after max attempts |
| Duplicate webhook | `409` / `{ duplicate: true }` — no second audit delivery |
| Revoked employee access | Session rejects (`No active organization membership`) |
| Emergency pause (kill switch) | Queue drains skip; orchestrator stays blocked |

## Feature freeze

Until overnight staging succeeds:

- Do **not** add new `/app/*` studios
- Demo surfaces for this workflow redirect: `/app/workflows` → autonomous, `/app/actions` → approvals, `/app/finance` → money
- Prefer deepening claim/idempotency, Twilio status, Approvals, and audit over new marketing UI

Overnight success means: scheduler ticks for ≥8 hours with zero duplicate customer SMS, DLQ empty or reviewed, and at least one full chase→approve→deliver→webhook path in the staging audit log.
