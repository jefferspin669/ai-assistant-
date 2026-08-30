/** User-owned ops surfaces: board, score, dashboard Q&A, risk, calls, knowledge, computer audit. */

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
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

/* ─── Board decisions ──────────────────────────────────────────────────── */

export type BoardDecision = {
  id: string;
  question: string;
  summary: string;
  voices: { advisor: string; stance: string; say: string }[];
  createdAt: string;
};

const BOARD_KEY = "atlas-user-board-decisions-v1";

export function loadBoardDecisions(): BoardDecision[] {
  return loadJson(BOARD_KEY, []);
}

export function saveBoardDecisions(items: BoardDecision[]) {
  saveJson(BOARD_KEY, items);
}

export function createBoardDecision(input: {
  question: string;
  summary: string;
  voices: BoardDecision["voices"];
}): BoardDecision {
  return {
    id: newId("board"),
    question: input.question.trim() || "New decision",
    summary: input.summary,
    voices: input.voices,
    createdAt: nowIso(),
  };
}

/* ─── Health score ─────────────────────────────────────────────────────── */

export type HealthScoreState = {
  score: number;
  previous: number;
  note: string;
};

const SCORE_KEY = "atlas-user-health-score-v1";

export function loadHealthScore(fallback = 86): HealthScoreState {
  return loadJson(SCORE_KEY, {
    score: fallback,
    previous: fallback - 3,
    note: "Owner-adjusted business health score.",
  });
}

export function saveHealthScore(state: HealthScoreState) {
  saveJson(SCORE_KEY, state);
}

/* ─── Risk items ───────────────────────────────────────────────────────── */

export type RiskItem = {
  id: string;
  category: string;
  severity: string;
  title: string;
  detail: string;
  action: string;
  impact: string;
  likelihood: string;
  timeline: string;
  createdAt: string;
};

const RISK_KEY = "atlas-user-risks-v1";

export function loadRiskItems(): RiskItem[] {
  return loadJson(RISK_KEY, []);
}

export function saveRiskItems(items: RiskItem[]) {
  saveJson(RISK_KEY, items);
}

export function enrichRisk(alert: {
  id: string;
  category: string;
  severity: string;
  title: string;
  detail: string;
  action: string;
}): RiskItem {
  const severity = alert.severity;
  return {
    ...alert,
    impact:
      severity === "High"
        ? "Could hit revenue, reputation, or compliance within days if ignored."
        : "Manageable if handled this week; watch for escalation.",
    likelihood:
      severity === "High" ? "Likely without intervention" : "Possible if trends continue",
    timeline: severity === "High" ? "Act within 48 hours" : "Act within 7 days",
    createdAt: "",
  };
}

export function createRiskItem(input: {
  title: string;
  category?: string;
  severity?: string;
  detail?: string;
  action?: string;
}): RiskItem {
  const severity = input.severity?.trim() || "Medium";
  return enrichRisk({
    id: newId("risk"),
    category: input.category?.trim() || "Operations",
    severity,
    title: input.title.trim() || "New risk",
    detail: input.detail?.trim() || "Owner-added risk watch item.",
    action: input.action?.trim() || "Review with Atlas and assign an owner.",
  });
}

/* ─── Call summaries ───────────────────────────────────────────────────── */

export type CallSummaryItem = {
  id: string;
  caller: string;
  when: string;
  notes: string;
  summary: string;
  needs: string;
  actions: string[];
  sentiment: string;
  mood: string;
  createdAt: string;
};

const CALLS_KEY = "atlas-user-call-summaries-v1";

export function loadCallSummaries(): CallSummaryItem[] {
  return loadJson(CALLS_KEY, []);
}

export function saveCallSummaries(items: CallSummaryItem[]) {
  saveJson(CALLS_KEY, items);
}

