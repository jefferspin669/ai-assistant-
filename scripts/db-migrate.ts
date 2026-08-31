import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.log("[atlas:db] DATABASE_URL unset — skip migrate");
    process.exit(0);
  }
  const dir = resolve(process.cwd(), "drizzle");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const client = postgres(url, { max: 1 });
  try {
    for (const name of files) {
      const sql = readFileSync(resolve(dir, name), "utf8");
      await client.unsafe(sql);
      console.log(`[atlas:db] applied drizzle/${name}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
