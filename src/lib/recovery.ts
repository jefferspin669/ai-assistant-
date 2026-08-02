import { getCurrentAccount } from "@/lib/account";
import { loadCalendarState, saveCalendarState, type CalendarEvent, type CalendarState } from "@/lib/smart-calendar";
import { loadTasks, saveTasks, type AtlasTask } from "@/lib/tasks";
import { loadTaxTransactions, saveTaxTransactions, type TaxTransaction } from "@/lib/tax-ledger";

export type TrashKind = "event" | "task" | "file" | "transaction" | "note";

export type TrashItem = {
  id: string;
  kind: TrashKind;
  title: string;
  deletedAt: string;
  payload: unknown;
};

export type UndoAction = {
  id: string;
  at: string;
  label: string;
  undo: () => void;
};

type StoredUndo = {
  id: string;
  at: string;
  label: string;
  snapshot: RecoverySnapshot;
};

export type BackupRecord = {
  id: string;
  at: string;
  label: string;
  scope: "full" | "calendar" | "tasks" | "tax" | "files";
  snapshot: RecoverySnapshot;
};

export type RecoverySnapshot = {
  calendar?: CalendarState;
  tasks?: AtlasTask[];
  tax?: TaxTransaction[];
  cloudItems?: unknown[];
};

export type VersionEntry = {
  id: string;
  at: string;
  label: string;
  scope: "calendar" | "tasks" | "tax";
  snapshot: RecoverySnapshot;
};

const TRASH_KEY = "atlas-trash-v1";
const UNDO_KEY = "atlas-undo-v1";
const BACKUP_KEY = "atlas-backups-v1";
const VERSION_KEY = "atlas-versions-v1";

const undoFns = new Map<string, () => void>();

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function captureSnapshot(scope: BackupRecord["scope"] = "full"): RecoverySnapshot {
  const snap: RecoverySnapshot = {};
  if (scope === "full" || scope === "calendar") snap.calendar = loadCalendarState();
  if (scope === "full" || scope === "tasks") snap.tasks = loadTasks();
  if (scope === "full" || scope === "tax") snap.tax = loadTaxTransactions();
  if (scope === "full" || scope === "files") {
    const account = getCurrentAccount();
    snap.cloudItems = account?.cloudItems || [];
  }
  return snap;
}

export function applySnapshot(snapshot: RecoverySnapshot) {
  if (snapshot.calendar) saveCalendarState(snapshot.calendar);
  if (snapshot.tasks) saveTasks(snapshot.tasks);
  if (snapshot.tax) saveTaxTransactions(snapshot.tax);
}

/* ─── Trash ─────────────────────────────────────────────────────────────── */

export function listTrash(): TrashItem[] {
  return readJson<TrashItem[]>(TRASH_KEY, []);
}

export function moveToTrash(item: Omit<TrashItem, "id" | "deletedAt">) {
  const entry: TrashItem = {
    ...item,
    id: newId("trash"),
    deletedAt: nowIso(),
  };
  writeJson(TRASH_KEY, [entry, ...listTrash()].slice(0, 100));
  return entry;
}

export function restoreTrashItem(id: string): { ok: true; message: string } | { ok: false; error: string } {
  const items = listTrash();
  const found = items.find((t) => t.id === id);
  if (!found) return { ok: false, error: "Item not in trash." };

  if (found.kind === "event") {
    const state = loadCalendarState();
    const event = found.payload as CalendarEvent;
    saveCalendarState({ ...state, events: [event, ...state.events] });
  } else if (found.kind === "task") {
    const tasks = loadTasks();
    saveTasks([found.payload as AtlasTask, ...tasks]);
  } else if (found.kind === "transaction") {
    const rows = loadTaxTransactions();
    saveTaxTransactions([found.payload as TaxTransaction, ...rows]);
  }

  writeJson(
    TRASH_KEY,
    items.filter((t) => t.id !== id),
  );
  return { ok: true, message: `Restored “${found.title}”.` };
}

export function purgeTrashItem(id: string) {
  writeJson(
    TRASH_KEY,
    listTrash().filter((t) => t.id !== id),
  );
}

export function softDeleteEvent(eventId: string): { ok: true; message: string } | { ok: false; error: string } {
  const state = loadCalendarState();
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return { ok: false, error: "Event not found." };
  const before = state;
  pushUndoAction({
    label: `Delete event “${event.title}”`,
    undo: () => saveCalendarState(before),
  });
  moveToTrash({ kind: "event", title: event.title, payload: event });
  saveCalendarState({ ...state, events: state.events.filter((e) => e.id !== eventId) });
  recordVersion("calendar", `Before delete · ${event.title}`);
  return { ok: true, message: `Moved “${event.title}” to trash.` };
}

export function softDeleteTask(taskId: string): { ok: true; message: string } | { ok: false; error: string } {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { ok: false, error: "Task not found." };
  const before = tasks;
  pushUndoAction({
    label: `Delete task “${task.title}”`,
    undo: () => saveTasks(before),
  });
  moveToTrash({ kind: "task", title: task.title, payload: task });
  saveTasks(tasks.filter((t) => t.id !== taskId));
  return { ok: true, message: `Moved “${task.title}” to trash.` };
}

