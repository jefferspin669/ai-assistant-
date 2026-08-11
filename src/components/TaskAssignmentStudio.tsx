"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createTeamTask,
  isOpenTask,
  loadTeamMembers,
  loadTeamTasks,
  replaceTask,
  saveTeamTasks,
  seedDemoTeamIfEmpty,
  taskStatusLabel,
  TASK_PRIORITIES,
  type TaskPriority,
  type TaskRecurrence,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";

const recurrences: { id: TaskRecurrence; label: string }[] = [
  { id: "one-time", label: "One-time" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export function TaskAssignmentStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Normal");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [department, setDepartment] = useState("");
  const [project, setProject] = useState("");
  const [goal, setGoal] = useState("");
  const [requiredResult, setRequiredResult] = useState("");
  const [attachments, setAttachments] = useState("");
  const [checklist, setChecklist] = useState("");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("one-time");
  const [approvalRequired, setApprovalRequired] = useState(false);

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setTasks(loadTeamTasks());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    setMemberId((prev) => prev || loadTeamMembers()[0]?.id || "");
    setReady(true);
  }, [refresh]);

  const activeMember = members.find((m) => m.id === memberId) ?? null;
  const memberTasks = useMemo(
    () => tasks.filter((t) => t.memberId === memberId),
    [tasks, memberId],
  );
  const pendingApprovals = useMemo(
    () => tasks.filter((t) => t.approvalRequired && t.approvalStatus === "pending"),
    [tasks],
  );

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const target = memberId || members[0]?.id;
    if (!target) return;
    const task = createTeamTask({
      memberId: target,
      title,
      description,
      priority,
      startDate,
      dueDate,
      estimatedTime,
      department: department || activeMember?.department,
      project,
      goal,
      requiredResult,
      attachments: attachments.split(",").map((a) => a.trim()).filter(Boolean),
      checklist: checklist.split("\n").map((c) => c.trim()).filter(Boolean),
      recurrence,
      approvalRequired,
    });
    saveTeamTasks([task, ...loadTeamTasks()]);
    refresh();
    const who = members.find((m) => m.id === target);
    setNote(`Assigned "${task.title}" to ${who?.name ?? "employee"} — it now shows on their page.`);
    setTitle("");
    setDescription("");
    setPriority("Normal");
    setStartDate("");
    setDueDate("");
    setEstimatedTime("");
    setProject("");
    setGoal("");
    setRequiredResult("");
    setAttachments("");
    setChecklist("");
    setRecurrence("one-time");
    setApprovalRequired(false);
  }

  function approve(task: TeamTask) {
    saveTeamTasks(replaceTask(loadTeamTasks(), { ...task, approvalStatus: "approved" }));
    refresh();
    setNote(`Approved "${task.title}".`);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Employees</span>
          <strong>{members.length}</strong>
          <small>Can receive tasks</small>
        </div>
        <div className="stat">
          <span>Open tasks</span>
          <strong>{tasks.filter((t) => isOpenTask(t.status)).length}</strong>
          <small>Across the team</small>
        </div>
        <div className="stat">
          <span>Awaiting approval</span>
          <strong>{pendingApprovals.length}</strong>
          <small>Need sign-off</small>
        </div>
        <div className="stat">
          <span>For {activeMember ? activeMember.name.split(" ")[0] : "—"}</span>
          <strong>{memberTasks.length}</strong>
          <small>Assigned total</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Create task</h2>
          <p className="panel-lead">Fill in the details — the employee sees it instantly.</p>
          <form className="form-grid" onSubmit={onCreate}>
            <label>
              Employee
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Task name
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contact expired customers" required />
            </label>
            <label>
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What needs to happen and why" />
            </label>
            <div className="field-row">
              <label>
                Priority
                <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estimated time
                <input value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="2h" />
              </label>
            </div>
            <div className="field-row">
              <label>
                Start date
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label>
                Due date
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </label>
            </div>
            <div className="field-row">
              <label>
                Department
                <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder={activeMember?.department || "Operations"} />
              </label>
              <label>
                Project
                <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Q3 retention" />
              </label>
            </div>
            <label>
              Goal
              <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Contact 25 customers" />
            </label>
            <label>
              Required result
              <input value={requiredResult} onChange={(e) => setRequiredResult(e.target.value)} placeholder="Record outcome for each call" />
            </label>
            <label>
              Checklist (one item per line)
              <textarea value={checklist} onChange={(e) => setChecklist(e.target.value)} rows={3} placeholder={"Pull expired list\nCall each customer\nLog outcome"} />
            </label>
            <label>
              Attachments (comma-separated names)
              <input value={attachments} onChange={(e) => setAttachments(e.target.value)} placeholder="expired-customers.csv, script.pdf" />
            </label>
            <div className="field-row">
              <label>
                Recurrence
                <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}>
                  {recurrences.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="check-inline">
                <input
                  type="checkbox"
                  checked={approvalRequired}
                  onChange={(e) => setApprovalRequired(e.target.checked)}
                />
                Approval required
              </label>
            </div>
            <button className="btn btn-dark" type="submit" disabled={members.length === 0}>
              Create task
            </button>
          </form>
          {note ? (
            <p className="muted-line" style={{ marginTop: "0.85rem" }}>
              {note}
            </p>
          ) : null}
        </section>

        <section className="panel">
          <h2>{activeMember ? `${activeMember.name}'s tasks` : "Assigned tasks"}</h2>
          {memberTasks.length === 0 ? (
            <p className="muted-line">No tasks yet for this employee.</p>
          ) : (
            <div className="list">
              {memberTasks.map((task) => (
                <div className="list-row" key={task.id}>
                  <span
                    className={
                      task.priority === "Urgent" || task.priority === "High" ? "badge warn" : "badge"
                    }
                  >
                    {task.priority}
                  </span>
                  <p>
                    <strong>
                      {task.kind === "meeting" ? "📅 " : ""}
                      {task.title}
                    </strong>
                    <span className="muted-line">
                      {taskStatusLabel(task.status)}
                      {task.dueDate ? ` · due ${task.dueDate.slice(0, 10)}` : ""}
                      {task.approvalRequired ? ` · approval ${task.approvalStatus}` : ""}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: "1rem" }}>Awaiting approval</h3>
          {pendingApprovals.length === 0 ? (
            <p className="muted-line">Nothing awaiting approval.</p>
          ) : (
            <div className="list">
              {pendingApprovals.map((task) => {
                const who = members.find((m) => m.id === task.memberId);
                return (
                  <div className="list-row" key={task.id}>
                    <span className="badge warn">Pending</span>
                    <p>
                      <strong>{task.title}</strong>
                      <span className="muted-line">
                        {who?.name ?? "Employee"} · {taskStatusLabel(task.status)}
                      </span>
                    </p>
                    <button className="btn btn-ghost" type="button" onClick={() => approve(task)}>
                      Approve
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="muted-line" style={{ marginTop: "1rem" }}>
            See who&apos;s online on the <Link href="/app/workforce-status">Workforce Status</Link> page.
          </p>
        </section>
      </div>
    </div>
  );
}
