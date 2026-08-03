import { fileExists, readJsonFile, writeJsonFile } from "@/lib/db/file-persist";
import {
  WORKSPACE_DOMAINS,
  isWorkspaceDomain,
  type WorkspaceDomain,
} from "@/lib/backend/domains";

export { WORKSPACE_DOMAINS, isWorkspaceDomain, type WorkspaceDomain };

export type WorkspaceStore = {
  updatedAt: string;
  domains: Partial<Record<WorkspaceDomain, unknown>>;
};

const WORKSPACE_FILE = "workspace.json";

type AtlasGlobal = typeof globalThis & { __atlasWorkspace?: WorkspaceStore };

function emptyWorkspace(): WorkspaceStore {
  return { updatedAt: new Date().toISOString(), domains: {} };
}

function getMemory(): WorkspaceStore {
  const g = globalThis as AtlasGlobal;
  if (!g.__atlasWorkspace) {
    g.__atlasWorkspace = readJsonFile<WorkspaceStore>(WORKSPACE_FILE) || emptyWorkspace();
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

export function loadWorkspace(): WorkspaceStore {
  return getMemory();
}

export function getWorkspaceDomain(domain: WorkspaceDomain) {
  const store = getMemory();
  return {
    domain,
    data: store.domains[domain] ?? null,
    updatedAt: store.updatedAt,
  };
}

export function putWorkspaceDomain(domain: WorkspaceDomain, data: unknown) {
  const store = getMemory();
  const next: WorkspaceStore = {
    updatedAt: new Date().toISOString(),
    domains: { ...store.domains, [domain]: data },
  };
  setMemory(next);
  return { domain, data, updatedAt: next.updatedAt };
}

export function putWorkspaceMany(domains: Partial<Record<WorkspaceDomain, unknown>>) {
  const store = getMemory();
  const next: WorkspaceStore = {
    updatedAt: new Date().toISOString(),
    domains: { ...store.domains, ...domains },
  };
  setMemory(next);
  return next;
}

export function workspaceStats() {
  const store = getMemory();
  return {
    updatedAt: store.updatedAt,
    domains: WORKSPACE_DOMAINS.map((domain) => ({
      domain,
      present: store.domains[domain] != null,
      size: store.domains[domain] == null ? 0 : JSON.stringify(store.domains[domain]).length,
    })),
  };
}
