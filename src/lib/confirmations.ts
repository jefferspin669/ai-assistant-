export type RiskyActionKind =
  | "send_money"
  | "file_taxes"
  | "delete_account"
  | "mass_email"
  | "cancel_appointment"
  | "change_payroll"
  | "remove_team_member"
  | "publish_content"
  | "other";

export type ConfirmationStatus = "pending" | "approved" | "cancelled" | "expired";

export type PendingConfirmation = {
  id: string;
  kind: RiskyActionKind;
  title: string;
  summary: string;
  details: string[];
  impact: string;
  requestedBy: string;
  createdAt: string;
  status: ConfirmationStatus;
  resolvedAt: string | null;
  resultNote: string | null;
};

const STORAGE_KEY = "atlas-confirmations-v1";

export const RISKY_ACTION_CATALOG: {
  kind: RiskyActionKind;
  title: string;
  summary: string;
  details: string[];
  impact: string;
}[] = [
  {
    kind: "send_money",
    title: "Send money",
    summary: "Transfer $1,250 to Apex Supply via ACH.",
    details: ["Amount: $1,250.00", "Recipient: Apex Supply", "Method: ACH · arrives in 1–2 days", "Memo: Parts restock"],
    impact: "Funds leave your operating account immediately once approved.",
  },
  {
    kind: "file_taxes",
    title: "File taxes",
    summary: "Submit Q2 estimated tax payment for Texas.",
    details: ["Jurisdiction: TX + federal estimate", "Amount: $2,180", "Method: EFTPS demo filing", "Period: Q2 2026"],
    impact: "Filing cannot be undone from Atlas after submission.",
  },
  {
    kind: "delete_account",
    title: "Delete account",
    summary: "Permanently wipe this Atlas account and local vault data.",
    details: ["Removes profiles, chats, files, and memories", "Recovery codes become invalid", "Export is recommended first"],
    impact: "Irreversible on this device after confirmation.",
  },
  {
    kind: "mass_email",
    title: "Send mass email",
    summary: "Send spring maintenance campaign to 842 customers.",
    details: ["Audience: Active customers", "Subject: Spring tune-up special", "Channel: Email", "Unsubscribe links included"],
    impact: "Messages start sending immediately after approval.",
  },
  {
    kind: "cancel_appointment",
    title: "Cancel appointment",
    summary: "Cancel Friday 2:00 PM visit with Jamie Cole.",
    details: ["Customer: Jamie Cole", "Job: Water heater install", "Tech: Sam", "Notify customer by text + email"],
    impact: "Slot opens and the customer is notified.",
  },
  {
    kind: "change_payroll",
    title: "Change payroll",
    summary: "Raise Sam Rivera’s hourly rate from $28 to $31.",
    details: ["Employee: Sam Rivera", "Effective: next pay period", "Estimated monthly impact: +$480"],
    impact: "Payroll exports and next run use the new rate.",
  },
  {
    kind: "remove_team_member",
    title: "Remove team member",
    summary: "Remove Alex Chen from the Atlas workspace.",
    details: ["Role: Manager", "Access: Calendar, CRM, Files", "Data they created stays in Atlas"],
    impact: "They lose login access immediately.",
  },
  {
    kind: "publish_content",
    title: "Publish content",
    summary: "Publish the holiday hours post to Google Business + Facebook.",
    details: ["Channels: Google Business, Facebook", "Goes live: immediately", "Includes address and phone"],
    impact: "Public customers can see the post right away.",
  },
];

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `confirm_${crypto.randomUUID()}`;
  return `confirm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function loadConfirmations(): PendingConfirmation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingConfirmation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConfirmations(items: PendingConfirmation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 80)));
}

export function requestConfirmation(input: {
  kind: RiskyActionKind;
  title: string;
  summary: string;
  details: string[];
  impact: string;
  requestedBy?: string;
}): PendingConfirmation {
  const item: PendingConfirmation = {
    id: newId(),
    kind: input.kind,
    title: input.title,
    summary: input.summary,
    details: input.details,
    impact: input.impact,
    requestedBy: input.requestedBy || "Atlas",
    createdAt: nowIso(),
    status: "pending",
    resolvedAt: null,
    resultNote: null,
  };
  saveConfirmations([item, ...loadConfirmations()]);
  return item;
}

export function resolveConfirmation(
  id: string,
  approved: boolean,
): { ok: true; item: PendingConfirmation } | { ok: false; error: string } {
  const items = loadConfirmations();
  const found = items.find((c) => c.id === id);
  if (!found) return { ok: false, error: "Confirmation not found." };
  if (found.status !== "pending") return { ok: false, error: "Already resolved." };
  const item: PendingConfirmation = {
    ...found,
    status: approved ? "approved" : "cancelled",
    resolvedAt: nowIso(),
    resultNote: approved
      ? `Approved — ${found.title} is complete.`
      : `Cancelled — Atlas did not ${found.title.toLowerCase()}.`,
  };
  saveConfirmations(items.map((c) => (c.id === id ? item : c)));
  return { ok: true, item };
}

export function pendingCount(items = loadConfirmations()) {
  return items.filter((c) => c.status === "pending").length;
}

export function queueCatalogAction(kind: RiskyActionKind, requestedBy = "Atlas") {
  const catalog = RISKY_ACTION_CATALOG.find((c) => c.kind === kind);
  if (!catalog) return requestConfirmation({
    kind: "other",
    title: "Risky action",
    summary: "Atlas needs your approval before continuing.",
    details: ["Review the details carefully."],
    impact: "Action will run only after you confirm.",
    requestedBy,
  });
  return requestConfirmation({ ...catalog, requestedBy });
}

export function addCustomConfirmation(input: {
  title: string;
  summary: string;
  details?: string;
  impact?: string;
  requestedBy?: string;
}): PendingConfirmation {
  const details = (input.details || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return requestConfirmation({
    kind: "other",
    title: input.title.trim() || "Custom action",
    summary: input.summary.trim() || "Atlas needs your approval before continuing.",
    details: details.length ? details : ["Review carefully before confirming."],
    impact: input.impact?.trim() || "Action runs only after you confirm.",
    requestedBy: input.requestedBy || "You",
  });
}

export function removeConfirmation(id: string): PendingConfirmation[] {
  const next = loadConfirmations().filter((item) => item.id !== id);
  saveConfirmations(next);
  return next;
}

export function clearResolvedConfirmations(): PendingConfirmation[] {
  const next = loadConfirmations().filter((item) => item.status === "pending");
  saveConfirmations(next);
  return next;
}
