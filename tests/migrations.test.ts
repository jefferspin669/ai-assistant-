import { describe, expect, it } from "vitest";
import {
  MIGRATIONS_TABLE,
  MIGRATIONS_TABLE_SQL,
  nonIdempotentStatements,
  pendingMigrations,
  readMigrationFiles,
} from "../src/lib/db/migrations";

describe("database migrations: fresh and existing installations", () => {
  const files = readMigrationFiles();

  it("ships ordered, uniquely numbered migration files", () => {
    expect(files.length).toBeGreaterThan(0);
    const names = files.map((f) => f.name);
    expect(names).toEqual([...names].sort());
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(name).toMatch(/^\d{4}_[a-z0-9_]+\.sql$/);
    }
  });

  it("keeps every statement safe to re-apply on an existing database", () => {
    for (const file of files) {
      expect(nonIdempotentStatements(file.sql), `non-idempotent SQL in ${file.name}`).toEqual([]);
    }
    expect(nonIdempotentStatements(MIGRATIONS_TABLE_SQL)).toEqual([]);
    expect(MIGRATIONS_TABLE_SQL).toContain(MIGRATIONS_TABLE);
  });

  it("catches non-idempotent SQL so it cannot reach a live database", () => {
    expect(nonIdempotentStatements("CREATE TABLE customers (id text);")).toHaveLength(1);
    expect(nonIdempotentStatements("CREATE UNIQUE INDEX sessions_token ON sessions (token);")).toHaveLength(
      1,
    );
    expect(nonIdempotentStatements("ALTER TABLE tasks ADD COLUMN project_label text;")).toHaveLength(1);
    expect(
      nonIdempotentStatements("-- CREATE TABLE ignored (id text);\nCREATE TABLE IF NOT EXISTS ok (id text);"),
    ).toEqual([]);
  });

  it("applies everything on a fresh install and nothing on a re-run", () => {
    const names = files.map((f) => f.name);
    expect(pendingMigrations(names, [])).toEqual(names);
    expect(pendingMigrations(names, names)).toEqual([]);
  });

  it("applies only new migrations on an existing install", () => {
    const applied = ["0000_init.sql", "0001_auth_and_remainder.sql"];
    const all = [...applied, "0002_workspace_domains.sql", "0003_future.sql"];
    expect(pendingMigrations(all, applied)).toEqual(["0002_workspace_domains.sql", "0003_future.sql"]);
    // Ledger rows for files that no longer exist must not break the run.
    expect(pendingMigrations(["0000_init.sql"], ["0000_init.sql", "9999_removed.sql"])).toEqual([]);
  });
});
