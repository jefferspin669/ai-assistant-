/** Which adapter owns Atlas business state on the server. */

import { isProduction } from "@/lib/ops/environment";

export type DatabaseDriver = "json" | "postgres";

export function postgresLive(): boolean {
  return typeof window === "undefined" && Boolean(process.env.DATABASE_URL?.trim());
}

/**
 * JSON file mirror is for local demos/tests only.
 * Production never writes or falls back to `.data/*.json`.
 */
export function jsonMirrorEnabled(): boolean {
  if (typeof window !== "undefined") return false;
  if (isProduction()) return false;
  return !postgresLive() || process.env.ATLAS_KEEP_JSON_MIRROR === "1";
}

export function databaseDriver(): DatabaseDriver {
  return postgresLive() ? "postgres" : "json";
}

/** Production refuses to boot without PostgreSQL — no silent file fallback. */
export function assertProductionPersistence(): void {
  if (typeof window !== "undefined") return;
  if (!isProduction()) return;
  if (!postgresLive()) {
    throw new Error(
      "DATABASE_URL is required when ATLAS_ENV/NODE_ENV is production. File JSON fallback is disabled.",
    );
  }
}

export function fileFallbackAllowed(): boolean {
  if (typeof window !== "undefined") return true;
  return !isProduction();
}
