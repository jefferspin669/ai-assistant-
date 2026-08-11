"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addTaskAttachment,
  addTaskNote,
  blockTask,
  clockIn as apiClockIn,
  clockOut as apiClockOut,
  completeTask,
  dailySummary,
  derivedStatus,
  employeeAssistantReply,
  EMPLOYEE_STATUSES,
  endBreak as apiEndBreak,
  formatClock,
  formatHours,
  getOpenShift,
  getPresence,
  greeting,
  groupTasksForBoard,
  heartbeat,
  isOnBreak,
  loadSignedInEmployee,
  loadTeamTasks,
  replaceTask,
  saveEmployeeSession,
  saveTeamTasks,
  startBreak as apiStartBreak,
  startTask,
  STATUS_META,
  TASK_STATUSES,
  timesheetFor,
  toggleChecklistItem,
  touchActivity,
  updatePresence,
  type AssistantAction,
  type EmployeePresence,
  type ManualStatus,
  type TaskPriority,
  type TaskStatus,
  type TeamPerson,
  type TeamTask,
  type TimeShift,
} from "@/lib/user-workspace";

type ChatMsg = { role: "user" | "ai"; text: string; actions?: AssistantAction[] };

function priorityBadge(priority: TaskPriority) {
  return priority === "Urgent" || priority === "High" ? "badge warn" : "badge";
}

