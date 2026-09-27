import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { backupJsonDatabase } from "../src/lib/ops/backup";

/**
 * Local backup helper. Production hosts should snapshot Postgres (Supabase PITR / pg_dump)
 * rather than relying on this script. Restore JSON with `npm run db:restore -- <file>`.
 */
async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const destDir = resolve(process.cwd(), ".data", "backups");
    mkdirSync(destDir, { recursive: true });
    const file = resolve(destDir, `atlas-${stamp}.sql`);
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync("pg_dump", [url, "-f", file], { encoding: "utf8" });
    if (result.status !== 0) {
      console.error(result.stderr || "pg_dump failed");
      process.exit(result.status || 1);
    }
    console.log("[atlas:backup] postgres dump", file);
    return;
  }

  const dest = backupJsonDatabase();
  console.log("[atlas:backup] copied", dest);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
