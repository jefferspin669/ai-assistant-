import postgres from "postgres";
import {
  MIGRATIONS_TABLE,
  MIGRATIONS_TABLE_SQL,
  pendingMigrations,
  readMigrationFiles,
} from "../src/lib/db/migrations";

/**
 * Applies `drizzle/*.sql` in order and records them in `_atlas_migrations`.
 * Safe on a fresh database and on an existing one (every file is `IF NOT EXISTS`,
 * and databases created before the ledger simply adopt it on the next run).
 */
async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.log("[atlas:db] DATABASE_URL unset — skip migrate");
    process.exit(0);
  }

  const files = readMigrationFiles();
  const client = postgres(url, { max: 1 });
  try {
    await client.unsafe(MIGRATIONS_TABLE_SQL);
    const appliedRows = await client.unsafe<{ name: string }[]>(
      `SELECT name FROM ${MIGRATIONS_TABLE}`,
    );
    const applied = appliedRows.map((row) => row.name);
    const pending = pendingMigrations(
      files.map((file) => file.name),
      applied,
    );

    if (!pending.length) {
      console.log(`[atlas:db] up to date (${applied.length} migration(s) applied)`);
      return;
    }

    for (const name of pending) {
      const file = files.find((item) => item.name === name)!;
      await client.begin(async (tx) => {
        await tx.unsafe(file.sql);
        await tx.unsafe(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1) ON CONFLICT DO NOTHING`, [
          name,
        ]);
      });
      console.log(`[atlas:db] applied drizzle/${name}`);
    }
    console.log(`[atlas:db] migrate complete (${pending.length} new, ${applied.length} existing)`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
