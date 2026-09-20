#!/usr/bin/env node
/**
 * CI gate: validate drizzle SQL migrations are present and syntactically loadable.
 * When DATABASE_URL is set, applies them. Otherwise checks files exist and are non-empty.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "drizzle");
const files = readdirSync(dir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (!files.length) {
  console.error("[atlas:migrate-check] no drizzle/*.sql migrations found");
  process.exit(1);
}

const required = [
  "0000_init.sql",
  "0001_auth_and_remainder.sql",
  "0002_projects_and_assignees.sql",
  "0003_unified_memory.sql",
  "0004_workspace_domains.sql",
];
for (const name of required) {
  if (!files.includes(name)) {
    console.error(`[atlas:migrate-check] missing required migration ${name}`);
    process.exit(1);
  }
  const sql = readFileSync(resolve(dir, name), "utf8");
  if (!sql.trim()) {
    console.error(`[atlas:migrate-check] empty migration ${name}`);
    process.exit(1);
  }
  console.log(`[atlas:migrate-check] ok ${name} (${sql.length} bytes)`);
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.log("[atlas:migrate-check] DATABASE_URL unset — file gate only (pass)");
  process.exit(0);
}

const { default: postgres } = await import("postgres");
const client = postgres(url, { max: 1 });
try {
  for (const name of files) {
    const sql = readFileSync(resolve(dir, name), "utf8");
    await client.unsafe(sql);
    console.log(`[atlas:migrate-check] applied ${name}`);
  }
} finally {
  await client.end();
}
