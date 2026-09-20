-- Projects + task assignment columns (workers may only update assigned tasks).

CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_by text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS projects_org_idx ON projects (org_id);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS customer_id text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notify_on_complete boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks (assignee_id);
CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks (project_id);
