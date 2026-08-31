"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { loadAtlasProjects } from "@/lib/projects-workspace";
import {
  addTaskComment,
  addTaskAttachment,
  awaitingApproval,
  createTeamTask,
  decideApproval,
  isOpenTask,
  loadTeamMembers,
  loadTeamTasks,
  replaceTask,
  saveTeamTasks,
  seedDemoTeamIfEmpty,
  taskStatusLabel,
  TASK_PRIORITIES,
  TASK_STATUSES,
  toggleChecklistItem,
  type TaskPriority,
  type TaskRecurrence,
  type TaskStatus,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";
import { isDemoWorkspace } from "@/lib/workspace-mode";

const recurrences: { id: TaskRecurrence; label: string }[] = [
  { id: "one-time", label: "One-time" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

function memberName(members: TeamPerson[], id: string) {
  return members.find((m) => m.id === id)?.name ?? "Unassigned";
}

export function TasksStudio() {
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [filter, setFilter] = useState<"open" | "all" | TaskStatus>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [flash, setFlash] = useState("");

  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [project, setProject] = useState("");
  const [department, setDepartment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Normal");
  const [description, setDescription] = useState("");
  const [subtasks, setSubtasks] = useState("");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("one-time");
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [attachmentName, setAttachmentName] = useState("");
  const [commentDraft, setCommentDraft] = useState("");

  const refresh = useCallback(() => {
    if (isDemoWorkspace()) seedDemoTeamIfEmpty();
    setMembers(loadTeamMembers());
    setTasks(loadTeamTasks());
  }, []);

  useEffect(() => {
    refresh();
    const first = loadTeamMembers()[0]?.id ?? "";
    setAssigneeId(first);
    setReady(true);
  }, [refresh]);

  const projects = useMemo(() => {
    const fromTasks = tasks.map((t) => t.project).filter(Boolean);
    const fromProjects = loadAtlasProjects().map((p) => p.name);
    return Array.from(new Set([...fromProjects, ...fromTasks])).sort();
  }, [tasks]);

  const departments = useMemo(
    () => Array.from(new Set(members.map((m) => m.department).filter(Boolean))).sort(),
    [members],
  );

  const visible = useMemo(() => {
    if (filter === "all") return tasks;
    if (filter === "open") return tasks.filter((t) => isOpenTask(t.status));
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const openCount = tasks.filter((t) => isOpenTask(t.status)).length;
  const highCount = tasks.filter((t) => t.priority === "High" || t.priority === "Urgent" && isOpenTask(t.status)).length;

  function note(msg: string) {
    setFlash(msg);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const target = assigneeId || members[0]?.id;
    if (!target || !title.trim()) return;
    const task = createTeamTask({
      memberId: target,
      title,
      description,
      priority,
      dueDate,
      department: department || members.find((m) => m.id === target)?.department,
      project,
      checklist: subtasks.split("\n").map((s) => s.trim()).filter(Boolean),
      recurrence,
      approvalRequired,
      people: collaborators,
    });
    saveTeamTasks([task, ...loadTeamTasks()]);
    refresh();
    const who = members.find((m) => m.id === target);
    note(`Created "${task.title}" and notified ${who?.name ?? "assignee"}.`);
    setShowCreate(false);
    setTitle("");
    setDescription("");
    setSubtasks("");
    setProject("");
    setDepartment("");
    setDueDate("");
    setPriority("Normal");
    setRecurrence("one-time");
    setApprovalRequired(false);
    setCollaborators([]);
    setSelectedId(task.id);
  }

  function toggleCollaborator(id: string) {
    setCollaborators((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function updateSelected(patch: Partial<TeamTask>) {
    if (!selected) return;
    const updated = { ...selected, ...patch };
    saveTeamTasks(replaceTask(loadTeamTasks(), updated));
    refresh();
  }

  function addComment() {
    if (!selected || !commentDraft.trim()) return;
    const { task: updated } = addTaskComment(selected, commentDraft, "manager");
    saveTeamTasks(replaceTask(loadTeamTasks(), updated));
    refresh();
    setCommentDraft("");
    note("Comment added.");
  }

  function addAttachment() {
    if (!selected || !attachmentName.trim()) return;
    const updated = addTaskAttachment(selected, attachmentName.trim(), "manager");
    saveTeamTasks(replaceTask(loadTeamTasks(), updated));
    refresh();
    setAttachmentName("");
    note("Attachment added.");
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
      subtitle="Work management — assignees from Workforce, projects, approvals, and Atlas-aware collaboration."
    >
      {flash ? <p className="auth-success">{flash}</p> : null}

      <div className="sc-toolbar" style={{ marginBottom: "1rem" }}>
        <div>
          <p className="briefing-kicker">Work management</p>
          <h2 style={{ margin: 0 }}>{openCount} open tasks</h2>
          <p className="muted-line">{highCount} high priority · synced with Workforce</p>
        </div>
        <button className="btn btn-dark" type="button" onClick={() => setShowCreate(true)}>
          + Create Task
        </button>
      </div>

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Open</span>
          <strong>{openCount}</strong>
          <small>Active work</small>
        </div>
        <div className="stat">
          <span>Team</span>
          <strong>{members.length}</strong>
          <small>
            <Link href="/app/workforce">Workforce</Link>
          </small>
        </div>
        <div className="stat">
          <span>Projects</span>
          <strong>{projects.length}</strong>
          <small>
            <Link href="/app/projects">Projects</Link>
          </small>
        </div>
        <div className="stat">
          <span>Approvals</span>
          <strong>{tasks.filter((t) => awaitingApproval(t)).length}</strong>
          <small>Need sign-off</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <div className="sc-toolbar">
            <h2>Tasks</h2>
            <div className="biz-switcher">
              <button
                type="button"
                className={filter === "open" ? "biz-chip active" : "biz-chip"}
                onClick={() => setFilter("open")}
              >
                Open
              </button>
              <button
                type="button"
                className={filter === "all" ? "biz-chip active" : "biz-chip"}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              {TASK_STATUSES.filter((s) => s.id !== "completed").map((status) => (
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
                  <button
                    type="button"
                    className="ghost-link"
                    style={{ textAlign: "left", width: "100%" }}
                    onClick={() => setSelectedId(task.id)}
                  >
                    <strong>{task.title}</strong>
                    <small>
                      {memberName(members, task.memberId)}
                      {task.project ? ` · ${task.project}` : ""}
                      {task.dueDate ? ` · due ${task.dueDate.slice(0, 10)}` : ""}
                      · {task.priority}
                    </small>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="panel">
          {selected ? (
            <>
              <h2>{selected.title}</h2>
              <p className="panel-lead">
                {taskStatusLabel(selected.status)}
                {selected.approvalRequired ? ` · approval ${selected.approvalStatus.replace(/_/g, " ")}` : ""}
              </p>
              <div className="form-grid">
                <label>
                  Assign to
                  <select
                    value={selected.memberId}
                    onChange={(e) => updateSelected({ memberId: e.target.value })}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={selected.status}
                    onChange={(e) => updateSelected({ status: e.target.value as TaskStatus })}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Project
                  <input value={selected.project} onChange={(e) => updateSelected({ project: e.target.value })} />
                </label>
                <label>
                  Department
                  <input value={selected.department} onChange={(e) => updateSelected({ department: e.target.value })} />
                </label>
                <label>
                  Due
                  <input type="date" value={selected.dueDate?.slice(0, 10) ?? ""} onChange={(e) => updateSelected({ dueDate: e.target.value })} />
                </label>
                <label>
                  Priority
                  <select
                    value={selected.priority}
                    onChange={(e) => updateSelected({ priority: e.target.value as TaskPriority })}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="form-grid" style={{ marginTop: "0.75rem" }}>
                Description
                <textarea
                  rows={3}
                  value={selected.description}
                  onChange={(e) => updateSelected({ description: e.target.value })}
                />
              </label>

              {selected.people?.length ? (
                <p className="muted-line">
                  Collaborators: {selected.people.map((id) => memberName(members, id)).join(", ")}
                </p>
              ) : null}

              {selected.checklist.length ? (
                <div style={{ marginTop: "0.75rem" }}>
                  <strong>Subtasks</strong>
                  <ul className="manage-list">
                    {selected.checklist.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="biz-chip"
                          onClick={() => {
                            const updated = toggleChecklistItem(selected, item.id);
                            saveTeamTasks(replaceTask(loadTeamTasks(), updated));
                            refresh();
                          }}
                        >
                          {item.done ? "✓" : "○"} {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selected.attachments.length ? (
                <div style={{ marginTop: "0.75rem" }}>
                  <strong>Attachments</strong>
                  <ul className="manage-list">
                    {selected.attachments.map((a) => (
                      <li key={a.id}>{a.name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="train-form" style={{ marginTop: "0.75rem" }}>
                <input
                  placeholder="Add attachment name"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                />
                <button type="button" className="btn btn-outline" onClick={addAttachment}>
                  Add attachment
                </button>
              </div>

              {selected.notes.length ? (
                <div style={{ marginTop: "0.75rem" }}>
                  <strong>Comments</strong>
                  <ul className="manage-list">
                    {selected.notes.map((n) => (
                      <li key={n.id}>
                        <small>{n.author} · {new Date(n.at).toLocaleString()}</small>
                        <div>{n.text}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="train-form" style={{ marginTop: "0.5rem" }}>
                <input
                  placeholder="Add comment"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                />
                <button type="button" className="btn btn-outline" onClick={addComment}>
                  Comment
                </button>
              </div>

              {awaitingApproval(selected) ? (
                <div className="cta-row" style={{ marginTop: "0.75rem" }}>
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={() => {
                      saveTeamTasks(replaceTask(loadTeamTasks(), decideApproval(selected, "approved")));
                      refresh();
                      note("Approved.");
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      saveTeamTasks(replaceTask(loadTeamTasks(), decideApproval(selected, "rejected")));
                      refresh();
                      note("Rejected.");
                    }}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="muted-line">Select a task or create one with + Create Task.</p>
          )}
        </section>
      </div>

      {showCreate ? (
        <section className="panel" style={{ marginTop: "1rem" }}>
          <div className="sc-toolbar">
            <h2>Create task</h2>
            <button type="button" className="ghost-link" onClick={() => setShowCreate(false)}>
              Close
            </button>
          </div>
          <form className="form-grid" onSubmit={onCreate}>
            <label>
              Task
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Prepare August sales report" required />
            </label>
            <label>
              Assign to
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label>
              Project
              <select value={project} onChange={(e) => setProject(e.target.value)}>
                <option value="">—</option>
                {projects.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Department
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Due
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <label>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Recurrence
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}>
                {recurrences.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </label>
            <label>
              Description
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <label>
              Subtasks (one per line)
              <textarea rows={3} value={subtasks} onChange={(e) => setSubtasks(e.target.value)} />
            </label>
            <fieldset>
              <legend>Collaborators</legend>
              <div className="biz-switcher">
                {members
                  .filter((m) => m.id !== assigneeId)
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={collaborators.includes(m.id) ? "biz-chip active" : "biz-chip"}
                      onClick={() => toggleCollaborator(m.id)}
                    >
                      {m.name}
                    </button>
                  ))}
              </div>
            </fieldset>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
              />
              Approval required before completion
            </label>
            <button className="btn btn-dark" type="submit">
              Create & Notify
            </button>
          </form>
        </section>
      ) : null}
    </AppShell>
  );
}
