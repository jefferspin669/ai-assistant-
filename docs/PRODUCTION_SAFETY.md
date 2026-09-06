# Production safety — trust Atlas with a real company

This is step **10** on the north-star ladder (`docs/NORTH_STAR.md`). It is not a new `/app/*` page. Rails live on existing APIs, workers, and `tests/safety.test.ts`.

## Autonomy safety (must stay green)

Before Atlas executes a real-world action, tests prove:

- Atlas cannot spend above the owner's automatic-payment limit
- Atlas cannot approve its own restricted action
- Atlas cannot access another company's data
- Atlas cannot fire an employee automatically
- Atlas cannot transfer money without the required approval
- Atlas cannot keep retrying a failed payment forever (max 3 → dead letter)
- Atlas cannot text the same customer 50 times after a worker crash (3/day fingerprint)
- Atlas records who/what caused every important action (`audit_logs.actor_label`)

## Rate limiting and abuse protection

In-memory buckets in `src/lib/auth/rate-limit.ts` (per instance). Keys:

- Auth login / register / forgot
- SMS, invoices, chat, autonomy work
- Billing checkout / portal, privacy export/delete, integrations

Login lockout: 5 failures / 15 minutes (`src/lib/auth/session.ts`).

## Encrypted secrets and credential rotation

- Never put secrets on `NEXT_PUBLIC_*` (`src/lib/secrets/redact.ts`, `/api/health` → `secrets`)
- Calendar OAuth tokens are AES-256-GCM encrypted at rest when `ATLAS_SECRETS_KEY` (or `ATLAS_APP_PASSWORD`, 16+ chars) is set (`src/lib/secrets/vault.ts`)
- Rotate: change the key, then `POST /api/integrations` `{ "action": "reconnect", "provider": "google-calendar" }` and complete OAuth again. `{ "action": "refresh" }` renews access tokens from the refresh token.

Host secrets in Vercel / Fly / AWS Secrets Manager. Do not commit `.env.local`.

## Database backups and restore testing

```
npm run db:backup    # JSON snapshot, or pg_dump when DATABASE_URL is set
npm run db:restore -- .data/backups/atlas-db-<stamp>.json
```

CI / unit tests restore a JSON snapshot in `tests/safety.test.ts`. Production: Supabase PITR + nightly `pg_dump` to object storage. After restore, run `GET /api/health` and `npm test`.

## Environments

| Name | How | Data |
| --- | --- | --- |
| development | `npm run dev` (JSON) or Docker Postgres/Redis | Seed / local |
| staging | `ATLAS_ENV=staging` + staging `DATABASE_URL` / `REDIS_URL` / Stripe test keys | Isolated DB |
| production | `ATLAS_ENV=production` + live credentials | Never share staging DB |

Health reports `environment` from `ATLAS_ENV` / `VERCEL_ENV`.

## CI/CD and rollback

`.github/workflows/atlas-ci.yml` on every PR: `tsc`, `npm test`, `npm audit` (critical).

Ship by merging to `main` and promoting the host deployment (Vercel production, or your Docker image). GitHub Pages (`nextjs.yml`) is the **static marketing export**, not the live API.

Rollback if a release breaks something:

1. Host dashboard → previous production deployment → Promote
2. Or `git revert <sha>` on `main` and re-run CI
3. If data is wrong: restore the last known-good backup (`pg_dump` / `npm run db:restore`), then replay the worker dead-letter queue after fixing the bug

Do not “fix forward” on a money or privacy incident without a backup first.

## Uptime monitoring and alerts

- Liveness: `GET /api/health` (postgres, redis, queue, **worker heartbeat**, dead-letter count, secret leak scan)
- Errors: `SENTRY_DSN`
- Cron: Vercel cron → `GET /api/autonomy/tick` (see `vercel.json`)
- Alert when `worker.stale === true` or `deadLetters` grows

## Disaster recovery

1. Confirm blast radius from `/api/health` + `/api/admin/support` (owner session, **this org only**)
2. Flip autonomy kill switch (`PUT /api/autonomy` `{ "killSwitch": true }`)
3. Restore DB from the last good backup; Redis can be flushed (sessions re-login, job fingerprints rebuild)
4. Restart `npm run worker`
5. Reconnect integrations if tokens fail (`POST /api/integrations` `{ "action": "reconnect" }`)
6. Write the incident to audit (privacy/support actions already do)

RPO: last backup (target daily + PITR). RTO: restore + worker restart.

## Stripe, plans, seats

Checkout metadata and `client_reference_id` are the **organization id**. Webhooks activate **that org’s** subscription only — they never steal another org’s row.

Plans (`src/lib/billing/entitlements.ts`):

| Plan | Max autonomy | Seat cap |
| --- | --- | --- |
| free | 1 | 1 |
| pro | 2 | 5 |
| business / enterprise | 4 | 25 / 500 |

Invites return 402 when the seat cap is full.

## Privacy, recovery, support

- Export: `GET /api/privacy`
- Delete operational data: `DELETE /api/privacy` (owner)
- Account recovery: `POST /api/auth/forgot` + `POST /api/auth/reset` (one-time token)
- Support: `GET /api/admin/support` — owner/admin, scoped to the session org

## Workers

- BullMQ: 3 attempts, exponential backoff 2s
- Exhausted payments → `.data/dead-letters.json` + audit `worker:dead_letter:*`
- Heartbeat every 30s (`src/lib/queue/heartbeat.ts`)
- Customer SMS/email: 3 per org+kind+number per UTC day
