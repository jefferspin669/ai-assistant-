/** Client-owned workspace data — starts empty and accumulates via user actions. */

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

/* ─── Event AI ─────────────────────────────────────────────────────────── */

export type PlannedEvent = {
  id: string;
  title: string;
  type: string;
  guests: number;
  budget: number;
  date: string;
  notes: string;
  checklist: string[];
  budgetRows: { item: string; amount: string }[];
  createdAt: string;
};

const EVENTS_KEY = "atlas-user-events-v1";

export function loadEvents(): PlannedEvent[] {
  return loadJson(EVENTS_KEY, []);
}

export function saveEvents(events: PlannedEvent[]) {
  saveJson(EVENTS_KEY, events);
}

export function planEventFromInput(input: {
  title: string;
  type: string;
  guests: number;
  budget: number;
  date: string;
  notes?: string;
}): PlannedEvent {
  const guests = Math.max(1, input.guests || 20);
  const budget = Math.max(100, input.budget || 500);
  const food = Math.round(budget * 0.45);
  const decor = Math.round(budget * 0.18);
  const entertainment = Math.round(budget * 0.22);
  const misc = budget - food - decor - entertainment;
  const type = input.type.trim() || "Company events";

  return {
    id: newId("event"),
    title: input.title.trim() || `${type} plan`,
    type,
    guests,
    budget,
    date: input.date || "",
    notes: (input.notes || "").trim(),
    checklist: [
      `Confirm guest list (${guests})`,
      "Send invitations + track RSVPs",
      "Reserve venue or setup space",
      `Order food & cake within $${food}`,
      "Decorations + playlist",
      "Day-of timeline + reminders",
      input.date ? `Lock date: ${input.date}` : "Pick and lock a date",
    ],
    budgetRows: [
      { item: "Food & cake", amount: `$${food}` },
      { item: "Decorations", amount: `$${decor}` },
      { item: "Entertainment", amount: `$${entertainment}` },
      { item: "Misc / buffer", amount: `$${misc}` },
    ],
    createdAt: nowIso(),
  };
}

/* ─── Industry packs ───────────────────────────────────────────────────── */

export type IndustryTemplate = {
  id: string;
  name: string;
  body: string;
};

export type IndustryPack = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  templates: IndustryTemplate[];
  createdAt: string;
};

const PACKS_KEY = "atlas-user-industry-packs-v1";

export function loadIndustryPacks(): IndustryPack[] {
  return loadJson(PACKS_KEY, []);
}

export function saveIndustryPacks(packs: IndustryPack[]) {
  saveJson(PACKS_KEY, packs);
}

export function createIndustryPack(input: {
  name: string;
  emoji?: string;
  blurb?: string;
  templateName?: string;
  templateBody?: string;
}): IndustryPack {
  const name = input.name.trim() || "Custom pack";
  const templates: IndustryTemplate[] = [];
  if (input.templateName?.trim() || input.templateBody?.trim()) {
    templates.push({
      id: newId("tpl"),
      name: input.templateName?.trim() || "Starter template",
      body:
        input.templateBody?.trim() ||
        `Pricing language, FAQs, and booking rules for ${name}.`,
    });
  }
  return {
    id: newId("pack"),
    name,
    emoji: input.emoji?.trim() || "📦",
    blurb:
      input.blurb?.trim() ||
      `Pricing language, FAQs, booking rules, compliance cues, and templates tuned for ${name.toLowerCase()}.`,
    templates,
    createdAt: nowIso(),
  };
}

export function addTemplateToPack(
  packs: IndustryPack[],
  packId: string,
  template: { name: string; body: string },
): IndustryPack[] {
  return packs.map((pack) =>
    pack.id === packId
      ? {
          ...pack,
          templates: [
            ...pack.templates,
            {
              id: newId("tpl"),
              name: template.name.trim() || "Template",
              body: template.body.trim() || "New template body.",
            },
          ],
        }
      : pack,
  );
}

