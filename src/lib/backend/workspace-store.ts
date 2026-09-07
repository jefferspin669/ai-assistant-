import { ValidationError } from "@/lib/domain/errors";
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

/** Best-effort Postgres mirror when DATABASE_URL is set (file remains primary for demos). */
function mirrorDomainToPostgres(
  organizationId: string,
  domain: WorkspaceDomain,
  data: unknown,
  updatedAt: string,
) {
  void import("@/lib/db/postgres")
    .then(async ({ hasPostgres, getDrizzle }) => {
      if (!hasPostgres()) return;
      const { workspaceDomains } = await import("@/lib/db/drizzle-schema");
      const db = getDrizzle();
      await db
        .insert(workspaceDomains)
        .values({ organizationId, domain, data, updatedAt })
        .onConflictDoUpdate({
          target: [workspaceDomains.organizationId, workspaceDomains.domain],
          set: { data, updatedAt },
        });
    })
    .catch(() => {
      /* table may not exist yet — file store still authoritative */
    });
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
  mirrorDomainToPostgres(organizationId, domain, data, next.updatedAt);
  return { organizationId, domain, data, updatedAt: next.updatedAt };
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
      mirrorDomainToPostgres(organizationId, domain, data, next.updatedAt);
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
