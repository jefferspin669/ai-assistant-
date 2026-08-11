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
  // Seeded performance metrics (shown with context — never a single score).
  tasksCompletedTotal?: number;
  onTimePct?: number;
  avgCompletion?: string;
  csat?: number;
  attendancePct?: number;
  trainingProgress?: number;
  goals?: string[];
  achievements?: string[];
  // Leave balances, in days.
  ptoDays?: number;
  sickDays?: number;
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
  startedAt: string;
  completedAt: string;
  result: string;
  blockedAt: string;
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
    startedAt: raw.startedAt || "",
    completedAt: raw.completedAt || "",
    result: raw.result || "",
    blockedAt: raw.blockedAt || "",
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
    startedAt: "",
    completedAt: "",
    result: "",
    blockedAt: "",
    createdAt: now,
  };
}

/* ─── Task timing + blocking ───────────────────────────────────────────── */

export function startTask(task: TeamTask): TeamTask {
  return { ...task, status: "in_progress", startedAt: task.startedAt || nowIso(), blockedAt: "" };
}

export function completeTask(task: TeamTask, input: { result?: string; note?: string }): TeamTask {
  const completed: TeamTask = {
    ...task,
    status: "completed",
    completedAt: nowIso(),
    result: (input.result || "").trim() || task.result,
  };
  return input.note?.trim() ? addTaskNote(completed, input.note, "employee") : completed;
}