/* ─── App Store ────────────────────────────────────────────────────────── */

export type StoreModule = {
  id: string;
  name: string;
  category: string;
  blurb: string;
  installs: number;
  createdAt: string;
};

const STORE_KEY = "atlas-user-app-store-v1";
const INSTALLED_KEY = "atlas-user-app-installed-v1";

export function loadStoreModules(): StoreModule[] {
  return loadJson(STORE_KEY, []);
}

export function saveStoreModules(modules: StoreModule[]) {
  saveJson(STORE_KEY, modules);
}

export function loadInstalledModules(): Record<string, boolean> {
  return loadJson(INSTALLED_KEY, {});
}

export function saveInstalledModules(installed: Record<string, boolean>) {
  saveJson(INSTALLED_KEY, installed);
}

export function createStoreModule(input: {
  name: string;
  category: string;
  blurb?: string;
}): StoreModule {
  return {
    id: newId("mod"),
    name: input.name.trim() || "Untitled module",
    category: input.category.trim() || "Ops",
    blurb: input.blurb?.trim() || "Custom Atlas module.",
    installs: 1,
    createdAt: nowIso(),
  };
}

/* ─── AI Agent goals ───────────────────────────────────────────────────── */

export type AgentGoal = {
  id: string;
  goal: string;
  status: string;
  progress: number;
  atlas: string;
  steps: { label: string; done: boolean }[];
  createdAt: string;
};

const GOALS_KEY = "atlas-user-agent-goals-v1";

export function loadAgentGoals(): AgentGoal[] {
  return loadJson(GOALS_KEY, []);
}

export function saveAgentGoals(goals: AgentGoal[]) {
  saveJson(GOALS_KEY, goals);
}

export function planAgentGoal(prompt: string): AgentGoal {
  const q = prompt.toLowerCase();
  if (q.includes("second location") || q.includes("open a second")) {
    return {
      id: newId("goal"),
      goal: prompt.trim() || "Open a second location",
      status: "In progress",
      progress: 20,
      atlas:
        "Checklist created, cost estimate drafted, permits tracked, construction milestones watched, equipment ordered, owner brief every Friday.",
      steps: [
        { label: "Create checklist", done: true },
        { label: "Estimate costs", done: false },
        { label: "Coordinate permits", done: false },
        { label: "Track construction milestones", done: false },
        { label: "Order equipment", done: false },
        { label: "Keep owner updated", done: true },
      ],
      createdAt: nowIso(),
    };
  }
  if (q.includes("tuesday") || q.includes("fill")) {
    return {
      id: newId("goal"),
      goal: prompt.trim() || "Fill next week’s empty Tuesday",
      status: "Ready",
      progress: 40,
      atlas: "Waitlist texted, bookings staged, routes rebalanced, preferred techs queued.",
      steps: [
        { label: "Text waitlist", done: true },
        { label: "Confirm bookings", done: false },
        { label: "Rebalance routes", done: false },
        { label: "Assign preferred techs", done: false },
      ],
      createdAt: nowIso(),
    };
  }
  if (q.includes("wait") || q.includes("quality")) {
    return {
      id: newId("goal"),
      goal: prompt.trim() || "Fix long-wait quality issues",
      status: "In progress",
      progress: 25,
      atlas: "ETA texts drafted, calendar buffers protected, training coach assigned, goodwill offers queued.",
      steps: [
        { label: "Draft ETA texts", done: true },
        { label: "Protect morning buffers", done: false },
        { label: "Assign training coach", done: false },
        { label: "Send goodwill offers", done: false },
      ],
      createdAt: nowIso(),
    };
  }
  return {
    id: newId("goal"),
    goal: prompt.trim() || "New goal",
    status: "Planned",
    progress: 10,
    atlas: "Atlas drafted a checklist, owners, and update cadence from Brain.",
    steps: [
      { label: "Create checklist", done: true },
      { label: "Estimate costs / effort", done: false },
      { label: "Assign owners", done: false },
      { label: "Track milestones", done: false },
      { label: "Keep owner updated", done: false },
    ],
    createdAt: nowIso(),
  };
}

