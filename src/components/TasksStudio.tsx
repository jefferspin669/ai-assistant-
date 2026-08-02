"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  createTask,
  loadTasks,
  removeTask,
  saveTasks,
  taskCounts,
  updateTask,
  type AtlasTask,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";

const STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" },
];

export function TasksStudio() {
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<AtlasTask[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Atlas");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    setTasks(loadTasks());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveTasks(tasks);
  }, [ready, tasks]);

  const counts = useMemo(() => taskCounts(tasks), [tasks]);
  const visible = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
  );

  function note(msg: string) {
    setFlash(msg);
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((prev) => [createTask({ title, notes, category, priority }), ...prev]);
    setTitle("");
    setNotes("");
    note("Task added.");
  }

  if (!ready) {
    return (
      <AppShell title="Tasks" subtitle="Loading…">
        <div className="panel">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Tasks"
      subtitle="Track Atlas development, finance, tax, and personal work in one place."
    >
      {flash ? <p className="auth-success">{flash}</p> : null}

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Open</span>
          <strong>{counts.todo + counts.doing}</strong>
          <small>{counts.high} high priority</small>
        </div>
        <div className="stat">
          <span>Doing</span>
          <strong>{counts.doing}</strong>
          <small>In progress</small>
        </div>
        <div className="stat">
          <span>Done</span>
          <strong>{counts.done}</strong>
          <small>Completed</small>
        </div>
        <div className="stat">
          <span>Total</span>
          <strong>{counts.total}</strong>
          <small>Saved on this device</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <div className="sc-toolbar">
            <h2>Board</h2>
            <div className="biz-switcher">
              <button
                type="button"
                className={filter === "all" ? "biz-chip active" : "biz-chip"}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              {STATUSES.map((status) => (
                <button
                  key={status.id}
                  type="button"
                  className={filter === status.id ? "biz-chip active" : "biz-chip"}
                  onClick={() => setFilter(status.id)}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
          <ul className="manage-list">
            {visible.length === 0 ? (
              <li>No tasks in this view.</li>
            ) : (
              visible.map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <small>
                      {task.category} · {task.priority}
                      {task.dueDate
                        ? ` · due ${new Date(task.dueDate).toLocaleDateString()}`
                        : ""}
                      {task.notes ? ` · ${task.notes}` : ""}
                    </small>
                  </div>
                  <div className="list-actions">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        setTasks((prev) =>
                          updateTask(prev, task.id, { status: e.target.value as TaskStatus }),
                        )
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ghost-link"
                      onClick={() => {
                        setTasks((prev) => removeTask(prev, task.id));
                        note("Task removed.");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="panel">
          <h2>Add task</h2>
          <form className="form-grid" onSubmit={onAdd}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Category
              <input value={category} onChange={(e) => setCategory(e.target.value)} />
            </label>
            <label>
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </label>
            <button className="btn btn-dark" type="submit">
              Add task
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
