import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Migration ledger shared by `scripts/db-migrate.ts` and `tests/migrations.test.ts`.
 *
 * Rules that keep fresh **and** existing installations working:
 * - every statement is idempotent (`IF NOT EXISTS`), so re-applying a file is safe
 * - applied files are recorded in `_atlas_migrations`, so an existing database
 *   that predates the ledger can adopt it without dropping anything
 */

export const MIGRATIONS_TABLE = "_atlas_migrations";

export const MIGRATIONS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);`;

export type MigrationFile = { name: string; sql: string };

export function migrationsDir(cwd = process.cwd()) {
  return resolve(cwd, "drizzle");
}

export function readMigrationFiles(cwd = process.cwd()): MigrationFile[] {
  const dir = migrationsDir(cwd);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => ({ name, sql: readFileSync(resolve(dir, name), "utf8") }));
}

/** Files that still need to run, in order. Already-applied names are skipped. */
export function pendingMigrations(all: string[], applied: string[]): string[] {
  const done = new Set(applied);
  return [...all].sort().filter((name) => !done.has(name));
}

/**
 * Statements that would fail on an existing installation.
 * Creating a table/index without `IF NOT EXISTS` breaks re-runs and upgrades.
 */
export function nonIdempotentStatements(sql: string): string[] {
  const withoutComments = sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  const offenders: string[] = [];
  const patterns: Array<{ re: RegExp; needs: RegExp }> = [
    { re: /create\s+table\s+(?!if\s+not\s+exists)[^;]*/gi, needs: /if\s+not\s+exists/i },
    {
      re: /create\s+(?:unique\s+)?index\s+(?!if\s+not\s+exists)[^;]*/gi,
      needs: /if\s+not\s+exists/i,
    },
    { re: /alter\s+table\s+[^;]*?add\s+column\s+(?!if\s+not\s+exists)[^;]*/gi, needs: /if\s+not\s+exists/i },
  ];

  for (const { re, needs } of patterns) {
    for (const match of withoutComments.matchAll(re)) {
      const statement = match[0].replace(/\s+/g, " ").trim();
      if (!needs.test(statement)) offenders.push(statement.slice(0, 120));
    }
  }
  return offenders;
}