/* ─── Automation workflows ─────────────────────────────────────────────── */

export type WorkflowStep = { id: string; kind: string; label: string };

export type UserWorkflow = {
  id: string;
  name: string;
  blurb: string;
  steps: WorkflowStep[];
  enabled: boolean;
  createdAt: string;
};

const WORKFLOWS_KEY = "atlas-user-workflows-v1";

export function loadWorkflows(): UserWorkflow[] {
  return loadJson(WORKFLOWS_KEY, []);
}

export function saveWorkflows(workflows: UserWorkflow[]) {
  saveJson(WORKFLOWS_KEY, workflows);
}

export function createEmptyWorkflow(name = "Untitled workflow"): UserWorkflow {
  return {
    id: newId("wf"),
    name: name.trim() || "Untitled workflow",
    blurb: "Build trigger → actions. Add steps from the palette.",
    steps: [],
    enabled: false,
    createdAt: nowIso(),
  };
}

/* ─── Team members ─────────────────────────────────────────────────────── */

export type TeamPerson = {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
  rating: string;
  jobsThisWeek: number;
  /** Short code the employee uses (with their email) to sign in to their page. */
  accessCode?: string;
  department?: string;
  shiftStart?: string;
  shiftEnd?: string;
  createdAt: string;
};

export type TaskStatus = "not_started" | "in_progress" | "waiting" | "blocked" | "completed";
export type TaskPriority = "Low" | "Normal" | "High" | "Urgent";
export type TaskKind = "task" | "meeting";
export type TaskRecurrence = "one-time" | "daily" | "weekly" | "monthly";
export type ApprovalStatus = "not_required" | "pending" | "approved";

export type ChecklistItem = { id: string; label: string; done: boolean };
export type TaskAttachment = { id: string; name: string; addedBy: "manager" | "employee"; addedAt: string };
export type TaskNote = { id: string; text: string; author: "manager" | "employee"; at: string };

export type TeamTask = {
  id: string;
  memberId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  kind: TaskKind;
  startDate: string;
  dueDate: string;
  estimatedTime: string;
  department: string;
  project: string;
  goal: string;
  requiredResult: string;
  checklist: ChecklistItem[];
  attachments: TaskAttachment[];
  notes: TaskNote[];
  recurrence: TaskRecurrence;
  approvalRequired: boolean;
  approvalStatus: ApprovalStatus;
  createdAt: string;
};

export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "not_started", label: "Not started" },
  { id: "in_progress", label: "In progress" },
  { id: "waiting", label: "Waiting" },
  { id: "blocked", label: "Blocked" },
  { id: "completed", label: "Completed" },
];

export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Normal", "High", "Urgent"];

export function taskStatusLabel(status: TaskStatus): string {
  return TASK_STATUSES.find((s) => s.id === status)?.label ?? "Not started";
}

export function isOpenTask(status: TaskStatus): boolean {
  return status !== "completed";
}

const TEAM_KEY = "atlas-user-team-v1";
const TEAM_TASKS_KEY = "atlas-user-team-tasks-v1";

export function loadTeamMembers(): TeamPerson[] {
  return loadJson(TEAM_KEY, []);
}

export function saveTeamMembers(members: TeamPerson[]) {
  saveJson(TEAM_KEY, members);
}

function makeAccessCode() {
  // 6-char human-friendly code (no ambiguous 0/O/1/I).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function createTeamMember(input: {
  name: string;
  role?: string;
  email?: string;
}): TeamPerson {
  const name = input.name.trim() || "New teammate";
  return {
    id: newId("member"),
    name,
    role: input.role?.trim() || "Team member",
    email: input.email?.trim().toLowerCase() || `${name.toLowerCase().replace(/\s+/g, ".")}@business.local`,
    status: "Available",
    rating: "—",
    jobsThisWeek: 0,
    accessCode: makeAccessCode(),
    department: "Operations",
    shiftStart: "8:00 AM",
    shiftEnd: "4:30 PM",
    createdAt: nowIso(),
  };
}

