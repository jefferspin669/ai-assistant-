-- Workspace domain bags (projects, settings, tasks cache, …) for Postgres mirror.

CREATE TABLE IF NOT EXISTS workspace_domains (
  organization_id text NOT NULL,
  domain text NOT NULL,
  data jsonb,
  updated_at text NOT NULL,
  PRIMARY KEY (organization_id, domain)
);

CREATE UNIQUE INDEX IF NOT EXISTS workspace_domains_org_domain
  ON workspace_domains (organization_id, domain);
