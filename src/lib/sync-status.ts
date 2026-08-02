export type SyncStatusKind =
  | "saved"
  | "saving"
  | "synced"
  | "offline"
  | "connection_failed"
  | "action_pending"
  | "action_completed"
  | "needs_attention";

export type SyncStatusEvent = {
  id: string;
  kind: SyncStatusKind;
  label: string;
  detail: string;
  at: string;
};

type Listener = (event: SyncStatusEvent) => void;

const HISTORY_KEY = "atlas-sync-status-history-v1";
const listeners = new Set<Listener>();
let current: SyncStatusEvent = {
  id: "boot",
  kind: "synced",
  label: "Synced",
  detail: "Local vault is up to date.",
  at: new Date().toISOString(),
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `status_${Date.now()}`;
}

export const STATUS_LABELS: Record<SyncStatusKind, string> = {
  saved: "Saved",
  saving: "Saving",
  synced: "Synced",
  offline: "Offline",
  connection_failed: "Connection failed",
  action_pending: "Action pending",
  action_completed: "Action completed",
  needs_attention: "Needs attention",
};

export function getSyncStatus() {
  return current;
}

export function subscribeSyncStatus(listener: Listener) {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

function pushHistory(event: SyncStatusEvent) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const prev = raw ? (JSON.parse(raw) as SyncStatusEvent[]) : [];
    localStorage.setItem(HISTORY_KEY, JSON.stringify([event, ...prev].slice(0, 40)));
  } catch {
    /* ignore */
  }
}

export function loadStatusHistory(): SyncStatusEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncStatusEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setSyncStatus(
  kind: SyncStatusKind,
  detail?: string,
  label = STATUS_LABELS[kind],
): SyncStatusEvent {
  current = {
    id: newId(),
    kind,
    label,
    detail: detail || defaultDetail(kind),
    at: new Date().toISOString(),
  };
  pushHistory(current);
  listeners.forEach((listener) => listener(current));
  return current;
}

function defaultDetail(kind: SyncStatusKind) {
  switch (kind) {
    case "saved":
      return "Your information is saved on this device.";
    case "saving":
      return "Atlas is saving your changes…";
    case "synced":
      return "Everything is synced.";
    case "offline":
      return "You’re offline. Changes will sync when you reconnect.";
    case "connection_failed":
      return "Atlas could not reach a connected service.";
    case "action_pending":
      return "Waiting for confirmation before continuing.";
    case "action_completed":
      return "The action finished successfully.";
    case "needs_attention":
      return "Something needs your review.";
  }
}

/** Demo helper: simulate a save → synced cycle. */
export async function runSaveCycle(label = "Changes") {
  setSyncStatus("saving", `Saving ${label.toLowerCase()}…`);
  await new Promise((r) => setTimeout(r, 450));
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    setSyncStatus("offline", `${label} saved locally. Will sync when online.`);
    return;
  }
  setSyncStatus("saved", `${label} saved.`);
  await new Promise((r) => setTimeout(r, 350));
  setSyncStatus("synced", `${label} synced.`);
}
