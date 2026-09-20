import { PersistenceError, ValidationError } from "@/lib/domain/errors";
import { fileExists, readJsonFile, writeJsonFile } from "@/lib/db/file-persist";
import {
  WORKSPACE_DOMAINS,
  isWorkspaceDomain,
  type WorkspaceDomain,
} from "@/lib/backend/domains";

export { WORKSPACE_DOMAINS, isWorkspaceDomain, type WorkspaceDomain };

export type WorkspaceStore = {
  updatedAt: string;
  /** Tenant-scoped domain bags. Legacy flat `domains` migrated on read. */
  tenants: Record<string, Partial<Record<WorkspaceDomain, unknown>>>;
};

const WORKSPACE_FILE = "workspace.json";
export const MAX_WORKSPACE_PAYLOAD_BYTES = 256_000;

type AtlasGlobal = typeof globalThis & { __atlasWorkspace?: WorkspaceStore };

type LegacyWorkspaceFile = {
  updatedAt?: string;
  domains?: Partial<Record<WorkspaceDomain, unknown>>;
  tenants?: Record<string, Partial<Record<WorkspaceDomain, unknown>>>;
};

function emptyWorkspace(): WorkspaceStore {
  return { updatedAt: new Date().toISOString(), tenants: {} };
}

function migrate(raw: LegacyWorkspaceFile | null): WorkspaceStore {
  if (!raw) return emptyWorkspace();
  if (raw.tenants && typeof raw.tenants === "object") {
    return { updatedAt: raw.updatedAt || new Date().toISOString(), tenants: raw.tenants };
  }
  // Legacy unscoped file → park under a reserved key until first authenticated write.
  if (raw.domains) {
    return {
      updatedAt: raw.updatedAt || new Date().toISOString(),
      tenants: { __legacy__: raw.domains },
    };
  }
  return emptyWorkspace();
}

function getMemory(): WorkspaceStore {
  const g = globalThis as AtlasGlobal;
  if (!g.__atlasWorkspace) {
    const raw = readJsonFile<LegacyWorkspaceFile>(WORKSPACE_FILE);
    g.__atlasWorkspace = migrate(raw);
    if (!fileExists(WORKSPACE_FILE)) {
      writeJsonFile(WORKSPACE_FILE, g.__atlasWorkspace);
    }
  }
  return g.__atlasWorkspace;
}

function setMemory(store: WorkspaceStore) {
  (globalThis as AtlasGlobal).__atlasWorkspace = store;
  writeJsonFile(WORKSPACE_FILE, store);
}

function tenantBag(organizationId: string) {
  return getMemory().tenants[organizationId] || {};
}

function cacheDomain(organizationId: string, domain: WorkspaceDomain, data: unknown, updatedAt: string) {
  const store = getMemory();
  (globalThis as AtlasGlobal).__atlasWorkspace = {
    updatedAt,
    tenants: {
      ...store.tenants,
      [organizationId]: { ...tenantBag(organizationId), [domain]: data },
    },
  };
}

export function assertPayloadSize(data: unknown) {
  const size = JSON.stringify(data ?? null).length;
  if (size > MAX_WORKSPACE_PAYLOAD_BYTES) {
    throw new ValidationError(`Workspace payload exceeds ${MAX_WORKSPACE_PAYLOAD_BYTES} bytes.`);
  }
  return size;
}

export function loadWorkspace(organizationId: string) {
  return {
    organizationId,
    updatedAt: getMemory().updatedAt,
    domains: tenantBag(organizationId),
  };
}

export function getWorkspaceDomain(organizationId: string, domain: WorkspaceDomain) {
  const store = getMemory();
  return {
    organizationId,
    domain,
    data: tenantBag(organizationId)[domain] ?? null,
    updatedAt: store.updatedAt,
  };
}

export function putWorkspaceDomain(organizationId: string, domain: WorkspaceDomain, data: unknown) {
  assertPayloadSize(data);
  const store = getMemory();
  const next: WorkspaceStore = {
    updatedAt: new Date().toISOString(),
    tenants: {
      ...store.tenants,
      [organizationId]: {
        ...tenantBag(organizationId),
        [domain]: data,
      },
    },
  };
  setMemory(next);
  return { organizationId, domain, data, updatedAt: next.updatedAt };
}

