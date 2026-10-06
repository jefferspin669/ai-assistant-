# Automation update — October 4

## Implemented

- Automatic task creation and manual task approval with project/assignee validation.
- PostgreSQL task worker claims queued rows with `FOR UPDATE SKIP LOCKED`; the task, job outcome, audit event, and failure notification are in the same transaction. A database exception rolls back the transaction and leaves the job queued. Task IDs derive from job IDs, adding duplicate protection on retries.
- Send `payload.idempotencyKey` with an automatic task intent to reuse the same job ID on repeated submission. Scope includes business and action kind. Use a new key for a new intended action.
- Snapshot persistence inserts jobs without overwriting existing worker state.
- Redis SMS/email reservations use atomic `SET NX`; outreach counters use one Lua operation. Ambiguous sends remain reserved and require owner review rather than an automatic resend. Provider acceptance does not prove customer delivery.
- Message workers reject simulation, missing contacts, provider failures, paused automation, and unsupported job kinds. PostgreSQL worker results update the job row directly.
- Background outreach reads current PostgreSQL policy and plan, including persisted action toggles.
- Receptionist replies capture proposed appointment times for review; no automatic “tomorrow at 9” booking or unsupported voice booking promise.
- Invoice orchestration stops while customer messaging is queued/unverified.
- Staging smoke fails when the running app reports unhealthy database/Redis or a mismatched driver.

## Deployment

1. Run `npm run db:migrate` with the staging database. Migration `0008_autonomy_policy_controls.sql` persists autonomy modes and category switches (after main’s `0007_autonomy_active_window.sql`). Existing policies with no stored switches have all categories disabled on upgrade; the owner must review and enable them explicitly.
2. Configure PostgreSQL, Redis, live test messaging credentials, the background worker, and `CRON_SECRET`. The scheduled `/api/autonomy/tick` calls the PostgreSQL task worker.
3. Run `npm run smoke:staging` against the running app.
4. Set `ATLAS_QUEUE_TEST_DATABASE_URL` to a disposable PostgreSQL test database and run `npm run test:queue:live`. This drill creates and removes only its own randomly named test schema. It checks two concurrent workers, transactional rollback/retry, an assignee from another business, and emergency pause.

## Verification limits

Local tests cover automatic task creation, stable action keys, approval, revoked roles, tenant assignment, Redis atomic-command contracts, provider failures, and existing owner/worker security paths. The live PostgreSQL drill is included but has not been run in this workspace because no test database is configured. No real SMS/email was sent.

This does not complete provider delivery callbacks, the overnight invoice-recovery workflow, or general-purpose autonomous payments/scheduling. Generic jobs still use BullMQ; only task creation has the new transactional database executor. A failed or uncertain message should be reviewed before a fresh send is authorized. Broader process-snapshot persistence and file-backed orchestrator state still need a separate multi-instance reliability pass before unattended production use.
