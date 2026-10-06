-- projects.version was declared in drizzle-schema / postgres hydrate but omitted from 0005.
-- Without this column, Postgres hydrate fails closed on SELECT ... version FROM projects.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