/**
 * Production read path. PostgreSQL is authoritative whenever DATABASE_URL is
 * configured; the JSON adapter is used only for local development and tests.
 */
export async function getWorkspaceDomainAuthoritative(
  organizationId: string,
  domain: WorkspaceDomain,
) {
  const { hasPostgres, getDrizzle } = await import("@/lib/db/postgres");
  if (!hasPostgres()) {
    const { isProduction } = await import("@/lib/ops/environment");
    if (isProduction()) throw new PersistenceError("DATABASE_URL is required in production.");
    return getWorkspaceDomain(organizationId, domain);
  }
  try {
    const { and, eq } = await import("drizzle-orm");
    const { workspaceDomains } = await import("@/lib/db/drizzle-schema");
    const rows = await getDrizzle()
      .select()
      .from(workspaceDomains)
      .where(and(eq(workspaceDomains.organizationId, organizationId), eq(workspaceDomains.domain, domain)))
      .limit(1);
    const row = rows[0];
    if (!row) return { organizationId, domain, data: null, updatedAt: null };
    cacheDomain(organizationId, domain, row.data, row.updatedAt);
    return { organizationId, domain, data: row.data, updatedAt: row.updatedAt };
  } catch (error) {
    throw new PersistenceError(error instanceof Error ? error.message : "Workspace database read failed.");
  }
}

/** Awaited write path used by APIs. A failed database write never returns success. */
export async function putWorkspaceDomainAuthoritative(
  organizationId: string,
  domain: WorkspaceDomain,
  data: unknown,
) {
  assertPayloadSize(data);
  const { hasPostgres, getDrizzle } = await import("@/lib/db/postgres");
  if (!hasPostgres()) {
    const { isProduction } = await import("@/lib/ops/environment");
    if (isProduction()) throw new PersistenceError("DATABASE_URL is required in production.");
    return putWorkspaceDomain(organizationId, domain, data);
  }
  const updatedAt = new Date().toISOString();
  try {
    const { workspaceDomains } = await import("@/lib/db/drizzle-schema");
    await getDrizzle()
      .insert(workspaceDomains)
      .values({ organizationId, domain, data, updatedAt })
      .onConflictDoUpdate({
        target: [workspaceDomains.organizationId, workspaceDomains.domain],
        set: { data, updatedAt },
      });
    cacheDomain(organizationId, domain, data, updatedAt);
    return { organizationId, domain, data, updatedAt };
  } catch (error) {
    throw new PersistenceError(error instanceof Error ? error.message : "Workspace database write failed.");
  }
}

export function putWorkspaceMany(
  organizationId: string,
  domains: Partial<Record<WorkspaceDomain, unknown>>,
) {
  assertPayloadSize(domains);
  const store = getMemory();
  const next: WorkspaceStore = {
    updatedAt: new Date().toISOString(),
    tenants: {
      ...store.tenants,
      [organizationId]: {
        ...tenantBag(organizationId),
        ...domains,
      },
    },
  };
  setMemory(next);
  for (const [domain, data] of Object.entries(domains)) {
    if (isWorkspaceDomain(domain)) {
      void domain;
      void data;
    }
  }
  return loadWorkspace(organizationId);
}

export function workspaceStats(organizationId?: string) {
  if (!organizationId) {
    const store = getMemory();
    const tenantIds = Object.keys(store.tenants);
    return {
      updatedAt: store.updatedAt,
      tenantCount: tenantIds.length,
      domains: WORKSPACE_DOMAINS.map((domain) => ({
        domain,
        present: tenantIds.some((id) => store.tenants[id]?.[domain] != null),
        size: tenantIds.reduce((sum, id) => {
          const value = store.tenants[id]?.[domain];
          return sum + (value == null ? 0 : JSON.stringify(value).length);
        }, 0),
      })),
    };
  }
  const bag = tenantBag(organizationId);
  return {
    organizationId,
    updatedAt: getMemory().updatedAt,
    domains: WORKSPACE_DOMAINS.map((domain) => ({
      domain,
      present: bag[domain] != null,
      size: bag[domain] == null ? 0 : JSON.stringify(bag[domain]).length,
    })),
  };
}
