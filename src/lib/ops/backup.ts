import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { applyServerDatabase, loadDatabase } from "@/lib/db/store";
import type { AtlasDatabase } from "@/lib/db/schema";
import { dataDir, ensureDataDir } from "@/lib/db/file-persist";

export function backupDir() {
  const dir = resolve(dataDir(), "backups");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function stampName() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

/** Snapshot the live in-memory database into `.data/backups` (authoritative). */
export function backupJsonDatabase(): string {
  ensureDataDir();
  const dest = resolve(backupDir(), `atlas-db-${stampName()}.json`);
  writeFileSync(dest, JSON.stringify(loadDatabase(), null, 2), "utf8");
  // Keep the on-disk adapter in sync when file fallback is active.
  const live = resolve(dataDir(), "atlas-db.json");
  writeFileSync(live, JSON.stringify(loadDatabase(), null, 2), "utf8");
  return dest;
}

export function restoreJsonDatabase(file: string): AtlasDatabase {
  const raw = readFileSync(file, "utf8");
  const parsed = JSON.parse(raw) as AtlasDatabase;
  if (!parsed?.organizations || !Array.isArray(parsed.organizations)) {
    throw new Error(`Not an Atlas database backup: ${basename(file)}`);
  }
  applyServerDatabase(parsed);
  return loadDatabase();
}

export function listJsonBackups() {
  if (!existsSync(backupDir())) return [];
  return readdirSync(backupDir())
    .filter((name) => name.endsWith(".json"))
    .map((name) => resolve(backupDir(), name));
}
