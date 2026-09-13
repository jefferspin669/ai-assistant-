import { databaseDriver, postgresLive } from "@/lib/db/driver";
import {
  applyServerDatabase,
  loadDatabase,
  seedDatabase,
} from "@/lib/db/store";
import { isProduction } from "@/lib/ops/environment";

export type EnsureResult = {
  driver: "json" | "postgres";
  source: "memory" | "postgres" | "seeded-once" | "json" | "error";
  seeded: boolean;
  error?: string;
};

type AtlasGlobal = typeof globalThis & {
  __atlasEnsure?: Promise<EnsureResult>;
  __atlasEnsured?: EnsureResult;
};

function g() {
  return globalThis as AtlasGlobal;
}

function allowEmptyPgSeed() {
  if (process.env.ATLAS_SEED_EMPTY_PG === "1") return true;
  if (process.env.ATLAS_SEED_EMPTY_PG === "0") return false;
  return !isProduction();
}

/**
 * Load Postgres into the process cache once per instance.
 * Empty databases may be seeded once in non-production (or when ATLAS_SEED_EMPTY_PG=1).
 * Never reseeds when organizations already exist.
 * Hydrate failures are visible and do not silently win with stale JSON unless explicitly allowed.
 */
export async function ensureServerDatabase(): Promise<EnsureResult> {
  if (typeof window !== "undefined") {
    return { driver: "json", source: "memory", seeded: false };
  }
  const existing = g().__atlasEnsured;
  // Retry next request after a hydrate error instead of locking into a dead cache forever.
  if (existing && existing.source !== "error") return existing;
  if (existing?.source === "error") {
    delete g().__atlasEnsure;
    delete g().__atlasEnsured;
  }
  if (g().__atlasEnsure) return g().__atlasEnsure!;

  g().__atlasEnsure = (async () => {
    if (!postgresLive()) {
      loadDatabase();
      const orgId = loadDatabase().organizations[0]?.id;
      if (orgId) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const employees = require("@/lib/services/employees") as typeof import("@/lib/services/employees");
        if (!employees.listEmployees(orgId).length) {
          employees.resetSeedEmployees(orgId);
        }
      }
      const result: EnsureResult = { driver: "json", source: "json", seeded: false };
      g().__atlasEnsured = result;
      return result;
    }

    try {
      const { loadAtlasDatabaseFromPostgres, persistAtlasDatabase } = await import("@/lib/db/postgres");
      const fromPg = await loadAtlasDatabaseFromPostgres();
      if (fromPg && fromPg.organizations.length > 0) {
        applyServerDatabase(fromPg);
        const result: EnsureResult = { driver: "postgres", source: "postgres", seeded: false };
        g().__atlasEnsured = result;
        return result;
      }
      if (!allowEmptyPgSeed()) {
        const message =
          "Postgres has no organizations — set ATLAS_SEED_EMPTY_PG=1 to seed, or restore a backup.";
        const result: EnsureResult = {
          driver: "postgres",
          source: "error",
          seeded: false,
          error: message,
        };
        g().__atlasEnsured = result;
        const { PersistenceError } = await import("@/lib/domain/errors");
        throw new PersistenceError(message);
      }
      const seeded = seedDatabase();
      applyServerDatabase(seeded);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const employees = require("@/lib/services/employees") as typeof import("@/lib/services/employees");
      if (seeded.organizations[0]?.id) {
        employees.resetSeedEmployees(seeded.organizations[0].id);
      }
      await persistAtlasDatabase(seeded);
      const result: EnsureResult = { driver: "postgres", source: "seeded-once", seeded: true };
      g().__atlasEnsured = result;
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "postgres hydrate failed";
      const result: EnsureResult = {
        driver: databaseDriver(),
        source: "error",
        seeded: false,
        error: message,
      };
      g().__atlasEnsured = result;
      console.error("[atlas:db]", result.error);
      if (process.env.ATLAS_ALLOW_JSON_FALLBACK === "1") {
        loadDatabase();
        return result;
      }
      const { PersistenceError } = await import("@/lib/domain/errors");
      throw new PersistenceError(`Postgres hydrate failed: ${message}`);
    }
  })();

  return g().__atlasEnsure!;
}

export function resetEnsureCache() {
  delete g().__atlasEnsure;
  delete g().__atlasEnsured;
}
