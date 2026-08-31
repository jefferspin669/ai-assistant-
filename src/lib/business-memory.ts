/**
 * Business Memory — one permission-aware memory engine for the whole company.
 */

import { isDemoWorkspace } from "@/lib/workspace-mode";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export type MemoryType =
  | "company"
  | "leadership"
  | "employee"
  | "customer"
  | "operational";

export type MemoryPermission = "owner" | "leadership" | "managers" | "all_staff" | "customer_facing";

export type BusinessMemoryEntry = {
  id: string;
  type: MemoryType;
  content: string;
  source: string;
  addedAt: string;
  addedBy: string;
  confidence: number;
  permission: MemoryPermission;
  lastUpdated: string;
};

export type PendingMemoryCorrection = {
  id: string;
  content: string;
  proposedType: MemoryType;
  source: string;
  askedAt: string;
};

const MEMORIES_KEY = "atlas-business-memory-v1";
const PENDING_KEY = "atlas-business-memory-pending-v1";

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  company: "Company memory",
  leadership: "Leadership memory",
  employee: "Employee memory",
  customer: "Customer memory",
  operational: "Operational memory",
};

export const MEMORY_TYPE_HINTS: Record<MemoryType, string> = {
  company: "Policies, pricing, goals, locations, vendors, procedures",
  leadership: "CEO preferences, approval rules, priorities, strategy",
  employee: "Roles, permissions, teams, work history",
  customer: "Conversations, purchases, appointments, complaints, preferences",
  operational: "Projects, meetings, decisions, inventory, recurring issues",
};

const SEED_MEMORIES: BusinessMemoryEntry[] = [
  {
    id: "mem-hours",
    type: "company",
    content: "Business hours: Mon–Fri 7am–6pm. No Sunday appointments.",
    source: "Owner setup",
    addedAt: nowIso(),
    addedBy: "Owner",
    confidence: 100,
    permission: "customer_facing",
    lastUpdated: nowIso(),
  },
  {
    id: "mem-pricing",
    type: "company",
    content: "Approved diagnostic fee: $89. Discounts over 10% require owner approval.",
    source: "Pricing policy",
    addedAt: nowIso(),
    addedBy: "Owner",
    confidence: 95,
    permission: "customer_facing",
    lastUpdated: nowIso(),
  },
  {
    id: "mem-refund",
    type: "leadership",
    content: "Refunds always require owner approval — never auto-issue.",
    source: "Approval rules",
    addedAt: nowIso(),
    addedBy: "CEO",
    confidence: 100,
    permission: "leadership",
    lastUpdated: nowIso(),
  },
];

export function loadBusinessMemories(): BusinessMemoryEntry[] {
  const saved = loadJson<BusinessMemoryEntry[]>(MEMORIES_KEY, []);
  if (saved.length) return saved;
  return isDemoWorkspace() ? SEED_MEMORIES : [];
}

export function saveBusinessMemories(entries: BusinessMemoryEntry[]) {
  saveJson(MEMORIES_KEY, entries);
}

export function addBusinessMemory(input: {
  type: MemoryType;
  content: string;
  source: string;
  addedBy: string;
  confidence?: number;
  permission?: MemoryPermission;
}): BusinessMemoryEntry {
  const entry: BusinessMemoryEntry = {
    id: newId("mem"),
    type: input.type,
    content: input.content.trim(),
    source: input.source,
    addedAt: nowIso(),
    addedBy: input.addedBy,
    confidence: input.confidence ?? 90,
    permission: input.permission ?? "all_staff",
    lastUpdated: nowIso(),
  };
  saveBusinessMemories([entry, ...loadBusinessMemories()]);
  return entry;
}

export function updateBusinessMemory(
  id: string,
  patch: Partial<Pick<BusinessMemoryEntry, "content" | "type" | "permission" | "confidence">>,
): BusinessMemoryEntry | null {
  const items = loadBusinessMemories();
  const idx = items.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  const updated = {
    ...items[idx],
    ...patch,
    lastUpdated: nowIso(),
  };
  items[idx] = updated;
  saveBusinessMemories(items);
  return updated;
}

export function deleteBusinessMemory(id: string) {
  saveBusinessMemories(loadBusinessMemories().filter((m) => m.id !== id));
}

export function memoriesByType(type: MemoryType): BusinessMemoryEntry[] {
  return loadBusinessMemories().filter((m) => m.type === type);
}

export function customerFacingMemories(): BusinessMemoryEntry[] {
  return loadBusinessMemories().filter(
    (m) => m.permission === "customer_facing" || m.type === "company",
  );
}

export function loadPendingCorrections(): PendingMemoryCorrection[] {
  return loadJson<PendingMemoryCorrection[]>(PENDING_KEY, []);
}

export function proposeMemoryCorrection(
  content: string,
  proposedType: MemoryType = "company",
  source = "Owner correction",
): PendingMemoryCorrection {
  const pending: PendingMemoryCorrection = {
    id: newId("pend"),
    content: content.trim(),
    proposedType,
    source,
    askedAt: nowIso(),
  };
  saveJson(PENDING_KEY, [pending, ...loadPendingCorrections()]);
  return pending;
}

export function resolvePendingCorrection(
  pendingId: string,
  save: boolean,
  addedBy = "Owner",
): BusinessMemoryEntry | null {
  const pending = loadPendingCorrections().find((p) => p.id === pendingId);
  if (!pending) return null;
  saveJson(PENDING_KEY, loadPendingCorrections().filter((p) => p.id !== pendingId));
  if (!save) return null;
  return addBusinessMemory({
    type: pending.proposedType,
    content: pending.content,
    source: pending.source,
    addedBy,
    confidence: 100,
    permission: pending.proposedType === "company" ? "customer_facing" : "all_staff",
  });
}

export function searchMemories(query: string): BusinessMemoryEntry[] {
  const q = query.toLowerCase();
  return loadBusinessMemories().filter((m) => m.content.toLowerCase().includes(q));
}
