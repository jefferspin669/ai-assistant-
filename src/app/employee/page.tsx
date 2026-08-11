"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addTaskAttachment,
  addTaskNote,
  dailySummary,
  derivedStatus,
  EMPLOYEE_STATUSES,
  getPresence,
  greeting,
  groupTasksForBoard,
  heartbeat,
  loadSignedInEmployee,
  loadTeamTasks,
  replaceTask,
  saveEmployeeSession,
  saveTeamTasks,
  STATUS_META,
  TASK_STATUSES,
  toggleChecklistItem,
  touchActivity,
  updatePresence,
  type EmployeePresence,
  type ManualStatus,
  type TaskPriority,
  type TaskStatus,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";

function priorityBadge(priority: TaskPriority) {
  return priority === "Urgent" || priority === "High" ? "badge warn" : "badge";
}

function statusBadge(status: TaskStatus) {
  if (status === "completed") return "badge ok";
  if (status === "blocked" || status === "waiting") return "badge warn";
  return "badge";
}

function dueLabel(dueDate: string) {
  if (!dueDate) return "No due date";
  return `Due ${dueDate.slice(0, 10)}`;
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<TeamPerson | null>(null);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [presence, setPresence] = useState<EmployeePresence | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [attachDraft, setAttachDraft] = useState("");
  const idRef = useRef<string | null>(null);
  const lastActivityPush = useRef(0);

  useEffect(() => {
    const me = loadSignedInEmployee();
    if (!me) {
      router.replace("/employee/login");
      return;
    }
    idRef.current = me.id;
    setEmployee(me);
    setTasks(loadTeamTasks().filter((t) => t.memberId === me.id));
    setPresence(getPresence(me.id));
    setReady(true);
  }, [router]);

  // Heartbeat (session alive) + a clock tick so auto-away/offline recompute.
  useEffect(() => {
    if (!ready) return;
    const beat = window.setInterval(() => {
      const id = idRef.current;
      if (!id) return;
      const current = getPresence(id);
      if (current.clockedIn) setPresence(heartbeat(id));
      setNow(Date.now());
    }, 15000);
    return () => window.clearInterval(beat);
  }, [ready]);

  // "Basic activity" detection: real interaction resets the auto-away timer.
  useEffect(() => {
    if (!ready) return;
    const onActivity = () => {
      const id = idRef.current;
      if (!id) return;
      const nowMs = Date.now();
      if (nowMs - lastActivityPush.current < 10000) return;
      lastActivityPush.current = nowMs;
      const current = getPresence(id);
      if (current.clockedIn) setPresence(touchActivity(id));
      setNow(nowMs);
    };
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    document.addEventListener("visibilitychange", onActivity);
    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      document.removeEventListener("visibilitychange", onActivity);
    };
  }, [ready]);

  const status = derivedStatus(presence, now);
  const summary = useMemo(
    () => (employee ? dailySummary(employee, tasks) : null),
    [employee, tasks],
  );
  const board = useMemo(() => groupTasksForBoard(tasks), [tasks]);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  const saveMyTasks = useCallback((memberId: string, mine: TeamTask[]) => {
    setTasks(mine);
    const others = loadTeamTasks().filter((t) => t.memberId !== memberId);
    saveTeamTasks([...mine, ...others]);
  }, []);

  function clockIn() {
    if (!employee) return;
    setPresence(updatePresence(employee.id, { clockedIn: true, manualStatus: "working", touchActive: true }));
  }
  function clockOut() {
    if (!employee) return;
    setPresence(updatePresence(employee.id, { clockedIn: false, currentTaskId: null, touchActive: true }));
  }
  function setStatus(next: ManualStatus) {
    if (!employee) return;
    setPresence(updatePresence(employee.id, { clockedIn: true, manualStatus: next, touchActive: true }));
  }

  function updateTask(next: TeamTask) {
    if (!employee) return;
    saveMyTasks(employee.id, replaceTask(tasks, next));
  }

  function changeStatus(task: TeamTask, next: TaskStatus) {
    if (!employee) return;
    const updated = { ...task, status: next };
    saveMyTasks(employee.id, replaceTask(tasks, updated));
    if (next === "in_progress") {
      setPresence(updatePresence(employee.id, { clockedIn: true, manualStatus: "working", currentTaskId: task.id, touchActive: true }));
    } else if (presence?.currentTaskId === task.id) {
      setPresence(updatePresence(employee.id, { currentTaskId: null, touchActive: true }));
    }
  }

  function addNote(e: FormEvent) {
    e.preventDefault();
    if (!selected || !noteDraft.trim()) return;
    updateTask(addTaskNote(selected, noteDraft, "employee"));
    setNoteDraft("");
  }
  function addAttachment(e: FormEvent) {
    e.preventDefault();
    if (!selected || !attachDraft.trim()) return;
    updateTask(addTaskAttachment(selected, attachDraft, "employee"));
    setAttachDraft("");
  }
  function toggleCheck(itemId: string) {
    if (!selected) return;
    updateTask(toggleChecklistItem(selected, itemId));
  }

  function logout() {
    if (employee) updatePresence(employee.id, { clockedIn: false, currentTaskId: null, touchActive: true });
    saveEmployeeSession(null);
    router.push("/employee/login");
  }

  if (!ready || !employee || !summary) {
    return (
      <div className="emp-shell">
        <div className="emp-main">
          <div className="container">
            <p className="muted-line">Loading your page…</p>
          </div>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[status];

  function renderTaskRow(task: TeamTask) {
    return (
      <button
        key={task.id}
        type="button"
        className={selectedId === task.id ? "compliance-row active" : "compliance-row"}
        onClick={() => setSelectedId(task.id)}
      >
        <span className={priorityBadge(task.priority)}>{task.priority}</span>
        <p>
          <strong>
            {task.kind === "meeting" ? "📅 " : ""}
            {task.title}
          </strong>
          <span className="muted-line">
            {dueLabel(task.dueDate)}
            {task.estimatedTime ? ` · ${task.estimatedTime}` : ""} ·{" "}
            {TASK_STATUSES.find((s) => s.id === task.status)?.label}
          </span>
        </p>
      </button>
    );
  }

  return (
    <div className="emp-shell">
      <header className="emp-top">
        <div className="container">
          <div className="emp-id">
            <span className={`presence-dot ${status}`} aria-hidden />
            <span>
              <strong>{employee.name}</strong>
              <span>
                {employee.role}
                {employee.department ? ` · ${employee.department}` : ""}
              </span>
            </span>
          </div>
          <div className="emp-top-actions">
            <span className={`presence-badge ${status}`}>
              <span className={`presence-dot ${status}`} aria-hidden />
              {meta.emoji} {meta.label}
            </span>
            <button className="btn btn-outline" type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="emp-main">
        <div className="container">
          {/* Homepage summary */}
          <section className="panel">
            <h2>
              {greeting()}, {employee.name.split(" ")[0]}
            </h2>
            <p className="panel-lead">Today&apos;s work at a glance.</p>
            <div className="stat-grid metrics-dense">
              <div className="stat">
                <span>Tasks due today</span>
                <strong>{summary.dueToday}</strong>
                <small>Not yet complete</small>
              </div>
              <div className="stat">
                <span>High-priority</span>
                <strong>{summary.highPriority}</strong>
                <small>High or urgent</small>
              </div>
              <div className="stat">
                <span>Meetings</span>
                <strong>{summary.meetings}</strong>
                <small>Today</small>
              </div>
              <div className="stat">
                <span>Shift</span>
                <strong style={{ fontSize: "0.95rem" }}>{summary.shift}</strong>
                <small>Today</small>
              </div>
            </div>
            <div className="bars" style={{ marginTop: "1rem" }}>
              <div className="bar-row">
                <span>Today&apos;s work</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${summary.percentComplete}%` }} />
                </span>
                <strong>{summary.percentComplete}% complete</strong>
              </div>
            </div>
          </section>

          {/* Presence controls */}
          <section className="panel">
            <h2>My status</h2>
            <p className="panel-lead">
              Clock in so your manager sees you&apos;re online, then set what you&apos;re doing.
            </p>
            <div className="train-actions" style={{ marginTop: "0.4rem" }}>
              {status === "offline" ? (
                <button className="btn btn-dark" type="button" onClick={clockIn}>
                  Clock in
                </button>
              ) : (
                <button className="btn btn-outline" type="button" onClick={clockOut}>
                  Clock out
                </button>
              )}
            </div>
            {status !== "offline" ? (
              <div className="status-picker" role="group" aria-label="Set your status">
                {EMPLOYEE_STATUSES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={
                      presence?.manualStatus === s.id ? "status-chip active" : "status-chip"
                    }
                    onClick={() => setStatus(s.id)}
                  >
                    <span className={`presence-dot ${s.id}`} aria-hidden /> {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {/* Task board + detail */}
          <div className="split">
            <section className="panel">
              <h2>My task board</h2>
              {tasks.length === 0 ? (
                <p className="muted-line">No tasks yet. Assigned work will appear here.</p>
              ) : (
                <>
                  <h3 style={{ marginTop: "0.5rem" }}>Urgent</h3>
                  <div className="list">
                    {board.urgent.length ? (
                      board.urgent.map(renderTaskRow)
                    ) : (
                      <p className="muted-line">Nothing urgent.</p>
                    )}
                  </div>
                  <h3 style={{ marginTop: "1rem" }}>Today</h3>
                  <div className="list">
                    {board.today.length ? (
                      board.today.map(renderTaskRow)
                    ) : (
                      <p className="muted-line">Nothing due today.</p>
                    )}
                  </div>
                  <h3 style={{ marginTop: "1rem" }}>Upcoming</h3>
                  <div className="list">
                    {board.upcoming.length ? (
                      board.upcoming.map(renderTaskRow)
                    ) : (
                      <p className="muted-line">Nothing upcoming.</p>
                    )}
                  </div>
                  {board.completed.length ? (
                    <>
                      <h3 style={{ marginTop: "1rem" }}>Completed</h3>
                      <div className="list">{board.completed.map(renderTaskRow)}</div>
                    </>
                  ) : null}
                </>
              )}
            </section>

            <section className="panel">
              {selected ? (
                <>
                  <h2>{selected.title}</h2>
                  <p className="panel-lead">
                    {selected.priority} priority · {dueLabel(selected.dueDate)}
                    {selected.project ? ` · ${selected.project}` : ""}
                  </p>

                  <label style={{ display: "block", marginTop: "0.6rem" }}>
                    <span className="muted-line">Status</span>
                    <select
                      value={selected.status}
                      onChange={(e) => changeStatus(selected, e.target.value as TaskStatus)}
                      aria-label="Task status"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selected.description ? (
                    <div className="memory-card" style={{ marginTop: "0.8rem" }}>
                      <div className="label">Description</div>
                      <p>{selected.description}</p>
                    </div>
                  ) : null}

                  {(selected.goal || selected.requiredResult || selected.estimatedTime) ? (
                    <div className="list" style={{ marginTop: "0.8rem" }}>
                      {selected.goal ? (
                        <div className="list-row">
                          <span className="badge">Goal</span>
                          <p>{selected.goal}</p>
                        </div>
                      ) : null}
                      {selected.requiredResult ? (
                        <div className="list-row">
                          <span className="badge">Result</span>
                          <p>{selected.requiredResult}</p>
                        </div>
                      ) : null}
                      {selected.estimatedTime ? (
                        <div className="list-row">
                          <span className="badge">Est.</span>
                          <p>{selected.estimatedTime}</p>
                        </div>
                      ) : null}
                      {selected.approvalRequired ? (
                        <div className="list-row">
                          <span className="badge warn">Approval</span>
                          <p>Approval required · {selected.approvalStatus}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {selected.checklist.length ? (
                    <>
                      <h3 style={{ marginTop: "1rem" }}>Checklist</h3>
                      <div className="list">
                        {selected.checklist.map((item) => (
                          <label className="quality-check-row" key={item.id}>
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={() => toggleCheck(item.id)}
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  ) : null}

                  <h3 style={{ marginTop: "1rem" }}>Notes</h3>
                  <div className="list">
                    {selected.notes.length ? (
                      selected.notes.map((n) => (
                        <div className="list-row" key={n.id}>
                          <span className={n.author === "manager" ? "badge" : "badge ok"}>
                            {n.author}
                          </span>
                          <p>{n.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="muted-line">No notes yet.</p>
                    )}
                  </div>
                  <form className="train-form" onSubmit={addNote} style={{ marginTop: "0.6rem" }}>
                    <input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Add a note…"
                    />
                    <button className="btn btn-dark" type="submit">
                      Add note
                    </button>
                  </form>

                  <h3 style={{ marginTop: "1rem" }}>Attachments</h3>
                  <div className="list">
                    {selected.attachments.length ? (
                      selected.attachments.map((a) => (
                        <div className="list-row" key={a.id}>
                          <span className="badge">{a.addedBy}</span>
                          <p>{a.name}</p>
                        </div>
                      ))
                    ) : (
                      <p className="muted-line">No attachments yet.</p>
                    )}
                  </div>
                  <form className="train-form" onSubmit={addAttachment} style={{ marginTop: "0.6rem" }}>
                    <input
                      value={attachDraft}
                      onChange={(e) => setAttachDraft(e.target.value)}
                      placeholder="Attach a file name or link…"
                    />
                    <button className="btn btn-dark" type="submit">
                      Add
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2>Task details</h2>
                  <p className="muted-line">Select a task from your board to see details, update its status, and add notes or attachments.</p>
                </>
              )}
            </section>
          </div>

          {/* Transparency */}
          <section className="panel">
            <h2>What Atlas tracks</h2>
            <p className="panel-lead">
              Atlas keeps this honest — it tracks your <strong>work status</strong> and{" "}
              <strong>task activity</strong> only:
            </p>
            <div className="list">
              <div className="list-row">
                <span className="badge ok">Tracked</span>
                <p>Whether you&apos;re clocked in, the status you set, and your task updates.</p>
              </div>
              <div className="list-row">
                <span className="badge ok">Tracked</span>
                <p>When the app was last active, so &quot;Away&quot; and &quot;Offline&quot; can update automatically.</p>
              </div>
              <div className="list-row">
                <span className="badge">Never</span>
                <p>No screen recording, no keystroke logging, no hidden monitoring.</p>
              </div>
            </div>
          </section>

          <p className="muted-line">
            Need to switch accounts? <Link href="/employee/login">Back to employee sign-in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
