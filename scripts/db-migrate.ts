import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.log("[atlas:db] DATABASE_URL unset — skip migrate");
    process.exit(0);
  }
  const file = resolve(process.cwd(), "drizzle/0000_init.sql");
  const sql = readFileSync(file, "utf8");
  const client = postgres(url, { max: 1 });
  try {
    await client.unsafe(sql);
    console.log("[atlas:db] applied drizzle/0000_init.sql");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