function dueLabel(dueDate: string) {
  return dueDate ? `Due ${dueDate.slice(0, 10)}` : "No due date";
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<TeamPerson | null>(null);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [presence, setPresence] = useState<EmployeePresence | null>(null);
  const [shift, setShift] = useState<TimeShift | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [attachDraft, setAttachDraft] = useState("");
  const [completing, setCompleting] = useState(false);
  const [resultDraft, setResultDraft] = useState("");
  const [completeNote, setCompleteNote] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [ask, setAsk] = useState("");
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
    setShift(getOpenShift(me.id));
    setChat([
      {
        role: "ai",
        text: `Hi ${me.name.split(" ")[0]} — I'm your Atlas assistant. Ask "What do I need to finish today?" or tell me if you're blocked on something.`,
      },
    ]);
    setReady(true);
  }, [router]);

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
  const summary = useMemo(() => (employee ? dailySummary(employee, tasks) : null), [employee, tasks]);
  const timesheet = useMemo(
    () => (employee ? timesheetFor(employee, undefined, now) : null),
    // `shift` is included so the sheet recomputes right after a clock punch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employee, now, shift],
  );
  const board = useMemo(() => groupTasksForBoard(tasks), [tasks]);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const onBreak = isOnBreak(shift);

  const saveMyTasks = useCallback((memberId: string, mine: TeamTask[]) => {
    setTasks(mine);
    const others = loadTeamTasks().filter((t) => t.memberId !== memberId);
    saveTeamTasks([...mine, ...others]);
  }, []);

  function updateTask(next: TeamTask) {
    if (!employee) return;
    saveMyTasks(employee.id, replaceTask(tasks, next));
  }

  // Time clock (also drives presence so the manager sees online/working/offline).
  function doClockIn() {
    if (!employee) return;
    setShift(apiClockIn(employee.id));
    setPresence(updatePresence(employee.id, { clockedIn: true, manualStatus: "working", touchActive: true }));
  }
  function doStartBreak() {
    if (!employee) return;
    setShift(apiStartBreak(employee.id));
    setPresence(updatePresence(employee.id, { manualStatus: "break", touchActive: true }));
  }
  function doEndBreak() {
    if (!employee) return;
    setShift(apiEndBreak(employee.id));
    setPresence(updatePresence(employee.id, { manualStatus: "working", touchActive: true }));
  }
  function doClockOut() {
    if (!employee) return;
    setShift(apiClockOut(employee.id));
    setShift(getOpenShift(employee.id));
    setPresence(updatePresence(employee.id, { clockedIn: false, currentTaskId: null, touchActive: true }));
  }

  function setStatus(next: ManualStatus) {
    if (!employee) return;
    setPresence(updatePresence(employee.id, { clockedIn: true, manualStatus: next, touchActive: true }));
  }

  function changeStatus(task: TeamTask, next: TaskStatus) {
    if (!employee) return;
    saveMyTasks(employee.id, replaceTask(tasks, { ...task, status: next }));
    if (next === "in_progress") {
      setPresence(updatePresence(employee.id, { clockedIn: true, manualStatus: "working", currentTaskId: task.id, touchActive: true }));
    } else if (presence?.currentTaskId === task.id) {
      setPresence(updatePresence(employee.id, { currentTaskId: null, touchActive: true }));
    }
  }

  function beginTask(task: TeamTask) {
    if (!employee) return;
    saveMyTasks(employee.id, replaceTask(tasks, startTask(task)));
    setSelectedId(task.id);
    setPresence(updatePresence(employee.id, { clockedIn: true, manualStatus: "working", currentTaskId: task.id, touchActive: true }));
  }

  function confirmComplete() {
    if (!employee || !selected) return;
    const done = completeTask(selected, { result: resultDraft, note: completeNote });
    saveMyTasks(employee.id, replaceTask(tasks, done));
    if (presence?.currentTaskId === selected.id) {
      setPresence(updatePresence(employee.id, { currentTaskId: null, touchActive: true }));
    }
    setCompleting(false);
    setResultDraft("");
    setCompleteNote("");
  }

  function doBlock(task: TeamTask) {
    if (!employee) return;
    saveMyTasks(employee.id, replaceTask(tasks, blockTask(task)));
    if (presence?.currentTaskId === task.id) {
      setPresence(updatePresence(employee.id, { manualStatus: "blocked", currentTaskId: null, touchActive: true }));
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

  function submitAsk(e: FormEvent) {
    e.preventDefault();
    if (!employee || !ask.trim()) return;
    const reply = employeeAssistantReply(employee, tasks, ask);
    setChat((prev) => [...prev, { role: "user", text: ask.trim() }, { role: "ai", text: reply.text, actions: reply.actions }]);
    setAsk("");
  }

  function runAction(action: AssistantAction) {
    const task = tasks.find((t) => t.id === action.taskId);
    if (!task) return;
    if (action.kind === "focus") {
      beginTask(task);
      setChat((prev) => [...prev, { role: "ai", text: `Started "${task.title}". Your status is now Working on it.` }]);
    } else if (action.kind === "block") {
      doBlock(task);
      setSelectedId(task.id);
      setChat((prev) => [...prev, { role: "ai", text: `Done — "${task.title}" is marked blocked and it now shows on your manager's alerts.` }]);
    } else if (action.kind === "complete") {
      setSelectedId(task.id);
      setCompleting(true);
      setChat((prev) => [...prev, { role: "ai", text: `Open the completion form for "${task.title}" on the right to record the result.` }]);
    }
  }

  function logout() {
    if (employee) updatePresence(employee.id, { clockedIn: false, currentTaskId: null, touchActive: true });
    saveEmployeeSession(null);
    router.push("/employee/login");
  }

  if (!ready || !employee || !summary || !timesheet) {
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

  function taskRow(task: TeamTask) {
    return (
      <button
        key={task.id}
        type="button"
        className={selectedId === task.id ? "compliance-row active" : "compliance-row"}
        onClick={() => {
          setSelectedId(task.id);
          setCompleting(false);
        }}
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

          <div className="split">
            <section className="panel">
              <h2>Time clock</h2>
              <div className="stat-grid metrics-dense">
                <div className="stat">
                  <span>Status</span>
                  <strong style={{ fontSize: "1rem" }}>
                    {!timesheet.clockedIn ? "Clocked out" : onBreak ? "On break" : "Clocked in"}
                  </strong>
                  <small>{shift ? `In at ${formatClock(shift.clockIn)}` : "Not clocked in"}</small>
                </div>
                <div className="stat">
                  <span>Hours today</span>
                  <strong>{formatHours(timesheet.hoursToday * 3_600_000)}</strong>
                  <small>So far</small>
                </div>
                <div className="stat">
                  <span>Hours this week</span>
                  <strong>{formatHours(timesheet.hoursWeek * 3_600_000)}</strong>
                  <small>Last 7 days</small>
                </div>
                <div className="stat">
                  <span>Overtime</span>
                  <strong>{timesheet.overtime.toFixed(1)}h</strong>
                  <small>Over 40h</small>
                </div>
              </div>
              <div className="train-actions" style={{ marginTop: "0.8rem" }}>
                {!timesheet.clockedIn ? (
                  <button className="btn btn-dark" type="button" onClick={doClockIn}>
                    Clock in
                  </button>
                ) : (
                  <>
                    {onBreak ? (
                      <button className="btn btn-dark" type="button" onClick={doEndBreak}>
                        End break
                      </button>
                    ) : (
                      <button className="btn btn-outline" type="button" onClick={doStartBreak}>
                        Start break
                      </button>
                    )}
                    <button className="btn btn-outline" type="button" onClick={doClockOut}>
                      Clock out
                    </button>
                  </>
                )}
              </div>
            </section>

            <section className="panel">
              <h2>My status</h2>
              {status === "offline" ? (
                <p className="muted-line">Clock in to set your status so your manager sees you&apos;re online.</p>
              ) : (
                <>
                  <p className="panel-lead">Tell your manager what you&apos;re doing.</p>
                  <div className="status-picker" role="group" aria-label="Set your status">
                    {EMPLOYEE_STATUSES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={presence?.manualStatus === s.id ? "status-chip active" : "status-chip"}
                        onClick={() => setStatus(s.id)}
                      >
                        <span className={`presence-dot ${s.id}`} aria-hidden /> {s.emoji} {s.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          <div className="split">
            <section className="panel">
              <h2>My task board</h2>
              {tasks.length === 0 ? (
                <p className="muted-line">No tasks yet. Assigned work will appear here.</p>
              ) : (
                <>
                  <h3 style={{ marginTop: "0.5rem" }}>Urgent</h3>
                  <div className="list">
                    {board.urgent.length ? board.urgent.map(taskRow) : <p className="muted-line">Nothing urgent.</p>}
                  </div>
                  <h3 style={{ marginTop: "1rem" }}>Today</h3>
                  <div className="list">
                    {board.today.length ? board.today.map(taskRow) : <p className="muted-line">Nothing due today.</p>}
                  </div>
                  <h3 style={{ marginTop: "1rem" }}>Upcoming</h3>
                  <div className="list">
                    {board.upcoming.length ? board.upcoming.map(taskRow) : <p className="muted-line">Nothing upcoming.</p>}
                  </div>
                  {board.completed.length ? (
                    <>
                      <h3 style={{ marginTop: "1rem" }}>Completed</h3>
                      <div className="list">{board.completed.map(taskRow)}</div>
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

                  <div className="train-actions" style={{ marginTop: "0.4rem" }}>
                    {selected.status !== "completed" ? (
                      selected.status === "in_progress" ? (
                        <button className="btn btn-dark" type="button" onClick={() => setCompleting((v) => !v)}>
                          Complete task
                        </button>
                      ) : (
                        <button className="btn btn-dark" type="button" onClick={() => beginTask(selected)}>
                          Start task
                        </button>
                      )
                    ) : (
                      <span className="badge ok">Completed</span>
                    )}
                    {selected.status !== "completed" && selected.status !== "blocked" ? (
                      <button className="btn btn-outline" type="button" onClick={() => doBlock(selected)}>
                        Mark blocked
                      </button>
                    ) : null}
                  </div>

                  {(selected.startedAt || selected.completedAt) ? (
                    <p className="muted-line" style={{ marginTop: "0.5rem" }}>
                      {selected.startedAt ? `Started ${formatClock(selected.startedAt)}` : ""}
                      {selected.completedAt ? ` · Finished ${formatClock(selected.completedAt)}` : ""}
                    </p>
                  ) : null}

                  {completing ? (
                    <div className="confirm-card" style={{ marginTop: "0.8rem" }}>
                      <div className="confirm-prompt">Complete &quot;{selected.title}&quot;</div>
                      <label>
                        <span className="muted-line">Result</span>
                        <input value={resultDraft} onChange={(e) => setResultDraft(e.target.value)} placeholder="e.g. Contacted 25 customers, 6 renewed" />
                      </label>
                      <label>
                        <span className="muted-line">Closing note (optional)</span>
                        <input value={completeNote} onChange={(e) => setCompleteNote(e.target.value)} placeholder="Anything the manager should know" />
                      </label>
                      <div className="train-actions">
                        <button className="btn btn-dark" type="button" onClick={confirmComplete}>
                          Confirm complete
                        </button>
                        <button className="btn btn-outline" type="button" onClick={() => setCompleting(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <label style={{ display: "block", marginTop: "0.8rem" }}>
                    <span className="muted-line">Status</span>
                    <select value={selected.status} onChange={(e) => changeStatus(selected, e.target.value as TaskStatus)} aria-label="Task status">
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

                  {(selected.goal || selected.requiredResult || selected.estimatedTime || selected.result) ? (
                    <div className="list" style={{ marginTop: "0.8rem" }}>
                      {selected.goal ? (
                        <div className="list-row"><span className="badge">Goal</span><p>{selected.goal}</p></div>
                      ) : null}
                      {selected.requiredResult ? (
                        <div className="list-row"><span className="badge">Result req.</span><p>{selected.requiredResult}</p></div>
                      ) : null}
                      {selected.estimatedTime ? (
                        <div className="list-row"><span className="badge">Est.</span><p>{selected.estimatedTime}</p></div>
                      ) : null}
                      {selected.result ? (
                        <div className="list-row"><span className="badge ok">Outcome</span><p>{selected.result}</p></div>
                      ) : null}
                      {selected.approvalRequired ? (
                        <div className="list-row"><span className="badge warn">Approval</span><p>Approval required · {selected.approvalStatus}</p></div>
                      ) : null}
                    </div>
                  ) : null}

                  {selected.checklist.length ? (
                    <>
                      <h3 style={{ marginTop: "1rem" }}>Checklist</h3>
                      <div className="list">
                        {selected.checklist.map((item) => (
                          <label className="quality-check-row" key={item.id}>
                            <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item.id)} />
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
                          <span className={n.author === "manager" ? "badge" : "badge ok"}>{n.author}</span>
                          <p>{n.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="muted-line">No notes yet.</p>
                    )}
                  </div>
                  <form className="train-form" onSubmit={addNote} style={{ marginTop: "0.6rem" }}>
                    <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add a note…" />
                    <button className="btn btn-dark" type="submit">Add note</button>
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
                    <input value={attachDraft} onChange={(e) => setAttachDraft(e.target.value)} placeholder="Attach a file name or link…" />
                    <button className="btn btn-dark" type="submit">Add</button>
                  </form>
                </>
              ) : (
                <>
                  <h2>Task details</h2>
                  <p className="muted-line">Select a task to start it, complete it, tick the checklist, and add notes or attachments.</p>
                </>
              )}
            </section>
          </div>

          {/* Employee AI assistant */}
          <section className="panel command-panel">
            <h2>Ask Atlas</h2>
            <p className="panel-lead">Your own assistant — it knows your tasks and can flag blockers to your manager.</p>
            <div className="command-thread">
              {chat.map((m, i) => (
                <div key={i} className={`bubble ${m.role === "ai" ? "bubble-ai" : "bubble-user"}`}>
                  {m.text}
                  {m.actions && m.actions.length ? (
                    <div className="train-actions" style={{ marginTop: "0.5rem" }}>
                      {m.actions.map((a) => (
                        <button key={a.label} type="button" className="btn btn-outline" onClick={() => runAction(a)}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <form className="command-form" onSubmit={submitAsk}>
              <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="What do I need to finish today?" />
              <button className="btn btn-dark" type="submit">Ask</button>
            </form>
          </section>

          <section className="panel">
            <h2>What Atlas tracks</h2>
            <p className="panel-lead">
              Atlas tracks your <strong>work status</strong>, <strong>time punches</strong>, and{" "}
              <strong>task activity</strong> only:
            </p>
            <div className="list">
              <div className="list-row">
                <span className="badge ok">Tracked</span>
                <p>Clock in/out and breaks, the status you set, and your task updates.</p>
              </div>
              <div className="list-row">
                <span className="badge ok">Tracked</span>
                <p>When the app was last active, so &quot;Away&quot; and &quot;Offline&quot; update automatically.</p>
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