export function blockTask(task: TeamTask, reason?: string): TeamTask {
  const blocked: TeamTask = { ...task, status: "blocked", blockedAt: nowIso() };
  return reason?.trim() ? addTaskNote(blocked, `Blocked: ${reason.trim()}`, "employee") : blocked;
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

/* ─── Timekeeping (clock in/out + breaks) ──────────────────────────────── */

export type ShiftBreak = { start: string; end: string | null };
export type TimeShift = {
  id: string;
  memberId: string;
  date: string; // local yyyy-mm-dd of the clock-in
  clockIn: string;
  clockOut: string | null;
  breaks: ShiftBreak[];
};

const SHIFTS_KEY = "atlas-user-shifts-v1";
const WEEK_HOURS = 40;
const LATE_GRACE_MIN = 5;

export function loadShifts(): TimeShift[] {
  return loadJson<TimeShift[]>(SHIFTS_KEY, []);
}
export function saveShifts(shifts: TimeShift[]) {
  saveJson(SHIFTS_KEY, shifts);
}

export function getOpenShift(memberId: string, shifts = loadShifts()): TimeShift | null {
  // Only today's open shift is the "current" session; a past open shift is a
  // missing punch (surfaced separately), not an active clock-in.
  const today = todayISO();
  return (
    shifts.find((s) => s.memberId === memberId && s.clockOut === null && s.date === today) ?? null
  );
}

export function clockIn(memberId: string): TimeShift {
  const shifts = loadShifts();
  const open = getOpenShift(memberId, shifts);
  if (open) return open;
  const now = new Date();
  const shift: TimeShift = {
    id: newId("shift"),
    memberId,
    date: todayISO(now),
    clockIn: now.toISOString(),
    clockOut: null,
    breaks: [],
  };
  saveShifts([shift, ...shifts]);
  return shift;
}

export function startBreak(memberId: string): TimeShift | null {
  const shifts = loadShifts();
  const open = getOpenShift(memberId, shifts);
  if (!open) return null;
  const last = open.breaks[open.breaks.length - 1];
  if (last && last.end === null) return open; // already on break
  open.breaks.push({ start: nowIso(), end: null });
  saveShifts(shifts);
  return open;
}

export function endBreak(memberId: string): TimeShift | null {
  const shifts = loadShifts();
  const open = getOpenShift(memberId, shifts);
  if (!open) return null;
  const last = open.breaks[open.breaks.length - 1];
  if (last && last.end === null) last.end = nowIso();
  saveShifts(shifts);
  return open;
}

export function clockOut(memberId: string): TimeShift | null {
  const shifts = loadShifts();
  const open = getOpenShift(memberId, shifts);
  if (!open) return null;
  const last = open.breaks[open.breaks.length - 1];
  if (last && last.end === null) last.end = nowIso();
  open.clockOut = nowIso();
  saveShifts(shifts);
  return open;
}

export function isOnBreak(shift: TimeShift | null): boolean {
  if (!shift) return false;
  const last = shift.breaks[shift.breaks.length - 1];
  return Boolean(last && last.end === null);
}

function breakMs(shift: TimeShift, now: number): number {
  return shift.breaks.reduce((sum, b) => {
    const start = new Date(b.start).getTime();
    const end = b.end ? new Date(b.end).getTime() : now;
    return sum + Math.max(0, end - start);
  }, 0);
}

/** Net worked ms for a shift. Past shifts left open (missing punch) count 0. */
function shiftNetMs(shift: TimeShift, now: number, today = todayISO()): number {
  const start = new Date(shift.clockIn).getTime();
  let end: number;
  if (shift.clockOut) {
    end = new Date(shift.clockOut).getTime();
  } else if (shift.date === today) {
    end = now; // live open shift today
  } else {
    return 0; // missing punch on a past day
  }
  return Math.max(0, end - start - breakMs(shift, now));
}

export function formatHours(ms: number): string {
  const hours = ms / 3_600_000;
  return `${hours.toFixed(1)}h`;
}

export function formatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function parseClockToMinutes(label?: string): number {
  if (!label) return 8 * 60;
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return 8 * 60;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

export type Timesheet = {
  memberId: string;
  hoursToday: number;
  hoursWeek: number;
  overtime: number;
  lateClockIns: number;
  missingPunches: number;
  ptoDays: number;
  sickDays: number;
  clockedIn: boolean;
  onBreak: boolean;
};

export function timesheetFor(
  member: TeamPerson,
  shifts = loadShifts(),
  now: number = Date.now(),
): Timesheet {
  const today = todayISO(new Date(now));
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const mine = shifts.filter((s) => s.memberId === member.id);
  let todayMs = 0;
  let weekMs = 0;
  let late = 0;
  let missing = 0;
  const startMin = parseClockToMinutes(member.shiftStart);
  for (const shift of mine) {
    const inTime = new Date(shift.clockIn).getTime();
    const net = shiftNetMs(shift, now, today);
    if (shift.date === today) todayMs += net;
    if (inTime >= weekAgo) weekMs += net;
    // Late: clock-in later than shift start + grace.
    const inMin = new Date(shift.clockIn).getHours() * 60 + new Date(shift.clockIn).getMinutes();
    if (inTime >= weekAgo && inMin > startMin + LATE_GRACE_MIN) late += 1;
    // Missing punch: a past day left without a clock-out.
    if (!shift.clockOut && shift.date < today) missing += 1;
  }
  const weekHours = weekMs / 3_600_000;
  const open = getOpenShift(member.id, shifts);
  return {
    memberId: member.id,
    hoursToday: todayMs / 3_600_000,
    hoursWeek: weekHours,
    overtime: Math.max(0, weekHours - WEEK_HOURS),
    lateClockIns: late,
    missingPunches: missing,
    ptoDays: member.ptoDays ?? 0,
    sickDays: member.sickDays ?? 0,
    clockedIn: Boolean(open),
    onBreak: isOnBreak(open),
  };
}

/* ─── Employee AI assistant ────────────────────────────────────────────── */

export type AssistantAction = { label: string; kind: "focus" | "block" | "complete"; taskId: string };
export type AssistantReply = { text: string; actions: AssistantAction[] };

const PRIORITY_RANK: Record<TaskPriority, number> = { Urgent: 3, High: 2, Normal: 1, Low: 0 };

function rankTasks(tasks: TeamTask[]): TeamTask[] {
  return [...tasks].sort((a, b) => {
    const p = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    if (p !== 0) return p;
    if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    return a.dueDate ? -1 : 1;
  });
}

function dueContext(task: TeamTask, today = todayISO()): string {
  if (!task.dueDate) return "no due date";
  const d = task.dueDate.slice(0, 10);
  if (d < today) return "overdue";
  if (d === today) return "due today";
  return `due ${d}`;
}

export function employeeAssistantReply(
  member: TeamPerson,
  allTasks: TeamTask[],
  input: string,
): AssistantReply {
  const q = input.toLowerCase().trim();
  const mine = allTasks.filter((t) => t.memberId === member.id);
  const open = mine.filter((t) => isOpenTask(t.status));
  const ranked = rankTasks(open);
  const today = todayISO();

  // "I can't finish X" / blocked / missing / stuck / waiting on.
  if (/can'?t|cannot|blocked|stuck|missing|waiting on|held up/.test(q)) {
    const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    const match =
      open.find((t) => words.some((w) => t.title.toLowerCase().includes(w))) ?? null;
    if (match) {
      return {
        text: `Sounds like "${match.title}" is stuck. Want me to mark it blocked and alert your manager?`,
        actions: [{ label: `Mark "${match.title}" as blocked`, kind: "block", taskId: match.id }],
      };
    }
    return {
      text: "Which task is blocked? Tell me its name, or pick one from your board and I'll flag it for your manager.",
      actions: ranked.slice(0, 3).map((t) => ({ label: `Block "${t.title}"`, kind: "block" as const, taskId: t.id })),
    };
  }

  // "What do I need to finish today?" / remaining / priorities.
  if (/finish|today|remaining|left|priorit|what.*(do|should)|next/.test(q)) {
    if (open.length === 0) {
      return { text: "You're all caught up — no open tasks right now. Nice work!", actions: [] };
    }
    const top = ranked[0];
    return {
      text: `You have ${open.length} task${open.length === 1 ? "" : "s"} remaining. "${top.title}" is the highest priority because it's ${top.priority.toLowerCase()} priority and ${dueContext(top, today)}.`,
      actions: [{ label: `Start "${top.title}"`, kind: "focus", taskId: top.id }],
    };
  }

  // "I finished / done".
  if (/done|finished|complete/.test(q)) {
    const inProgress = open.find((t) => t.status === "in_progress") ?? ranked[0];
    if (inProgress) {
      return {
        text: `Great — mark "${inProgress.title}" complete and I'll record the finish time for your manager.`,
        actions: [{ label: `Complete "${inProgress.title}"`, kind: "complete", taskId: inProgress.id }],
      };
    }
  }

  const top = ranked[0];
  return {
    text:
      "I can help with your day. Try: \u201cWhat do I need to finish today?\u201d, tell me a task you\u2019re blocked on, or say you finished something." +
      (top ? ` Right now, "${top.title}" is your top priority.` : ""),
    actions: top ? [{ label: `Start "${top.title}"`, kind: "focus", taskId: top.id }] : [],
  };
}

/* ─── Manager alerts ───────────────────────────────────────────────────── */

export type ManagerAlert = {
  id: string;
  kind: "at_risk" | "blocked" | "approval" | "workload" | "scheduling";
  severity: "high" | "medium";
  title: string;
  detail: string;
  memberId?: string;
};

function checklistPct(task: TeamTask): number {
  if (task.checklist.length) {
    return Math.round((task.checklist.filter((c) => c.done).length / task.checklist.length) * 100);
  }
  if (task.status === "in_progress") return 50;
  if (task.status === "waiting" || task.status === "blocked") return 20;
  return 0;
}

function minutesSince(iso: string, now: number): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.round((now - t) / 60000));
}

