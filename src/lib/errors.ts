export type AtlasErrorCode =
  | "SAVE_EVENT"
  | "SAVE_TASK"
  | "SAVE_NOTE"
  | "SYNC_FAILED"
  | "UPLOAD_FAILED"
  | "AUTH_FAILED"
  | "NETWORK"
  | "UNKNOWN";

export type FriendlyError = {
  id: string;
  code: AtlasErrorCode;
  userMessage: string;
  technical: string;
  context: string;
  at: string;
  acknowledged: boolean;
};

const LOG_KEY = "atlas-error-log-v1";

const FRIENDLY: Record<AtlasErrorCode, string> = {
  SAVE_EVENT: "Atlas could not save this event. Your information is still here. Try again.",
  SAVE_TASK: "Atlas could not save this task. Nothing was lost — try once more.",
  SAVE_NOTE: "Atlas could not save this note. Your draft is still on screen.",
  SYNC_FAILED: "Atlas could not sync right now. Your local copy is safe.",
  UPLOAD_FAILED: "Atlas could not upload that file. The original is unchanged.",
  AUTH_FAILED: "Atlas could not verify that sign-in. Check your details and try again.",
  NETWORK: "Atlas lost the connection. You can keep working offline.",
  UNKNOWN: "Something went wrong, but your information is still here. Try again.",
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `err_${crypto.randomUUID()}`;
  return `err_${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function loadErrorLog(): FriendlyError[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FriendlyError[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLog(items: FriendlyError[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOG_KEY, JSON.stringify(items.slice(0, 100)));
}

export function recordError(input: {
  code: AtlasErrorCode;
  technical: string;
  context?: string;
  userMessage?: string;
}): FriendlyError {
  const entry: FriendlyError = {
    id: newId(),
    code: input.code,
    userMessage: input.userMessage || FRIENDLY[input.code],
    technical: input.technical,
    context: input.context || "app",
    at: nowIso(),
    acknowledged: false,
  };
  saveLog([entry, ...loadErrorLog()]);
  return entry;
}

export function acknowledgeError(id: string) {
  saveLog(loadErrorLog().map((e) => (e.id === id ? { ...e, acknowledged: true } : e)));
}

export function clearAcknowledgedErrors() {
  saveLog(loadErrorLog().filter((e) => !e.acknowledged));
}

/** Simulate a failing save while keeping user data intact. */
export function simulateFailedSave(kind: "event" | "task" | "note" = "event") {
  const code: AtlasErrorCode =
    kind === "event" ? "SAVE_EVENT" : kind === "task" ? "SAVE_TASK" : "SAVE_NOTE";
  return recordError({
    code,
    context: kind,
    technical: `Error 500 · demo persistence failure in ${kind} writer · stack: AtlasStore.write/${kind}`,
  });
}

export function friendlyFromUnknown(error: unknown, code: AtlasErrorCode = "UNKNOWN") {
  const technical =
    error instanceof Error
      ? `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ""}`
      : String(error);
  return recordError({ code, technical });
}
