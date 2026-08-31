/** Client-owned workspace data — starts empty and accumulates via user actions. */

import { isDemoWorkspace } from "@/lib/workspace-mode";
import { appointments as dataAppointments, customers as dataCustomers, quotes as dataQuotes } from "./data";

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
  phone?: string;
  managerId?: string;
  permissions?: string[];
  jobTitle?: string;
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
  perfFeedback?: string;
  // Leave balances, in days.
  ptoDays?: number;
  sickDays?: number;
  // Skills used for shift qualification, and physical work location.
  qualifications?: string[];
  location?: string;
  // Profile.
  employeeId?: string;
  startDate?: string;
  skills?: { name: string; level: number }[];
  earnedAchievements?: string[];
  createdAt: string;
};

export const ACHIEVEMENT_BADGES: { id: string; emoji: string; title: string; desc: string }[] = [
  { id: "perfect_week", emoji: "🏆", title: "Perfect Week", desc: "All tasks completed on time." },
  { id: "streak10", emoji: "🔥", title: "10-Day Streak", desc: "Active ten days running." },
  { id: "customer_favorite", emoji: "⭐", title: "Customer Favorite", desc: "Top customer ratings." },
  { id: "goal_crusher", emoji: "🎯", title: "Goal Crusher", desc: "Beat a goal." },
  { id: "problem_solver", emoji: "💡", title: "Problem Solver", desc: "Unblocked a tricky issue." },
  { id: "team_player", emoji: "🤝", title: "Team Player", desc: "Helped teammates." },
];

export type TaskStatus = "not_started" | "in_progress" | "waiting" | "blocked" | "completed";
export type TaskPriority = "Low" | "Normal" | "High" | "Urgent";
export type TaskKind = "task" | "meeting";
export type TaskRecurrence = "one-time" | "daily" | "weekly" | "monthly";
export type ApprovalStatus = "not_required" | "pending" | "approved" | "changes_requested" | "rejected";
export type ApprovalAction = "submitted" | "approved" | "changes_requested" | "rejected";

export type ChecklistItem = { id: string; label: string; done: boolean };
export type TaskAttachment = { id: string; name: string; addedBy: "manager" | "employee"; addedAt: string };
export type TaskNote = { id: string; text: string; author: "manager" | "employee" | "atlas"; at: string };
export type ApprovalEntry = { action: ApprovalAction; by: string; at: string; note?: string };
export type TaskPart = { id: string; memberId: string; label: string; status: TaskStatus };

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
  approvalLog: ApprovalEntry[];
  startedAt: string;
  completedAt: string;
  result: string;
  blockedAt: string;
  blockReason: string;
  dueTime: string;
  assignedBy: string;
  progress: number; // explicit 0-100; 0 means "derive from checklist/status"
  timeSpentMs: number;
  dependencies: string[];
  dependsOn: string[]; // ids of upstream tasks that must complete first
  parts: TaskPart[]; // for shared/team tasks
  people: string[];
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
  phone?: string;
  department?: string;
  managerId?: string;
  permissions?: string[];
  jobTitle?: string;
}): TeamPerson {
  const name = input.name.trim() || "New teammate";
  return {
    id: newId("member"),
    name,
    role: input.role?.trim() || input.jobTitle?.trim() || "Team member",
    jobTitle: input.jobTitle?.trim() || input.role?.trim() || "Team member",
    email: input.email?.trim().toLowerCase() || `${name.toLowerCase().replace(/\s+/g, ".")}@business.local`,
    phone: input.phone?.trim() || "",
    managerId: input.managerId,
    permissions: input.permissions ?? ["tasks", "calendar", "messages"],
    status: "Available",
    rating: "—",
    jobsThisWeek: 0,
    accessCode: makeAccessCode(),
    department: input.department?.trim() || "Operations",
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
    approvalLog: Array.isArray(raw.approvalLog) ? (raw.approvalLog as ApprovalEntry[]) : [],
    startedAt: raw.startedAt || "",
    completedAt: raw.completedAt || "",
    result: raw.result || "",
    blockedAt: raw.blockedAt || "",
    blockReason: raw.blockReason || "",
    dueTime: raw.dueTime || "",
    assignedBy: raw.assignedBy || "Manager",
    progress: typeof raw.progress === "number" ? raw.progress : 0,
    timeSpentMs: typeof raw.timeSpentMs === "number" ? raw.timeSpentMs : 0,
    dependencies: Array.isArray(raw.dependencies) ? (raw.dependencies as string[]) : [],
    dependsOn: Array.isArray(raw.dependsOn) ? (raw.dependsOn as string[]) : [],
    parts: Array.isArray(raw.parts) ? (raw.parts as TaskPart[]) : [],
    people: Array.isArray(raw.people) ? (raw.people as string[]) : [],
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
  dueTime?: string;
  assignedBy?: string;
  progress?: number;
  dependencies?: string[];
  people?: string[];
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
    approvalStatus: "not_required",
    approvalLog: [],
    startedAt: "",
    completedAt: "",
    result: "",
    blockedAt: "",
    blockReason: "",
    dueTime: (input.dueTime || "").trim(),
    assignedBy: (input.assignedBy || "Manager").trim(),
    progress: input.progress ?? 0,
    timeSpentMs: 0,
    dependencies: input.dependencies ?? [],
    dependsOn: [],
    parts: [],
    people: input.people ?? [],
    createdAt: now,
  };
}

/* ─── Task dependencies + shared parts ─────────────────────────────────── */

export type DependencyStatus = { ready: boolean; blockers: TeamTask[] };

export function dependencyStatus(task: TeamTask, allTasks: TeamTask[]): DependencyStatus {
  const blockers = task.dependsOn
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t): t is TeamTask => Boolean(t) && t!.status !== "completed");
  return { ready: blockers.length === 0, blockers };
}

/** Walk the dependency chain to the first incomplete upstream task (bottleneck). */
export function bottleneckOf(task: TeamTask, allTasks: TeamTask[]): TeamTask | null {
  const seen = new Set<string>();
  let cursor: TeamTask | null = task;
  let bottleneck: TeamTask | null = null;
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    const upstream: TeamTask | undefined = cursor.dependsOn
      .map((id) => allTasks.find((t) => t.id === id))
      .find((t) => t && t.status !== "completed");
    if (!upstream) break;
    bottleneck = upstream;
    cursor = upstream;
  }
  return bottleneck;
}

export function isShared(task: TeamTask): boolean {
  return task.parts.length > 0;
}

export function sharedProgress(task: TeamTask): number {
  if (!task.parts.length) return taskProgress(task);
  const done = task.parts.filter((p) => p.status === "completed").length;
  return Math.round((done / task.parts.length) * 100);
}

export function updateTaskPart(task: TeamTask, partId: string, status: TaskStatus): TeamTask {
  return { ...task, parts: task.parts.map((p) => (p.id === partId ? { ...p, status } : p)) };
}

/* ─── Task timing + blocking + approval workflow ───────────────────────── */

/** 0-100 progress: explicit value if set, else checklist ratio, else status. */
export function taskProgress(task: TeamTask): number {
  if (task.status === "completed") return 100;
  if (task.progress > 0) return Math.min(100, task.progress);
  if (task.checklist.length) {
    return Math.round((task.checklist.filter((c) => c.done).length / task.checklist.length) * 100);
  }
  if (task.status === "in_progress") return 50;
  if (task.status === "waiting") return 30;
  if (task.status === "blocked") return 20;
  return 0;
}

