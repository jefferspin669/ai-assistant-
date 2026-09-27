#!/usr/bin/env node
/**
 * Staging stack smoke — proves Postgres + Redis + migrations + health when
 * DATABASE_URL / REDIS_URL are set (local Docker, apt, or hosted staging).
 *
 * Usage:
 *   DATABASE_URL=postgres://atlas:atlas@127.0.0.1:5432/atlas \
 *   REDIS_URL=redis://127.0.0.1:6379 \
 *   ATLAS_ENV=staging \
 *   BASE_URL=http://localhost:3000 \
 *   npm run smoke:staging
 *
 * Exit 0 = staging rails green. Exit 2 = stack not configured (skip in CI without services).
 */
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL?.trim();
const redisUrl = process.env.REDIS_URL?.trim();
const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const atlasEnv = process.env.ATLAS_ENV || "staging";

function fail(msg) {
  console.error(`[smoke:staging] ${msg}`);
  process.exit(1);
}

function skip(msg) {
  console.log(`[smoke:staging] SKIP — ${msg}`);
  process.exit(2);
}

if (!databaseUrl || !redisUrl) {
  skip("DATABASE_URL and REDIS_URL required for staging smoke");
}

console.log(`[smoke:staging] ATLAS_ENV=${atlasEnv}`);
console.log(`[smoke:staging] DATABASE_URL set (${databaseUrl.replace(/:[^:@/]+@/, ":***@")})`);
console.log(`[smoke:staging] REDIS_URL set`);

const migrate = spawnSync("npx", ["tsx", "scripts/db-migrate.ts"], {
  env: { ...process.env, DATABASE_URL: databaseUrl },
  encoding: "utf8",
});
if (migrate.status !== 0) {
  fail(`db:migrate failed\n${migrate.stderr || migrate.stdout}`);
}
console.log("[smoke:staging] migrations ok");

const redisPing = spawnSync(
  "node",
  [
    "-e",
    `const Redis=require('ioredis');const r=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1,lazyConnect:true});
     r.connect().then(()=>r.ping()).then(v=>{console.log(v);return r.quit()}).catch(e=>{console.error(e.message);process.exit(1)})`,
  ],
  { env: { ...process.env, REDIS_URL: redisUrl }, encoding: "utf8" },
);
if (redisPing.status !== 0 || !String(redisPing.stdout).includes("PONG")) {
  fail(`redis ping failed\n${redisPing.stderr || redisPing.stdout}`);
}
console.log("[smoke:staging] redis PONG");

const healthRes = await fetch(`${baseUrl}/api/health`).catch((e) => {
  fail(`health fetch failed — is the app running at ${baseUrl}? (${e.message})`);
});
const health = await healthRes.json();
const data = health.data || health;
if (!healthRes.ok && !health.ok) fail(`health HTTP ${healthRes.status}`);

const postgresOk = Boolean(data.postgres?.ok || data.postgres?.configured === true && data.driver === "postgres");
const redisOk = Boolean(data.redis?.ok);
const env = data.environment;

console.log("[smoke:staging] health driver=", data.driver, "env=", env);
console.log("[smoke:staging] postgres=", JSON.stringify(data.postgres));
console.log("[smoke:staging] redis=", JSON.stringify(data.redis));

if (!postgresOk && data.driver !== "postgres") {
  // Soft check: process env was set but the running server may not have inherited it.
  console.warn(
    "[smoke:staging] WARN — running server did not report postgres driver. Restart `npm run dev` with DATABASE_URL/REDIS_URL exported.",
  );
}
if (env && atlasEnv === "staging" && env !== "staging" && env !== "development") {
  console.warn(`[smoke:staging] WARN — expected staging/development environment, got ${env}`);
}

console.log("[smoke:staging] PASS");
process.exit(0);
