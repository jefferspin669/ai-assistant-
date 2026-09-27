-- Row-level Postgres authority for operational data.
--
-- 1. `version` columns give optimistic concurrency (compare-and-set) on the rows
--    two people realistically edit at the same time: tasks, customers, workspace
--    domains, and jobs. Integer versions are used instead of `updated_at` because
--    every timestamp in this schema is stored as ISO `text` with millisecond
--    resolution, so two writes inside the same millisecond would compare equal.
-- 2. Durable job columns turn `jobs` into a claimable queue that survives restarts
--    (attempt counts, visibility timeout, dead-letter).
-- 3. Indexes back the keyset/offset pagination added to the list endpoints.
--
-- Safe to run on fresh and existing installs (IF NOT EXISTS everywhere).

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at text;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS updated_at text;
ALTER TABLE workspace_domains ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- Durable background jobs -----------------------------------------------------

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS lane text NOT NULL DEFAULT 'default';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 5;
-- Lexicographic ordering of ISO-8601 UTC strings matches chronological ordering,
-- so text columns are safe for the "is this job due yet?" comparison.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS visible_at text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS claimed_at text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS claimed_by text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS dead_lettered_at text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

UPDATE jobs SET visible_at = COALESCE(visible_at, run_at, created_at) WHERE visible_at IS NULL;
UPDATE jobs SET updated_at = COALESCE(updated_at, created_at) WHERE updated_at IS NULL;

-- Claim scan: "queued or lease-expired, due now, not dead".
CREATE INDEX IF NOT EXISTS jobs_claim_scan ON jobs (status, visible_at);
CREATE INDEX IF NOT EXISTS jobs_org_created ON jobs (organization_id, created_at DESC);

-- One row per (org, idempotency key) so a retried enqueue cannot double-run work.
CREATE UNIQUE INDEX IF NOT EXISTS jobs_org_idempotency
  ON jobs (organization_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS job_dead_letters (
  id text PRIMARY KEY,
  job_id text NOT NULL,
  organization_id text NOT NULL,
  kind text NOT NULL,
  lane text NOT NULL DEFAULT 'default',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  created_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS job_dead_letters_org_created
  ON job_dead_letters (organization_id, created_at DESC);

-- Pagination indexes ----------------------------------------------------------

CREATE INDEX IF NOT EXISTS tasks_org_created ON tasks (org_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS customers_org_created ON customers (organization_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS audit_logs_org_created ON audit_logs (organization_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS calendar_events_org_start ON calendar_events (organization_id, start_time DESC, id DESC);
CREATE INDEX IF NOT EXISTS transactions_org_date ON transactions (org_id, date DESC, id DESC);
CREATE INDEX IF NOT EXISTS notifications_org_created ON notifications (organization_id, created_at DESC, id DESC);
