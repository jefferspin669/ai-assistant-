-- Atlas commercial core (Supabase / Postgres)
-- Phase 1 replaces `.data/*.json` for beachhead domains.
-- Apply with: supabase db push  OR  psql $DATABASE_URL -f supabase/schema.sql

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  business_type text not null default 'service',
  timezone text not null default 'America/Phoenix',
  dna jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'employee', 'viewer')),
  status text not null default 'active',
  unique (organization_id, user_id)
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  channel text not null check (channel in ('app', 'sms', 'voice', 'email')),
  customer_id uuid references customers(id) on delete set null,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  tool_name text,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled',
  source text not null default 'atlas',
  external_calendar_id text,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  amount_cents integer not null,
  status text not null default 'draft',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists action_proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  kind text not null,
  title text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'cancelled', 'executed', 'failed')),
  requested_by text not null default 'Atlas',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Domain events (src/backend/events) are file-backed today: .data/atlas-events.json
-- Promote this table in Phase 3 when the bus dual-writes to Postgres.
-- create table if not exists domain_events (
--   id uuid primary key default gen_random_uuid(),
--   organization_id uuid not null references organizations(id) on delete cascade,
--   type text not null,
--   payload jsonb not null default '{}'::jsonb,
--   actor_id text,
--   created_at timestamptz not null default now()
-- );

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor text not null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists standing_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  order_text text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists calendar_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider text not null check (provider in ('google', 'microsoft')),
  account_email text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table if not exists missed_calls (
  id text primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  from_phone text not null,
  to_phone text,
  status text not null default 'received',
  sms_sid text,
  lead_name text,
  notes text,
  received_at timestamptz not null default now()
);

create table if not exists stripe_customers (
  organization_id uuid primary key references organizations(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text,
  plan text not null default 'business',
  status text not null default 'trialing',
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_org on customers(organization_id);
create index if not exists idx_appointments_org_start on appointments(organization_id, starts_at);
create index if not exists idx_action_proposals_org_status on action_proposals(organization_id, status);
create index if not exists idx_audit_org_created on audit_events(organization_id, created_at desc);
create index if not exists idx_missed_calls_org on missed_calls(organization_id, received_at desc);
