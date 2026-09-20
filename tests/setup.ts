/**
 * Default unit tests use the JSON adapter. Live Postgres/Redis drills set
 * ATLAS_TEST_LIVE_DB=1 (or run scripts/staging-smoke.mjs / drill:trust separately).
 */
if (process.env.ATLAS_TEST_LIVE_DB !== "1") {
  delete process.env.DATABASE_URL;
  delete process.env.REDIS_URL;
}
if (!process.env.ATLAS_ENV) {
  process.env.ATLAS_ENV = "development";
}
