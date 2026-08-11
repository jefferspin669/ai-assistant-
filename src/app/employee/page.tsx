"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  acceptOpenShift,
  acknowledgeAnnouncement,
  addTaskAttachment,
  addTaskComment,
  awaitingApproval,
  blockTask,
  buildDaySchedule,
  bumpTraining,
  certState,
  certsForMember,
  channelsForEmployee,
  clockIn as apiClockIn,
  clockOut as apiClockOut,
  completeTask,
  createSuggestion,
  createTimeOffRequest,
  dailySummary,
  documentsForEmployee,
  eligibleForShift,
  giveUpShift,
  derivedStatus,
  employeeAssistantReply,
  EMPLOYEE_STATUSES,
  endBreak as apiEndBreak,
  formatClock,
  formatGoalValue,
  formatHours,
  getOpenShift,
  getPresence,
  goalPct,
  greeting,
  groupTasksForBoard,
  heartbeat,
  isOnBreak,
  loadGoals,
  loadMessages,
  loadScheduledShifts,
  loadSignedInEmployee,
  loadTeamMembers,
  loadTeamTasks,
  loadTraining,
  messagesFor,
  recognitionsFor,
  replaceTask,
  requestSwap,
  saveEmployeeSession,
  saveScheduledShifts,
  saveTeamTasks,
  saveTraining,
  sendMessage,
  startBreak as apiStartBreak,
  startTask,
  STATUS_META,
  TASK_STATUSES,
  timesheetFor,
  toggleChecklistItem,
  touchActivity,
  trainingForMember,
  trainingState,
  unacknowledgedFor,
  updatePresence,
  type Announcement,
  type AssistantAction,
  type Certification,
  type ChannelRef,
  type ChatMessage,
  type EmployeeDocument,
  type EmployeeGoal,
  type EmployeePresence,
  type ManualStatus,
  type Recognition,
  type ScheduleEntry,
  type ScheduledShift,
  type TaskPriority,
  type TaskStatus,
  type TeamPerson,
  type TeamTask,
  type TimeShift,
  type TimeOffType,
  type TrainingModule,
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [channels, setChannels] = useState<ChannelRef[]>([]);
  const [channelId, setChannelId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgDraft, setMsgDraft] = useState("");
  const [ptoStart, setPtoStart] = useState("");
  const [ptoEnd, setPtoEnd] = useState("");
  const [ptoType, setPtoType] = useState<TimeOffType>("Vacation");
  const [ptoMsg, setPtoMsg] = useState<string | null>(null);
  const [allShifts, setAllShifts] = useState<ScheduledShift[]>([]);
  const [training, setTraining] = useState<TrainingModule[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [swapShiftId, setSwapShiftId] = useState("");
  const [swapToId, setSwapToId] = useState("");
  const [suggestDraft, setSuggestDraft] = useState("");
  const [suggestMsg, setSuggestMsg] = useState<string | null>(null);
  const [allMembers, setAllMembers] = useState<TeamPerson[]>([]);
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
    setAnnouncements(unacknowledgedFor(me.id));
    setGoals(loadGoals().filter((g) => g.memberId === me.id));
    const chans = channelsForEmployee(me);
    setChannels(chans);
    setChannelId(chans[0]?.id ?? "");
    setMessages(loadMessages());
    setAllShifts(loadScheduledShifts());
    setTraining(trainingForMember(me.id));
    setCerts(certsForMember(me.id));
    setDocs(documentsForEmployee(me.id));
    setRecognitions(recognitionsFor(me.id));
    setAllMembers(loadTeamMembers());
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
  const schedule = useMemo<ScheduleEntry[]>(
    () => (employee ? buildDaySchedule(employee, tasks, now) : []),
    [employee, tasks, now],
  );
  const thread = useMemo(() => messagesFor(channelId, messages), [channelId, messages]);
  const myShifts = useMemo(
    () => (employee ? allShifts.filter((s) => s.memberId === employee.id && s.status === "assigned") : []),
    [allShifts, employee],
  );
  const openShifts = useMemo(
    () => (employee ? allShifts.filter((s) => s.status === "open" && eligibleForShift(s, employee, allShifts)) : []),
    [allShifts, employee],
  );
  const coworkers = useMemo(
    () => (employee ? allMembers.filter((m) => m.id !== employee.id) : []),
    [allMembers, employee],
  );
  const trainingNow = Date.now();

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
    const { task: updated, autoWaiting } = addTaskComment(selected, noteDraft, "employee");
    updateTask(updated);
    if (autoWaiting && presence?.currentTaskId === selected.id) {
      setPresence(updatePresence(employee!.id, { manualStatus: "blocked", currentTaskId: null, touchActive: true }));
    }
    setNoteDraft("");
  }

  function ackAnnouncement(id: string) {
    if (!employee) return;
    acknowledgeAnnouncement(id, employee.id);
    setAnnouncements(unacknowledgedFor(employee.id));
  }

  function sendChannelMessage(e: FormEvent) {
    e.preventDefault();
    if (!employee || !msgDraft.trim() || !channelId) return;
    sendMessage(channelId, employee.id, employee.name, msgDraft);
    setMessages(loadMessages());
    setMsgDraft("");
  }

  function requestTimeOff(e: FormEvent) {
    e.preventDefault();
    if (!employee || !ptoStart) return;
    createTimeOffRequest({ memberId: employee.id, startDate: ptoStart, endDate: ptoEnd || ptoStart, type: ptoType });
    setPtoMsg(`Requested ${ptoType} ${ptoStart}${ptoEnd && ptoEnd !== ptoStart ? `–${ptoEnd}` : ""}. Your manager will review it.`);
    setPtoStart("");
    setPtoEnd("");
  }

  function acceptShift(shiftId: string) {
    if (!employee) return;
    const next = acceptOpenShift(loadScheduledShifts(), shiftId, employee.id);
    saveScheduledShifts(next);
    setAllShifts(next);
  }
  function giveUp(shiftId: string) {
    const next = giveUpShift(loadScheduledShifts(), shiftId);
    saveScheduledShifts(next);
    setAllShifts(next);
  }
  function submitSwap(e: FormEvent) {
    e.preventDefault();
    if (!employee || !swapShiftId || !swapToId) return;
    requestSwap(swapShiftId, employee.id, swapToId);
    setSwapShiftId("");
    setSwapToId("");
    setSuggestMsg(null);
    setPtoMsg("Swap requested — your coworker can accept it from their page.");
  }
  function continueTraining(id: string) {
    if (!employee) return;
    const next = bumpTraining(loadTraining(), id, 20);
    saveTraining(next);
    setTraining(next.filter((m) => m.memberId === employee.id));
  }
  function submitSuggestion(e: FormEvent) {
    e.preventDefault();
    if (!employee || !suggestDraft.trim()) return;
    const s = createSuggestion(employee.id, suggestDraft);
    setSuggestMsg(`Thanks — Atlas grouped your idea under "${s.topic}" and shared it with leadership.`);
    setSuggestDraft("");
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
          {announcements.length ? (
            <section className="panel" style={{ borderLeft: "4px solid var(--sand)" }}>
              <h2>Company announcements</h2>
              <div className="list">
                {announcements.map((a) => (
                  <div className="list-row" key={a.id}>
                    <span className="badge warn">New</span>
                    <div style={{ flex: 1 }}>
                      <p>
                        <strong>{a.title}</strong>
                        {a.body ? <span className="muted-line">{a.body}</span> : null}
                      </p>
                    </div>
                    <button className="btn btn-dark" type="button" onClick={() => ackAnnouncement(a.id)}>
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

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
              <h2>Today&apos;s schedule</h2>
              <p className="panel-lead">Your calendar and tasks combined.</p>
              <div className="timeline" style={{ marginTop: "0.6rem" }}>
                {schedule.map((e, i) => (
                  <div className="timeline-item" key={`${e.minutes}-${i}`}>
                    <strong>
                      {e.time} · {e.label}
                    </strong>
                    <p className="muted-line">
                      {e.kind === "clock" ? "Time clock" : e.kind === "meeting" ? "Meeting" : e.kind === "break" ? "Break" : "Task"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>My goals</h2>
              {goals.length === 0 ? (
                <p className="muted-line">No goals assigned yet.</p>
              ) : (
                <div className="list">
                  {goals.map((g) => (
                    <div className="list-row" key={g.id}>
                      <span className="badge">{goalPct(g)}%</span>
                      <div style={{ flex: 1 }}>
                        <p>
                          <strong>{g.title}</strong>
                          <span className="muted-line">
                            {formatGoalValue(g)}
                            {g.period ? ` · ${g.period}` : ""}
                          </span>
                        </p>
                        <span className="bar-track" style={{ display: "block", marginTop: "0.35rem" }}>
                          <span className="bar-fill" style={{ width: `${goalPct(g)}%` }} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

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

                  {selected.approvalRequired ? (
                    <div
                      className={awaitingApproval(selected) ? "confirm-card" : "memory-card"}
                      style={{ marginTop: "0.5rem" }}
                    >
                      <div className="label">
                        {awaitingApproval(selected)
                          ? "Awaiting manager approval"
                          : selected.approvalStatus === "approved"
                            ? "✓ Approved by manager"
                            : selected.approvalStatus === "changes_requested"
                              ? "Manager requested changes"
                              : selected.approvalStatus === "rejected"
                                ? "Rejected by manager"
                                : "Approval required before this is final"}
                      </div>
                      <p className="muted-line">
                        {awaitingApproval(selected)
                          ? "Your completed work was submitted and is waiting for a manager decision."
                          : "This task needs manager sign-off when you complete it."}
                      </p>
                    </div>
                  ) : null}

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

          <div className="split">
            <section className="panel command-panel">
              <h2>Messages</h2>
              <div className="status-picker" role="group" aria-label="Channels">
                {channels.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={channelId === c.id ? "status-chip active" : "status-chip"}
                    onClick={() => setChannelId(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="command-thread" style={{ marginTop: "0.6rem" }}>
                {thread.length === 0 ? (
                  <p className="muted-line">No messages yet.</p>
                ) : (
                  thread.map((m) => (
                    <div key={m.id} className={`bubble ${m.authorId === employee.id ? "bubble-user" : "bubble-ai"}`}>
                      <span className="agent-tag">{m.authorName}</span>
                      {m.text}
                    </div>
                  ))
                )}
              </div>
              <form className="command-form" onSubmit={sendChannelMessage}>
                <input value={msgDraft} onChange={(e) => setMsgDraft(e.target.value)} placeholder="Message…" />
                <button className="btn btn-dark" type="submit">Send</button>
              </form>
            </section>

            <section className="panel">
              <h2>Request time off</h2>
              <p className="panel-lead">Atlas checks staffing before your manager approves.</p>
              <form className="form-grid" onSubmit={requestTimeOff}>
                <div className="field-row">
                  <label>
                    Start
                    <input type="date" value={ptoStart} onChange={(e) => setPtoStart(e.target.value)} required />
                  </label>
                  <label>
                    End
                    <input type="date" value={ptoEnd} onChange={(e) => setPtoEnd(e.target.value)} />
                  </label>
                </div>
                <label>
                  Type
                  <select value={ptoType} onChange={(e) => setPtoType(e.target.value as TimeOffType)}>
                    <option value="Vacation">Vacation</option>
                    <option value="Sick">Sick</option>
                    <option value="Personal">Personal</option>
                  </select>
                </label>
                <button className="btn btn-dark" type="submit">Request time off</button>
              </form>
              {ptoMsg ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{ptoMsg}</p> : null}
            </section>
          </div>

          {recognitions.length ? (
            <section className="panel">
              <h2>Recognition</h2>
              <div className="list">
                {recognitions.map((r) => (
                  <div className="list-row" key={r.id}>
                    <span className="badge ok" style={{ fontSize: "1rem" }}>{r.emoji}</span>
                    <p>
                      <strong>{r.title}</strong>
                      {r.detail ? <span className="muted-line">{r.detail}</span> : null}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div className="split">
            <section className="panel">
              <h2>My shifts</h2>
              {myShifts.length === 0 ? (
                <p className="muted-line">No upcoming shifts.</p>
              ) : (
                <div className="list">
                  {myShifts.map((s) => (
                    <div className="list-row" key={s.id}>
                      <span className="badge">{s.date}</span>
                      <div style={{ flex: 1 }}>
                        <p>
                          <strong>
                            {s.start}–{s.end}
                          </strong>
                          <span className="muted-line">
                            {s.role || "Shift"}
                            {s.location ? ` · ${s.location}` : ""}
                          </span>
                        </p>
                      </div>
                      <button className="btn btn-outline" type="button" onClick={() => giveUp(s.id)}>
                        Give up
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {myShifts.length && coworkers.length ? (
                <form className="form-grid" onSubmit={submitSwap} style={{ marginTop: "0.8rem" }}>
                  <div className="field-row">
                    <label>
                      Swap shift
                      <select value={swapShiftId} onChange={(e) => setSwapShiftId(e.target.value)}>
                        <option value="">Choose…</option>
                        {myShifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.date} {s.start}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      With
                      <select value={swapToId} onChange={(e) => setSwapToId(e.target.value)}>
                        <option value="">Choose…</option>
                        {coworkers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button className="btn btn-outline" type="submit" disabled={!swapShiftId || !swapToId}>
                    Request swap
                  </button>
                </form>
              ) : null}
            </section>

            <section className="panel">
              <h2>Open shifts</h2>
              <p className="panel-lead">Shifts you&apos;re qualified &amp; available for.</p>
              {openShifts.length === 0 ? (
                <p className="muted-line">No open shifts you can pick up.</p>
              ) : (
                <div className="list">
                  {openShifts.map((s) => (
                    <div className="list-row" key={s.id}>
                      <span className="badge warn">Open</span>
                      <div style={{ flex: 1 }}>
                        <p>
                          <strong>
                            {s.date} · {s.start}–{s.end}
                          </strong>
                          <span className="muted-line">
                            {s.role || "Any role"}
                            {s.location ? ` · ${s.location}` : ""}
                          </span>
                        </p>
                      </div>
                      <button className="btn btn-dark" type="button" onClick={() => acceptShift(s.id)}>
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="split">
            <section className="panel">
              <h2>My training</h2>
              {training.length === 0 ? (
                <p className="muted-line">No training assigned.</p>
              ) : (
                <div className="list">
                  {training.map((m) => {
                    const state = trainingState(m, trainingNow);
                    return (
                      <div className="list-row" key={m.id}>
                        <span className={state === "complete" ? "badge ok" : state === "overdue" ? "badge warn" : "badge"}>
                          {state === "complete" ? "✅" : `${m.progress}%`}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p>
                            <strong>{m.name}</strong>
                            <span className="muted-line">
                              {state === "complete"
                                ? "Complete"
                                : m.dueDate
                                  ? `Due ${m.dueDate}`
                                  : "In progress"}
                            </span>
                          </p>
                          {state !== "complete" ? (
                            <span className="bar-track" style={{ display: "block", marginTop: "0.35rem" }}>
                              <span className="bar-fill" style={{ width: `${m.progress}%` }} />
                            </span>
                          ) : null}
                        </div>
                        {state !== "complete" ? (
                          <button className="btn btn-outline" type="button" onClick={() => continueTraining(m.id)}>
                            Continue
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}

              <h3 style={{ marginTop: "1rem" }}>Certifications</h3>
              {certs.length === 0 ? (
                <p className="muted-line">No certifications on file.</p>
              ) : (
                <div className="list">
                  {certs.map((c) => {
                    const state = certState(c, trainingNow);
                    return (
                      <div className="list-row" key={c.id}>
                        <span className={state === "valid" ? "badge ok" : "badge warn"}>
                          {state === "expired" ? "Expired" : state === "expiring" ? "Expiring" : "Valid"}
                        </span>
                        <p>
                          <strong>{c.name}</strong>
                          <span className="muted-line">Expires {c.expires}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="panel">
              <h2>My documents</h2>
              {docs.length === 0 ? (
                <p className="muted-line">No documents shared with you.</p>
              ) : (
                <div className="list">
                  {docs.map((d) => (
                    <div className="list-row" key={d.id}>
                      <span className="badge">{d.category}</span>
                      <p>{d.title}</p>
                    </div>
                  ))}
                </div>
              )}

              <h3 style={{ marginTop: "1rem" }}>Suggest an improvement</h3>
              <form className="train-form" onSubmit={submitSuggestion}>
                <input
                  value={suggestDraft}
                  onChange={(e) => setSuggestDraft(e.target.value)}
                  placeholder="e.g. Our refund process takes too many steps"
                />
                <button className="btn btn-dark" type="submit">Send</button>
              </form>
              {suggestMsg ? <p className="muted-line" style={{ marginTop: "0.6rem" }}>{suggestMsg}</p> : null}
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