/** Access code for a member, deriving a stable fallback for older records. */
export function employeeAccessCode(member: TeamPerson): string {
  if (member.accessCode) return member.accessCode;
  return member.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase().padStart(6, "X");
}

const LEGACY_STATUS_MAP: Record<string, TaskStatus> = {
  todo: "not_started",
  doing: "in_progress",
  done: "completed",
};

type RawTask = Omit<Partial<TeamTask>, "notes" | "status"> & { notes?: unknown; status?: string };

/** Upgrade older/simpler task records to the rich shape. */
function normalizeTask(raw: RawTask): TeamTask {
  const status = (LEGACY_STATUS_MAP[raw.status ?? ""] ??
    (TASK_STATUSES.some((s) => s.id === raw.status) ? (raw.status as TaskStatus) : "not_started")) as TaskStatus;

  let notes: TaskNote[] = [];
  if (Array.isArray(raw.notes)) {
    notes = raw.notes as TaskNote[];
  } else if (typeof raw.notes === "string" && raw.notes.trim()) {
    notes = [{ id: newId("note"), text: raw.notes.trim(), author: "manager", at: raw.createdAt || nowIso() }];
  }

  return {
    id: raw.id || newId("ttask"),
    memberId: raw.memberId || "",
    title: raw.title || "Untitled task",
    description: raw.description || "",
    status,
    priority: (raw.priority as TaskPriority) || "Normal",
    kind: (raw.kind as TaskKind) || "task",
    startDate: raw.startDate || "",
    dueDate: raw.dueDate || "",
    estimatedTime: raw.estimatedTime || "",
    department: raw.department || "",
    project: raw.project || "",
    goal: raw.goal || "",
    requiredResult: raw.requiredResult || "",
    checklist: Array.isArray(raw.checklist) ? (raw.checklist as ChecklistItem[]) : [],
    attachments: Array.isArray(raw.attachments) ? (raw.attachments as TaskAttachment[]) : [],
    notes,
    recurrence: (raw.recurrence as TaskRecurrence) || "one-time",
    approvalRequired: Boolean(raw.approvalRequired),
    approvalStatus: (raw.approvalStatus as ApprovalStatus) || (raw.approvalRequired ? "pending" : "not_required"),
    createdAt: raw.createdAt || nowIso(),
  };
}

export function loadTeamTasks(): TeamTask[] {
  return loadJson<RawTask[]>(TEAM_TASKS_KEY, []).map(normalizeTask);
}

export function saveTeamTasks(tasks: TeamTask[]) {
  saveJson(TEAM_TASKS_KEY, tasks);
}

export function createTeamTask(input: {
  memberId: string;
  title: string;
  description?: string;
  notes?: string;
  priority?: TaskPriority;
  kind?: TaskKind;
  startDate?: string;
  dueDate?: string;
  estimatedTime?: string;
  department?: string;
  project?: string;
  goal?: string;
  requiredResult?: string;
  checklist?: string[];
  attachments?: string[];
  recurrence?: TaskRecurrence;
  approvalRequired?: boolean;
}): TeamTask {
  const now = nowIso();
  const notes: TaskNote[] = input.notes?.trim()
    ? [{ id: newId("note"), text: input.notes.trim(), author: "manager", at: now }]
    : [];
  return {
    id: newId("ttask"),
    memberId: input.memberId,
    title: input.title.trim() || "Untitled task",
    description: (input.description || "").trim(),
    status: "not_started",
    priority: input.priority || "Normal",
    kind: input.kind || "task",
    startDate: input.startDate || "",
    dueDate: input.dueDate || "",
    estimatedTime: (input.estimatedTime || "").trim(),
    department: (input.department || "").trim(),
    project: (input.project || "").trim(),
    goal: (input.goal || "").trim(),
    requiredResult: (input.requiredResult || "").trim(),
    checklist: (input.checklist || [])
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label) => ({ id: newId("chk"), label, done: false })),
    attachments: (input.attachments || [])
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ id: newId("att"), name, addedBy: "manager" as const, addedAt: now })),
    notes,
    recurrence: input.recurrence || "one-time",
    approvalRequired: Boolean(input.approvalRequired),
    approvalStatus: input.approvalRequired ? "pending" : "not_required",
    createdAt: now,
  };
}

