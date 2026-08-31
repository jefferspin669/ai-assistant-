/** Atlas Project Manager — projects, tasks, milestones, and AI planning. */

import { loadTeamMembers, type TeamPerson } from "./user-workspace";

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

export type ProjectTaskStatus = "todo" | "in_progress" | "review" | "completed" | "blocked";
export type ProjectPriority = "Low" | "Normal" | "High" | "Urgent";
export type ProjectStatus = "planning" | "active" | "at_risk" | "completed";

export type ProjectSubtask = {
  id: string;
  title: string;
  status: ProjectTaskStatus;
  assigneeId?: string;
};

export type ProjectComment = {
  id: string;
  text: string;
  author: string;
  at: string;
};

export type ProjectFile = {
  id: string;
  name: string;
  addedBy: string;
  at: string;
};

export type ProjectMilestone = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
};

export type ProjectActivity = {
  id: string;
  kind: "created" | "updated" | "comment" | "risk" | "ai";
  text: string;
  at: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  priority: ProjectPriority;
  dueDate: string;
  assigneeIds: string[];
  subtasks: ProjectSubtask[];
  comments: ProjectComment[];
  createdAt: string;
};

export type ProjectFolder = {
  id: string;
  name: string;
  createdAt: string;
};

export type AtlasProject = {
  id: string;
  folderId?: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  priority: ProjectPriority;
  dueDate: string;
  budget: string;
  spent: string;
  teamMemberIds: string[];
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  files: ProjectFile[];
  comments: ProjectComment[];
  activity: ProjectActivity[];
  riskWarnings: string[];
  aiSuggestions: string[];
  createdAt: string;
};

const PROJECTS_KEY = "atlas-projects-v2";
const FOLDERS_KEY = "atlas-project-folders-v1";

export function loadProjectFolders(): ProjectFolder[] {
  return loadJson(FOLDERS_KEY, []);
}

export function saveProjectFolders(folders: ProjectFolder[]) {
  saveJson(FOLDERS_KEY, folders);
}

export function loadAtlasProjects(): AtlasProject[] {
  return loadJson(PROJECTS_KEY, []);
}

export function saveAtlasProjects(projects: AtlasProject[]) {
  saveJson(PROJECTS_KEY, projects);
}

export function computeProjectProgress(project: AtlasProject): number {
  const tasks = project.tasks;
  if (!tasks.length) return project.progress;
  const done = tasks.filter((t) => t.status === "completed").length;
  return Math.round((done / tasks.length) * 100);
}

export function assessProjectRisks(project: AtlasProject, today = todayISO()): string[] {
  const warnings: string[] = [];
  const overdue = project.tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && t.dueDate.slice(0, 10) < today,
  );
  if (overdue.length) warnings.push(`${overdue.length} task${overdue.length === 1 ? "" : "s"} overdue`);
  const blocked = project.tasks.filter((t) => t.status === "blocked");
  if (blocked.length) warnings.push(`${blocked.length} blocked task${blocked.length === 1 ? "" : "s"}`);
  if (project.dueDate && project.dueDate.slice(0, 10) < today && project.status !== "completed") {
    warnings.push("Project deadline passed");
  }
  const unassigned = project.tasks.filter((t) => t.status !== "completed" && !t.assigneeIds.length);
  if (unassigned.length > 2) warnings.push(`${unassigned.length} tasks still need owners`);
  return warnings;
}

export function aiSuggestionsForProject(project: AtlasProject): string[] {
  const risks = assessProjectRisks(project);
  const suggestions: string[] = [];
  if (risks.some((r) => r.includes("overdue"))) {
    suggestions.push("Atlas suggests rebalancing due dates or assigning backup owners on overdue work.");
  }
  if (project.progress < 40 && project.status === "active") {
    suggestions.push("Progress is behind pace — consider a team sync or splitting large tasks.");
  }
  if (project.tasks.filter((t) => t.status === "review").length > 2) {
    suggestions.push("Several tasks await review — batch manager approvals this afternoon.");
  }
  return suggestions;
}

function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function createProjectFolder(name: string): ProjectFolder {
  const folder: ProjectFolder = { id: newId("fld"), name: name.trim() || "Folder", createdAt: nowIso() };
  saveProjectFolders([...loadProjectFolders(), folder]);
  return folder;
}

export function createAtlasProject(input: {
  name: string;
  description?: string;
  folderId?: string;
  dueDate?: string;
  budget?: string;
  teamMemberIds?: string[];
}): AtlasProject {
  const project: AtlasProject = {
    id: newId("proj"),
    folderId: input.folderId,
    name: input.name.trim() || "New project",
    description: input.description?.trim() || "",
    status: "planning",
    progress: 0,
    priority: "Normal",
    dueDate: input.dueDate || "",
    budget: input.budget || "",
    spent: "$0",
    teamMemberIds: input.teamMemberIds ?? [],
    milestones: [],
    tasks: [],
    files: [],
    comments: [],
    activity: [{ id: newId("act"), kind: "created", text: "Project created", at: nowIso() }],
    riskWarnings: [],
    aiSuggestions: [],
    createdAt: nowIso(),
  };
  saveAtlasProjects([project, ...loadAtlasProjects()]);
  return project;
}

export function updateAtlasProject(id: string, patch: Partial<AtlasProject>): AtlasProject | null {
  const projects = loadAtlasProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const updated = { ...projects[idx], ...patch };
  updated.progress = computeProjectProgress(updated);
  updated.riskWarnings = assessProjectRisks(updated);
  updated.aiSuggestions = aiSuggestionsForProject(updated);
  projects[idx] = updated;
  saveAtlasProjects(projects);
  return updated;
}