export function summarizeCall(input: { caller: string; notes: string }): CallSummaryItem {
  const notes = input.notes.trim();
  const lower = notes.toLowerCase();
  let summary = "Customer called. Atlas captured the conversation and drafted next steps.";
  let needs = "Follow up and confirm the next appointment window.";
  let actions = ["Log CRM note", "Send confirmation text"];
  let sentiment = "Neutral → Positive";
  let mood = "Businesslike";

  if (lower.includes("leak") || lower.includes("water") || lower.includes("sink")) {
    summary = "Plumbing issue reported. Photos requested; morning slot offered.";
    needs = "They need a tech on-site soon with leak-stop guidance until arrival.";
    actions = ["Create lead", "Request photos", "Offer morning slot"];
    sentiment = "Frustrated → Trusting";
    mood = "Urgent but polite";
  } else if (lower.includes("ac") || lower.includes("heat") || lower.includes("cool")) {
    summary = "HVAC discomfort reported. Appointment booked and confirmation drafted.";
    needs = "They need cooling restored and a clear arrival window.";
    actions = ["Book appointment", "Create estimate draft", "Text confirmation"];
    sentiment = "Concerned → Relieved";
    mood = "Anxious about comfort";
  } else if (lower.includes("quote") || lower.includes("price") || lower.includes("estimate")) {
    summary = "Caller asked about quote status and payment timing.";
    needs = "They need a clear status update and who must approve next.";
    actions = ["Share estimate status", "Flag owner approval"];
    sentiment = "Neutral → Positive";
    mood = "Businesslike";
  } else if (lower.includes("cancel") || lower.includes("reschedule")) {
    summary = "Caller wants to change timing. Atlas prepared reschedule options.";
    needs = "They need a new window without losing their preferred tech.";
    actions = ["Offer two slots", "Update calendar", "Confirm by text"];
    sentiment = "Neutral";
    mood = "Flexible";
  }

  return {
    id: newId("call"),
    caller: input.caller.trim() || "Unknown caller",
    when: "Just now",
    notes,
    summary,
    needs,
    actions,
    sentiment,
    mood,
    createdAt: nowIso(),
  };
}

/* ─── Knowledge docs ───────────────────────────────────────────────────── */

export type KnowledgeDoc = {
  id: string;
  name: string;
  type: string;
  status: string;
  pages: number;
  createdAt: string;
};

const KNOWLEDGE_KEY = "atlas-user-knowledge-v1";

export function loadKnowledgeDocs(): KnowledgeDoc[] {
  return loadJson(KNOWLEDGE_KEY, []);
}

export function saveKnowledgeDocs(items: KnowledgeDoc[]) {
  saveJson(KNOWLEDGE_KEY, items);
}

export function createKnowledgeDoc(fileName: string): KnowledgeDoc {
  const name = fileName || "Untitled document";
  const lower = name.toLowerCase();
  let type = "Document";
  if (lower.endsWith(".pdf")) type = "PDF";
  else if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.includes("price")) type = "Price sheet";
  else if (lower.endsWith(".docx") || lower.endsWith(".doc")) type = "Policies";
  else if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) type = "Images";
  else if (lower.endsWith(".mp4") || lower.endsWith(".mov")) type = "Video";
  else if (lower.endsWith(".zip")) type = "Contracts";

  return {
    id: newId("doc"),
    name,
    type,
    status: "Learning",
    pages: Math.max(1, Math.round(name.length / 8)),
    createdAt: nowIso(),
  };
}

/* ─── Computer audit log ───────────────────────────────────────────────── */

export type ComputerAuditEntry = {
  id: string;
  when: string;
  actor: string;
  action: string;
  createdAt: string;
};

const COMPUTER_AUDIT_KEY = "atlas-user-computer-audit-v1";

export function loadComputerAudit(): ComputerAuditEntry[] {
  return loadJson(COMPUTER_AUDIT_KEY, []);
}

export function saveComputerAudit(items: ComputerAuditEntry[]) {
  saveJson(COMPUTER_AUDIT_KEY, items);
}

export function appendComputerAudit(action: string, actor = "Atlas"): ComputerAuditEntry {
  const entry: ComputerAuditEntry = {
    id: newId("caudit"),
    when: "Just now",
    actor,
    action,
    createdAt: nowIso(),
  };
  const next = [entry, ...loadComputerAudit()].slice(0, 80);
  saveComputerAudit(next);
  return entry;
}