/* ─── Task board grouping + daily summary ──────────────────────────────── */

export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isToday(dateStr: string, today = todayISO()): boolean {
  return Boolean(dateStr) && dateStr.slice(0, 10) === today;
}

function isPast(dateStr: string, today = todayISO()): boolean {
  return Boolean(dateStr) && dateStr.slice(0, 10) < today;
}

export type TaskBoard = {
  urgent: TeamTask[];
  today: TeamTask[];
  upcoming: TeamTask[];
  completed: TeamTask[];
};

export function groupTasksForBoard(tasks: TeamTask[], today = todayISO()): TaskBoard {
  const board: TaskBoard = { urgent: [], today: [], upcoming: [], completed: [] };
  for (const task of tasks) {
    if (task.status === "completed") {
      board.completed.push(task);
      continue;
    }
    if (task.priority === "Urgent" || task.priority === "High" || task.status === "blocked" || isPast(task.dueDate, today)) {
      board.urgent.push(task);
    } else if (isToday(task.dueDate, today) || !task.dueDate) {
      board.today.push(task);
    } else {
      board.upcoming.push(task);
    }
  }
  return board;
}

export type DailySummary = {
  dueToday: number;
  highPriority: number;
  meetings: number;
  shift: string;
  percentComplete: number;
};

export function dailySummary(member: TeamPerson, tasks: TeamTask[], today = todayISO()): DailySummary {
  const mine = tasks.filter((t) => t.memberId === member.id);
  const todaysWork = mine.filter((t) => isToday(t.dueDate, today) || isPast(t.dueDate, today));
  const dueToday = mine.filter((t) => t.kind === "task" && isToday(t.dueDate, today) && t.status !== "completed").length;
  const highPriority = mine.filter(
    (t) => (t.priority === "High" || t.priority === "Urgent") && t.status !== "completed",
  ).length;
  const meetings = mine.filter((t) => t.kind === "meeting" && isToday(t.dueDate, today)).length;
  const done = todaysWork.filter((t) => t.status === "completed").length;
  const percentComplete = todaysWork.length ? Math.round((done / todaysWork.length) * 100) : 0;
  const shift =
    member.shiftStart && member.shiftEnd ? `${member.shiftStart}–${member.shiftEnd}` : "Not set";
  return { dueToday, highPriority, meetings, shift, percentComplete };
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Replace one task in a list (or prepend if new). */
export function replaceTask(all: TeamTask[], updated: TeamTask): TeamTask[] {
  return all.some((t) => t.id === updated.id)
    ? all.map((t) => (t.id === updated.id ? updated : t))
    : [updated, ...all];
}

export function addTaskNote(task: TeamTask, text: string, author: "manager" | "employee"): TeamTask {
  const trimmed = text.trim();
  if (!trimmed) return task;
  return {
    ...task,
    notes: [...task.notes, { id: newId("note"), text: trimmed, author, at: nowIso() }],
  };
}

export function addTaskAttachment(task: TeamTask, name: string, addedBy: "manager" | "employee"): TeamTask {
  const trimmed = name.trim();
  if (!trimmed) return task;
  return {
    ...task,
    attachments: [...task.attachments, { id: newId("att"), name: trimmed, addedBy, addedAt: nowIso() }],
  };
}

export function toggleChecklistItem(task: TeamTask, itemId: string): TeamTask {
  return {
    ...task,
    checklist: task.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)),
  };
}

/* ─── Employee portal: sign-in, presence, seeding ──────────────────────── */