export function addProjectTask(
  projectId: string,
  input: {
    title: string;
    description?: string;
    priority?: ProjectPriority;
    dueDate?: string;
    assigneeIds?: string[];
  },
): ProjectTask | null {
  const projects = loadAtlasProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;
  const task: ProjectTask = {
    id: newId("ptask"),
    title: input.title.trim(),
    description: input.description?.trim() || "",
    status: "todo",
    priority: input.priority ?? "Normal",
    dueDate: input.dueDate || "",
    assigneeIds: input.assigneeIds ?? [],
    subtasks: [],
    comments: [],
    createdAt: nowIso(),
  };
  project.tasks = [task, ...project.tasks];
  project.activity = [
    { id: newId("act"), kind: "updated", text: `Task added: ${task.title}`, at: nowIso() },
    ...project.activity,
  ];
  updateAtlasProject(projectId, project);
  return task;
}

export function addProjectComment(projectId: string, text: string, author = "Manager"): ProjectComment | null {
  const projects = loadAtlasProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;
  const comment: ProjectComment = { id: newId("cmt"), text, author, at: nowIso() };
  project.comments = [comment, ...project.comments];
  project.activity = [
    { id: newId("act"), kind: "comment", text: `${author} commented`, at: nowIso() },
    ...project.activity,
  ];
  updateAtlasProject(projectId, project);
  return comment;
}

export function addProjectMilestone(projectId: string, title: string, dueDate: string): ProjectMilestone | null {
  const projects = loadAtlasProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;
  const milestone: ProjectMilestone = { id: newId("ms"), title, dueDate, completed: false };
  project.milestones = [...project.milestones, milestone];
  updateAtlasProject(projectId, project);
  return milestone;
}

/** Generate a launch plan from natural language — divides work across teams. */
export function generateProjectPlanFromPrompt(prompt: string): AtlasProject {
  const members = loadTeamMembers();
  const marketing = members.filter((m) => /marketing|sales|emma/i.test(`${m.department} ${m.name}`));
  const dev = members.filter((m) => /dev|tech|engineering|alex|sam/i.test(`${m.department} ${m.role} ${m.name}`));
  const lower = prompt.toLowerCase();
  const name = lower.includes("website")
    ? "Website launch"
    : lower.includes("product")
      ? "Product launch"
      : "New initiative";

  const project = createAtlasProject({
    name,
    description: prompt.trim(),
    dueDate: todayISO(new Date(Date.now() + 21 * 864e5)),
    budget: "$12k est.",
    teamMemberIds: [...marketing, ...dev].map((m) => m.id),
  });

  const tasks: Array<{ title: string; team: TeamPerson[]; days: number }> = [
    { title: "Finalize landing page copy and hero design", team: marketing, days: 5 },
    { title: "Build responsive mobile layout", team: dev, days: 10 },
    { title: "Integrate analytics and conversion tracking", team: dev, days: 12 },
    { title: "Prepare email and social launch campaign", team: marketing, days: 14 },
    { title: "QA pass and launch checklist", team: [...dev, ...marketing], days: 18 },
  ];

  const updated = loadAtlasProjects().find((p) => p.id === project.id)!;
  for (const item of tasks) {
    const due = todayISO(new Date(Date.now() + item.days * 864e5));
    updated.tasks.push({
      id: newId("ptask"),
      title: item.title,
      description: `From Atlas plan: ${prompt.slice(0, 120)}`,
      status: "todo",
      priority: "High",
      dueDate: due,
      assigneeIds: item.team.slice(0, 2).map((m) => m.id),
      subtasks: [],
      comments: [],
      createdAt: nowIso(),
    });
  }
  updated.milestones = [
    { id: newId("ms"), title: "Design approved", dueDate: todayISO(new Date(Date.now() + 7 * 864e5)), completed: false },
    { id: newId("ms"), title: "Beta ready", dueDate: todayISO(new Date(Date.now() + 14 * 864e5)), completed: false },
    { id: newId("ms"), title: "Public launch", dueDate: updated.dueDate, completed: false },
  ];
  updated.status = "active";
  updated.activity = [
    { id: newId("act"), kind: "ai", text: "Atlas generated a launch plan from your request", at: nowIso() },
    ...updated.activity,
  ];
  updateAtlasProject(updated.id, updated);
  return loadAtlasProjects().find((p) => p.id === project.id)!;
}

export function seedProjectsIfEmpty(): void {
  if (loadAtlasProjects().length > 0) return;
  const members = loadTeamMembers();
  const p1 = createAtlasProject({
    name: "Atlas 2.0",
    description: "Customer dashboard redesign and mobile refresh",
    dueDate: todayISO(new Date(Date.now() + 30 * 864e5)),
    budget: "$45k",
    teamMemberIds: members.slice(0, 3).map((m) => m.id),
  });
  addProjectTask(p1.id, {
    title: "Update customer dashboard mobile layout",
    priority: "High",
    dueDate: todayISO(new Date(Date.now() + 5 * 864e5)),
    assigneeIds: members[0] ? [members[0].id] : [],
  });
  addProjectMilestone(p1.id, "Mobile beta", todayISO(new Date(Date.now() + 10 * 864e5)));
  updateAtlasProject(p1.id, { status: "active" });
}

export function workloadByMember(): Record<string, { open: number; projects: string[] }> {
  const map: Record<string, { open: number; projects: string[] }> = {};
  for (const project of loadAtlasProjects()) {
    for (const task of project.tasks) {
      if (task.status === "completed") continue;
      for (const id of task.assigneeIds) {
        if (!map[id]) map[id] = { open: 0, projects: [] };
        map[id].open += 1;
        if (!map[id].projects.includes(project.name)) map[id].projects.push(project.name);
      }
    }
  }
  return map;
}