export function computeManagerAlerts(
  members: TeamPerson[],
  tasks: TeamTask[],
  now: number = Date.now(),
): ManagerAlert[] {
  const today = todayISO(new Date(now));
  const alerts: ManagerAlert[] = [];
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "An employee";

  for (const task of tasks) {
    if (task.status === "completed") {
      // Waiting on approval.
      if (task.approvalRequired && task.approvalStatus === "pending" && task.completedAt) {
        const mins = minutesSince(task.completedAt, now);
        if (mins >= 1) {
          alerts.push({
            id: `approval-${task.id}`,
            kind: "approval",
            severity: mins >= 30 ? "high" : "medium",
            title: "Employee blocked",
            detail: `${nameOf(task.memberId)} has been waiting on manager approval for ${mins} minute${mins === 1 ? "" : "s"} on "${task.title}".`,
            memberId: task.memberId,
          });
        }
      }
      continue;
    }

    // Blocked tasks.
    if (task.status === "blocked") {
      const mins = task.blockedAt ? minutesSince(task.blockedAt, now) : 0;
      alerts.push({
        id: `blocked-${task.id}`,
        kind: "blocked",
        severity: "high",
        title: "Employee blocked",
        detail: `${nameOf(task.memberId)}'s "${task.title}" is blocked${mins ? ` (${mins} min)` : ""}.`,
        memberId: task.memberId,
      });
      continue;
    }

    // At-risk: high/urgent, due today or overdue, not done.
    const due = task.dueDate ? task.dueDate.slice(0, 10) : "";
    const highPri = task.priority === "High" || task.priority === "Urgent";
    if (highPri && due && due <= today) {
      const pct = checklistPct(task);
      if (due < today || pct < 70) {
        alerts.push({
          id: `risk-${task.id}`,
          kind: "at_risk",
          severity: due < today ? "high" : "medium",
          title: "Task at risk",
          detail: `${nameOf(task.memberId)}'s "${task.title}" is ${due < today ? "overdue" : "due today"} and only ${pct}% complete.`,
          memberId: task.memberId,
        });
      }
    }
  }

  // Workload imbalance.
  if (members.length >= 2) {
    const openCounts = members.map((m) => ({
      m,
      count: tasks.filter((t) => t.memberId === m.id && isOpenTask(t.status)).length,
    }));
    const avg = openCounts.reduce((s, x) => s + x.count, 0) / members.length;
    for (const { m, count } of openCounts) {
      if (count >= 5 && count >= avg * 1.7) {
        alerts.push({
          id: `workload-${m.id}`,
          kind: "workload",
          severity: "medium",
          title: "Workload imbalance",
          detail: `${m.name} has ${count} open tasks while the team average is ${avg.toFixed(1)}.`,
          memberId: m.id,
        });
      }
    }
  }

  // Scheduling overlap: multiple employees with meetings on the same upcoming day.
  const meetingDays = new Map<string, Set<string>>();
  for (const task of tasks) {
    if (task.kind === "meeting" && task.status !== "completed" && task.dueDate) {
      const d = task.dueDate.slice(0, 10);
      if (d >= today) {
        const set = meetingDays.get(d) ?? new Set<string>();
        set.add(task.memberId);
        meetingDays.set(d, set);
      }
    }
  }
  for (const [day, set] of meetingDays) {
    if (set.size >= 3) {
      alerts.push({
        id: `sched-${day}`,
        kind: "scheduling",
        severity: "medium",
        title: "Possible scheduling problem",
        detail: `${set.size} employees have appointments on ${day} — check for overlaps.`,
      });
    }
  }

  return alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));
}

