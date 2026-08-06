export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "normal" | "high";

export type AtlasTask = {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "atlas-tasks-v1";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function seedTasks(now = new Date()): AtlasTask[] {
  const day = (offset: number) => {
    const d = new Date(now);
    d.setHours(17, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d.toISOString();
  };
  return [
    {
      id: newId(),
      title: "Finish CallbackFlow login",
      notes: "Ship auth screen before standup",
      status: "doing",
      priority: "high",
      dueDate: day(0),
      category: "Atlas",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: newId(),
      title: "Review HomeBase dashboard",
      notes: "UI polish pass",
      status: "todo",
      priority: "high",
      dueDate: day(1),
      category: "Atlas",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: newId(),
      title: "Pay internet bill",
      notes: "Due this week",
      status: "todo",
      priority: "normal",
      dueDate: day(0),
      category: "Finance",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: newId(),
      title: "Upload Q2 receipts",
      notes: "Attach to Tax Center ledger",
      status: "todo",
      priority: "normal",
      dueDate: day(3),
      category: "Tax",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: newId(),
      title: "Confirm Saturday family block",
      notes: "Shared calendar with Morgan",
      status: "done",
      priority: "low",
      dueDate: day(-1),
      category: "Personal",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];
}

export function loadTasks(): AtlasTask[] {
  if (typeof window === "undefined") return seedTasks();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedTasks();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as AtlasTask[];
    return Array.isArray(parsed) && parsed.length ? parsed : seedTasks();
  } catch {
    return seedTasks();
  }
}

export function saveTasks(tasks: AtlasTask[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  void import("@/lib/backend/client").then(({ pushWorkspace }) => pushWorkspace("tasks", tasks));
}

export async function hydrateTasks(): Promise<AtlasTask[]> {
  if (typeof window === "undefined") return seedTasks();
  try {
    const { pullWorkspace } = await import("@/lib/backend/client");
    const remote = await pullWorkspace<AtlasTask[]>("tasks");
    if (Array.isArray(remote) && remote.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      return remote;
    }
  } catch {
    /* fall through */
  }
  return loadTasks();
}

export function createTask(input: {
  title: string;
  notes?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  category?: string;
}): AtlasTask {
  const stamp = nowIso();
  return {
    id: newId(),
    title: input.title.trim() || "Untitled task",
    notes: (input.notes || "").trim(),
    status: "todo",
    priority: input.priority || "normal",
    dueDate: input.dueDate ?? null,
    category: (input.category || "General").trim() || "General",
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function updateTask(tasks: AtlasTask[], id: string, patch: Partial<AtlasTask>) {
  return tasks.map((task) =>
    task.id === id ? { ...task, ...patch, updatedAt: nowIso() } : task,
  );
}

export function removeTask(tasks: AtlasTask[], id: string) {
  return tasks.filter((task) => task.id !== id);
}

export function taskCounts(tasks: AtlasTask[]) {
  return {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
    high: tasks.filter((t) => t.priority === "high" && t.status !== "done").length,
  };
}