/* ─── Undo ──────────────────────────────────────────────────────────────── */

export function listUndoActions(): { id: string; at: string; label: string }[] {
  return readJson<StoredUndo[]>(UNDO_KEY, []).map(({ id, at, label }) => ({ id, at, label }));
}

export function pushUndoAction(input: { label: string; undo: () => void; snapshot?: RecoverySnapshot }) {
  const id = newId("undo");
  const at = nowIso();
  undoFns.set(id, input.undo);
  const stored: StoredUndo = {
    id,
    at,
    label: input.label,
    snapshot: input.snapshot || captureSnapshot("full"),
  };
  writeJson(UNDO_KEY, [stored, ...readJson<StoredUndo[]>(UNDO_KEY, [])].slice(0, 30));
  return stored;
}

export function undoRecent(id?: string): { ok: true; message: string } | { ok: false; error: string } {
  const list = readJson<StoredUndo[]>(UNDO_KEY, []);
  if (!list.length) return { ok: false, error: "Nothing to undo." };
  const target = id ? list.find((u) => u.id === id) : list[0];
  if (!target) return { ok: false, error: "Undo action not found." };

  const fn = undoFns.get(target.id);
  if (fn) fn();
  else applySnapshot(target.snapshot);

  writeJson(
    UNDO_KEY,
    list.filter((u) => u.id !== target.id),
  );
  undoFns.delete(target.id);
  return { ok: true, message: `Undid: ${target.label}` };
}

/* ─── Backups ───────────────────────────────────────────────────────────── */

export function listBackups(): BackupRecord[] {
  return readJson<BackupRecord[]>(BACKUP_KEY, []);
}

export function recordBackup(
  scope: BackupRecord["scope"] = "full",
  label = "Automatic backup",
): BackupRecord {
  const record: BackupRecord = {
    id: newId("bak"),
    at: nowIso(),
    label,
    scope,
    snapshot: captureSnapshot(scope),
  };
  writeJson(BACKUP_KEY, [record, ...listBackups()].slice(0, 20));
  return record;
}

export function restoreBackup(id: string): { ok: true; message: string } | { ok: false; error: string } {
  const bak = listBackups().find((b) => b.id === id);
  if (!bak) return { ok: false, error: "Backup not found." };
  const current = captureSnapshot(bak.scope);
  pushUndoAction({
    label: `Restore backup “${bak.label}”`,
    undo: () => applySnapshot(current),
    snapshot: current,
  });
  applySnapshot(bak.snapshot);
  return { ok: true, message: `Restored backup from ${new Date(bak.at).toLocaleString()}.` };
}

export function ensureDailyBackup() {
  if (typeof window === "undefined") return;
  const backups = listBackups();
  const today = new Date().toISOString().slice(0, 10);
  if (backups.some((b) => b.at.slice(0, 10) === today && b.scope === "full")) return;
  recordBackup("full", "Automatic daily backup");
}

/* ─── Version history ───────────────────────────────────────────────────── */

export function listVersions(): VersionEntry[] {
  return readJson<VersionEntry[]>(VERSION_KEY, []);
}

export function recordVersion(scope: VersionEntry["scope"], label: string) {
  const entry: VersionEntry = {
    id: newId("ver"),
    at: nowIso(),
    label,
    scope,
    snapshot: captureSnapshot(scope),
  };
  writeJson(VERSION_KEY, [entry, ...listVersions()].slice(0, 40));
  return entry;
}

export function restoreVersion(id: string): { ok: true; message: string } | { ok: false; error: string } {
  const ver = listVersions().find((v) => v.id === id);
  if (!ver) return { ok: false, error: "Version not found." };
  const current = captureSnapshot(ver.scope);
  pushUndoAction({
    label: `Restore version “${ver.label}”`,
    undo: () => applySnapshot(current),
    snapshot: current,
  });
  applySnapshot(ver.snapshot);
  return { ok: true, message: `Restored “${ver.label}”.` };
}

/** Demo helper: simulate a bulk calendar change and keep a restore point. */
export function simulateBulkCalendarChange(): { ok: true; message: string } {
  const before = loadCalendarState();
  recordVersion("calendar", "Yesterday’s calendar version");
  recordBackup("calendar", "Before bulk calendar change");
  pushUndoAction({
    label: "Bulk-changed 20 calendar events",
    undo: () => saveCalendarState(before),
    snapshot: { calendar: before },
  });
  const shifted = {
    ...before,
    events: before.events.map((event, index) => {
      if (index >= 20) return event;
      const start = new Date(event.start);
      start.setHours(start.getHours() + 2);
      const end = new Date(event.end);
      end.setHours(end.getHours() + 2);
      return {
        ...event,
        title: event.title.startsWith("[shifted] ") ? event.title : `[shifted] ${event.title}`,
        start: start.toISOString(),
        end: end.toISOString(),
      };
    }),
  };
  saveCalendarState(shifted);
  return {
    ok: true,
    message: "Shifted up to 20 events by 2 hours. Use Undo or restore yesterday’s version.",
  };
}

export function recoveryCodesForAccount(): string[] {
  const account = getCurrentAccount();
  return account?.security.recoveryCodes || [];
}
