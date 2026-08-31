-- Auth + remaining AtlasDatabase tables so Postgres can be the source of truth.

CREATE TABLE IF NOT EXISTS user_credentials (
  user_id text PRIMARY KEY,
  password_hash text NOT NULL,
  mfa_secret text,
  mfa_enabled boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  token text NOT NULL,
  user_id text NOT NULL,
  organization_id text NOT NULL,
  created_at text NOT NULL,
  expires_at text NOT NULL,
  revoked_at text,
  device_name text NOT NULL DEFAULT 'web'
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token ON sessions (token);

CREATE TABLE IF NOT EXISTS calendar_categories (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  organization_id text NOT NULL,
  name text NOT NULL,
  color text NOT NULL,
  icon text NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  preview text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at text NOT NULL,
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS memories (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  org_id text NOT NULL,
  title text NOT NULL,
  kind text NOT NULL,
  content text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes integer,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  plan text NOT NULL,
  status text NOT NULL,
  renews_at text NOT NULL,
  seats integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS automations (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  trigger text NOT NULL,
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS autonomy_policies (
  organization_id text PRIMARY KEY,
  level integer NOT NULL DEFAULT 1,
  kill_switch boolean NOT NULL DEFAULT false,
  auto_payment_limit_cents integer NOT NULL,
  refund_limit_cents integer NOT NULL,
  discount_cap_percent integer NOT NULL,
  marketing_budget_cents integer NOT NULL,
  earliest_schedule_hour integer NOT NULL,
  wake_only_emergencies boolean NOT NULL DEFAULT true,
  standing_orders jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at text NOT NULL
);