/** Total time spent, including the live segment if the task is running. */
export function elapsedMs(task: TeamTask, now: number = Date.now()): number {
  const live = task.status === "in_progress" && task.startedAt ? now - new Date(task.startedAt).getTime() : 0;
  return task.timeSpentMs + Math.max(0, live);
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function startTask(task: TeamTask): TeamTask {
  return { ...task, status: "in_progress", startedAt: task.startedAt || nowIso(), blockedAt: "" };
}

/** Pause: bank the running segment into timeSpentMs and stop the timer. */
export function pauseTask(task: TeamTask): TeamTask {
  const banked = task.startedAt ? Date.now() - new Date(task.startedAt).getTime() : 0;
  return { ...task, timeSpentMs: task.timeSpentMs + Math.max(0, banked), startedAt: "" };
}

/**
 * Complete a task. If it requires approval, the work is submitted and held in
 * "Awaiting manager approval" (approvalStatus "pending") instead of finishing.
 */
export function completeTask(task: TeamTask, input: { result?: string; note?: string }): TeamTask {
  const now = nowIso();
  const banked = task.startedAt ? Date.now() - new Date(task.startedAt).getTime() : 0;
  let updated: TeamTask = {
    ...task,
    status: "completed",
    completedAt: now,
    startedAt: "",
    timeSpentMs: task.timeSpentMs + Math.max(0, banked),
    result: (input.result || "").trim() || task.result,
  };
  if (task.approvalRequired) {
    updated = {
      ...updated,
      approvalStatus: "pending",
      approvalLog: [...task.approvalLog, { action: "submitted", by: "employee", at: now }],
    };
  }
  return input.note?.trim() ? addTaskNote(updated, input.note, "employee") : updated;
}

export function awaitingApproval(task: TeamTask): boolean {
  return task.approvalRequired && task.approvalStatus === "pending";
}

/** Manager decision on a submitted task; keeps an audit trail. */
export function decideApproval(
  task: TeamTask,
  action: "approved" | "changes_requested" | "rejected",
  note?: string,
): TeamTask {
  const entry: ApprovalEntry = { action, by: "manager", at: nowIso(), note: note?.trim() || undefined };
  const log = [...task.approvalLog, entry];
  if (action === "approved") {
    return { ...task, approvalStatus: "approved", approvalLog: log };
  }
  // Changes requested / rejected send the task back to the employee.
  const bounced: TeamTask = {
    ...task,
    approvalStatus: action,
    status: "in_progress",
    completedAt: "",
    approvalLog: log,
  };
  return note?.trim()
    ? addTaskNote(bounced, `${action === "rejected" ? "Rejected" : "Changes requested"}: ${note.trim()}`, "manager")
    : bounced;
}

/** Detect "waiting on X" in a comment so Atlas can set the status automatically. */
export function detectWaitingOn(text: string): string | null {
  const m = text.match(/waiting on (?:the )?([a-z0-9][a-z0-9 &'-]{1,40})/i);
  if (!m) return null;
  let who = m[1].trim().replace(/[.,;!?]+$/, "");
  // Trim trailing filler words.
  who = who.replace(/\b(report|number|numbers|data|team|department|dept|to|for|before)\b\s*$/i, "").trim();
  if (!who) return null;
  return who.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Add a comment to a task. If the text says "waiting on X", Atlas sets the
 * status to Waiting and appends a short system note.
 */
export function addTaskComment(
  task: TeamTask,
  text: string,
  author: "manager" | "employee",
): { task: TeamTask; autoWaiting: string | null } {
  let updated = addTaskNote(task, text, author);
  const who = detectWaitingOn(text);
  if (who && updated.status !== "completed") {
    updated = addTaskNote({ ...updated, status: "waiting" }, `Atlas set status: Waiting on ${who}`, "atlas");
    return { task: updated, autoWaiting: who };
  }
  return { task: updated, autoWaiting: null };
}

/** Reasons an employee can give when blocked; drives who Atlas notifies. */
export const BLOCK_REASONS: { id: string; label: string; clause: string; notify: string }[] = [
  { id: "manager", label: "Waiting for manager", clause: "they're waiting on a manager", notify: "your manager" },
  { id: "customer", label: "Waiting for customer", clause: "they're waiting on the customer", notify: "the account owner" },
  { id: "info", label: "Missing information", clause: "information is missing", notify: "your manager" },
  { id: "equipment", label: "Equipment problem", clause: "of an equipment problem", notify: "the ops team" },
  { id: "technical", label: "Technical issue", clause: "of a technical issue", notify: "IT support" },
  { id: "assistance", label: "Need assistance", clause: "they need assistance", notify: "the team" },
  { id: "other", label: "Other", clause: "", notify: "your manager" },
];

export function blockTask(task: TeamTask, reason?: string): TeamTask {
  const banked = task.startedAt ? Date.now() - new Date(task.startedAt).getTime() : 0;
  const clause = (reason || "").trim();
  const blocked: TeamTask = {
    ...task,
    status: "blocked",
    blockedAt: nowIso(),
    blockReason: clause,
    startedAt: "",
    timeSpentMs: task.timeSpentMs + Math.max(0, banked),
  };
  return clause ? addTaskNote(blocked, `Blocked: ${clause}`, "employee") : blocked;
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

export type PriorityBoard = {
  doNow: TeamTask[];
  today: TeamTask[];
  comingUp: TeamTask[];
  whenever: TeamTask[];
  completed: TeamTask[];
};

/** Auto-organize into Do Now / Today / Coming Up / Whenever. */
export function smartPriorities(tasks: TeamTask[], today = todayISO()): PriorityBoard {
  const b: PriorityBoard = { doNow: [], today: [], comingUp: [], whenever: [], completed: [] };
  for (const t of tasks) {
    if (t.status === "completed") {
      b.completed.push(t);
      continue;
    }
    const due = t.dueDate ? t.dueDate.slice(0, 10) : "";
    if (t.priority === "Urgent" || t.status === "blocked" || (due && due < today)) {
      b.doNow.push(t);
    } else if (t.priority === "High" || due === today) {
      b.today.push(t);
    } else if (due && due > today) {
      b.comingUp.push(t);
    } else {
      b.whenever.push(t);
    }
  }
  return b;
}

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

export function addTaskNote(task: TeamTask, text: string, author: "manager" | "employee" | "atlas"): TeamTask {
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
  const denial = permissionDenialFor(member, input);
  if (denial) return { text: denial, actions: [] };
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

/* ─── Atlas sidebar assistant (everywhere, permission-scoped) ──────────── */

export type SidebarReply = { text: string; items: string[] };

export function atlasSidebarReply(member: TeamPerson, input: string, now: number = Date.now()): SidebarReply {
  const denial = permissionDenialFor(member, input);
  if (denial) return { text: denial, items: [] };
  const q = input.toLowerCase().trim();
  const today = todayISO(new Date(now));
  const mine = loadTeamTasks().filter((t) => t.memberId === member.id);
  const open = mine.filter((t) => isOpenTask(t.status));
  const docs = documentsForEmployee(member.id);
  const training = trainingForMember(member.id);
  const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 3);

  // What's due today?
  if (/due today|what.*due|today'?s? work|what.*work on/.test(q)) {
    const due = open.filter((t) => t.kind === "task" && t.dueDate.slice(0, 10) === today);
    const meetings = mine.filter((t) => t.kind === "meeting" && t.dueDate.slice(0, 10) === today);
    return {
      text: `You have ${due.length} task${due.length === 1 ? "" : "s"} and ${meetings.length} meeting${meetings.length === 1 ? "" : "s"} due today.`,
      items: [...due, ...meetings].map((t) => `${t.dueTime ? `${t.dueTime} · ` : ""}${t.title}`),
    };
  }

  // Work memory: "what did we do last time…".
  if (/last time|previous|before|remember|history|what did we do|earlier|past/.test(q)) {
    const hits = searchMemory(member, input);
    if (hits.length) {
      const top = hits[0];
      return {
        text: `Last time: ${top.title}. ${top.detail}`,
        items: [...top.docs.map((d) => `📄 ${d}`), ...hits.slice(1, 3).map((h) => `Related: ${h.title}`)],
      };
    }
    return { text: "I don't have a matching memory for that yet — it may be a first.", items: [] };
  }

  // Company wiki: "how do refunds work", "what's our bad-weather policy".
  if (/how (do|does|to|can)|what'?s our|what is our|policy|procedure/.test(q)) {
    const hits = searchWiki(input);
    if (hits.length) {
      const a = hits[0];
      return { text: a.answer, items: [`📚 Source: ${a.source}`, ...hits.slice(1, 3).map((h) => `Related: ${h.question}`)] };
    }
  }

  // Find a document / contract / file.
  if (/find|where.*(is|are)|contract|document|file|policy|handbook/.test(q)) {
    const hits = docs.filter((d) => words.some((w) => d.title.toLowerCase().includes(w) || d.category.toLowerCase().includes(w)));
    const list = hits.length ? hits : docs;
    return {
      text: hits.length ? "Here's what I found in your documents:" : "Here are the documents you can access:",
      items: list.map((d) => `${d.title} (${d.category})`),
    };
  }

  // How do I handle X? / refund guidance.
  if (/how do i|how to|handle|refund|process/.test(q)) {
    if (/refund/.test(q)) {
      return {
        text: "Refund process (per policy):",
        items: [
          "Confirm the order and reason in the customer record.",
          "Check it's within the refund window and amount limits.",
          "If over your limit, request manager approval.",
          "Issue the refund and log the outcome on the task.",
        ],
      };
    }
    return {
      text: "Here's the general playbook — check the linked policy for specifics:",
      items: ["Confirm the details.", "Follow the documented steps.", "Escalate to your manager if it's outside policy.", "Log what you did."],
    };
  }

  // Summarize a project.
  if (/summariz|summary|project/.test(q)) {
    const projects = [...new Set(mine.map((t) => t.project).filter(Boolean))];
    const target = projects.find((p) => words.some((w) => p.toLowerCase().includes(w))) ?? projects[0];
    if (target) {
      const pt = mine.filter((t) => t.project === target);
      const done = pt.filter((t) => t.status === "completed").length;
      return {
        text: `Project "${target}": ${pt.length} tasks, ${done} done, ${pt.length - done} open.`,
        items: pt.map((t) => `${t.title} — ${taskStatusLabel(t.status)}`),
      };
    }
    return { text: "You're not on any projects with tasks yet.", items: [] };
  }

  // Draft a reply.
  if (/draft|write|reply|respond|email/.test(q)) {
    return {
      text: "Here's a draft you can adjust:",
      items: [
        `Hi there — thanks for reaching out. I've reviewed your request and I'm on it. I'll follow up with next steps shortly. Best, ${member.name.split(" ")[0]}.`,
      ],
    };
  }

  // Who should I contact?
  if (/who.*(contact|ask|talk|reach)|escalate/.test(q)) {
    let route = "your manager";
    if (/it|technical|system|login|computer/.test(q)) route = "IT support";
    else if (/hr|benefit|payroll|leave/.test(q)) route = "HR";
    else if (/finance|pricing|invoice|billing/.test(q)) route = "Finance (via your manager)";
    else if (/customer|account|client/.test(q)) route = "the account team";
    return { text: `For that, contact ${route}. Want me to open a Need-Help request?`, items: [] };
  }

  // Training guide.
  if (/training|guide|learn|course/.test(q)) {
    return {
      text: "Your training modules:",
      items: training.map((m) => `${m.name} — ${m.progress >= 100 ? "complete" : `${m.progress}%`}`),
    };
  }

  // Fall back to the task-focused assistant.
  const r = employeeAssistantReply(member, mine, input);
  return { text: r.text, items: r.actions.map((a) => a.label) };
}

/* ─── Daily brief + end-of-day summary + help routing ──────────────────── */

export function dailyBrief(member: TeamPerson, tasks: TeamTask[], now: number = Date.now()): string[] {
  const today = todayISO(new Date(now));
  const mine = tasks.filter((t) => t.memberId === member.id);
  const dueToday = mine.filter((t) => t.kind === "task" && t.dueDate.slice(0, 10) === today && t.status !== "completed");
  const high = mine.filter((t) => (t.priority === "High" || t.priority === "Urgent") && t.status !== "completed");
  const meetingsToday = mine
    .filter((t) => t.kind === "meeting" && t.dueDate.slice(0, 10) === today && t.dueTime)
    .sort((a, b) => (parseClockToMinutes(a.dueTime) < parseClockToMinutes(b.dueTime) ? -1 : 1));
  const topDue = mine
    .filter((t) => t.status !== "completed" && t.dueTime && t.dueDate.slice(0, 10) === today)
    .sort((a, b) => (PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]))[0];
  const waiting = mine.filter((t) => t.status === "waiting");
  const overdue = mine.filter((t) => isOpenTask(t.status) && t.dueDate && t.dueDate.slice(0, 10) < today);

  const lines: string[] = [];
  lines.push(`You have ${dueToday.length} task${dueToday.length === 1 ? "" : "s"} today.`);
  if (high.length) lines.push(`${high.length} ${high.length === 1 ? "is" : "are"} high priority.`);
  if (meetingsToday[0]) lines.push(`Your first meeting begins at ${meetingsToday[0].dueTime}.`);
  if (topDue && topDue.dueTime) lines.push(`The ${topDue.title} is due at ${topDue.dueTime}.`);
  if (waiting[0]) lines.push(`You're waiting on ${waiting[0].blockReason || "someone"} for one task.`);
  lines.push(overdue.length ? `You have ${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}.` : "You have no overdue work.");
  return lines;
}

export type EndOfDay = { completed: number; moved: number; blocked: number; meetings: number; compliments: number };

export function endOfDaySummary(member: TeamPerson, tasks: TeamTask[], now: number = Date.now()): EndOfDay {
  const today = todayISO(new Date(now));
  const mine = tasks.filter((t) => t.memberId === member.id);
  return {
    completed: mine.filter((t) => t.status === "completed").length,
    moved: mine.filter((t) => isOpenTask(t.status) && t.dueDate.slice(0, 10) === today).length,
    blocked: mine.filter((t) => t.status === "blocked").length,
    meetings: mine.filter((t) => t.kind === "meeting" && t.dueDate.slice(0, 10) === today).length,
    compliments: recognitionsFor(member.id).length,
  };
}

export const HELP_CATEGORIES: { id: string; label: string; route: string }[] = [
  { id: "manager", label: "Manager Help", route: "your manager" },
  { id: "it", label: "IT Problem", route: "IT support" },
  { id: "hr", label: "HR Question", route: "HR" },
  { id: "customer", label: "Customer Problem", route: "the account team" },
  { id: "equipment", label: "Equipment Problem", route: "the ops team" },
  { id: "atlas", label: "Atlas AI Help", route: "Atlas" },
];

/* ─── Personal inbox (unified notifications) ───────────────────────────── */

export type InboxItem = { id: string; emoji: string; text: string; ago: string; ts: number };

export function inboxItems(member: TeamPerson, now: number = Date.now()): InboxItem[] {
  const items: InboxItem[] = [];
  const mine = loadTeamTasks().filter((t) => t.memberId === member.id);

  for (const t of mine) {
    for (const e of t.approvalLog) {
      if (e.by !== "manager") continue;
      const label =
        e.action === "changes_requested"
          ? `Manager requested changes to ${t.title}`
          : e.action === "approved"
            ? `${t.title} was approved`
            : e.action === "rejected"
              ? `${t.title} was rejected`
              : "";
      if (label) items.push({ id: `appr-${t.id}-${e.at}`, emoji: e.action === "approved" ? "✅" : "✏️", text: label, ago: relativeTime(e.at, now), ts: new Date(e.at).getTime() });
    }
    if (t.status === "not_started") {
      items.push({ id: `task-${t.id}`, emoji: "🗒️", text: `New task assigned: ${t.title}`, ago: relativeTime(t.createdAt, now), ts: new Date(t.createdAt).getTime() });
    }
  }

  for (const r of loadTimeOff().filter((r) => r.memberId === member.id)) {
    if (r.status !== "pending" && r.decidedAt) {
      items.push({ id: `pto-${r.id}`, emoji: r.status === "approved" ? "✅" : "⛔", text: `PTO request ${r.status}`, ago: relativeTime(r.decidedAt, now), ts: new Date(r.decidedAt).getTime() });
    }
  }

  for (const c of certsForMember(member.id)) {
    const days = Math.ceil((new Date(c.expires).getTime() - now) / 86_400_000);
    if (days <= 30) {
      items.push({ id: `cert-${c.id}`, emoji: "📅", text: days < 0 ? `${c.name} expired` : `${c.name} expires in ${days} day${days === 1 ? "" : "s"}`, ago: "", ts: now });
    }
  }

  const chanIds = new Set(channelsForEmployee(member).map((c) => c.id));
  for (const m of loadMessages()) {
    if (chanIds.has(m.channelId) && m.authorId !== member.id) {
      items.push({ id: `msg-${m.id}`, emoji: "💬", text: `New message from ${m.authorName}`, ago: relativeTime(m.at, now), ts: new Date(m.at).getTime() });
    }
  }

  for (const a of loadAnnouncements().filter((a) => !a.acks.includes(member.id))) {
    items.push({ id: `ann-${a.id}`, emoji: "📢", text: `Announcement: ${a.title}`, ago: relativeTime(a.at, now), ts: new Date(a.at).getTime() });
  }

  for (const h of handoffsFor(member.id).filter((h) => h.status === "pending")) {
    items.push({ id: `handoff-${h.id}`, emoji: "🔄", text: `Handoff from ${h.fromName}: ${h.taskTitle}`, ago: relativeTime(h.at, now), ts: new Date(h.at).getTime() });
  }

  return items.sort((a, b) => b.ts - a.ts).slice(0, 12);
}

/* ─── Employee projects ────────────────────────────────────────────────── */

export type ProjectSummary = {
  name: string;
  progress: number;
  team: string[];
  myTasks: number;
  projectTasks: number;
  nextDeadline: string;
};

export function employeeProjects(member: TeamPerson, allTasks: TeamTask[]): string[] {
  return [...new Set(allTasks.filter((t) => t.memberId === member.id && t.project).map((t) => t.project))];
}

export function projectSummary(name: string, allTasks: TeamTask[], members: TeamPerson[], memberId: string): ProjectSummary {
  const pt = allTasks.filter((t) => t.project === name);
  const progress = pt.length ? Math.round(pt.reduce((s, t) => s + taskProgress(t), 0) / pt.length) : 0;
  const team = new Set<string>();
  for (const t of pt) {
    const m = members.find((x) => x.id === t.memberId);
    if (m) team.add(m.name);
    t.people.forEach((p) => team.add(p));
    if (t.assignedBy) team.add(t.assignedBy);
  }
  const openDated = pt.filter((t) => isOpenTask(t.status) && t.dueDate).map((t) => t.dueDate.slice(0, 10)).sort();
  return {
    name,
    progress,
    team: [...team],
    myTasks: pt.filter((t) => t.memberId === memberId).length,
    projectTasks: pt.length,
    nextDeadline: openDated[0] ?? "",
  };
}

/* ─── Employee work memory ─────────────────────────────────────────────── */

export type MemoryKind = "project" | "training" | "procedure" | "note" | "preference" | "case";
export type MemoryEntry = {
  id: string;
  memberId: string;
  kind: MemoryKind;
  title: string;
  detail: string;
  tags: string[];
  docs: string[];
  at: string;
};

const MEMORY_KEY = "atlas-employee-memory-v1";
export function loadMemory(): MemoryEntry[] {
  return loadJson<MemoryEntry[]>(MEMORY_KEY, []).sort((a, b) => (a.at < b.at ? 1 : -1));
}
export function saveMemory(list: MemoryEntry[]) {
  saveJson(MEMORY_KEY, list);
}
export function addMemory(input: { memberId: string; kind: MemoryKind; title: string; detail: string; tags?: string[]; docs?: string[] }): MemoryEntry {
  const m: MemoryEntry = {
    id: newId("mem"),
    memberId: input.memberId,
    kind: input.kind,
    title: input.title.trim(),
    detail: input.detail.trim(),
    tags: input.tags ?? [],
    docs: input.docs ?? [],
    at: nowIso(),
  };
  saveMemory([m, ...loadMemory()]);
  return m;
}
export function memoryFor(memberId: string): MemoryEntry[] {
  return loadMemory().filter((m) => m.memberId === memberId);
}
export function searchMemory(member: TeamPerson, query: string): MemoryEntry[] {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const mine = memoryFor(member.id);
  const scored = mine
    .map((m) => {
      const hay = `${m.title} ${m.detail} ${m.tags.join(" ")}`.toLowerCase();
      const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.m);
}

/* ─── Smart handoffs ───────────────────────────────────────────────────── */

export type Handoff = {
  id: string;
  taskId: string;
  taskTitle: string;
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  summary: string;
  at: string;
  status: "pending" | "accepted";
};

const HANDOFFS_KEY = "atlas-employee-handoffs-v1";
export function loadHandoffs(): Handoff[] {
  return loadJson<Handoff[]>(HANDOFFS_KEY, []).sort((a, b) => (a.at < b.at ? 1 : -1));
}
export function saveHandoffs(list: Handoff[]) {
  saveJson(HANDOFFS_KEY, list);
}

/** Auto-draft a handoff summary from a task's state. */
export function buildHandoffSummary(task: TeamTask): string {
  const pct = taskProgress(task);
  const lastNote = task.notes.length ? task.notes[task.notes.length - 1].text : "";
  const statusLine =
    task.status === "blocked" && task.blockReason
      ? `Blocked because ${task.blockReason}.`
      : task.status === "waiting"
        ? "Waiting on an input to continue."
        : "";
  const next = task.requiredResult ? `Next action: ${task.requiredResult}.` : "Next action: continue the work.";
  return [`${pct}% complete.`, lastNote, statusLine, next].filter(Boolean).join(" ");
}

/** Create a handoff and reassign the task to the recipient. */
export function createHandoff(task: TeamTask, from: TeamPerson, to: TeamPerson): Handoff {
  const summary = buildHandoffSummary(task);
  const reassigned = addTaskNote({ ...task, memberId: to.id }, `Handoff from ${from.name}: ${summary}`, "atlas");
  saveTeamTasks(replaceTask(loadTeamTasks(), reassigned));
  const handoff: Handoff = {
    id: newId("handoff"),
    taskId: task.id,
    taskTitle: task.title,
    fromMemberId: from.id,
    fromName: from.name,
    toMemberId: to.id,
    toName: to.name,
    summary,
    at: nowIso(),
    status: "pending",
  };
  saveHandoffs([handoff, ...loadHandoffs()]);
  return handoff;
}
export function handoffsFor(memberId: string): Handoff[] {
  return loadHandoffs().filter((h) => h.toMemberId === memberId);
}
export function acceptHandoff(id: string): Handoff[] {
  const next = loadHandoffs().map((h) => (h.id === id ? { ...h, status: "accepted" as const } : h));
  saveHandoffs(next);
  return next;
}

/* ─── Automatic task creation (capture from notes/email) ───────────────── */

export type TaskSuggestion = {
  id: string;
  title: string;
  assigneeId: string | null;
  assigneeName: string | null;
  dueLabel: string;
  dueDate: string;
  source: string;
};

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Resolve a natural due phrase to a label + ISO date (when possible). */
export function resolveDue(phrase: string): { label: string; date: string } {
  const p = phrase.toLowerCase();
  const now = new Date();
  if (/\btoday\b|end of day|\beod\b/.test(p)) return { label: "today", date: todayISO(now) };
  if (/\btomorrow\b/.test(p)) return { label: "tomorrow", date: todayISO(new Date(now.getTime() + 864e5)) };
  if (/first of (the )?month|1st of/.test(p)) {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { label: "first of month", date: todayISO(d) };
  }
  for (let i = 0; i < WEEKDAYS.length; i += 1) {
    if (p.includes(WEEKDAYS[i])) {
      const target = i;
      const d = new Date(now);
      let add = (target - d.getDay() + 7) % 7;
      if (add === 0) add = 7; // "by Thursday" means the coming Thursday
      d.setDate(d.getDate() + add);
      return { label: WEEKDAYS[i][0].toUpperCase() + WEEKDAYS[i].slice(1), date: todayISO(d) };
    }
  }
  if (/next week/.test(p)) return { label: "next week", date: todayISO(new Date(now.getTime() + 7 * 864e5)) };
  return { label: "", date: "" };
}

function titleCase(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

/** Parse commands like “Assign Mike the website redesign and make it due Friday.” */
export function parseNaturalAssignCommand(text: string, members: TeamPerson[]): TaskSuggestion | null {
  const trimmed = text.trim();
  const assignMatch = trimmed.match(
    /^(?:assign|give)\s+([a-z]+)\s+(?:the\s+)?(.+?)(?:\s+and\s+make\s+it\s+due\s+(.+))?$/i,
  );
  if (!assignMatch) return null;
  const member = members.find((m) => m.name.toLowerCase().startsWith(assignMatch[1].toLowerCase()));
  if (!member) return null;
  const duePhrase = assignMatch[3] || trimmed;
  const due = resolveDue(duePhrase);
  let title = assignMatch[2].trim();
  title = title.replace(/\s+and\s+make\s+it\s+due\s+.+$/i, "").trim();
  return {
    id: newId("sug"),
    title: titleCase(title),
    assigneeId: member.id,
    assigneeName: member.name,
    dueLabel: due.label,
    dueDate: due.date,
    source: trimmed,
  };
}

/** Turn meeting action items into Workforce tasks. */
export function createTeamTasksFromMeeting(
  meeting: { id: string; title: string; tasks: { owner: string; task: string; due: string }[] },
): number {
  const members = loadTeamMembers();
  let created = 0;
  const existing = loadTeamTasks();
  const newTasks = [...existing];
  for (const item of meeting.tasks) {
    const first = item.owner.trim().split(/\s+/)[0].toLowerCase();
    const member = members.find((m) => m.name.toLowerCase().startsWith(first));
    if (!member) continue;
    const suggestion: TaskSuggestion = {
      id: `meet-${meeting.id}-${item.task}`,
      title: item.task,
      assigneeId: member.id,
      assigneeName: member.name,
      dueLabel: item.due,
      dueDate: "",
      source: `From meeting: ${meeting.title}`,
    };
    newTasks.unshift(createTaskFromSuggestion(suggestion, member.id, "Meeting Intelligence"));
    created += 1;
  }
  saveTeamTasks(newTasks);
  return created;
}

/** Scan meeting notes / an email for commitments and propose tasks. */
export function detectTaskSuggestions(text: string, members: TeamPerson[]): TaskSuggestion[] {
  const suggestions: TaskSuggestion[] = [];
  const seen = new Set<string>();
  const sentences = text.split(/[\n.!?]+/).map((s) => s.trim()).filter(Boolean);

  const firstNames = members.map((m) => ({ m, first: m.name.split(/\s+/)[0].toLowerCase() }));

  for (const raw of sentences) {
    const s = raw.replace(/\s+/g, " ").trim();
    const lower = s.toLowerCase();
    let title = "";
    let assignee: TeamPerson | null = null;
    let duePhrase = s;

    // Pattern A: "<Name> will <action> [by <when>]"
    const willMatch = s.match(/^([A-Z][a-z]+)\s+will\s+(.+)$/);
    // Pattern B: requests — "can you <action>", "please <action>", "need to <action>"
    const askMatch = lower.match(/(?:can you|could you|please|need to|needs to|remember to)\s+(.+)$/);

    if (willMatch) {
      const who = firstNames.find((f) => f.first === willMatch[1].toLowerCase());
      assignee = who ? who.m : null;
      let body = willMatch[2];
      body = body.replace(/\bby\b.*$/i, "").trim();
      title = titleCase(body);
    } else if (askMatch) {
      let body = askMatch[1];
      body = body.replace(/\b(by|tomorrow|today|next week|end of day|eod)\b.*$/i, "").trim();
      title = titleCase(body);
    } else {
      continue;
    }

    if (title.length < 3) continue;
    const due = resolveDue(duePhrase);
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    suggestions.push({
      id: newId("sug"),
      title: title.length > 70 ? `${title.slice(0, 67)}…` : title,
      assigneeId: assignee ? assignee.id : null,
      assigneeName: assignee ? assignee.name : null,
      dueLabel: due.label,
      dueDate: due.date,
      source: s.length > 90 ? `${s.slice(0, 87)}…` : s,
    });
  }
  return suggestions;
}

/** Turn an accepted suggestion into a real task. */
export function createTaskFromSuggestion(s: TaskSuggestion, fallbackMemberId: string, assignedBy = "Atlas capture"): TeamTask {
  const task = createTeamTask({
    memberId: s.assigneeId || fallbackMemberId,
    title: s.title,
    dueDate: s.dueDate,
    assignedBy,
    priority: "Normal",
  });
  saveTeamTasks([task, ...loadTeamTasks()]);
  return task;
}

/* ─── Recurring responsibilities ───────────────────────────────────────── */

export type RecurringCadence = "weekly-mon" | "weekly-fri" | "monthly-1";
export type RecurringTemplate = {
  id: string;
  memberId: string;
  title: string;
  department: string;
  cadence: RecurringCadence;
  lastOccurrence: string; // ISO date of the last occurrence materialized
  createdAt: string;
};

const RECURRING_KEY = "atlas-recurring-v1";
export function loadRecurring(): RecurringTemplate[] {
  return loadJson<RecurringTemplate[]>(RECURRING_KEY, []);
}
export function saveRecurring(list: RecurringTemplate[]) {
  saveJson(RECURRING_KEY, list);
}
export function recurringFor(memberId: string): RecurringTemplate[] {
  return loadRecurring().filter((r) => r.memberId === memberId);
}
export function cadenceLabel(c: RecurringCadence): string {
  return c === "weekly-mon" ? "Every Monday" : c === "weekly-fri" ? "Every Friday" : "First of the month";
}
export function addRecurring(input: { memberId: string; title: string; department?: string; cadence: RecurringCadence }): RecurringTemplate {
  const tpl: RecurringTemplate = {
    id: newId("rec"),
    memberId: input.memberId,
    title: input.title.trim(),
    department: input.department || "",
    cadence: input.cadence,
    lastOccurrence: "",
    createdAt: nowIso(),
  };
  saveRecurring([tpl, ...loadRecurring()]);
  return tpl;
}

/** ISO date of the current period's occurrence for a cadence. */
function currentOccurrence(c: RecurringCadence, now = new Date()): string {
  if (c === "monthly-1") return todayISO(new Date(now.getFullYear(), now.getMonth(), 1));
  const target = c === "weekly-mon" ? 1 : 5;
  const d = new Date(now);
  const back = (d.getDay() - target + 7) % 7;
  d.setDate(d.getDate() - back); // most recent target weekday (this period)
  return todayISO(d);
}

/**
 * Materialize any recurring template whose current-period occurrence hasn't
 * been created yet. Returns the number of tasks Atlas auto-created.
 */
export function generateRecurringTasks(now = new Date()): number {
  const templates = loadRecurring();
  if (!templates.length) return 0;
  let created = 0;
  const existing = loadTeamTasks();
  const newTasks: TeamTask[] = [];
  const updated = templates.map((tpl) => {
    const occ = currentOccurrence(tpl.cadence, now);
    if (tpl.lastOccurrence === occ) return tpl;
    const task = createTeamTask({
      memberId: tpl.memberId,
      title: tpl.title,
      dueDate: occ,
      assignedBy: "Atlas (recurring)",
      department: tpl.department,
    });
    newTasks.push({ ...task, recurrence: tpl.cadence === "monthly-1" ? "monthly" : "weekly" });
    created += 1;
    return { ...tpl, lastOccurrence: occ };
  });
  if (created) {
    saveTeamTasks([...newTasks, ...existing]);
    saveRecurring(updated);
  }
  return created;
}

/* ─── Employee tool center ─────────────────────────────────────────────── */

export type EmployeeApp = { id: string; name: string; emoji: string; desc: string; restrictedTo?: string[] };
export const EMPLOYEE_APPS: EmployeeApp[] = [
  { id: "email", name: "Email", emoji: "✉️", desc: "Company inbox" },
  { id: "calendar", name: "Calendar", emoji: "📅", desc: "Schedule & meetings" },
  { id: "crm", name: "CRM", emoji: "👥", desc: "Customers & pipeline" },
  { id: "documents", name: "Documents", emoji: "📁", desc: "Files & contracts" },
  { id: "accounting", name: "Accounting", emoji: "💰", desc: "Invoices & payments", restrictedTo: ["Management", "Finance", "Operations"] },
  { id: "support", name: "Customer Support", emoji: "🎧", desc: "Tickets & help desk" },
  { id: "pm", name: "Project Management", emoji: "🗂️", desc: "Projects & boards" },
];
export function appsFor(member: TeamPerson): EmployeeApp[] {
  return EMPLOYEE_APPS.filter((a) => !a.restrictedTo || a.restrictedTo.includes(member.department || ""));
}

/* ─── Universal company search ─────────────────────────────────────────── */

export type SearchHit = { title: string; sub: string };
export type SearchGroup = { category: string; emoji: string; hits: SearchHit[] };

export function universalSearch(member: TeamPerson, query: string): SearchGroup[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const groups: SearchGroup[] = [];
  const match = (s: string) => s.toLowerCase().includes(q);

  // Customers (company-wide) — names come from CRM + quotes.
  const customerNames = new Set<string>();
  for (const c of dataCustomers) if (match(c.name) || match(c.email)) customerNames.add(c.name);
  for (const qu of dataQuotes) if (match(qu.customer)) customerNames.add(qu.customer);
  if (customerNames.size) {
    groups.push({ category: "Customers", emoji: "🏢", hits: [...customerNames].slice(0, 5).map((n) => ({ title: n, sub: "Customer record" })) });
  }

  // Documents the employee can see (+ their memory docs).
  const docHits: SearchHit[] = [];
  for (const d of documentsForEmployee(member.id)) if (match(d.title)) docHits.push({ title: d.title, sub: d.category });
  for (const m of memoryFor(member.id)) for (const doc of m.docs) if (match(doc)) docHits.push({ title: doc, sub: "Referenced document" });
  if (docHits.length) groups.push({ category: "Documents", emoji: "📄", hits: docHits.slice(0, 5) });

  // Tasks the employee owns or is part of.
  const taskHits = loadTeamTasks()
    .filter((t) => (t.memberId === member.id || t.parts.some((p) => p.memberId === member.id)) && (match(t.title) || match(t.description) || match(t.project)))
    .slice(0, 5)
    .map((t) => ({ title: t.title, sub: t.project ? `Task · ${t.project}` : "Task" }));
  if (taskHits.length) groups.push({ category: "Tasks", emoji: "✅", hits: taskHits });

  // Messages in the employee's channels.
  const myChannels = new Set(channelsForEmployee(member).map((c) => c.id));
  const msgMatches = loadMessages().filter((m) => myChannels.has(m.channelId) && match(m.text));
  if (msgMatches.length) {
    groups.push({ category: "Messages", emoji: "💬", hits: [{ title: `${msgMatches.length} conversation${msgMatches.length === 1 ? "" : "s"}`, sub: msgMatches[0].text.slice(0, 60) }] });
  }

  // Meetings / events.
  const meetingHits = loadEvents()
    .filter((e) => match(e.title) || match(e.type))
    .slice(0, 5)
    .map((e) => ({ title: e.title, sub: e.date ? `Meeting · ${e.date}` : "Meeting" }));
  if (meetingHits.length) groups.push({ category: "Meetings", emoji: "📆", hits: meetingHits });

  // Invoices / quotes (company-wide).
  const invoiceHits = dataQuotes
    .filter((qu) => match(qu.id) || match(qu.title) || match(qu.customer))
    .slice(0, 5)
    .map((qu) => ({ title: qu.id, sub: `${qu.title} · ${qu.amount}` }));
  if (invoiceHits.length) groups.push({ category: "Invoices", emoji: "🧾", hits: invoiceHits });

  return groups;
}

/* ─── Company wiki ─────────────────────────────────────────────────────── */

export type WikiArticle = { id: string; question: string; answer: string; source: string; tags: string[] };
export const WIKI_ARTICLES: WikiArticle[] = [
  { id: "refunds", question: "How do refunds work?", answer: "Confirm the order and that it's within the 30-day window, then process the refund. Refunds over $500 need manager approval. Log the outcome in the customer record.", source: "Customer Policy Handbook, §4.2 Refunds", tags: ["refund", "return", "money back"] },
  { id: "weather", question: "What's our bad-weather policy?", answer: "If a site is unsafe due to weather, notify your manager and reschedule the customer. Field crews should not travel in severe warnings. Remote staff continue as normal.", source: "Operations Manual, §7 Safety", tags: ["weather", "storm", "snow", "safety", "closure"] },
  { id: "pto", question: "How do I request PTO?", answer: "Open Time-off in your portal, choose the dates and type, and submit. Atlas checks staffing and routes it to your manager for approval.", source: "Employee Handbook, §3 Time Off", tags: ["pto", "time off", "vacation", "leave", "holiday"] },
  { id: "estimate", question: "How do I create an estimate?", answer: "In the CRM, open the customer, choose New Estimate, add line items, apply any approved discount, and send for e-signature. Estimates over $10k route to a manager first.", source: "Sales Playbook, §2 Estimates", tags: ["estimate", "quote", "proposal", "pricing"] },
  { id: "expenses", question: "How do I submit an expense report?", answer: "Every Friday, itemize receipts in Accounting, attach photos, and submit. Reimbursements land in the next pay cycle.", source: "Finance Policy, §5 Expenses", tags: ["expense", "reimbursement", "receipts"] },
];
export function searchWiki(query: string): WikiArticle[] {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  if (!words.length) return [];
  return WIKI_ARTICLES.map((a) => {
    const hay = `${a.question} ${a.answer} ${a.tags.join(" ")}`.toLowerCase();
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    return { a, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.a);
}

/* ─── New employee mode (onboarding) ───────────────────────────────────── */

export type OnboardingStep = { id: string; label: string; detail: string };
export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: "profile", label: "Complete your profile", detail: "Add your photo, contact details, and skills." },
  { id: "policies", label: "Review company policies", detail: "Handbook, safety, and code of conduct." },
  { id: "documents", label: "Sign required documents", detail: "Employment agreement and tax forms." },
  { id: "training", label: "Start required training", detail: "Safety basics and your role's onboarding course." },
  { id: "coworkers", label: "Meet your coworkers", detail: "See who's on your team and what they do." },
  { id: "manager", label: "Meet your manager", detail: "Say hello and book a 1:1." },
  { id: "software", label: "Set up software access", detail: "Email, CRM, and the tools you'll use." },
  { id: "tasks", label: "See your first tasks", detail: "Atlas has queued a few starter tasks." },
  { id: "schedule", label: "Review your first-week schedule", detail: "Your shifts, meetings, and check-ins." },
];

export type OnboardingState = { memberId: string; done: string[]; startedAt: string };
const ONBOARDING_KEY = "atlas-onboarding-v1";
export function loadOnboardingAll(): OnboardingState[] {
  return loadJson<OnboardingState[]>(ONBOARDING_KEY, []);
}
export function saveOnboardingAll(list: OnboardingState[]) {
  saveJson(ONBOARDING_KEY, list);
}
export function onboardingFor(memberId: string): OnboardingState | null {
  return loadOnboardingAll().find((o) => o.memberId === memberId) ?? null;
}
export function onboardingPct(state: OnboardingState): number {
  return Math.round((state.done.length / ONBOARDING_STEPS.length) * 100);
}
export function completeOnboardingStep(memberId: string, stepId: string): OnboardingState {
  const all = loadOnboardingAll();
  const idx = all.findIndex((o) => o.memberId === memberId);
  const state: OnboardingState = idx >= 0 ? all[idx] : { memberId, done: [], startedAt: nowIso() };
  if (!state.done.includes(stepId)) state.done = [...state.done, stepId];
  const next = idx >= 0 ? all.map((o) => (o.memberId === memberId ? state : o)) : [...all, state];
  saveOnboardingAll(next);
  return state;
}

/* ─── AI Mentor · Career Center · Internal opportunities ───────────────── */

export type CareerRung = { role: string; skills: string[]; expectations: string[]; training: string[] };
export type CareerTrack = { id: string; name: string; departments: string[]; rungs: CareerRung[] };

export const CAREER_TRACKS: CareerTrack[] = [
  {
    id: "support",
    name: "Customer Support",
    departments: ["Customer Support"],
    rungs: [
      { role: "Customer Support Representative", skills: ["Customer Service", "Product Knowledge"], expectations: ["Resolve tickets on time", "CSAT 4.5+"], training: ["Support Basics"] },
      { role: "Senior Representative", skills: ["Customer Service", "Conflict resolution", "Product Knowledge"], expectations: ["Handle escalations", "Mentor new reps"], training: ["Advanced Support", "De-escalation"] },
      { role: "Team Lead", skills: ["Leadership", "Coaching", "Scheduling"], expectations: ["Run a small team", "Hit team CSAT"], training: ["Leadership 101", "Coaching skills"] },
      { role: "Support Manager", skills: ["Team management", "Data reporting", "Hiring"], expectations: ["Own team performance", "Manage a budget"], training: ["People Management", "Support Analytics"] },
      { role: "Regional Support Director", skills: ["Strategy", "Budgeting", "Multi-team leadership"], expectations: ["Own the region", "Set support strategy"], training: ["Director Program"] },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    departments: ["Sales"],
    rungs: [
      { role: "Sales Associate", skills: ["Sales", "Product Knowledge"], expectations: ["Hit activity targets"], training: ["Sales Basics"] },
      { role: "Account Executive", skills: ["Sales", "Salesforce", "Negotiation"], expectations: ["Own a pipeline", "Hit quota"], training: ["Pipeline Management"] },
      { role: "Senior Account Executive", skills: ["Negotiation", "Forecasting", "Salesforce"], expectations: ["Close strategic deals"], training: ["Advanced Negotiation"] },
      { role: "Sales Manager", skills: ["Leadership", "Coaching", "Data reporting"], expectations: ["Lead a sales team"], training: ["People Management"] },
      { role: "Regional Sales Director", skills: ["Strategy", "Budgeting"], expectations: ["Own regional revenue"], training: ["Director Program"] },
    ],
  },
  {
    id: "management",
    name: "Leadership",
    departments: ["Management", "Operations", "Marketing"],
    rungs: [
      { role: "Office Manager", skills: ["Customer Service", "Scheduling", "Excel"], expectations: ["Keep operations running"], training: ["Operations Basics"] },
      { role: "Operations Manager", skills: ["Leadership", "Coaching", "Data reporting"], expectations: ["Manage a department", "Hit KPIs"], training: ["People Management", "Ops Analytics"] },
      { role: "Director of Operations", skills: ["Strategy", "Budgeting", "Team management"], expectations: ["Own multiple teams"], training: ["Director Program"] },
      { role: "VP of Operations", skills: ["Vision", "Financial planning"], expectations: ["Own the org"], training: ["Executive Program"] },
    ],
  },
];

export function trackForMember(member: TeamPerson): CareerTrack | null {
  return (
    CAREER_TRACKS.find((t) => t.departments.includes(member.department || "")) ??
    CAREER_TRACKS.find((t) => t.id === "management") ??
    null
  );
}
function memberSkillNames(member: TeamPerson): Set<string> {
  return new Set((member.skills ?? []).map((s) => s.name.toLowerCase()));
}
export function currentRungIndex(member: TeamPerson, track: CareerTrack): number {
  const idx = track.rungs.findIndex((r) => r.role.toLowerCase() === (member.role || "").toLowerCase());
  return idx >= 0 ? idx : 0;
}

export type CareerLadder = { track: CareerTrack; currentIndex: number; nextRole: string | null; missingForNext: string[] };
export function careerLadderFor(member: TeamPerson): CareerLadder | null {
  const track = trackForMember(member);
  if (!track) return null;
  const currentIndex = currentRungIndex(member, track);
  const next = track.rungs[currentIndex + 1] ?? null;
  const have = memberSkillNames(member);
  const missingForNext = next ? next.skills.filter((s) => !have.has(s.toLowerCase())) : [];
  return { track, currentIndex, nextRole: next ? next.role : null, missingForNext };
}

export type MentorPlan = {
  target: string;
  path: string[];
  skillsHave: string[];
  skillsMissing: string[];
  training: string[];
  expectations: string[];
  goals: string[];
};
export function mentorPlan(member: TeamPerson, aspiration: string): MentorPlan | null {
  const track = trackForMember(member);
  if (!track) return null;
  const cur = currentRungIndex(member, track);
  const q = aspiration.toLowerCase();
  let targetIdx = -1;
  for (let i = cur + 1; i < track.rungs.length; i += 1) {
    const role = track.rungs[i].role.toLowerCase();
    if (q && (role.includes(q) || q.split(/\s+/).some((w) => w.length > 3 && role.includes(w)))) {
      targetIdx = i;
      break;
    }
  }
  if (targetIdx <= cur) targetIdx = Math.min(cur + 1, track.rungs.length - 1);
  const rung = track.rungs[targetIdx];
  const have = memberSkillNames(member);
  return {
    target: rung.role,
    path: track.rungs.slice(cur, targetIdx + 1).map((r) => r.role),
    skillsHave: rung.skills.filter((s) => have.has(s.toLowerCase())),
    skillsMissing: rung.skills.filter((s) => !have.has(s.toLowerCase())),
    training: rung.training,
    expectations: rung.expectations,
    goals: [
      ...rung.skills.filter((s) => !have.has(s.toLowerCase())).map((s) => `Build your ${s} skill`),
      ...rung.training.map((t) => `Complete "${t}" training`),
    ].slice(0, 5),
  };
}

export type InternalOpening = { id: string; role: string; department: string; location: string; requirements: string[]; postedAt: string };
export const INTERNAL_OPENINGS: InternalOpening[] = [
  { id: "open-teamlead", role: "Team Lead", department: "Customer Support", location: "HQ", requirements: ["Customer Service", "Sales", "Salesforce", "Excel", "Leadership", "Coaching", "Team management", "2+ years tenure", "Conflict resolution", "Data reporting"], postedAt: "2026-08-01" },
  { id: "open-ae", role: "Account Executive", department: "Sales", location: "HQ", requirements: ["Sales", "Salesforce", "Negotiation", "Pipeline management", "2+ years tenure"], postedAt: "2026-08-05" },
];
function memberCredentials(member: TeamPerson): string[] {
  const creds = new Set<string>();
  (member.skills ?? []).forEach((s) => creds.add(s.name.toLowerCase()));
  const role = (member.role || "").toLowerCase();
  creds.add(role);
  if (role.includes("manager") || role.includes("lead")) ["leadership", "coaching", "team management"].forEach((c) => creds.add(c));
  if (member.startDate) {
    const yrs = (Date.now() - new Date(member.startDate).getTime()) / (365 * 864e5);
    if (yrs >= 2) {
      creds.add("2+ years tenure");
      creds.add("tenure");
    }
  }
  return [...creds];
}
export function openingMatch(member: TeamPerson, opening: InternalOpening): { met: number; total: number; missing: string[] } {
  const creds = memberCredentials(member);
  const missing: string[] = [];
  let met = 0;
  for (const req of opening.requirements) {
    const r = req.toLowerCase();
    if (creds.some((c) => c.includes(r) || r.includes(c))) met += 1;
    else missing.push(req);
  }
  return { met, total: opening.requirements.length, missing };
}

/* ─── Employee self-service (routed requests) ──────────────────────────── */

export type ServiceCategory = { id: string; label: string; emoji: string; routeTo: string };
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: "pto", label: "Time off (PTO)", emoji: "🏖️", routeTo: "Your manager" },
  { id: "availability", label: "Availability change", emoji: "🕒", routeTo: "Scheduling" },
  { id: "schedule", label: "Schedule change", emoji: "📅", routeTo: "Scheduling" },
  { id: "swap", label: "Shift swap", emoji: "🔁", routeTo: "Scheduling" },
  { id: "expense", label: "Expense reimbursement", emoji: "💳", routeTo: "Finance" },
  { id: "equipment", label: "Equipment request", emoji: "🖥️", routeTo: "IT / Facilities" },
  { id: "document", label: "Document request", emoji: "📄", routeTo: "HR" },
  { id: "benefits", label: "Benefits information", emoji: "🩺", routeTo: "HR / Benefits" },
  { id: "contact", label: "Address / contact change", emoji: "🏠", routeTo: "HR" },
  { id: "concern", label: "Workplace concern", emoji: "⚠️", routeTo: "HR (confidential)" },
  { id: "hr", label: "HR question", emoji: "❓", routeTo: "HR" },
];
export type ServiceRequest = { id: string; memberId: string; category: string; label: string; detail: string; routedTo: string; status: "open" | "in_progress" | "resolved"; at: string };
const SERVICE_KEY = "atlas-service-requests-v1";
export function loadServiceRequests(): ServiceRequest[] {
  return loadJson<ServiceRequest[]>(SERVICE_KEY, []).sort((a, b) => (a.at < b.at ? 1 : -1));
}
export function saveServiceRequests(list: ServiceRequest[]) {
  saveJson(SERVICE_KEY, list);
}
export function createServiceRequest(input: { memberId: string; categoryId: string; detail: string }): ServiceRequest {
  const cat = SERVICE_CATEGORIES.find((c) => c.id === input.categoryId);
  const req: ServiceRequest = {
    id: newId("svc"),
    memberId: input.memberId,
    category: input.categoryId,
    label: cat?.label ?? "Request",
    detail: input.detail.trim(),
    routedTo: cat?.routeTo ?? "HR",
    status: "open",
    at: nowIso(),
  };
  saveServiceRequests([req, ...loadServiceRequests()]);
  return req;
}
export function serviceRequestsFor(memberId: string): ServiceRequest[] {
  return loadServiceRequests().filter((r) => r.memberId === memberId);
}

/* ─── Pay dashboard (permission-sensitive) ─────────────────────────────── */

export type Paystub = { id: string; period: string; gross: number; net: number; date: string };
export type PayDashboard = { nextPayday: string; regularHours: number; overtimeHours: number; ptoHours: number; paystubs: Paystub[]; taxDocs: string[] };
function nextFridayISO(now = new Date()): string {
  const d = new Date(now);
  let add = (5 - d.getDay() + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  return todayISO(d);
}
export function payDashboard(member: TeamPerson): PayDashboard {
  const ts = timesheetFor(member);
  const regular = Math.min(ts.hoursWeek, 40);
  return {
    nextPayday: nextFridayISO(),
    regularHours: Math.round(regular * 10) / 10,
    overtimeHours: Math.round(ts.overtime * 10) / 10,
    ptoHours: (ts.ptoDays || 0) * 8,
    paystubs: [
      { id: "ps-2", period: "Jul 16–31", gross: 2840, net: 2180, date: "2026-07-31" },
      { id: "ps-1", period: "Jul 1–15", gross: 2760, net: 2120, date: "2026-07-15" },
    ],
    taxDocs: ["W-2 (2025)", "W-2 (2024)"],
  };
}

/* ─── Expense center ───────────────────────────────────────────────────── */

export type Expense = { id: string; memberId: string; merchant: string; date: string; amount: number; category: string; project: string; status: "submitted" | "approved" | "rejected"; at: string };
const EXPENSE_KEY = "atlas-expenses-v1";
export function loadExpenses(): Expense[] {
  return loadJson<Expense[]>(EXPENSE_KEY, []).sort((a, b) => (a.at < b.at ? 1 : -1));
}
export function saveExpenses(list: Expense[]) {
  saveJson(EXPENSE_KEY, list);
}
/** Mock receipt OCR — returns plausible extracted fields for a scanned receipt. */
export function sampleReceiptExtraction(): { merchant: string; date: string; amount: number; category: string; project: string } {
  const samples = [
    { merchant: "Office Depot", amount: 86.42, category: "Office supplies", project: "Johnson Expansion" },
    { merchant: "Shell", amount: 52.1, category: "Fuel", project: "Field visits" },
    { merchant: "Delta Air Lines", amount: 318.0, category: "Travel", project: "Client onsite" },
  ];
  const s = samples[Math.floor(Math.random() * samples.length)];
  return { ...s, date: todayISO() };
}
export function createExpense(input: { memberId: string; merchant: string; date: string; amount: number; category: string; project: string }): Expense {
  const e: Expense = {
    id: newId("exp"),
    memberId: input.memberId,
    merchant: input.merchant.trim(),
    date: input.date,
    amount: input.amount,
    category: input.category.trim(),
    project: input.project.trim(),
    status: "submitted",
    at: nowIso(),
  };
  saveExpenses([e, ...loadExpenses()]);
  return e;
}
export function expensesFor(memberId: string): Expense[] {
  return loadExpenses().filter((e) => e.memberId === memberId);
}
export function pendingExpenses(): Expense[] {
  return loadExpenses().filter((e) => e.status === "submitted");
}
export function decideExpense(id: string, status: "approved" | "rejected"): Expense[] {
  const next = loadExpenses().map((e) => (e.id === id ? { ...e, status } : e));
  saveExpenses(next);
  return next;
}

/* ─── Equipment & assets ───────────────────────────────────────────────── */

export type Asset = { id: string; memberId: string; kind: string; tag: string; name: string };
const ASSET_KEY = "atlas-assets-v1";
export function loadAssets(): Asset[] {
  return loadJson<Asset[]>(ASSET_KEY, []);
}
export function saveAssets(list: Asset[]) {
  saveJson(ASSET_KEY, list);
}
export function assetsFor(memberId: string): Asset[] {
  return loadAssets().filter((a) => a.memberId === memberId);
}
/** Report a problem with an asset — routes an IT/facilities request. */
export function reportAssetProblem(member: TeamPerson, asset: Asset, detail: string): ServiceRequest {
  return createServiceRequest({
    memberId: member.id,
    categoryId: "equipment",
    detail: `${asset.kind} ${asset.tag} (${asset.name}): ${detail || "Reported a problem"}`,
  });
}

/* ─── Incident reporting ───────────────────────────────────────────────── */

export type IncidentSeverity = "Low" | "Moderate" | "High" | "Critical";
export const INCIDENT_SEVERITIES: IncidentSeverity[] = ["Low", "Moderate", "High", "Critical"];
export type Incident = {
  id: string;
  memberId: string;
  description: string;
  location: string;
  witnesses: string;
  equipment: string;
  severity: IncidentSeverity;
  photos: string[];
  routedTo: string;
  status: "reported" | "reviewing" | "closed";
  at: string;
};
const INCIDENT_KEY = "atlas-incidents-v1";
export function loadIncidents(): Incident[] {
  return loadJson<Incident[]>(INCIDENT_KEY, []).sort((a, b) => (a.at < b.at ? 1 : -1));
}
export function saveIncidents(list: Incident[]) {
  saveJson(INCIDENT_KEY, list);
}
function incidentRoute(sev: IncidentSeverity): string {
  if (sev === "Critical" || sev === "High") return "Safety team + Manager (urgent)";
  if (sev === "Moderate") return "Your manager";
  return "Supervisor";
}
export function createIncident(input: { memberId: string; description: string; location?: string; witnesses?: string; equipment?: string; severity: IncidentSeverity; photos?: string[] }): Incident {
  const inc: Incident = {
    id: newId("inc"),
    memberId: input.memberId,
    description: input.description.trim(),
    location: (input.location || "").trim(),
    witnesses: (input.witnesses || "").trim(),
    equipment: (input.equipment || "").trim(),
    severity: input.severity,
    photos: input.photos ?? [],
    routedTo: incidentRoute(input.severity),
    status: "reported",
    at: nowIso(),
  };
  saveIncidents([inc, ...loadIncidents()]);
  return inc;
}
export function incidentsFor(memberId: string): Incident[] {
  return loadIncidents().filter((i) => i.memberId === memberId);
}

/* ─── Permissions (role-based access) ──────────────────────────────────── */

export type AccessScope = "own" | "team" | "department" | "personnel" | "financial" | "company";
export const SCOPE_LABELS: Record<AccessScope, string> = {
  own: "Your own tasks & schedule",
  team: "Your team's tasks",
  department: "Department information",
  personnel: "Personnel / HR information",
  financial: "Financial information",
  company: "Company-wide information",
};
export function scopesFor(member: TeamPerson): AccessScope[] {
  const role = (member.role || "").toLowerCase();
  const dept = member.department || "";
  const scopes = new Set<AccessScope>(["own"]);
  if (role.includes("lead")) scopes.add("team");
  if (role.includes("manager") || dept === "Management") {
    scopes.add("team");
    scopes.add("department");
  }
  if (dept === "Customer Support" || dept === "HR") scopes.add("team");
  if (dept === "HR") scopes.add("personnel");
  if (dept === "Finance" || role.includes("finance")) scopes.add("financial");
  if (role.includes("ceo") || role.includes("owner") || role.includes("chief") || role.includes("president")) {
    (Object.keys(SCOPE_LABELS) as AccessScope[]).forEach((s) => scopes.add(s));
  }
  return [...scopes];
}
export function hasScope(member: TeamPerson, scope: AccessScope): boolean {
  return scopesFor(member).includes(scope);
}

/**
 * If a sidebar/assistant query asks for something outside the employee's
 * permissions (and no temp grant covers it), return a denial message.
 */
export function permissionDenialFor(member: TeamPerson, query: string): string | null {
  const q = query.toLowerCase();
  const scopes = scopesFor(member);
  const grantsCover = activeGrantsFor(member.id).some((g) => q.includes(g.resource.toLowerCase().split(/\s+/)[0]));
  // Someone else's pay / salary.
  if (/how much (does|do).*(make|earn)|\bsalary\b|\bpaystub\b|\bwage\b|compensation of|what does .* (make|earn)/.test(q)) {
    if (!scopes.includes("financial") && !scopes.includes("personnel") && !scopes.includes("company")) {
      return "You don't have access to that information. Pay and compensation are restricted to HR, Finance, and leadership.";
    }
  }
  // Personnel / HR files.
  if (/personnel file|social security|\bssn\b|home address of|medical record|performance review of/.test(q)) {
    if (!scopes.includes("personnel") && !scopes.includes("company") && !grantsCover) {
      return "You don't have access to that information. Personnel records are restricted to HR and leadership.";
    }
  }
  // Company financials.
  if (/company (revenue|profit|financ)|\bp&l\b|burn rate|gross margin/.test(q)) {
    if (!scopes.includes("financial") && !scopes.includes("company") && !grantsCover) {
      return "You don't have access to that information. Company financials are restricted to Finance and leadership.";
    }
  }
  return null;
}

/* ─── Temporary permissions ────────────────────────────────────────────── */

export type TempGrant = { id: string; memberId: string; memberName: string; resource: string; grantedBy: string; grantedAt: string; expiresAt: string; revoked: boolean };
const GRANT_KEY = "atlas-temp-grants-v1";
export function loadGrants(): TempGrant[] {
  return loadJson<TempGrant[]>(GRANT_KEY, []).sort((a, b) => (a.grantedAt < b.grantedAt ? 1 : -1));
}
export function saveGrants(list: TempGrant[]) {
  saveJson(GRANT_KEY, list);
}
export function isGrantActive(g: TempGrant): boolean {
  return !g.revoked && Date.now() < new Date(g.expiresAt).getTime();
}
export function grantTempAccess(input: { memberId: string; memberName: string; resource: string; grantedBy: string; expiresAt: string }): TempGrant {
  const g: TempGrant = {
    id: newId("grant"),
    memberId: input.memberId,
    memberName: input.memberName,
    resource: input.resource.trim(),
    grantedBy: input.grantedBy,
    grantedAt: nowIso(),
    expiresAt: input.expiresAt,
    revoked: false,
  };
  saveGrants([g, ...loadGrants()]);
  logAudit(input.grantedBy, "granted temporary access", `${input.memberName}: ${g.resource} until ${new Date(input.expiresAt).toLocaleString()}`);
  return g;
}
export function revokeGrant(id: string): TempGrant[] {
  const next = loadGrants().map((g) => (g.id === id ? { ...g, revoked: true } : g));
  saveGrants(next);
  return next;
}
export function activeGrantsFor(memberId: string): TempGrant[] {
  return loadGrants().filter((g) => g.memberId === memberId && isGrantActive(g));
}

/* ─── Audit trail ──────────────────────────────────────────────────────── */

export type AuditEvent = { id: string; at: string; actor: string; action: string; target: string };
const AUDIT_KEY = "atlas-audit-v1";
export function loadAudit(): AuditEvent[] {
  return loadJson<AuditEvent[]>(AUDIT_KEY, []).sort((a, b) => (a.at < b.at ? 1 : -1));
}
export function logAudit(actor: string, action: string, target: string): AuditEvent {
  const ev: AuditEvent = { id: newId("audit"), at: nowIso(), actor, action, target };
  saveJson(AUDIT_KEY, [ev, ...loadAudit()].slice(0, 200));
  return ev;
}

/* ─── Substitute / coverage mode ───────────────────────────────────────── */

export type CoverageSuggestion = { id: string; name: string; reason: string };
export type CoverageItem = { kind: "task" | "appointment" | "deadline"; title: string; detail: string; suggestions: CoverageSuggestion[] };
export type CoveragePlan = { member: TeamPerson; tasksAffected: number; appointmentsAffected: number; urgentDeadlines: number; items: CoverageItem[] };

export function coveragePlan(member: TeamPerson, now: number = Date.now()): CoveragePlan {
  const today = todayISO(new Date(now));
  const allTasks = loadTeamTasks().filter((t) => t.memberId === member.id && isOpenTask(t.status));
  const members = loadTeamMembers();
  const others = members.filter((m) => m.id !== member.id);
  const availableIds = new Set(others.filter((m) => isAvailableStatus(derivedStatus(getPresence(m.id), now))).map((m) => m.id));
  const sameDept = others.filter((m) => (m.department || "") === (member.department || ""));
  // Prefer people who are live-available; otherwise fall back to qualified
  // same-department teammates (or anyone) so the manager always has options.
  const pool = (availableIds.size ? others.filter((m) => availableIds.has(m.id)) : sameDept.length ? sameDept : others);

  const reasonFor = (m: TeamPerson): string => {
    const avail = availableIds.has(m.id);
    const dept = (m.department || "") === (member.department || "");
    if (avail && dept) return "Same department, available now";
    if (avail) return "Available now";
    if (dept) return "Same department, qualified";
    return "Qualified teammate";
  };

  const suggestFor = (): CoverageSuggestion[] => {
    const sameDeptInPool = pool.filter((m) => (m.department || "") === (member.department || ""));
    const chosen = (sameDeptInPool.length ? sameDeptInPool : pool).slice(0, 3);
    return chosen.map((m) => ({ id: m.id, name: m.name, reason: reasonFor(m) }));
  };

  const items: CoverageItem[] = allTasks.map((t) => ({
    kind: t.dueDate === today && (t.priority === "Urgent" || t.priority === "High") ? "deadline" : "task",
    title: t.title,
    detail: `${t.priority} · ${t.dueDate ? `due ${t.dueDate}` : "no due date"}${t.project ? ` · ${t.project}` : ""}`,
    suggestions: suggestFor(),
  }));

  // Appointments today assigned to this member (from CRM demo appointments by first name).
  const first = member.name.split(/\s+/)[0];
  const appts = dataAppointments.filter((a) => a.staff === first);
  for (const a of appts) {
    items.push({
      kind: "appointment",
      title: `${a.job} — ${a.customer}`,
      detail: `${a.time} · ${a.status}`,
      suggestions: suggestFor(),
    });
  }

  return {
    member,
    tasksAffected: allTasks.length,
    appointmentsAffected: appts.length,
    urgentDeadlines: items.filter((i) => i.kind === "deadline").length,
    items,
  };
}

/* ─── Language translation (workplace messages) ────────────────────────── */

const TRANSLATION_PHRASES: Record<string, string> = {
  "hola, el cliente de johnson pidió una cotización actualizada para mañana. ¿puedes ayudar?":
    "Hi, the Johnson customer asked for an updated quote for tomorrow. Can you help?",
  "gracias, ya casi termino el reporte.": "Thanks, I'm almost done with the report.",
  "necesito ayuda con el inventario.": "I need help with the inventory.",
};
const TRANSLATION_WORDS: Record<string, string> = {
  hola: "hello", gracias: "thanks", cliente: "customer", cotización: "quote", mañana: "tomorrow",
  reporte: "report", inventario: "inventory", ayuda: "help", "¿puedes": "can you", pedido: "order",
  necesito: "I need", el: "the", la: "the", de: "of", para: "for", con: "with", ya: "already", termino: "finish",
};
export function detectLanguage(text: string): "es" | "en" {
  const t = text.toLowerCase();
  if (/[¿¡ñáéíóú]/.test(t)) return "es";
  const esWords = ["hola", "gracias", "cliente", "mañana", "necesito", "ayuda", "pedido", "cotización"];
  return esWords.some((w) => t.includes(w)) ? "es" : "en";
}
/** Mock translator: exact-phrase map first, then a small word dictionary. */
export function translateText(text: string, to: "en" | "es" = "en"): string {
  if (to !== "en") return text;
  const key = text.trim().toLowerCase();
  if (TRANSLATION_PHRASES[key]) return TRANSLATION_PHRASES[key];
  let changed = false;
  const out = text.split(/(\s+)/).map((tok) => {
    const bare = tok.toLowerCase().replace(/[.,!?¿¡]/g, "");
    if (TRANSLATION_WORDS[bare]) {
      changed = true;
      return TRANSLATION_WORDS[bare];
    }
    return tok;
  });
  return changed ? out.join("") : text;
}

/* ─── Accessibility settings ───────────────────────────────────────────── */

export type A11ySettings = { largeText: boolean; highContrast: boolean; reducedMotion: boolean };
const A11Y_KEY = "atlas-a11y-v1";
export function loadA11y(): A11ySettings {
  return loadJson<A11ySettings>(A11Y_KEY, { largeText: false, highContrast: false, reducedMotion: false });
}
export function saveA11y(s: A11ySettings) {
  saveJson(A11Y_KEY, s);
}
export function applyA11y(s: A11ySettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("a11y-large-text", s.largeText);
  root.classList.toggle("a11y-high-contrast", s.highContrast);
  root.classList.toggle("a11y-reduced-motion", s.reducedMotion);
}

/* ─── Offline mode (sync queue) ────────────────────────────────────────── */

export type SyncItem = { id: string; label: string; at: string };
const SYNC_KEY = "atlas-sync-queue-v1";
export function loadSyncQueue(): SyncItem[] {
  return loadJson<SyncItem[]>(SYNC_KEY, []);
}
export function queueSync(label: string): SyncItem {
  const item: SyncItem = { id: newId("sync"), label, at: nowIso() };
  saveJson(SYNC_KEY, [...loadSyncQueue(), item]);
  return item;
}
export function syncPending(): number {
  return loadSyncQueue().length;
}
/** Flush the offline queue (data is already persisted locally) and return count. */
export function flushSyncQueue(): number {
  const n = loadSyncQueue().length;
  saveJson(SYNC_KEY, []);
  return n;
}

/* ─── "My Work" intelligent feed ───────────────────────────────────────── */

function clockToMin(label?: string): number | null {
  if (!label) return null;
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}
function parseEstimateMinutes(label?: string): number | null {
  if (!label) return null;
  const m = label.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)?/);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2] || "min";
  return /^h/.test(unit) ? Math.round(n * 60) : Math.round(n);
}

export type WorkFeed = {
  day: string;
  needsAttention: { task: TeamTask; note: string }[];
  blocked: { task: TeamTask; note: string }[];
  next: { task: TeamTask; when: string } | null;
  updates: { emoji: string; text: string }[];
  completedToday: number;
  totalToday: number;
  suggestion: { text: string; task: TeamTask } | null;
};

export function myWorkFeed(member: TeamPerson, now: number = Date.now()): WorkFeed {
  const day = new Date(now).toLocaleDateString("en-US", { weekday: "long" });
  const today = todayISO(new Date(now));
  const nowMin = new Date(now).getHours() * 60 + new Date(now).getMinutes();
  const all = loadTeamTasks();
  const members = loadTeamMembers();
  const mine = all.filter((t) => t.memberId === member.id);
  const open = mine.filter((t) => isOpenTask(t.status));

  // Next: earliest upcoming timed task today.
  const upcoming = open
    .filter((t) => t.dueDate === today && clockToMin(t.dueTime) !== null && (clockToMin(t.dueTime) as number) >= nowMin)
    .sort((a, b) => (clockToMin(a.dueTime) as number) - (clockToMin(b.dueTime) as number));
  const next = upcoming[0] ? { task: upcoming[0], when: upcoming[0].dueTime } : null;
  const nextId = next?.task.id;

  // Needs attention: overdue, due-soon, or high-priority-today (excluding "next").
  const needsAttention: { task: TeamTask; note: string }[] = [];
  for (const t of open) {
    if (t.status === "blocked" || t.id === nextId) continue;
    const tm = clockToMin(t.dueTime);
    if (t.dueDate && t.dueDate < today) needsAttention.push({ task: t, note: "overdue" });
    else if (t.dueDate === today && tm !== null && tm >= nowMin && tm - nowMin <= 120) needsAttention.push({ task: t, note: `due in ${tm - nowMin} minutes` });
    else if (t.dueDate === today && (t.priority === "Urgent" || t.priority === "High")) needsAttention.push({ task: t, note: `${t.priority} priority · due today` });
  }

  // Blocked: explicit blocks + dependency bottlenecks.
  const blocked: { task: TeamTask; note: string }[] = [];
  for (const t of open) {
    if (t.status === "blocked") blocked.push({ task: t, note: t.blockReason ? `blocked — ${t.blockReason}` : "blocked" });
    else if (t.dependsOn.length) {
      const bn = bottleneckOf(t, all);
      if (bn) {
        const who = members.find((m) => m.id === bn.memberId);
        blocked.push({ task: t, note: `waiting for ${bn.title}${who ? ` (${who.name})` : ""}` });
      }
    }
  }

  // New / updates.
  const updates: { emoji: string; text: string }[] = [];
  for (const h of handoffsFor(member.id).filter((x) => x.status === "pending")) updates.push({ emoji: "🔄", text: `Handoff from ${h.fromName}: ${h.taskTitle}` });
  for (const a of loadAnnouncements().filter((a) => !a.acks.includes(member.id)).slice(0, 2)) updates.push({ emoji: "📢", text: `Announcement: ${a.title}` });
  const myChannels = new Set(channelsForEmployee(member).map((c) => c.id));
  const recentMsgs = loadMessages().filter((m) => myChannels.has(m.channelId) && m.authorId !== member.id).slice(-2);
  for (const m of recentMsgs) updates.push({ emoji: "💬", text: `${m.authorName}: ${m.text.slice(0, 60)}` });

  // Completed today.
  const completedToday = mine.filter((t) => t.status === "completed" && t.completedAt && t.completedAt.slice(0, 10) === today).length;
  const totalToday = completedToday + open.filter((t) => t.dueDate === today).length;

  // Atlas suggestion: fit a quick task into the gap before the next item.
  let suggestion: { text: string; task: TeamTask } | null = null;
  if (next) {
    const gap = (clockToMin(next.when) as number) - nowMin;
    if (gap > 10) {
      const quick = open
        .map((t) => ({ t, est: parseEstimateMinutes(t.estimatedTime) }))
        .filter((x) => x.est !== null && (x.est as number) <= gap && x.t.id !== nextId)
        .sort((a, b) => (a.est as number) - (b.est as number))[0];
      if (quick) {
        suggestion = {
          text: `You have about ${gap} minutes before ${next.task.title}. Your ${quick.t.title} should take about ${quick.est} minutes.`,
          task: quick.t,
        };
      }
    }
  }

  return { day, needsAttention, blocked, next, updates, completedToday, totalToday, suggestion };
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
      const because = task.blockReason ? ` because ${task.blockReason}` : "";
      alerts.push({
        id: `blocked-${task.id}`,
        kind: "blocked",
        severity: "high",
        title: "Employee blocked",
        detail: `⚠️ ${nameOf(task.memberId)} can't complete "${task.title}"${because}${mins ? ` (${mins} min)` : ""}.`,
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

/* ─── Employee goals ───────────────────────────────────────────────────── */

export type GoalKind = "amount" | "count";
export type EmployeeGoal = {
  id: string;
  memberId: string; // "" for a team goal
  department: string;
  title: string;
  kind: GoalKind;
  target: number;
  current: number;
  unit: string;
  period: string;
  createdAt: string;
};

const EMP_GOALS_KEY = "atlas-user-emp-goals-v1";
export function loadGoals(): EmployeeGoal[] {
  return loadJson<EmployeeGoal[]>(EMP_GOALS_KEY, []);
}
export function saveGoals(goals: EmployeeGoal[]) {
  saveJson(EMP_GOALS_KEY, goals);
}
export function createGoal(input: {
  memberId?: string;
  department?: string;
  title: string;
  kind: GoalKind;
  target: number;
  current?: number;
  unit?: string;
  period?: string;
}): EmployeeGoal {
  return {
    id: newId("goal"),
    memberId: input.memberId || "",
    department: input.department || "",
    title: input.title.trim() || "Goal",
    kind: input.kind,
    target: Math.max(1, input.target || 1),
    current: Math.max(0, input.current || 0),
    unit: (input.unit || "").trim(),
    period: (input.period || "").trim(),
    createdAt: nowIso(),
  };
}
export function updateGoalProgress(goals: EmployeeGoal[], id: string, current: number): EmployeeGoal[] {
  return goals.map((g) => (g.id === id ? { ...g, current: Math.max(0, current) } : g));
}
export function goalPct(goal: EmployeeGoal): number {
  return Math.min(100, Math.round((goal.current / goal.target) * 100));
}
export function formatGoalValue(goal: EmployeeGoal): string {
  if (goal.kind === "amount") {
    return `$${goal.current.toLocaleString()} / $${goal.target.toLocaleString()}`;
  }
  return `${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}${goal.unit ? ` ${goal.unit}` : ""}`;
}

export type GoalProjection = { away: number; projected: number; onTrack: boolean; elapsedPct: number };

/** Projects month-end value from current pace (day-of-month based). */
export function goalProjection(goal: EmployeeGoal, now: number = Date.now()): GoalProjection {
  const d = new Date(now);
  const day = d.getDate();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const elapsed = Math.min(1, Math.max(0.1, day / daysInMonth));
  const projected = Math.round(goal.current / elapsed);
  return {
    away: Math.max(0, goal.target - goal.current),
    projected,
    onTrack: projected >= goal.target,
    elapsedPct: Math.round(elapsed * 100),
  };
}

export function formatGoalNumber(goal: EmployeeGoal, n: number): string {
  return goal.kind === "amount" ? `$${n.toLocaleString()}` : `${n.toLocaleString()}${goal.unit ? ` ${goal.unit}` : ""}`;
}

/** Canned "how to reach my goal" suggestions. */
export function goalActionPlan(goal: EmployeeGoal): string[] {
  if (goal.kind === "amount") {
    return [
      "Follow up with your 3 warmest open opportunities today.",
      "Re-engage last month's closed-lost accounts with a check-in.",
      "Bundle the maintenance plan on every open quote.",
      "Ask your manager for two priority referrals.",
    ];
  }
  return [
    "Block two focused hours each morning for this goal.",
    "Batch similar work to move faster.",
    "Flag blockers early so nothing stalls.",
  ];
}

export function goalsCompletedFor(memberId: string): { done: number; total: number } {
  const mine = loadGoals().filter((g) => g.memberId === memberId);
  return { done: mine.filter((g) => goalPct(g) >= 100).length, total: mine.length };
}

/* ─── Internal messaging ───────────────────────────────────────────────── */

export type ChatMessage = {
  id: string;
  channelId: string;
  authorId: string; // "owner" or memberId
  authorName: string;
  text: string;
  at: string;
};

export type ProjectChannel = { id: string; name: string };

const MESSAGES_KEY = "atlas-user-messages-v1";
const PROJECTS_KEY = "atlas-user-channels-v1";

export function loadMessages(): ChatMessage[] {
  return loadJson<ChatMessage[]>(MESSAGES_KEY, []);
}
export function saveMessages(messages: ChatMessage[]) {
  saveJson(MESSAGES_KEY, messages);
}
export function sendMessage(channelId: string, authorId: string, authorName: string, text: string): ChatMessage {
  const msg: ChatMessage = {
    id: newId("msg"),
    channelId,
    authorId,
    authorName,
    text: text.trim(),
    at: nowIso(),
  };
  saveMessages([...loadMessages(), msg]);
  return msg;
}
export function messagesFor(channelId: string, messages = loadMessages()): ChatMessage[] {
  return messages
    .filter((m) => m.channelId === channelId)
    .sort((a, b) => (a.at < b.at ? -1 : 1));
}
export function dmChannelId(memberId: string) {
  return `dm:${memberId}`;
}
export function teamChannelId(department: string) {
  return `team:${department.toLowerCase().replace(/\s+/g, "-")}`;
}
export function loadProjectChannels(): ProjectChannel[] {
  return loadJson<ProjectChannel[]>(PROJECTS_KEY, []);
}
export function saveProjectChannels(channels: ProjectChannel[]) {
  saveJson(PROJECTS_KEY, channels);
}
export function createProjectChannel(name: string): ProjectChannel {
  const channel: ProjectChannel = {
    id: `project:${name.toLowerCase().replace(/\s+/g, "-").slice(0, 32)}-${Math.random().toString(36).slice(2, 5)}`,
    name: name.trim() || "New project",
  };
  saveProjectChannels([...loadProjectChannels(), channel]);
  return channel;
}
export type ChannelRef = { id: string; label: string };
export function channelsForEmployee(member: TeamPerson, projects = loadProjectChannels()): ChannelRef[] {
  return [
    { id: dmChannelId(member.id), label: "My manager" },
    { id: teamChannelId(member.department || "Team"), label: `Team · ${member.department || "General"}` },
    ...projects.map((p) => ({ id: p.id, label: `# ${p.name}` })),
  ];
}
export function extractMentions(text: string): string[] {
  return (text.match(/@([a-z][a-z0-9._-]*)/gi) || []).map((m) => m.slice(1));
}

/* ─── Company announcements ────────────────────────────────────────────── */

export type AnnouncementPriority = "normal" | "urgent" | "critical";
export type Audience =
  | { kind: "all" }
  | { kind: "managers" }
  | { kind: "working" }
  | { kind: "night" }
  | { kind: "new" }
  | { kind: "department"; value: string }
  | { kind: "location"; value: string }
  | { kind: "project"; value: string }
  | { kind: "members"; ids: string[] };
export type Announcement = {
  id: string;
  title: string;
  body: string;
  at: string;
  acks: string[];
  reads?: string[];
  audience?: Audience;
  priority?: AnnouncementPriority;
  scheduledFor?: string;
  from?: string;
};
const ANNOUNCEMENTS_KEY = "atlas-user-announcements-v1";

function normalizeAnn(a: Announcement): Announcement {
  return { reads: [], audience: { kind: "all" }, priority: "normal", scheduledFor: "", from: "Owner", ...a };
}
export function loadAnnouncements(): Announcement[] {
  return loadJson<Announcement[]>(ANNOUNCEMENTS_KEY, []).map(normalizeAnn).sort((a, b) => (a.at < b.at ? 1 : -1));
}
export function saveAnnouncements(list: Announcement[]) {
  saveJson(ANNOUNCEMENTS_KEY, list);
}
export function createAnnouncement(input: { title: string; body: string; audience?: Audience; priority?: AnnouncementPriority; scheduledFor?: string; from?: string }): Announcement {
  const ann: Announcement = {
    id: newId("ann"),
    title: input.title.trim() || "Announcement",
    body: input.body.trim(),
    at: nowIso(),
    acks: [],
    reads: [],
    audience: input.audience ?? { kind: "all" },
    priority: input.priority ?? "normal",
    scheduledFor: input.scheduledFor ?? "",
    from: input.from ?? "CEO",
  };
  saveAnnouncements([ann, ...loadAnnouncements()]);
  return ann;
}
/** Back-compat shorthand. */
export function postAnnouncement(title: string, body: string): Announcement {
  return createAnnouncement({ title, body, from: "Owner" });
}
export function acknowledgeAnnouncement(id: string, memberId: string): Announcement[] {
  const next = loadAnnouncements().map((a) =>
    a.id === id ? { ...a, reads: [...new Set([...(a.reads ?? []), memberId])], acks: a.acks.includes(memberId) ? a.acks : [...a.acks, memberId] } : a,
  );
  saveAnnouncements(next);
  return next;
}
export function markAnnouncementRead(id: string, memberId: string) {
  const next = loadAnnouncements().map((a) => (a.id === id ? { ...a, reads: [...new Set([...(a.reads ?? []), memberId])] } : a));
  saveAnnouncements(next);
}
export function remindUnread(id: string): number {
  const a = loadAnnouncements().find((x) => x.id === id);
  if (!a) return 0;
  const audience = audienceMembers(a.audience ?? { kind: "all" });
  const unread = audience.filter((m) => !(a.reads ?? []).includes(m.id));
  logAudit(a.from ?? "CEO", "reminded unread employees", `${a.title} (${unread.length})`);
  return unread.length;
}

/* ─── Audience targeting ───────────────────────────────────────────────── */

export const AUDIENCE_PRESETS: { id: string; label: string; make: () => Audience }[] = [
  { id: "all", label: "All employees", make: () => ({ kind: "all" }) },
  { id: "managers", label: "Managers only", make: () => ({ kind: "managers" }) },
  { id: "working", label: "Employees currently working", make: () => ({ kind: "working" }) },
  { id: "night", label: "Night shift", make: () => ({ kind: "night" }) },
  { id: "new", label: "New employees", make: () => ({ kind: "new" }) },
];
export function audienceLabel(a: Audience): string {
  switch (a.kind) {
    case "all": return "All employees";
    case "managers": return "Managers only";
    case "working": return "Employees currently working";
    case "night": return "Night shift";
    case "new": return "New employees";
    case "department": return `${a.value} department`;
    case "location": return `${a.value} location`;
    case "project": return `Project: ${a.value}`;
    case "members": return a.ids.length === 1 ? "Direct message" : `${a.ids.length} selected`;
  }
}
export function audienceMembers(a: Audience, now: number = Date.now()): TeamPerson[] {
  const all = loadTeamMembers();
  switch (a.kind) {
    case "all":
      return all;
    case "managers":
      return all.filter((m) => /manager|lead|director|chief|owner/i.test(m.role || "") || m.department === "Management");
    case "working":
      return all.filter((m) => isAvailableStatus(derivedStatus(getPresence(m.id), now)));
    case "night":
      return all.filter((m) => parseClockToMinutes(m.shiftStart) >= 16 * 60 || (m.qualifications ?? []).some((q) => /night/i.test(q)));
    case "new":
      return all.filter((m) => onboardingFor(m.id) !== null || (m.startDate && Date.now() - new Date(m.startDate).getTime() < 365 * 864e5));
    case "department":
      return all.filter((m) => (m.department || "") === a.value);
    case "location":
      return all.filter((m) => (m.location || "") === a.value);
    case "project": {
      const ids = new Set(loadTeamTasks().filter((t) => t.project === a.value).map((t) => t.memberId));
      return all.filter((m) => ids.has(m.id));
    }
    case "members":
      return all.filter((m) => a.ids.includes(m.id));
  }
}
export function audienceTargets(a: Audience, memberId: string): boolean {
  return audienceMembers(a).some((m) => m.id === memberId);
}
export function targetsMember(a: Announcement, memberId: string): boolean {
  return audienceTargets(a.audience ?? { kind: "all" }, memberId);
}

/** Draft a broadcast from a natural CEO instruction (audience + message). */
export function draftBroadcast(command: string): { audience: Audience; title: string; body: string } {
  const q = command.toLowerCase();
  let audience: Audience = { kind: "all" };
  const locMatch = q.match(/\b(chicago|miami|dallas|headquarters|hq)\b/);
  const deptMatch = q.match(/\b(sales|hr|finance|operations|marketing|customer support|management)\b/);
  if (/all managers|managers only|the managers|leadership/.test(q)) audience = { kind: "managers" };
  else if (locMatch) audience = { kind: "location", value: locMatch[1] === "hq" ? "Headquarters" : locMatch[1][0].toUpperCase() + locMatch[1].slice(1) };
  else if (deptMatch) audience = { kind: "department", value: deptMatch[1].replace(/\b\w/g, (c) => c.toUpperCase()) };
  else if (/night shift/.test(q)) audience = { kind: "night" };
  else if (/new (employees|hires)/.test(q)) audience = { kind: "new" };
  else if (/currently working|on shift/.test(q)) audience = { kind: "working" };
  else if (/everyone|company[- ]wide|all employees|all staff/.test(q)) audience = { kind: "all" };

  let body = command;
  const marker = command.match(/(?:tell (?:them|everyone|him|her)|saying|that|:)\s+(.+)$/i);
  if (marker) body = marker[1].trim();
  body = body.charAt(0).toUpperCase() + body.slice(1);
  const title = body.split(/[.!?]/)[0].split(/\s+/).slice(0, 7).join(" ");
  return { audience, title, body };
}
export function announcementIsLive(a: Announcement, now: number = Date.now()): boolean {
  return !a.scheduledFor || new Date(a.scheduledFor).getTime() <= now;
}

export type AnnouncementStats = { audience: number; read: number; acked: number; unread: number; readNotAcked: number };
export function announcementStats(a: Announcement): AnnouncementStats {
  const audience = audienceMembers(a.audience ?? { kind: "all" });
  const ids = new Set(audience.map((m) => m.id));
  const reads = (a.reads ?? []).filter((id) => ids.has(id));
  const acks = a.acks.filter((id) => ids.has(id));
  return { audience: audience.length, read: reads.length, acked: acks.length, unread: audience.length - reads.length, readNotAcked: Math.max(0, reads.length - acks.length) };
}

/** Live announcements targeted at a member (for the employee portal). */
export function announcementsForMember(memberId: string, now: number = Date.now()): Announcement[] {
  return loadAnnouncements().filter((a) => announcementIsLive(a, now) && targetsMember(a, memberId));
}
export function unacknowledgedFor(memberId: string): Announcement[] {
  return announcementsForMember(memberId).filter((a) => !a.acks.includes(memberId));
}

/* ─── Anonymous employee feedback ──────────────────────────────────────── */

export type FeedbackPrompt = { id: string; question: string; anonymous: boolean; at: string };
export type FeedbackResponse = { id: string; promptId: string; text: string; at: string };
const FB_PROMPT_KEY = "atlas-feedback-prompts-v1";
const FB_RESP_KEY = "atlas-feedback-responses-v1";
export function loadFeedbackPrompts(): FeedbackPrompt[] {
  return loadJson<FeedbackPrompt[]>(FB_PROMPT_KEY, []).sort((a, b) => (a.at < b.at ? 1 : -1));
}
export function createFeedbackPrompt(question: string, anonymous = true): FeedbackPrompt {
  const p: FeedbackPrompt = { id: newId("fbp"), question: question.trim(), anonymous, at: nowIso() };
  saveJson(FB_PROMPT_KEY, [p, ...loadFeedbackPrompts()]);
  return p;
}
export function loadFeedbackResponses(): FeedbackResponse[] {
  return loadJson<FeedbackResponse[]>(FB_RESP_KEY, []);
}
export function submitFeedback(promptId: string, text: string): FeedbackResponse {
  const r: FeedbackResponse = { id: newId("fbr"), promptId, text: text.trim(), at: nowIso() };
  saveJson(FB_RESP_KEY, [r, ...loadFeedbackResponses()]);
  return r;
}
export function responsesFor(promptId: string): FeedbackResponse[] {
  return loadFeedbackResponses().filter((r) => r.promptId === promptId);
}
const FB_STOPWORDS = new Set(["this", "that", "with", "have", "from", "they", "been", "were", "would", "about", "there", "their", "which", "when", "what", "your", "just", "them", "then", "some", "more", "very", "really", "system", "working", "still", "much", "also", "into"]);
export function summarizeFeedback(promptId: string): { count: number; themes: { theme: string; count: number }[] } {
  const responses = responsesFor(promptId);
  const tally = new Map<string, number>();
  for (const r of responses) {
    for (const w of r.text.toLowerCase().split(/[^a-z]+/)) {
      if (w.length > 3 && !FB_STOPWORDS.has(w)) tally.set(w, (tally.get(w) ?? 0) + 1);
    }
  }
  const themes = [...tally.entries()].map(([theme, count]) => ({ theme, count })).filter((t) => t.count > 1).sort((a, b) => b.count - a.count).slice(0, 5);
  return { count: responses.length, themes };
}

/* ─── Atlas Calendar Hub ───────────────────────────────────────────────── */

export type CalendarKind = "company" | "private" | "department" | "team" | "project" | "location" | "custom";
export type SharedCalendar = { id: string; name: string; kind: CalendarKind; owner: string; audience: Audience; createdAt: string };
export type CalEventKind = "meeting" | "training" | "deadline" | "milestone" | "company-event" | "closure" | "shift" | "appointment" | "announcement" | "pto";
export const CAL_EVENT_KINDS: { id: CalEventKind; label: string; emoji: string }[] = [
  { id: "meeting", label: "Meeting", emoji: "👥" },
  { id: "training", label: "Training", emoji: "🎓" },
  { id: "deadline", label: "Deadline", emoji: "⏰" },
  { id: "milestone", label: "Project milestone", emoji: "🚩" },
  { id: "company-event", label: "Company event", emoji: "🎉" },
  { id: "closure", label: "Office closure", emoji: "🏢" },
  { id: "shift", label: "Shift change", emoji: "🔁" },
  { id: "appointment", label: "Customer appointment", emoji: "📅" },
  { id: "announcement", label: "Announcement", emoji: "📣" },
  { id: "pto", label: "Time off", emoji: "🏖️" },
];
export type CalEvent = {
  id: string;
  calendarId: string;
  title: string;
  kind: CalEventKind;
  date: string; // YYYY-MM-DD
  time: string;
  audience: Audience;
  createdBy: string;
  source: "manual" | "atlas";
  at: string;
};

const CALENDARS_KEY = "atlas-calendars-v1";
const CAL_EVENTS_KEY = "atlas-cal-events-v1";

export function loadCalendars(): SharedCalendar[] {
  return loadJson<SharedCalendar[]>(CALENDARS_KEY, []);
}
export function saveCalendars(list: SharedCalendar[]) {
  saveJson(CALENDARS_KEY, list);
}
export function loadCalEvents(): CalEvent[] {
  return loadJson<CalEvent[]>(CAL_EVENTS_KEY, []).sort((a, b) => (a.date === b.date ? (a.time < b.time ? -1 : 1) : a.date < b.date ? -1 : 1));
}
export function saveCalEvents(list: CalEvent[]) {
  saveJson(CAL_EVENTS_KEY, list);
}
export function createCalendar(input: { name: string; kind: CalendarKind; owner?: string; audience: Audience }): SharedCalendar {
  const c: SharedCalendar = { id: newId("cal"), name: input.name.trim() || "New calendar", kind: input.kind, owner: input.owner ?? "Manager", audience: input.audience, createdAt: nowIso() };
  saveCalendars([...loadCalendars(), c]);
  return c;
}
export function createCalEvent(input: { calendarId: string; title: string; kind: CalEventKind; date: string; time?: string; audience: Audience; createdBy?: string; source?: "manual" | "atlas" }): CalEvent {
  const e: CalEvent = {
    id: newId("cev"),
    calendarId: input.calendarId,
    title: input.title.trim() || "Event",
    kind: input.kind,
    date: input.date,
    time: input.time ?? "",
    audience: input.audience,
    createdBy: input.createdBy ?? "CEO",
    source: input.source ?? "manual",
    at: nowIso(),
  };
  saveCalEvents([...loadCalEvents(), e]);
  return e;
}

/** Next date (YYYY-MM-DD) that falls on the given weekday name, on/after today. */
function nextWeekdayISO(dayName: string, now = new Date()): string {
  const idx = WEEKDAYS.indexOf(dayName.toLowerCase());
  if (idx < 0) return todayISO(now);
  const d = new Date(now);
  let add = (idx - d.getDay() + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  return todayISO(d);
}

/**
 * CEO says "schedule a company meeting Friday at 10 AM" — Atlas creates it on
 * the Company calendar for everyone, keeping the private CEO calendar separate.
 */
export function scheduleCompanyMeeting(command: string): CalEvent {
  const q = command.toLowerCase();
  const dayMatch = q.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  const timeMatch = q.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  const date = dayMatch ? nextWeekdayISO(dayMatch[1]) : todayISO(new Date(Date.now() + 864e5));
  let time = "";
  if (timeMatch) {
    let h = Number(timeMatch[1]);
    const min = timeMatch[2] ?? "00";
    const ap = timeMatch[3];
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    time = `${((h + 11) % 12) + 1}:${min} ${h >= 12 ? "PM" : "AM"}`;
  }
  const titleMatch = command.match(/schedule (?:a |an )?(.+?)\s+(?:on\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|at|tomorrow)/i);
  const title = titleMatch ? titleMatch[1].replace(/\b\w/, (c) => c.toUpperCase()) : "Company meeting";
  return createCalEvent({ calendarId: "company", title, kind: /training/i.test(q) ? "training" : "company-event", date, time, audience: { kind: "all" }, createdBy: "CEO", source: "atlas" });
}

/** Events derived automatically by Atlas (approved PTO shown to the team). */
function derivedEvents(): CalEvent[] {
  const members = loadTeamMembers();
  const out: CalEvent[] = [];
  for (const r of loadTimeOff().filter((t) => t.status === "approved")) {
    const m = members.find((x) => x.id === r.memberId);
    out.push({ id: `pto-${r.id}`, calendarId: "company", title: `${m ? m.name.split(" ")[0] : "Employee"} — ${r.type} (approved)`, kind: "pto", date: r.startDate, time: "", audience: m?.department ? { kind: "department", value: m.department } : { kind: "all" }, createdBy: "Atlas", source: "atlas", at: r.decidedAt || nowIso() });
  }
  return out;
}

/** All events a member is permitted to see (excludes the private CEO calendar). */
export function eventsForMember(memberId: string): CalEvent[] {
  const cals = loadCalendars();
  const privateIds = new Set(cals.filter((c) => c.kind === "private").map((c) => c.id));
  const all = [...loadCalEvents(), ...derivedEvents()];
  return all.filter((e) => !privateIds.has(e.calendarId) && audienceTargets(e.audience, memberId)).sort((a, b) => (a.date === b.date ? (a.time < b.time ? -1 : 1) : a.date < b.date ? -1 : 1));
}

/** Classify an event into an overlay bucket for on/off toggles. */
export type CalOverlay = "mine" | "team" | "company" | "projects" | "training";
export function overlayOf(e: CalEvent): CalOverlay {
  if (e.kind === "training") return "training";
  if (e.kind === "milestone" || e.kind === "deadline") return "projects";
  if (e.kind === "company-event" || e.kind === "closure" || e.kind === "announcement") return "company";
  if (e.audience.kind === "members") return "mine";
  return "team";
}

export function seedCalendarsIfEmpty(): void {
  if (loadCalendars().length > 0) return;
  const cals: SharedCalendar[] = [
    { id: "company", name: "Company Calendar", kind: "company", owner: "CEO", audience: { kind: "all" }, createdAt: nowIso() },
    { id: "ceo", name: "CEO Calendar (private)", kind: "private", owner: "CEO", audience: { kind: "members", ids: [] }, createdAt: nowIso() },
    { id: "cal-sales", name: "Sales Calendar", kind: "department", owner: "Sales Manager", audience: { kind: "department", value: "Sales" }, createdAt: nowIso() },
    { id: "cal-ops", name: "Operations Calendar", kind: "department", owner: "Ops Manager", audience: { kind: "department", value: "Operations" }, createdAt: nowIso() },
    { id: "cal-phoenix", name: "Project Phoenix Calendar", kind: "project", owner: "PM", audience: { kind: "project", value: "Johnson Expansion" }, createdAt: nowIso() },
  ];
  saveCalendars(cals);

  const d = (offset: number) => todayISO(new Date(Date.now() + offset * 864e5));
  const events: CalEvent[] = [
    { id: newId("cev"), calendarId: "company", title: "All-hands company meeting", kind: "company-event", date: nextWeekdayISO("friday"), time: "10:00 AM", audience: { kind: "all" }, createdBy: "CEO", source: "manual", at: nowIso() },
    { id: newId("cev"), calendarId: "company", title: "Office closed — Labor Day", kind: "closure", date: d(6), time: "", audience: { kind: "all" }, createdBy: "CEO", source: "manual", at: nowIso() },
    { id: newId("cev"), calendarId: "company", title: "Required: Safety recertification", kind: "training", date: d(3), time: "2:00 PM", audience: { kind: "all" }, createdBy: "Atlas", source: "atlas", at: nowIso() },
    { id: newId("cev"), calendarId: "cal-sales", title: "Sales weekly sync", kind: "meeting", date: nextWeekdayISO("monday"), time: "9:30 AM", audience: { kind: "department", value: "Sales" }, createdBy: "Sales Manager", source: "manual", at: nowIso() },
    { id: newId("cev"), calendarId: "cal-phoenix", title: "Johnson Expansion — pricing milestone", kind: "milestone", date: d(2), time: "", audience: { kind: "project", value: "Johnson Expansion" }, createdBy: "PM", source: "atlas", at: nowIso() },
    { id: newId("cev"), calendarId: "cal-ops", title: "Night shift coverage change", kind: "shift", date: d(1), time: "", audience: { kind: "department", value: "Operations" }, createdBy: "Ops Manager", source: "manual", at: nowIso() },
    { id: newId("cev"), calendarId: "ceo", title: "Board prep (private)", kind: "meeting", date: d(1), time: "7:30 AM", audience: { kind: "members", ids: [] }, createdBy: "CEO", source: "manual", at: nowIso() },
  ];
  saveCalEvents(events);
}

/* ─── PTO / time-off requests + staffing ───────────────────────────────── */

export type TimeOffType = "PTO" | "Vacation" | "Sick" | "Personal" | "Unpaid";
export type TimeOffStatus = "pending" | "approved" | "rejected";
export type DayPortion = "full" | "partial";
export type TimeOffRequest = {
  id: string;
  memberId: string;
  startDate: string;
  endDate: string;
  type: TimeOffType;
  portion: DayPortion;
  note: string;
  managerNote?: string;
  status: TimeOffStatus;
  createdAt: string;
  decidedAt?: string;
};

const TIMEOFF_KEY = "atlas-user-timeoff-v1";
const RECOMMENDED_STAFFING: Record<string, number> = {
  "Customer Support": 6,
  Sales: 5,
  Operations: 15,
  Marketing: 4,
  Management: 3,
  "Field ops": 3,
  "Front office": 2,
};

export function loadTimeOff(): TimeOffRequest[] {
  return loadJson<TimeOffRequest[]>(TIMEOFF_KEY, []).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
export function saveTimeOff(list: TimeOffRequest[]) {
  saveJson(TIMEOFF_KEY, list);
}
export function createTimeOffRequest(input: {
  memberId: string;
  startDate: string;
  endDate: string;
  type: TimeOffType;
  portion?: DayPortion;
  note?: string;
}): TimeOffRequest {
  const req: TimeOffRequest = {
    id: newId("pto"),
    memberId: input.memberId,
    startDate: input.startDate,
    endDate: input.endDate || input.startDate,
    type: input.type,
    portion: input.portion ?? "full",
    note: (input.note || "").trim(),
    status: "pending",
    createdAt: nowIso(),
  };
  saveTimeOff([req, ...loadTimeOff()]);
  return req;
}
export function decideTimeOff(id: string, status: TimeOffStatus, managerNote?: string): TimeOffRequest[] {
  const next = loadTimeOff().map((r) =>
    r.id === id ? { ...r, status, managerNote: managerNote ?? r.managerNote, decidedAt: nowIso() } : r,
  );
  saveTimeOff(next);
  return next;
}
export function requestTimeOffChange(id: string, managerNote: string): TimeOffRequest[] {
  const next = loadTimeOff().map((r) =>
    r.id === id ? { ...r, status: "pending" as TimeOffStatus, managerNote, decidedAt: undefined } : r,
  );
  saveTimeOff(next);
  return next;
}
function rangesOverlap(a1: string, a2: string, b1: string, b2: string): boolean {
  return a1 <= b2 && b1 <= a2;
}
export function recommendedStaff(department: string, deptSize: number): number {
  return RECOMMENDED_STAFFING[department] ?? Math.max(1, Math.ceil(deptSize * 0.7));
}
export type StaffingImpact = { department: string; deptSize: number; available: number; recommended: number; short: boolean };
export function staffingImpact(
  members: TeamPerson[],
  requests: TimeOffRequest[],
  req: TimeOffRequest,
): StaffingImpact {
  const member = members.find((m) => m.id === req.memberId);
  const department = member?.department || "General";
  const deptMembers = members.filter((m) => (m.department || "General") === department);
  const off = new Set<string>([req.memberId]);
  for (const r of requests) {
    if (r.id === req.id) continue;
    if (r.status === "rejected") continue;
    const m = members.find((x) => x.id === r.memberId);
    if ((m?.department || "General") !== department) continue;
    if (rangesOverlap(req.startDate, req.endDate, r.startDate, r.endDate)) off.add(r.memberId);
  }
  const available = Math.max(0, deptMembers.length - off.size);
  const recommended = recommendedStaff(department, deptMembers.length);
  return { department, deptSize: deptMembers.length, available, recommended, short: available < recommended };
}

export type CoverageCandidate = { id: string; name: string; reason: string };

/** Suggest employees who could cover during a time-off window. */
export function findCoverageForTimeOff(
  members: TeamPerson[],
  requests: TimeOffRequest[],
  req: TimeOffRequest,
  now = Date.now(),
): { understaffed: boolean; message: string; candidates: CoverageCandidate[] } {
  const member = members.find((m) => m.id === req.memberId);
  if (!member) return { understaffed: false, message: "Employee not found.", candidates: [] };
  const plan = coveragePlan(member, now);
  const impact = staffingImpact(members, requests, req);
  const candidates = plan.items[0]?.suggestions ?? [];
  const message = impact.short
    ? `${impact.department} may be understaffed (${impact.available}/${impact.recommended} available).`
  : `Coverage looks acceptable for ${member.name}.`;
  return { understaffed: impact.short, message, candidates };
}

/* ─── Departments / team pages ─────────────────────────────────────────── */

export type DepartmentSummary = { department: string; count: number };
export function departmentsOf(members: TeamPerson[]): DepartmentSummary[] {
  const map = new Map<string, number>();
  for (const m of members) {
    const d = m.department || "General";
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return [...map.entries()].map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count);
}

/* ─── Daily schedule (calendar events + tasks combined) ────────────────── */

export type ScheduleEntry = { minutes: number; time: string; label: string; kind: "clock" | "meeting" | "task" | "break"; taskId?: string };

export function buildDaySchedule(member: TeamPerson, tasks: TeamTask[], now: number = Date.now()): ScheduleEntry[] {
  const today = todayISO(new Date(now));
  const shifts = loadShifts();
  const todayShift = shifts.find((s) => s.memberId === member.id && s.date === today) ?? null;
  const startMin = parseClockToMinutes(member.shiftStart);
  const endMin = parseClockToMinutes(member.shiftEnd);

  const entries: ScheduleEntry[] = [];
  entries.push({
    minutes: startMin,
    time: todayShift ? formatClock(todayShift.clockIn) : member.shiftStart || "8:00 AM",
    label: "Clock in",
    kind: "clock",
  });
  for (const t of tasks) {
    if (t.memberId !== member.id || !t.dueTime) continue;
    const onToday = !t.dueDate || t.dueDate.slice(0, 10) === today;
    if (!onToday || t.status === "completed") continue;
    entries.push({
      minutes: parseClockToMinutes(t.dueTime),
      time: t.dueTime,
      label: t.title,
      kind: t.kind === "meeting" ? "meeting" : "task",
      taskId: t.id,
    });
  }
  entries.push({ minutes: 12 * 60, time: "12:00 PM", label: "Lunch", kind: "break" });
  entries.push({
    minutes: endMin,
    time: todayShift?.clockOut ? formatClock(todayShift.clockOut) : member.shiftEnd || "4:30 PM",
    label: "Clock out",
    kind: "clock",
  });
  return entries.sort((a, b) => a.minutes - b.minutes);
}

/* ─── Shift scheduling + swaps ─────────────────────────────────────────── */

export type ScheduledShift = {
  id: string;
  memberId: string; // "" when open
  date: string;
  start: string;
  end: string;
  role: string;
  location: string;
  status: "assigned" | "open";
  createdAt: string;
};
export type SwapRequest = {
  id: string;
  shiftId: string;
  fromMemberId: string;
  toMemberId: string;
  status: "requested" | "accepted" | "declined";
  createdAt: string;
};

const SCHED_KEY = "atlas-user-scheduled-shifts-v1";
const SWAPS_KEY = "atlas-user-swaps-v1";

export function loadScheduledShifts(): ScheduledShift[] {
  return loadJson<ScheduledShift[]>(SCHED_KEY, []).sort((a, b) =>
    a.date === b.date ? (a.start < b.start ? -1 : 1) : a.date < b.date ? -1 : 1,
  );
}
export function saveScheduledShifts(shifts: ScheduledShift[]) {
  saveJson(SCHED_KEY, shifts);
}
export function createScheduledShift(input: {
  memberId?: string;
  date: string;
  start: string;
  end: string;
  role?: string;
  location?: string;
}): ScheduledShift {
  return {
    id: newId("sched"),
    memberId: input.memberId || "",
    date: input.date,
    start: input.start,
    end: input.end,
    role: (input.role || "").trim(),
    location: (input.location || "").trim(),
    status: input.memberId ? "assigned" : "open",
    createdAt: nowIso(),
  };
}
export function giveUpShift(shifts: ScheduledShift[], shiftId: string): ScheduledShift[] {
  return shifts.map((s) => (s.id === shiftId ? { ...s, memberId: "", status: "open" as const } : s));
}
export function acceptOpenShift(shifts: ScheduledShift[], shiftId: string, memberId: string): ScheduledShift[] {
  return shifts.map((s) => (s.id === shiftId ? { ...s, memberId, status: "assigned" as const } : s));
}
export function qualifiedFor(shift: ScheduledShift, member: TeamPerson): boolean {
  if (!shift.role) return true;
  const quals = member.qualifications ?? [];
  return quals.some((q) => q.toLowerCase() === shift.role.toLowerCase());
}
export function availableOn(memberId: string, date: string, shifts: ScheduledShift[], excludeShiftId?: string): boolean {
  return !shifts.some(
    (s) => s.memberId === memberId && s.date === date && s.status === "assigned" && s.id !== excludeShiftId,
  );
}
export function eligibleForShift(shift: ScheduledShift, member: TeamPerson, shifts: ScheduledShift[]): boolean {
  return qualifiedFor(shift, member) && availableOn(member.id, shift.date, shifts, shift.id);
}
export function loadSwaps(): SwapRequest[] {
  return loadJson<SwapRequest[]>(SWAPS_KEY, []);
}
export function saveSwaps(list: SwapRequest[]) {
  saveJson(SWAPS_KEY, list);
}
export function requestSwap(shiftId: string, fromMemberId: string, toMemberId: string): SwapRequest {
  const req: SwapRequest = {
    id: newId("swap"),
    shiftId,
    fromMemberId,
    toMemberId,
    status: "requested",
    createdAt: nowIso(),
  };
  saveSwaps([req, ...loadSwaps()]);
  return req;
}
/** Accept a swap: reassign the shift to the accepting member. */
export function acceptSwap(swapId: string): { swaps: SwapRequest[]; shifts: ScheduledShift[] } {
  const swaps = loadSwaps();
  const swap = swaps.find((s) => s.id === swapId);
  let shifts = loadScheduledShifts();
  if (swap) {
    shifts = shifts.map((s) => (s.id === swap.shiftId ? { ...s, memberId: swap.toMemberId, status: "assigned" as const } : s));
    saveScheduledShifts(shifts);
  }
  const nextSwaps = swaps.map((s) => (s.id === swapId ? { ...s, status: "accepted" as const } : s));
  saveSwaps(nextSwaps);
  return { swaps: nextSwaps, shifts };
}

/* ─── Training center ──────────────────────────────────────────────────── */

export type TrainingModule = { id: string; memberId: string; name: string; progress: number; dueDate: string };
export type TrainingState = "complete" | "overdue" | "in_progress" | "not_started";

const TRAINING_KEY = "atlas-user-training-v1";
export function loadTraining(): TrainingModule[] {
  return loadJson<TrainingModule[]>(TRAINING_KEY, []);
}
export function saveTraining(list: TrainingModule[]) {
  saveJson(TRAINING_KEY, list);
}
export function trainingState(m: TrainingModule, now: number = Date.now()): TrainingState {
  if (m.progress >= 100) return "complete";
  if (m.dueDate && new Date(m.dueDate).getTime() < now) return "overdue";
  if (m.progress > 0) return "in_progress";
  return "not_started";
}
export function trainingForMember(memberId: string): TrainingModule[] {
  return loadTraining().filter((m) => m.memberId === memberId);
}
export function bumpTraining(list: TrainingModule[], id: string, delta = 20): TrainingModule[] {
  return list.map((m) => (m.id === id ? { ...m, progress: Math.min(100, m.progress + delta) } : m));
}
export function needsTraining(memberId: string, now: number = Date.now()): boolean {
  return trainingForMember(memberId).some((m) => trainingState(m, now) !== "complete");
}

/* ─── Certifications ───────────────────────────────────────────────────── */

export type Certification = { id: string; memberId: string; name: string; expires: string };
export type CertState = "expired" | "expiring" | "valid";
const CERTS_KEY = "atlas-user-certs-v1";
const CERT_EXPIRING_DAYS = 30;

export function loadCertifications(): Certification[] {
  return loadJson<Certification[]>(CERTS_KEY, []);
}
export function saveCertifications(list: Certification[]) {
  saveJson(CERTS_KEY, list);
}
export function certState(c: Certification, now: number = Date.now()): CertState {
  const t = new Date(c.expires).getTime();
  if (!Number.isFinite(t)) return "valid";
  if (t < now) return "expired";
  if (t - now < CERT_EXPIRING_DAYS * 24 * 60 * 60 * 1000) return "expiring";
  return "valid";
}
export function certsForMember(memberId: string): Certification[] {
  return loadCertifications().filter((c) => c.memberId === memberId);
}

/* ─── Employee documents (permission-scoped) ───────────────────────────── */

export type DocCategory =
  | "Handbook"
  | "Pay"
  | "Employment"
  | "Training certificate"
  | "Policy"
  | "Contract"
  | "Performance review";
export type EmployeeDocument = {
  id: string;
  memberId: string;
  title: string;
  category: DocCategory;
  visibility: "employee" | "manager";
  addedAt: string;
};
const DOCS_KEY = "atlas-user-documents-v1";
export function loadDocuments(): EmployeeDocument[] {
  return loadJson<EmployeeDocument[]>(DOCS_KEY, []);
}
export function saveDocuments(list: EmployeeDocument[]) {
  saveJson(DOCS_KEY, list);
}
/** Docs the employee themselves can see (manager-only docs are hidden). */
export function documentsForEmployee(memberId: string): EmployeeDocument[] {
  return loadDocuments().filter((d) => d.memberId === memberId && d.visibility === "employee");
}

/* ─── Recognition ──────────────────────────────────────────────────────── */

export type Recognition = { id: string; memberId: string; emoji: string; title: string; detail: string; at: string };
const RECOG_KEY = "atlas-user-recognition-v1";
export function loadRecognitions(): Recognition[] {
  return loadJson<Recognition[]>(RECOG_KEY, []).sort((a, b) => (a.at < b.at ? 1 : -1));
}
export function saveRecognitions(list: Recognition[]) {
  saveJson(RECOG_KEY, list);
}
export function giveRecognition(input: { memberId: string; emoji?: string; title: string; detail?: string }): Recognition {
  const r: Recognition = {
    id: newId("recog"),
    memberId: input.memberId,
    emoji: input.emoji?.trim() || "🏆",
    title: input.title.trim() || "Recognition",
    detail: (input.detail || "").trim(),
    at: nowIso(),
  };
  saveRecognitions([r, ...loadRecognitions()]);
  return r;
}
export function recognitionsFor(memberId: string): Recognition[] {
  return loadRecognitions().filter((r) => r.memberId === memberId);
}

/* ─── Employee suggestions (grouped intelligence) ──────────────────────── */

export type Suggestion = { id: string; memberId: string; text: string; topic: string; at: string };
const SUGGESTIONS_KEY = "atlas-user-suggestions-v1";
const SUGGESTION_TOPICS: { match: RegExp; topic: string }[] = [
  { match: /refund/i, topic: "Refund workflow" },
  { match: /schedul|shift|roster/i, topic: "Scheduling" },
  { match: /invent|stock|suppli/i, topic: "Inventory & supplies" },
  { match: /train/i, topic: "Training" },
  { match: /communicat|message|email/i, topic: "Communication" },
  { match: /tool|equipment|software|app/i, topic: "Tools & equipment" },
];
export function topicOf(text: string): string {
  for (const t of SUGGESTION_TOPICS) if (t.match.test(text)) return t.topic;
  return "General";
}
export function loadSuggestions(): Suggestion[] {
  return loadJson<Suggestion[]>(SUGGESTIONS_KEY, []).sort((a, b) => (a.at < b.at ? 1 : -1));
}
export function saveSuggestions(list: Suggestion[]) {
  saveJson(SUGGESTIONS_KEY, list);
}
export function createSuggestion(memberId: string, text: string): Suggestion {
  const s: Suggestion = { id: newId("sugg"), memberId, text: text.trim(), topic: topicOf(text), at: nowIso() };
  saveSuggestions([s, ...loadSuggestions()]);
  return s;
}
export type SuggestionGroup = { topic: string; count: number; items: Suggestion[] };
export function groupSuggestions(suggestions = loadSuggestions()): SuggestionGroup[] {
  const map = new Map<string, Suggestion[]>();
  for (const s of suggestions) {
    const arr = map.get(s.topic) ?? [];
    arr.push(s);
    map.set(s.topic, arr);
  }
  return [...map.entries()]
    .map(([topic, items]) => ({ topic, count: items.length, items }))
    .sort((a, b) => b.count - a.count);
}

/* ─── Workforce map (by location) ──────────────────────────────────────── */

export type LocationSummary = { location: string; working: number; onBreak: number; offline: number; total: number };
export function workforceByLocation(
  members: TeamPerson[],
  presence: Record<string, EmployeePresence>,
  now: number = Date.now(),
): LocationSummary[] {
  const map = new Map<string, LocationSummary>();
  for (const m of members) {
    const loc = m.location || "Unassigned";
    const s = map.get(loc) ?? { location: loc, working: 0, onBreak: 0, offline: 0, total: 0 };
    const status = derivedStatus(presence[m.id], now);
    s.total += 1;
    if (status === "offline") s.offline += 1;
    else if (status === "break") s.onBreak += 1;
    else s.working += 1;
    map.set(loc, s);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/* ─── Workforce assistant (CEO Q&A over the real system) ───────────────── */

export type WorkforceAnswer = { text: string; items: string[] };

export function workforceAssistantReply(input: string, now: number = Date.now()): WorkforceAnswer {
  const q = input.toLowerCase();
  const members = loadTeamMembers();
  const tasks = loadTeamTasks();
  const today = todayISO(new Date(now));
  const presence: Record<string, EmployeePresence> = {};
  for (const m of members) presence[m.id] = getPresence(m.id);
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Someone";
  const openCount = (id: string) => tasks.filter((t) => t.memberId === id && isOpenTask(t.status)).length;

  if (/working right now|who.*working|who is online|clocked in/.test(q)) {
    const working = members.filter((m) => derivedStatus(presence[m.id], now) !== "offline");
    return {
      text: `${working.length} employee${working.length === 1 ? " is" : "s are"} online right now.`,
      items: working.map((m) => `${m.name} · ${STATUS_META[derivedStatus(presence[m.id], now)].label}`),
    };
  }
  if (/too much work|overloaded|most tasks|workload/.test(q)) {
    const ranked = members
      .map((m) => ({ m, n: openCount(m.id) }))
      .sort((a, b) => b.n - a.n)
      .filter((x) => x.n > 0)
      .slice(0, 5);
    const avg = members.length ? members.reduce((s, m) => s + openCount(m.id), 0) / members.length : 0;
    return {
      text: `Team average is ${avg.toFixed(1)} open tasks. Most loaded:`,
      items: ranked.map((x) => `${x.m.name}: ${x.n} open`),
    };
  }
  if (/late|overdue/.test(q)) {
    const late = tasks.filter((t) => isOpenTask(t.status) && t.dueDate && t.dueDate.slice(0, 10) < today);
    return {
      text: late.length ? `${late.length} task${late.length === 1 ? " is" : "s are"} overdue.` : "No overdue tasks — nice.",
      items: late.map((t) => `${t.title} — ${nameOf(t.memberId)}`),
    };
  }
  if (/another customer|take.*customer|who can take|available now|capacity/.test(q)) {
    const avail = members
      .filter((m) => derivedStatus(presence[m.id], now) === "working")
      .map((m) => ({ m, n: openCount(m.id) }))
      .sort((a, b) => a.n - b.n)
      .slice(0, 5);
    return {
      text: avail.length ? "These people are working and have the lightest load:" : "No one is clocked in and working right now.",
      items: avail.map((x) => `${x.m.name}: ${x.n} open task${x.n === 1 ? "" : "s"}`),
    };
  }
  if (/sales.*goal|hitting its goal|preventing.*sales|sales team/.test(q)) {
    const goals = loadGoals().filter((g) => g.department === "Sales");
    const salesIds = new Set(members.filter((m) => (m.department || "") === "Sales").map((m) => m.id));
    const blockers = tasks.filter((t) => salesIds.has(t.memberId) && (t.status === "blocked" || (t.dueDate && t.dueDate.slice(0, 10) < today && isOpenTask(t.status))));
    const items = [
      ...goals.map((g) => `Goal "${g.title}": ${formatGoalValue(g)} (${goalPct(g)}%)`),
      ...blockers.map((t) => `Blocker: ${t.title} — ${nameOf(t.memberId)}`),
    ];
    return {
      text: blockers.length
        ? "Sales is tracking toward its goal but these blockers/overdue items are in the way:"
        : "Sales goal progress:",
      items: items.length ? items : ["No Sales goals or blockers found."],
    };
  }
  if (/need training|training/.test(q)) {
    const need = members.filter((m) => needsTraining(m.id, now));
    return {
      text: `${need.length} employee${need.length === 1 ? "" : "s"} ${need.length === 1 ? "has" : "have"} incomplete training.`,
      items: need.map((m) => {
        const open = trainingForMember(m.id).filter((t) => trainingState(t, now) !== "complete").map((t) => t.name);
        return `${m.name}: ${open.join(", ") || "modules due"}`;
      }),
    };
  }
  if (/available (this |on )?(saturday|sunday|weekend|monday|tuesday|wednesday|thursday|friday)/.test(q)) {
    const dayMatch = q.match(/saturday|sunday|monday|tuesday|wednesday|thursday|friday/);
    const dayName = dayMatch ? dayMatch[0] : "saturday";
    const target = nextDateForWeekday(dayName, now);
    const shifts = loadScheduledShifts();
    const off = loadTimeOff();
    const free = members.filter((m) => {
      const scheduled = shifts.some((s) => s.memberId === m.id && s.date === target && s.status === "assigned");
      const onLeave = off.some((r) => r.status !== "rejected" && r.memberId === m.id && r.startDate <= target && target <= r.endDate);
      return !scheduled && !onLeave;
    });
    return {
      text: `${free.length} employee${free.length === 1 ? " is" : "s are"} available on ${dayName[0].toUpperCase()}${dayName.slice(1)} (${target}) — no shift and no time off.`,
      items: free.slice(0, 12).map((m) => `${m.name} · ${m.department || m.role}`),
    };
  }

  return {
    text:
      "Ask me about your workforce — for example: \u201cWho's working right now?\u201d, \u201cWho has too much work?\u201d, \u201cWhich tasks are late?\u201d, \u201cWho can take another customer?\u201d, \u201cWhich employees need training?\u201d, or \u201cWho is available Saturday?\u201d",
    items: [],
  };
}

function nextDateForWeekday(dayName: string, now: number): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const target = days.indexOf(dayName);
  const d = new Date(now);
  const cur = d.getDay();
  let add = (target - cur + 7) % 7;
  if (add === 0) add = 7; // next occurrence, not today
  d.setDate(d.getDate() + add);
  return todayISO(d);
}

/* ─── Team (employee view) + availability ──────────────────────────────── */

export function teammatesOf(member: TeamPerson, members: TeamPerson[]): TeamPerson[] {
  const dept = member.department || "General";
  return members.filter((m) => m.id !== member.id && (m.department || "General") === dept);
}

/** Reachable to help/collaborate now (online and not busy in a meeting/job). */
export function isAvailableStatus(status: EmployeeStatus): boolean {
  return status === "working" || status === "away";
}

/* ─── Employee home widgets (customizable dashboard) ───────────────────── */

export const EMPLOYEE_WIDGETS: { id: string; title: string }[] = [
  { id: "tasks", title: "My Tasks" },
  { id: "schedule", title: "My Schedule" },
  { id: "goals", title: "My Goals" },
  { id: "messages", title: "Messages" },
  { id: "team", title: "Team Status" },
  { id: "announcements", title: "Announcements" },
  { id: "training", title: "Training" },
  { id: "files", title: "Recent Files" },
  { id: "timeclock", title: "Time Clock" },
  { id: "sales", title: "Sales Numbers" },
  { id: "appointments", title: "Customer Appointments" },
];

export type WidgetPref = { id: string; enabled: boolean };
const WIDGETS_KEY = "atlas-employee-widgets-v1";

export function defaultWidgetLayout(): WidgetPref[] {
  const on = new Set(["tasks", "schedule", "goals", "team", "timeclock", "announcements"]);
  return EMPLOYEE_WIDGETS.map((w) => ({ id: w.id, enabled: on.has(w.id) }));
}

export function loadWidgetLayout(): WidgetPref[] {
  const saved = loadJson<WidgetPref[]>(WIDGETS_KEY, []);
  if (!saved.length) return defaultWidgetLayout();
  const known = saved.filter((w) => EMPLOYEE_WIDGETS.some((x) => x.id === w.id));
  const extra = EMPLOYEE_WIDGETS.filter((w) => !saved.some((s) => s.id === w.id)).map((w) => ({ id: w.id, enabled: false }));
  return [...known, ...extra];
}

export function saveWidgetLayout(layout: WidgetPref[]) {
  saveJson(WIDGETS_KEY, layout);
}

export function widgetTitle(id: string): string {
  return EMPLOYEE_WIDGETS.find((w) => w.id === id)?.title ?? id;
}

export function moveWidget(layout: WidgetPref[], id: string, dir: -1 | 1): WidgetPref[] {
  const i = layout.findIndex((w) => w.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= layout.length) return layout;
  const next = [...layout];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function reorderWidget(layout: WidgetPref[], fromId: string, toId: string): WidgetPref[] {
  const from = layout.findIndex((w) => w.id === fromId);
  const to = layout.findIndex((w) => w.id === toId);
  if (from < 0 || to < 0 || from === to) return layout;
  const next = [...layout];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

type DemoTaskSeed = {
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  kind?: TaskKind;
  due?: "today" | "friday" | "";
  time?: string;
  description?: string;
  goal?: string;
  requiredResult?: string;
  estimatedTime?: string;
  checklist?: string[];
  approvalRequired?: boolean;
  assignedBy?: string;
  progress?: number;
  project?: string;
  dependencies?: string[];
  people?: string[];
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
  perfFeedback: string;
  tasks: DemoTaskSeed[];
};

const DEMO_EMPLOYEES: DemoEmployee[] = [
  {
    name: "Sarah Williams",
    role: "Office Manager",
    department: "Management",
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
    perfFeedback: "Your customer response time improved 18% compared with last month.",
    tasks: [
      { title: "Johnson Proposal", priority: "High", due: "today", time: "2:00 PM", status: "in_progress", progress: 72, assignedBy: "Michael", project: "Johnson Expansion", estimatedTime: "3h", description: "Full expansion proposal for the Johnson account — scope, pricing, and timeline.", checklist: ["Scope & pricing", "Project timeline", "Executive summary"], dependencies: ["Finance Q2 numbers"], people: ["Michael", "Elena Brooks"], requiredResult: "Send to the client by 2 PM" },
      { title: "Call Johnson Construction", priority: "Urgent", due: "today", time: "10:30 AM", description: "Confirm the start date and 40% deposit.", goal: "Confirm the schedule", requiredResult: "Log the call outcome", estimatedTime: "30m" },
      { title: "Send revised quote", priority: "High", due: "today", time: "3:00 PM", description: "Apply the updated pricing and resend to the customer.", estimatedTime: "20m" },
      { title: "Update customer records", priority: "Normal", due: "today", time: "11:00 AM", status: "in_progress", estimatedTime: "45m" },
      { title: "Complete inventory check", priority: "Normal", due: "today", checklist: ["Filters", "Coolant", "Hand tools", "Safety gear"], estimatedTime: "1h" },
      { title: "Prepare Friday sales report", priority: "Normal", due: "friday", description: "Summarize the week's revenue and pipeline.", approvalRequired: true },
      { title: "Approve team timesheets", priority: "Normal", due: "today", status: "completed" },
      { title: "Morning route planning", priority: "Normal", due: "today", status: "completed" },
      { title: "Team standup", kind: "meeting", due: "today", time: "9:00 AM", description: "Daily sync." },
      { title: "Client demo: Elena Brooks", kind: "meeting", due: "today", time: "1:00 PM", description: "Review the maintenance plan." },
    ],
  },
  {
    name: "Alex Rivera",
    role: "Lead Technician",
    department: "Operations",
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
    perfFeedback: "Your on-time completion is up 6% versus last month.",
    tasks: [
      { title: "Finish the Johnson AC install", priority: "High", due: "today", requiredResult: "Photograph the finished unit" },
      { title: "Restock the truck", priority: "Normal", due: "today", checklist: ["Filters", "Refrigerant", "Fittings"] },
    ],
  },
  {
    name: "Sam Patel",
    role: "Field Technician",
    department: "Operations",
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
    perfFeedback: "You cut callbacks to under 3% — great work.",
    tasks: [
      { title: "Morning maintenance route", priority: "Normal", due: "today" },
    ],
  },
];

/**
 * Seed a small demo team the first time the workforce features are opened in
 * **preview mode only**. Production workspaces stay empty until real invites.
 */
export function seedDemoTeamIfEmpty(): TeamPerson[] {
  const existing = loadTeamMembers();
  if (existing.length > 0) return existing;

  if (!isDemoWorkspace()) return existing;

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
      perfFeedback: demo.perfFeedback,
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
        dueTime: seed.time,
        assignedBy: seed.assignedBy,
        progress: seed.progress,
        project: seed.project,
        dependencies: seed.dependencies,
        people: seed.people,
      });
      tasks.push(seed.status ? { ...base, status: seed.status } : base);
    }
  });

  // Wider org roster so Team pages show real departments (lightweight members).
  const roster: { name: string; role: string; department: string }[] = [
    { name: "David Chen", role: "Account Manager", department: "Management" },
    { name: "Mike Ross", role: "Operations Manager", department: "Management" },
    { name: "Ashley Kim", role: "Finance Lead", department: "Management" },
    { name: "Jordan Ellis", role: "Program Manager", department: "Management" },
    { name: "Jordan Blake", role: "Account Executive", department: "Sales" },
    { name: "Riley Chen", role: "Sales Rep", department: "Sales" },
    { name: "Morgan Lee", role: "Support Lead", department: "Customer Support" },
    { name: "Priya Shah", role: "Support Specialist", department: "Customer Support" },
    { name: "Diego Ruiz", role: "Support Specialist", department: "Customer Support" },
    { name: "Taylor Kim", role: "Marketing Manager", department: "Marketing" },
    { name: "Casey Nolan", role: "Ops Coordinator", department: "Operations" },
    { name: "Marcus Lee", role: "Sales Associate", department: "Sales" },
  ];
  const goals: EmployeeGoal[] = [];
  roster.forEach((r) => {
    const m = createTeamMember({ name: r.name, role: r.role });
    m.department = r.department;
    members.push(m);
  });

  const byName = (name: string) => members.find((m) => m.name === name);
  const sarah = byName("Sarah Williams");
  const jordan = byName("Jordan Blake");

  // Goals (individual + a team goal).
  if (jordan) {
    goals.push(
      createGoal({ memberId: jordan.id, department: "Sales", title: "August Sales Goal", kind: "amount", target: 50000, current: 42000, period: "August" }),
    );
  }
  if (sarah) {
    goals.push(
      createGoal({ memberId: sarah.id, department: "Management", title: "Customer Calls", kind: "count", target: 200, current: 173, unit: "calls", period: "This month" }),
      createGoal({ memberId: sarah.id, department: "Management", title: "Monthly Sales Goal", kind: "amount", target: 50000, current: 38250, period: "August" }),
    );
  }
  goals.push(
    createGoal({ department: "Customer Support", title: "CSAT above 4.7", kind: "count", target: 100, current: 82, unit: "%", period: "Q3" }),
  );

  // A seeded announcement (with a few acknowledgements already).
  const labor: Announcement = {
    id: newId("ann"),
    title: "Office closed Monday for Labor Day",
    body: "The office is closed Monday, September 1 for Labor Day. Emergency on-call only.",
    at: nowIso(),
    acks: members.slice(3).map((m) => m.id),
  };

  // A manager message to Sarah, plus a team-channel note.
  const seededMessages: ChatMessage[] = [];
  if (sarah) {
    seededMessages.push(
      { id: newId("msg"), channelId: dmChannelId(sarah.id), authorId: "owner", authorName: "Owner", text: "@Sarah please prioritize the Johnson account.", at: nowIso() },
      { id: newId("msg"), channelId: teamChannelId(sarah.department || "Management"), authorId: "owner", authorName: "Owner", text: "Great work closing out July — let's keep the momentum.", at: nowIso() },
      { id: newId("msg"), channelId: teamChannelId(sarah.department || "Management"), authorId: byName("Diego Ruiz")?.id ?? "teammate", authorName: "Diego Ruiz", text: "Hola, el cliente de Johnson pidió una cotización actualizada para mañana. ¿Puedes ayudar?", at: nowIso() },
    );
  }

  // A pending time-off request that would understaff Customer Support.
  const priya = byName("Priya Shah");
  const timeoff: TimeOffRequest[] = priya
    ? [
        {
          id: newId("pto"),
          memberId: priya.id,
          startDate: "2026-08-21",
          endDate: "2026-08-23",
          type: "Vacation",
          portion: "full",
          note: "Family trip",
          status: "pending",
          createdAt: nowIso(),
        },
      ]
    : [];

  // Location + shift qualifications by department (with a couple in Miami).
  const locByDept: Record<string, string> = {
    Management: "Headquarters",
    Sales: "Headquarters",
    Marketing: "Headquarters",
    Operations: "Chicago",
    "Customer Support": "Dallas",
  };
  const qualsByDept: Record<string, string[]> = {
    Operations: ["HVAC"],
    "Customer Support": ["Customer Service"],
    Sales: ["Sales"],
    Marketing: ["Marketing"],
    Management: ["Management"],
  };
  members.forEach((m) => {
    const d = m.department || "General";
    if (!m.location) m.location = locByDept[d] || "Headquarters";
    if (!m.qualifications) m.qualifications = qualsByDept[d] || [d];
  });
  const riley = byName("Riley Chen");
  const diego = byName("Diego Ruiz");
  const morgan = byName("Morgan Lee");
  const priya2 = byName("Priya Shah");
  const alex = byName("Alex Rivera");
  const sam = byName("Sam Patel");
  if (riley) riley.location = "Miami";
  if (diego) diego.location = "Miami";

  const saturday = nextDateForWeekday("saturday", Date.now());
  const scheduled: ScheduledShift[] = [];
  if (alex) scheduled.push(createScheduledShift({ memberId: alex.id, date: today, start: "8:00 AM", end: "4:30 PM", role: "HVAC", location: alex.location }));
  if (sam) scheduled.push(createScheduledShift({ memberId: sam.id, date: today, start: "9:00 AM", end: "5:30 PM", role: "HVAC", location: sam.location }));
  if (morgan) scheduled.push(createScheduledShift({ memberId: morgan.id, date: saturday, start: "10:00 AM", end: "6:00 PM", role: "Customer Service", location: morgan.location }));
  scheduled.push(createScheduledShift({ date: saturday, start: "9:00 AM", end: "5:00 PM", role: "HVAC", location: "Chicago" })); // open shift

  const training: TrainingModule[] = [];
  const stdModules = (mid: string): TrainingModule[] =>
    [
      { name: "Workplace Safety", progress: 100, dueDate: "" },
      { name: "Customer Service", progress: 100, dueDate: "" },
      { name: "Atlas Basics", progress: 100, dueDate: "" },
      { name: "Advanced Sales", progress: 70, dueDate: "" },
      { name: "Cybersecurity", progress: 40, dueDate: "2026-08-30" },
    ].map((x) => ({ id: newId("trn"), memberId: mid, ...x }));
  [sarah, alex, sam].forEach((m) => {
    if (m) training.push(...stdModules(m.id));
  });

  const certs: Certification[] = [];
  if (alex) certs.push({ id: newId("cert"), memberId: alex.id, name: "HVAC Certification", expires: "2026-08-20" });
  if (sam) certs.push({ id: newId("cert"), memberId: sam.id, name: "CDL (Commercial License)", expires: "2027-01-15" });
  if (sarah) certs.push({ id: newId("cert"), memberId: sarah.id, name: "Food Safety Manager", expires: "2026-09-05" });

  const docCategories: { title: string; category: DocCategory; visibility: "employee" | "manager" }[] = [
    { title: "Employee Handbook", category: "Handbook", visibility: "employee" },
    { title: "Pay stub — July", category: "Pay", visibility: "employee" },
    { title: "Offer letter", category: "Employment", visibility: "employee" },
    { title: "Cybersecurity Policy", category: "Policy", visibility: "employee" },
    { title: "Q2 Performance Review", category: "Performance review", visibility: "manager" },
  ];
  const docs: EmployeeDocument[] = [];
  [sarah, alex, sam].forEach((m) => {
    if (m) docCategories.forEach((d) => docs.push({ id: newId("doc"), memberId: m.id, addedAt: nowIso(), ...d }));
  });

  const recognitions: Recognition[] = [];
  if (sarah) {
    recognitions.push({ id: newId("recog"), memberId: sarah.id, emoji: "🏆", title: "Customer Hero", detail: "Received five 5-star customer reviews this month.", at: nowIso() });
    recognitions.push({ id: newId("recog"), memberId: sarah.id, emoji: "🎯", title: "100 Tasks Completed", detail: "Crossed 100 completed tasks in Atlas.", at: nowIso() });
  }

  const suggestions: Suggestion[] = [];
  const addSugg = (mid: string | undefined, text: string) => {
    if (mid) suggestions.push({ id: newId("sugg"), memberId: mid, text, topic: topicOf(text), at: nowIso() });
  };
  addSugg(morgan?.id, "Our current refund process takes too many steps.");
  addSugg(priya2?.id, "Refunds require too many approvals — customers wait too long.");
  addSugg(diego?.id, "The refund workflow is confusing for new hires.");
  addSugg(jordan?.id, "We need better scheduling visibility across teams.");

  // Seed live-ish presence for a few teammates so Team views show real statuses.
  const presenceSeed: Record<string, EmployeePresence> = {};
  const stamp = nowIso();
  const setPres = (name: string, manual: ManualStatus) => {
    const m = byName(name);
    if (m) presenceSeed[m.id] = { memberId: m.id, clockedIn: true, manualStatus: manual, currentTaskId: null, note: "", lastSeen: stamp, lastActiveAt: stamp };
  };
  setPres("David Chen", "working");
  setPres("Mike Ross", "meeting");
  setPres("Ashley Kim", "break");
  setPres("Jordan Ellis", "away");

  // Profiles (skills, ids, start dates) + earned achievements.
  if (sarah) {
    sarah.employeeId = "E-1042";
    sarah.startDate = "2023-03-06";
    sarah.skills = [
      { name: "Customer Service", level: 5 },
      { name: "Salesforce", level: 4 },
      { name: "Excel", level: 3 },
      { name: "Sales", level: 5 },
    ];
    sarah.earnedAchievements = ["perfect_week", "customer_favorite", "goal_crusher", "team_player"];
  }
  if (alex) {
    alex.employeeId = "E-1088";
    alex.startDate = "2024-01-15";
    alex.skills = [
      { name: "HVAC", level: 5 },
      { name: "Diagnostics", level: 4 },
      { name: "Customer Service", level: 4 },
    ];
    alex.earnedAchievements = ["streak10", "problem_solver"];
  }
  if (sam) {
    sam.employeeId = "E-1120";
    sam.startDate = "2024-06-01";
    sam.skills = [
      { name: "HVAC", level: 3 },
      { name: "Route planning", level: 4 },
    ];
    sam.earnedAchievements = ["team_player"];
  }

  // Johnson Expansion dependency chain + a shared team task.
  const david = byName("David Chen");
  const mike = byName("Mike Ross");
  const ashley = byName("Ashley Kim");
  const projectTasks: TeamTask[] = [];
  if (sarah && mike && david && ashley) {
    const prep = createTeamTask({ memberId: sarah.id, title: "Prepare pricing", project: "Johnson Expansion", assignedBy: "Michael" });
    prep.status = "completed";
    const approve = createTeamTask({ memberId: mike.id, title: "Approve pricing", project: "Johnson Expansion", assignedBy: "Michael" });
    approve.dependsOn = [prep.id];
    approve.status = "in_progress";
    const contract = createTeamTask({ memberId: david.id, title: "Create contract", project: "Johnson Expansion", assignedBy: "Michael" });
    contract.dependsOn = [approve.id];
    const send = createTeamTask({ memberId: ashley.id, title: "Send contract", project: "Johnson Expansion", assignedBy: "Michael" });
    send.dependsOn = [contract.id];
    const review = createTeamTask({ memberId: sarah.id, title: "Review approved pricing", project: "Johnson Expansion", assignedBy: "Michael" });
    review.dependsOn = [approve.id];
    projectTasks.push(prep, approve, contract, send, review);

    const shared = createTeamTask({ memberId: sarah.id, title: "Launch Customer Website", project: "Website Launch", assignedBy: "Michael", dueDate: friday });
    shared.parts = [
      { id: newId("part"), memberId: sarah.id, label: "Design", status: "completed" },
      { id: newId("part"), memberId: mike.id, label: "Development", status: "in_progress" },
      { id: newId("part"), memberId: ashley.id, label: "Copywriting", status: "completed" },
      { id: newId("part"), memberId: david.id, label: "Testing", status: "not_started" },
    ];
    projectTasks.push(shared);
  }
  tasks.push(...projectTasks);

  // A near-future meeting + a quick task so "My Work" shows a Next item and an
  // Atlas time-gap suggestion regardless of when the demo runs.
  if (sarah) {
    const soon = formatClock(new Date(Date.now() + 40 * 60000).toISOString());
    tasks.push(
      createTeamTask({ memberId: sarah.id, title: "Customer meeting", assignedBy: "Michael", dueDate: today, dueTime: soon, kind: "meeting", estimatedTime: "30 min" }),
      createTeamTask({ memberId: sarah.id, title: "Expense report", assignedBy: "Michael", dueDate: today, estimatedTime: "15 min", priority: "Normal" }),
    );
  }

  // Work memory for Sarah (past case, procedure, training, preference).
  const memory: MemoryEntry[] = sarah
    ? [
        { id: newId("mem"), memberId: sarah.id, kind: "case", title: "Johnson pricing dispute (Q2)", detail: "The Johnson account pushed back on pricing. We re-quoted with a 5% loyalty discount and a phased payment plan; it resolved in 3 days and they signed.", tags: ["johnson", "pricing", "dispute", "contract", "problem"], docs: ["Johnson re-quote Q2.pdf", "Johnson signed contract.pdf"], at: nowIso() },
        { id: newId("mem"), memberId: sarah.id, kind: "procedure", title: "Refund procedure", detail: "Confirm the order, check the window, get manager approval over $500, and log the outcome.", tags: ["refund", "procedure"], docs: ["Refund policy.pdf"], at: nowIso() },
        { id: newId("mem"), memberId: sarah.id, kind: "training", title: "Completed Advanced CRM training", detail: "Certified on the new CRM workflows in July.", tags: ["training", "crm"], docs: [], at: nowIso() },
        { id: newId("mem"), memberId: sarah.id, kind: "preference", title: "Prefers morning deep-work", detail: "Blocks 8–10 AM for proposals; batches calls in the afternoon.", tags: ["preference", "schedule"], docs: [], at: nowIso() },
      ]
    : [];

  const meeting: Announcement = {
    id: newId("ann"),
    title: "Company meeting tomorrow at 9 AM",
    body: "All-hands in the main room and on the call link.",
    at: nowIso(),
    acks: [],
  };

  // New-hire onboarding, Sarah's recurring responsibilities, a searchable meeting.
  const marcus = byName("Marcus Lee");
  const onboarding: OnboardingState[] = marcus ? [{ memberId: marcus.id, done: ["profile"], startedAt: nowIso() }] : [];
  const recurring: RecurringTemplate[] = sarah
    ? [
        { id: newId("rec"), memberId: sarah.id, title: "Inventory audit", department: "Operations", cadence: "weekly-mon", lastOccurrence: "", createdAt: nowIso() },
        { id: newId("rec"), memberId: sarah.id, title: "Submit expense report", department: "Finance", cadence: "weekly-fri", lastOccurrence: "", createdAt: nowIso() },
        { id: newId("rec"), memberId: sarah.id, title: "Customer account review", department: "Sales", cadence: "monthly-1", lastOccurrence: "", createdAt: nowIso() },
      ]
    : [];
  const events: PlannedEvent[] = [planEventFromInput({ title: "Johnson Expansion Meeting", type: "Client meeting", guests: 6, budget: 500, date: friday })];

  // A temporary access grant (auto-expires) + a starter audit trail.
  const grants: TempGrant[] = sarah
    ? [
        {
          id: newId("grant"),
          memberId: sarah.id,
          memberName: sarah.name,
          resource: "Johnson acquisition documents",
          grantedBy: "Owner",
          grantedAt: nowIso(),
          expiresAt: new Date(`${friday}T17:00:00`).toISOString(),
          revoked: false,
        },
      ]
    : [];
  const audit: AuditEvent[] = sarah
    ? [
        { id: newId("audit"), at: new Date(Date.now() - 40 * 60000).toISOString(), actor: sarah.name, action: "completed", target: "Task: Call Johnson Construction" },
        { id: newId("audit"), at: new Date(Date.now() - 23 * 60000).toISOString(), actor: "Owner", action: "approved", target: "Sarah's proposal" },
        { id: newId("audit"), at: new Date(Date.now() - 22 * 60000).toISOString(), actor: "Atlas", action: "sent customer email", target: "Johnson Construction" },
        { id: newId("audit"), at: new Date(Date.now() - 7 * 60000).toISOString(), actor: "Owner", action: "granted temporary access", target: "Sarah: Johnson acquisition documents" },
      ]
    : [];

  // Equipment assigned to Sarah for the Equipment & Asset page.
  const assets: Asset[] = sarah
    ? [
        { id: newId("asset"), memberId: sarah.id, kind: "Laptop", tag: "#A194", name: "MacBook Pro 14\"" },
        { id: newId("asset"), memberId: sarah.id, kind: "Phone", tag: "#M283", name: "iPhone 15" },
        { id: newId("asset"), memberId: sarah.id, kind: "Vehicle", tag: "#142", name: "Company van" },
        { id: newId("asset"), memberId: sarah.id, kind: "Access Card", tag: "#183", name: "HQ badge" },
      ]
    : [];

  saveTeamMembers(members);
  saveTeamTasks([...tasks, ...loadTeamTasks()]);
  saveShifts([...shifts, ...loadShifts()]);
  savePresenceMap({ ...loadPresenceMap(), ...presenceSeed });
  saveGoals([...goals, ...loadGoals()]);
  saveAnnouncements([meeting, labor, ...loadAnnouncements()]);
  saveMessages([...loadMessages(), ...seededMessages]);
  saveTimeOff([...timeoff, ...loadTimeOff()]);
  saveScheduledShifts([...scheduled, ...loadScheduledShifts()]);
  saveTraining([...training, ...loadTraining()]);
  saveCertifications([...certs, ...loadCertifications()]);
  saveDocuments([...docs, ...loadDocuments()]);
  saveRecognitions([...recognitions, ...loadRecognitions()]);
  saveSuggestions([...suggestions, ...loadSuggestions()]);
  saveMemory([...memory, ...loadMemory()]);
  saveOnboardingAll([...onboarding, ...loadOnboardingAll()]);
  saveRecurring([...recurring, ...loadRecurring()]);
  saveEvents([...loadEvents(), ...events]);
  saveAssets([...assets, ...loadAssets()]);
  saveGrants([...grants, ...loadGrants()]);
  saveJson(AUDIT_KEY, [...audit, ...loadAudit()].slice(0, 200));
  return members;
}