const EMPLOYEE_SESSION_KEY = "atlas-employee-session-v1";
const PRESENCE_KEY = "atlas-employee-presence-v1";

/** No heartbeat within this window ⇒ treated as offline (the page/tab is closed). */
export const PRESENCE_OFFLINE_MS = 120_000;
/** While "Working", no interaction within this window ⇒ Atlas auto-marks "Away". */
export const PRESENCE_AWAY_MS = 60_000;

/** Statuses an employee can set for themselves. */
export type ManualStatus = "working" | "break" | "meeting" | "job" | "blocked" | "away";
/** Displayed status — manual choices plus the auto-detected "offline". */
export type EmployeeStatus = ManualStatus | "offline";

export const EMPLOYEE_STATUSES: { id: ManualStatus; label: string; emoji: string }[] = [
  { id: "working", label: "Working", emoji: "🟢" },
  { id: "break", label: "On break", emoji: "🟡" },
  { id: "meeting", label: "In meeting", emoji: "🔵" },
  { id: "job", label: "On customer job", emoji: "🟣" },
  { id: "blocked", label: "Waiting / blocked", emoji: "🟠" },
  { id: "away", label: "Away", emoji: "⚪" },
];

export const STATUS_META: Record<EmployeeStatus, { label: string; emoji: string }> = {
  working: { label: "Working", emoji: "🟢" },
  break: { label: "On break", emoji: "🟡" },
  meeting: { label: "In meeting", emoji: "🔵" },
  job: { label: "On customer job", emoji: "🟣" },
  blocked: { label: "Waiting / blocked", emoji: "🟠" },
  away: { label: "Away", emoji: "⚪" },
  offline: { label: "Offline", emoji: "🔴" },
};

export type EmployeePresence = {
  memberId: string;
  clockedIn: boolean;
  manualStatus: ManualStatus;
  currentTaskId: string | null;
  note: string;
  /** Updated by the heartbeat while the page is open (session liveness). */
  lastSeen: string;
  /** Updated on real interaction — the "basic activity" Atlas uses for auto-away. */
  lastActiveAt: string;
};

function defaultPresence(memberId: string): EmployeePresence {
  const now = nowIso();
  return {
    memberId,
    clockedIn: false,
    manualStatus: "working",
    currentTaskId: null,
    note: "",
    lastSeen: now,
    lastActiveAt: now,
  };
}

type LegacyPresence = Partial<EmployeePresence> & { online?: boolean; working?: boolean };

/** Upgrade older presence records (online/working booleans) to the status model. */
function normalizePresence(memberId: string, raw: LegacyPresence | undefined): EmployeePresence {
  if (!raw) return defaultPresence(memberId);
  if (raw.clockedIn === undefined && (raw.online !== undefined || raw.working !== undefined)) {
    const now = raw.lastSeen || nowIso();
    return {
      memberId,
      clockedIn: Boolean(raw.online),
      manualStatus: raw.working ? "working" : "break",
      currentTaskId: raw.currentTaskId ?? null,
      note: raw.note || "",
      lastSeen: now,
      lastActiveAt: now,
    };
  }
  return {
    memberId,
    clockedIn: Boolean(raw.clockedIn),
    manualStatus: (raw.manualStatus as ManualStatus) || "working",
    currentTaskId: raw.currentTaskId ?? null,
    note: raw.note || "",
    lastSeen: raw.lastSeen || nowIso(),
    lastActiveAt: raw.lastActiveAt || raw.lastSeen || nowIso(),
  };
}

/** Match an employee by email + access code (both case-insensitive). */
export function authenticateEmployee(email: string, code: string): TeamPerson | null {
  const wantEmail = email.trim().toLowerCase();
  const wantCode = code.trim().toUpperCase();
  if (!wantEmail || !wantCode) return null;
  const member = loadTeamMembers().find(
    (person) =>
      person.email.trim().toLowerCase() === wantEmail &&
      employeeAccessCode(person).toUpperCase() === wantCode,
  );
  return member ?? null;
}

