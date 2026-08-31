/** Which adapter owns Atlas business state on the server. */

export type DatabaseDriver = "json" | "postgres";

export function postgresLive(): boolean {
  return typeof window === "undefined" && Boolean(process.env.DATABASE_URL?.trim());
}

export function jsonMirrorEnabled(): boolean {
  return !postgresLive() || process.env.ATLAS_KEEP_JSON_MIRROR === "1";
}

export function databaseDriver(): DatabaseDriver {
  return postgresLive() ? "postgres" : "json";
}
