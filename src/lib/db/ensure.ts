import {
  assertProductionPersistence,
  databaseDriver,
  fileFallbackAllowed,
  jsonMirrorEnabled,
  postgresLive,
} from "@/lib/db/driver";
import {
  applyServerDatabase,
  loadDatabase,
  seedDatabase,
} from "@/lib/db/store";

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

/**
 * Load Postgres into the process cache once per instance.
 * Empty databases are seeded once (so demo login still works locally).
 * Never reseeds when organizations already exist.
 * Production requires DATABASE_URL — file fallback is refused.
 */
export async function ensureServerDatabase(): Promise<EnsureResult> {
  if (typeof window !== "undefined") {
    return { driver: "json", source: "memory", seeded: false };
  }
  assertProductionPersistence();
  const existing = g().__atlasEnsured;
  if (existing) return existing;
  if (g().__atlasEnsure) return g().__atlasEnsure!;

  g().__atlasEnsure = (async () => {
    if (!postgresLive()) {
      if (!fileFallbackAllowed()) {
        throw new Error("DATABASE_URL is required in production.");
      }
      loadDatabase();
      const orgId = loadDatabase().organizations[0]?.id;
      if (orgId) {
        const employees = await import("@/lib/services/employees");
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
      const seeded = seedDatabase();
      applyServerDatabase(seeded);
      const employees = await import("@/lib/services/employees");
      if (seeded.organizations[0]?.id) {
        employees.resetSeedEmployees(seeded.organizations[0].id);
      }
      await persistAtlasDatabase(seeded);
      const result: EnsureResult = { driver: "postgres", source: "seeded-once", seeded: true };
      g().__atlasEnsured = result;
      return result;
    } catch (error) {
      // Production: never fall back to JSON after a Postgres failure.
      if (!fileFallbackAllowed()) {
        throw error instanceof Error ? error : new Error("postgres hydrate failed");
      }
      const result: EnsureResult = {
        driver: databaseDriver(),
        source: "error",
        seeded: false,
        error: error instanceof Error ? error.message : "postgres hydrate failed",
      };
      g().__atlasEnsured = result;
      if (jsonMirrorEnabled()) loadDatabase();
      console.error("[atlas:db]", result.error);
      return result;
    }
  })();

  return g().__atlasEnsure!;
}

export function resetEnsureCache() {
  delete g().__atlasEnsure;
  delete g().__atlasEnsured;
}