export function loadEmployeeSession(): string | null {
  return loadJson<string | null>(EMPLOYEE_SESSION_KEY, null);
}

export function saveEmployeeSession(memberId: string | null) {
  if (typeof window === "undefined") return;
  if (memberId) {
    localStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(memberId));
  } else {
    localStorage.removeItem(EMPLOYEE_SESSION_KEY);
  }
}

/** The currently signed-in employee for this device, if any. */
export function loadSignedInEmployee(): TeamPerson | null {
  const id = loadEmployeeSession();
  if (!id) return null;
  return loadTeamMembers().find((person) => person.id === id) ?? null;
}

export function loadPresenceMap(): Record<string, EmployeePresence> {
  const raw = loadJson<Record<string, LegacyPresence>>(PRESENCE_KEY, {});
  const map: Record<string, EmployeePresence> = {};
  for (const [id, value] of Object.entries(raw)) map[id] = normalizePresence(id, value);
  return map;
}

export function savePresenceMap(map: Record<string, EmployeePresence>) {
  saveJson(PRESENCE_KEY, map);
}

export function getPresence(memberId: string): EmployeePresence {
  return loadPresenceMap()[memberId] ?? defaultPresence(memberId);
}

/**
 * Merge a presence update for one employee and bump lastSeen. Pass
 * `touchActive: true` for real user interactions so auto-away resets.
 */
export function updatePresence(
  memberId: string,
  patch: Partial<Omit<EmployeePresence, "memberId" | "lastSeen" | "lastActiveAt">> & {
    touchActive?: boolean;
  },
): EmployeePresence {
  const map = loadPresenceMap();
  const current = map[memberId] ?? defaultPresence(memberId);
  const { touchActive, ...rest } = patch;
  const now = nowIso();
  const next: EmployeePresence = {
    ...current,
    ...rest,
    memberId,
    lastSeen: now,
    lastActiveAt: touchActive ? now : current.lastActiveAt,
  };
  map[memberId] = next;
  savePresenceMap(map);
  return next;
}

/** Session liveness ping — keeps the employee "online" but does NOT count as activity. */
export function heartbeat(memberId: string): EmployeePresence {
  const map = loadPresenceMap();
  const current = map[memberId] ?? defaultPresence(memberId);
  const next: EmployeePresence = { ...current, lastSeen: nowIso() };
  map[memberId] = next;
  savePresenceMap(map);
  return next;
}

/** Record a real interaction (resets the auto-away idle timer). */
export function touchActivity(memberId: string): EmployeePresence {
  return updatePresence(memberId, { touchActive: true });
}

