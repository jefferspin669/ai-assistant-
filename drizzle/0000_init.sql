-- Atlas Backend V1 — Drizzle dual-write schema (text PKs match .data/atlas-db.json).
-- Apply: npm run db:migrate   (requires DATABASE_URL)
-- Hosted: point DATABASE_URL at Supabase Postgres, then run the same migration.

CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  business_name text NOT NULL,
  logo_url text,
  business_type text NOT NULL DEFAULT 'service',
  tax_structure text NOT NULL DEFAULT 'LLC',
  state text NOT NULL DEFAULT 'TX',
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL,
  profile_image text,
  timezone text NOT NULL DEFAULT 'America/Chicago',
  preferred_language text NOT NULL DEFAULT 'en',
  email_verified_at text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS organization_members (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  user_id text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  joined_at text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_members_org_user
  ON organization_members (organization_id, user_id);

CREATE TABLE IF NOT EXISTS customers (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'lead',
  created_at text NOT NULL,
  provenance text NOT NULL DEFAULT 'LIVE'
);

CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  user_id text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'normal',
  due_date text,
  category text NOT NULL DEFAULT 'general',
  notes text NOT NULL DEFAULT '',
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  organization_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  start_time text NOT NULL,
  end_time text NOT NULL,
  timezone text NOT NULL,
  category_id text NOT NULL DEFAULT 'work',
  location text NOT NULL DEFAULT '',
  assignee text,
  priority text NOT NULL DEFAULT 'normal',
  reminder_time text,
  recurring_rule text,
  external_calendar_id text,
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  user_id text NOT NULL,
  kind text NOT NULL,
  label text NOT NULL,
  amount integer NOT NULL,
  category text,
  date text NOT NULL,
  receipt_name text,
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  requested_by text NOT NULL,
  action_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at text NOT NULL,
  resolved_at text
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  actor_user_id text NOT NULL,
  actor_label text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  created_at text NOT NULL,
  run_at text
);

CREATE TABLE IF NOT EXISTS agents (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS domain_events (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL,
  actor_id text,
  actor_label text,
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  organization_id text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS quotes (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  customer_id text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at text NOT NULL
);
