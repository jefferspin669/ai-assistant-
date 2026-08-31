import { restoreJsonDatabase } from "../src/lib/ops/backup";

/**
 * Restore a JSON backup taken by `npm run db:backup`.
 * Postgres: use `psql "$DATABASE_URL" < .data/backups/atlas-....sql` instead.
 */
async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: npm run db:restore -- .data/backups/atlas-db-<stamp>.json");
    process.exit(1);
  }
  const db = restoreJsonDatabase(file);
  console.log("[atlas:restore] organizations", db.organizations.length, "customers", db.customers.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