/** Resolve a presence record to a displayed status (auto offline/away applied). */
export function derivedStatus(
  presence: EmployeePresence | null | undefined,
  now: number = Date.now(),
): EmployeeStatus {
  if (!presence || !presence.clockedIn) return "offline";
  const seen = new Date(presence.lastSeen).getTime();
  if (!Number.isFinite(seen) || now - seen > PRESENCE_OFFLINE_MS) return "offline";
  const active = new Date(presence.lastActiveAt).getTime();
  if (presence.manualStatus === "working" && Number.isFinite(active) && now - active > PRESENCE_AWAY_MS) {
    return "away";
  }
  return presence.manualStatus;
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

type DemoTaskSeed = {
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  kind?: TaskKind;
  due?: "today" | "friday" | "";
  description?: string;
  goal?: string;
  requiredResult?: string;
  estimatedTime?: string;
  checklist?: string[];
  approvalRequired?: boolean;
};

type DemoEmployee = {
  name: string;
  role: string;
  department: string;
  email: string;
  accessCode: string;
  rating: string;
  jobsThisWeek: number;
  tasks: DemoTaskSeed[];
};

const DEMO_EMPLOYEES: DemoEmployee[] = [
  {
    name: "Sarah Williams",
    role: "Office Manager",
    department: "Front office",
    email: "sarah@business.local",
    accessCode: "SARAH1",
    rating: "4.9",
    jobsThisWeek: 12,
    tasks: [
      { title: "Call Johnson Construction", priority: "Urgent", due: "today", description: "Confirm the start date and 40% deposit.", goal: "Confirm the schedule", requiredResult: "Log the call outcome", estimatedTime: "30m" },
      { title: "Send revised quote", priority: "High", due: "today", description: "Apply the updated pricing and resend to the customer.", estimatedTime: "20m" },
      { title: "Update customer records", priority: "Normal", due: "today", status: "in_progress", estimatedTime: "45m" },
      { title: "Complete inventory check", priority: "Normal", due: "today", checklist: ["Filters", "Coolant", "Hand tools", "Safety gear"], estimatedTime: "1h" },
      { title: "Prepare Friday sales report", priority: "Normal", due: "friday", description: "Summarize the week's revenue and pipeline.", approvalRequired: true },
      { title: "Approve team timesheets", priority: "Normal", due: "today", status: "completed" },
      { title: "Morning route planning", priority: "Normal", due: "today", status: "completed" },
      { title: "Team standup", kind: "meeting", due: "today", description: "Daily 9:00 AM sync." },
      { title: "Client call: Elena Brooks", kind: "meeting", due: "today", description: "Review the maintenance plan." },
    ],
  },
  {
    name: "Alex Rivera",
    role: "Lead Technician",
    department: "Field ops",
    email: "alex@business.local",
    accessCode: "ALEX24",
    rating: "4.8",
    jobsThisWeek: 9,
    tasks: [
      { title: "Finish the Johnson AC install", priority: "High", due: "today", requiredResult: "Photograph the finished unit" },
      { title: "Restock the truck", priority: "Normal", due: "today", checklist: ["Filters", "Refrigerant", "Fittings"] },
    ],
  },
  {
    name: "Sam Patel",
    role: "Field Technician",
    department: "Field ops",
    email: "sam@business.local",
    accessCode: "SAM24X",
    rating: "4.7",
    jobsThisWeek: 7,
    tasks: [
      { title: "Morning maintenance route", priority: "Normal", due: "today" },
    ],
  },
];

/**
 * Seed a small demo team (with known access codes and realistic tasks) the
 * first time the workforce features are opened, so the portal is usable
 * immediately. No-op once any team member exists.
 */
export function seedDemoTeamIfEmpty(): TeamPerson[] {
  const existing = loadTeamMembers();
  if (existing.length > 0) return existing;

  const today = todayISO();
  const friday = todayISO(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
  const dueFor = (due?: DemoTaskSeed["due"]) =>
    due === "today" ? today : due === "friday" ? friday : "";

  const members: TeamPerson[] = [];
  const tasks: TeamTask[] = [];
  for (const demo of DEMO_EMPLOYEES) {
    const member: TeamPerson = {
      id: newId("member"),
      name: demo.name,
      role: demo.role,
      email: demo.email,
      status: "Available",
      rating: demo.rating,
      jobsThisWeek: demo.jobsThisWeek,
      accessCode: demo.accessCode,
      department: demo.department,
      shiftStart: "8:00 AM",
      shiftEnd: "4:30 PM",
      createdAt: nowIso(),
    };
    members.push(member);
    for (const seed of demo.tasks) {
      const base = createTeamTask({
        memberId: member.id,
        title: seed.title,
        description: seed.description,
        priority: seed.priority,
        kind: seed.kind,
        dueDate: dueFor(seed.due),
        estimatedTime: seed.estimatedTime,
        department: demo.department,
        goal: seed.goal,
        requiredResult: seed.requiredResult,
        checklist: seed.checklist,
        approvalRequired: seed.approvalRequired,
      });
      tasks.push(seed.status ? { ...base, status: seed.status } : base);
    }
  }
  saveTeamMembers(members);
  saveTeamTasks([...tasks, ...loadTeamTasks()]);
  return members;
}
