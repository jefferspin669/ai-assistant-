-- Unified business memory metadata (org-scoped, permission-aware).

ALTER TABLE memories ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS memory_type text NOT NULL DEFAULT 'operational';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'system';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS author_label text NOT NULL DEFAULT 'Atlas';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS confidence integer NOT NULL DEFAULT 80;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS access_level text NOT NULL DEFAULT 'all_staff';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS entity_id text;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS updated_at text;

CREATE INDEX IF NOT EXISTS memories_org_idx ON memories (organization_id);
CREATE INDEX IF NOT EXISTS memories_access_idx ON memories (access_level);

CREATE TABLE IF NOT EXISTS memory_outcomes (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  memory_id text,
  recommendation text NOT NULL,
  status text NOT NULL,
  original text NOT NULL DEFAULT '',
  edited text,
  actor_user_id text NOT NULL,
  created_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS memory_outcomes_org_idx ON memory_outcomes (organization_id);
