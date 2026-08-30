/**
 * SQL contract for later Drizzle + SQLite, then Postgres.
 * Runtime still uses the JSON adapter in `store.ts` until DATABASE_URL is set.
 * Do not import drizzle-orm here — keep `next build` working without extra native deps.
 */
export const SCHEMA_VERSION = 6;

export const DRIZZLE_TABLES = [
  "users",
  "organizations",
  "organization_members",
  "customers",
  "tasks",
  "calendar_events",
  "sessions",
  "audit_logs",
  "approvals",
  "notifications",
  "integrations",
  "jobs",
  "quotes",
  "webhook_receipts",
] as const;