/* ─── Employee performance summary ─────────────────────────────────────── */

export type PerformanceSummary = {
  tasksCompleted: number;
  onTimePct: number;
  avgCompletion: string;
  csat: number;
  attendancePct: number;
  trainingProgress: number;
  currentWorkload: number;
  completedInApp: number;
  goals: string[];
  achievements: string[];
};

export function performanceSummary(member: TeamPerson, tasks: TeamTask[]): PerformanceSummary {
  const mine = tasks.filter((t) => t.memberId === member.id);
  const completedInApp = mine.filter((t) => t.status === "completed").length;
  const currentWorkload = mine.filter((t) => isOpenTask(t.status)).length;
  return {
    tasksCompleted: member.tasksCompletedTotal ?? completedInApp,
    onTimePct: member.onTimePct ?? 0,
    avgCompletion: member.avgCompletion ?? "—",
    csat: member.csat ?? 0,
    attendancePct: member.attendancePct ?? 0,
    trainingProgress: member.trainingProgress ?? 0,
    currentWorkload,
    completedInApp,
    goals: member.goals ?? [],
    achievements: member.achievements ?? [],
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
  tasksCompletedTotal: number;
  onTimePct: number;
  avgCompletion: string;
  csat: number;
  attendancePct: number;
  trainingProgress: number;
  ptoDays: number;
  sickDays: number;
  goals: string[];
  achievements: string[];
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
    tasksCompletedTotal: 94,
    onTimePct: 96,
    avgCompletion: "2h 10m",
    csat: 4.8,
    attendancePct: 98,
    trainingProgress: 80,
    ptoDays: 6,
    sickDays: 3,
    goals: ["Lift on-time completion to 98%", "Finish the CRM certification"],
    achievements: ["100-task streak", "Top CSAT in Q2"],
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
    tasksCompletedTotal: 71,
    onTimePct: 92,
    avgCompletion: "3h 05m",
    csat: 4.7,
    attendancePct: 95,
    trainingProgress: 65,
    ptoDays: 4,
    sickDays: 2,
    goals: ["Complete the EPA refrigerant recert"],
    achievements: ["Fastest install time in March"],
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
    tasksCompletedTotal: 58,
    onTimePct: 89,
    avgCompletion: "2h 40m",
    csat: 4.6,
    attendancePct: 97,
    trainingProgress: 50,
    ptoDays: 5,
    sickDays: 1,
    goals: ["Reduce callbacks to under 3%"],
    achievements: ["Perfect attendance in Q1"],
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
  const shifts: TimeShift[] = [];

  const pushShift = (
    memberId: string,
    offset: number,
    inH: number,
    inM: number,
    opts: { outH?: number; outM?: number; missing?: boolean } = {},
  ) => {
    const inD = new Date();
    inD.setDate(inD.getDate() - offset);
    inD.setHours(inH, inM, 0, 0);
    const out = new Date(inD);
    out.setHours(opts.outH ?? 17, opts.outM ?? 0, 0, 0);
    const bStart = new Date(inD);
    bStart.setHours(12, 0, 0, 0);
    const bEnd = new Date(inD);
    bEnd.setHours(12, 45, 0, 0);
    shifts.push({
      id: newId("shift"),
      memberId,
      date: todayISO(inD),
      clockIn: inD.toISOString(),
      clockOut: opts.missing ? null : out.toISOString(),
      breaks: [{ start: bStart.toISOString(), end: bEnd.toISOString() }],
    });
  };

  DEMO_EMPLOYEES.forEach((demo, index) => {
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
      tasksCompletedTotal: demo.tasksCompletedTotal,
      onTimePct: demo.onTimePct,
      avgCompletion: demo.avgCompletion,
      csat: demo.csat,
      attendancePct: demo.attendancePct,
      trainingProgress: demo.trainingProgress,
      goals: demo.goals,
      achievements: demo.achievements,
      ptoDays: demo.ptoDays,
      sickDays: demo.sickDays,
      createdAt: nowIso(),
    };
    members.push(member);

    // Seed prior time shifts so the manager timesheet has real hours.
    if (index === 0) {
      pushShift(member.id, 1, 8, 0);
      pushShift(member.id, 2, 8, 22); // late clock-in
      pushShift(member.id, 3, 8, 0);
      pushShift(member.id, 4, 8, 0);
      pushShift(member.id, 5, 8, 0);
      pushShift(member.id, 6, 8, 0, { missing: true }); // missing punch
    } else {
      pushShift(member.id, 1, 8, 0, { outH: 16, outM: 30 });
      pushShift(member.id, 2, 8, 0, { outH: 16, outM: 30 });
      pushShift(member.id, 3, 8, 0, { outH: 16, outM: 30 });
      pushShift(member.id, 4, 8, 0, { outH: 16, outM: 30 });
    }

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
  });

  saveTeamMembers(members);
  saveTeamTasks([...tasks, ...loadTeamTasks()]);
  saveShifts([...shifts, ...loadShifts()]);
  return members;
}
