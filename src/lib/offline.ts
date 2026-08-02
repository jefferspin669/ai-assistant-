import { getCurrentAccount } from "@/lib/account";
import { loadCalendarState, type CalendarState } from "@/lib/smart-calendar";
import { loadCaptures, type CaptureNote } from "@/lib/quick-capture";
import { loadTasks, type AtlasTask } from "@/lib/tasks";
import { setSyncStatus } from "@/lib/sync-status";

export type OfflineBundle = {
  cachedAt: string;
  calendar: CalendarState | null;
  tasks: AtlasTask[];
  notes: CaptureNote[];
  conversations: { id: string; title: string; preview: string; updatedAt: string }[];
  documents: { id: string; title: string; kind: string; updatedAt: string }[];
};

export type OfflineQueueItem = {
  id: string;
  at: string;
  label: string;
  payload: string;
  synced: boolean;
};

const CACHE_KEY = "atlas-offline-cache-v1";
const QUEUE_KEY = "atlas-offline-queue-v1";
const FORCE_OFFLINE_KEY = "atlas-force-offline-v1";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `off_${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function isForcedOffline() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FORCE_OFFLINE_KEY) === "1";
}

export function setForcedOffline(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FORCE_OFFLINE_KEY, value ? "1" : "0");
  setSyncStatus(value || !navigator.onLine ? "offline" : "synced");
}

export function isOffline() {
  if (typeof window === "undefined") return false;
  return isForcedOffline() || navigator.onLine === false;
}

export function buildOfflineBundle(): OfflineBundle {
  const account = getCurrentAccount();
  return {
    cachedAt: nowIso(),
    calendar: typeof window !== "undefined" ? loadCalendarState() : null,
    tasks: typeof window !== "undefined" ? loadTasks() : [],
    notes: typeof window !== "undefined" ? loadCaptures() : [],
    conversations:
      account?.aiWorkspace.chats.slice(0, 12).map((c) => ({
        id: c.id,
        title: c.title,
        preview: c.preview,
        updatedAt: c.updatedAt,
      })) || [],
    documents:
      account?.cloudItems
        .filter((i) => !i.deletedAt && (i.kind === "file" || i.kind === "document"))
        .slice(0, 12)
        .map((i) => ({
          id: i.id,
          title: i.title,
          kind: i.kind,
          updatedAt: i.updatedAt,
        })) || [],
  };
}

export function refreshOfflineCache() {
  if (typeof window === "undefined") return buildOfflineBundle();
  const bundle = buildOfflineBundle();
  localStorage.setItem(CACHE_KEY, JSON.stringify(bundle));
  return bundle;
}

export function loadOfflineCache(): OfflineBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return refreshOfflineCache();
    return JSON.parse(raw) as OfflineBundle;
  } catch {
    return refreshOfflineCache();
  }
}

export function loadOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(items: OfflineQueueItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(0, 50)));
}

export function enqueueOfflineChange(label: string, payload = "") {
  const item: OfflineQueueItem = {
    id: newId(),
    at: nowIso(),
    label,
    payload,
    synced: false,
  };
  saveQueue([item, ...loadOfflineQueue()]);
  setSyncStatus("offline", `${label} queued until you reconnect.`);
  return item;
}

export function flushOfflineQueue() {
  const items = loadOfflineQueue();
  const pending = items.filter((i) => !i.synced);
  if (!items.length) {
    setSyncStatus("synced", "Nothing waiting to sync.");
    return { count: 0 };
  }
  const count = pending.length || items.length;
  refreshOfflineCache();
  saveQueue([]);
  setSyncStatus("synced", `Synced ${count} offline change(s).`);
  return { count };
}

export function offlineSummary(bundle = loadOfflineCache()) {
  if (!bundle) {
    return { events: 0, tasks: 0, notes: 0, conversations: 0, documents: 0, cachedAt: null as string | null };
  }
  return {
    events: bundle.calendar?.events.length || 0,
    tasks: bundle.tasks.length,
    notes: bundle.notes.length,
    conversations: bundle.conversations.length,
    documents: bundle.documents.length,
    cachedAt: bundle.cachedAt,
  };
}
