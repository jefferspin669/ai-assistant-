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
  BLOCK_REASONS,
  blockTask,
  buildDaySchedule,
  bumpTraining,
  formatGoalNumber,
  goalActionPlan,
  goalProjection,
  goalsCompletedFor,
  isAvailableStatus,
  loadWidgetLayout,
  moveWidget,
  performanceSummary,
  reorderWidget,
  saveWidgetLayout,
  teammatesOf,
  widgetTitle,
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
  elapsedMs,
  employeeAssistantReply,
  EMPLOYEE_STATUSES,
  endBreak as apiEndBreak,
  formatClock,
  formatDuration,
  formatGoalValue,
  formatHours,
  getOpenShift,
  getPresence,
  goalPct,
  greeting,
  heartbeat,
  pauseTask,
  smartPriorities,
  taskProgress,
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
  type WidgetPref,
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
  const [heroAsk, setHeroAsk] = useState("");
  const [heroAnswer, setHeroAnswer] = useState<ChatMsg | null>(null);
  const [topNote, setTopNote] = useState<string | null>(null);
  const [blockingTaskId, setBlockingTaskId] = useState<string | null>(null);
  const [blockFlash, setBlockFlash] = useState<string | null>(null);
  const [layout, setLayout] = useState<WidgetPref[]>([]);
  const [customizing, setCustomizing] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [goalPlanId, setGoalPlanId] = useState<string | null>(null);
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
    setLayout(loadWidgetLayout());
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
  const priorities = useMemo(() => smartPriorities(tasks), [tasks]);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const onBreak = isOnBreak(shift);
  const runningTask = useMemo(
    () => tasks.find((t) => t.status === "in_progress" && t.startedAt) ?? null,
    [tasks],
  );
  const clockedInMs = shift
    ? (shift.clockOut ? new Date(shift.clockOut).getTime() : now) - new Date(shift.clockIn).getTime()
    : 0;
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
  const teammates = useMemo(
    () => (employee ? teammatesOf(employee, allMembers) : []),
    [employee, allMembers],
  );
  const salesGoal = useMemo(() => goals.find((g) => g.kind === "amount") ?? null, [goals]);
  const appointments = useMemo(() => tasks.filter((t) => t.kind === "meeting"), [tasks]);
  const perf = useMemo(() => (employee ? performanceSummary(employee, tasks) : null), [employee, tasks]);
  const goalsDone = useMemo(
    () => (employee ? goalsCompletedFor(employee.id) : { done: 0, total: 0 }),
    // Recompute when goals change (goalsCompletedFor reads from storage).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employee, goals],
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

  function chooseBlock(task: TeamTask, reason: (typeof BLOCK_REASONS)[number]) {
    if (!employee) return;
    const clause = reason.clause || "another reason";
    saveMyTasks(employee.id, replaceTask(tasks, blockTask(task, clause)));
    if (presence?.currentTaskId === task.id) {
      setPresence(updatePresence(employee.id, { manualStatus: "blocked", currentTaskId: null, touchActive: true }));
    }
    setBlockingTaskId(null);
    setBlockFlash(
      `⚠️ Atlas notified ${reason.notify}: ${employee.name.split(" ")[0]} can't complete "${task.title}" because ${clause}.`,
    );
  }

  function toggleWidget(id: string) {
    const next = layout.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w));
    setLayout(next);
    saveWidgetLayout(next);
  }
  function nudgeWidget(id: string, dir: -1 | 1) {
    const next = moveWidget(layout, id, dir);
    setLayout(next);
    saveWidgetLayout(next);
  }
  function dropWidget(toId: string) {
    if (!dragId || dragId === toId) return;
    const next = reorderWidget(layout, dragId, toId);
    setLayout(next);
    saveWidgetLayout(next);
    setDragId(null);
  }

  function askHero(e: FormEvent) {
    e.preventDefault();
    if (!employee || !heroAsk.trim()) return;
    const r = employeeAssistantReply(employee, tasks, heroAsk);
    setHeroAnswer({ role: "ai", text: r.text, actions: r.actions });
    setHeroAsk("");
  }

  function pauseCurrent(task: TeamTask) {
    if (!employee) return;
    saveMyTasks(employee.id, replaceTask(tasks, pauseTask(task)));
    if (presence?.currentTaskId === task.id) {
      setPresence(updatePresence(employee.id, { manualStatus: "break", currentTaskId: null, touchActive: true }));
    }
  }

  function askAboutTask(task: TeamTask) {
    const pct = taskProgress(task);
    const spent = formatDuration(elapsedMs(task, Date.now()));
    const dep = task.dependencies.length ? ` It depends on ${task.dependencies.join(", ")}.` : "";
    const due = task.dueDate ? `due ${task.dueDate.slice(0, 10)}${task.dueTime ? ` at ${task.dueTime}` : ""}` : "no due date";
    setChat((prev) => [
      ...prev,
      {
        role: "ai",
        text: `"${task.title}" is ${task.priority.toLowerCase()} priority, ${due}, ${pct}% done with ${spent} logged.${dep} ${pct >= 100 ? "It's complete." : "I'd finish this next given its priority and deadline."}`,
      },
    ]);
    document.getElementById("emp-assistant")?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollTo(anchorId: string) {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth" });
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

  function taskCard(task: TeamTask) {
    const pct = taskProgress(task);
    return (
      <div className={selectedId === task.id ? "task-card active" : "task-card"} key={task.id}>
        <div className="tc-top">
          <h4>
            {task.kind === "meeting" ? "📅 " : ""}
            {task.title}
          </h4>
          <span className={priorityBadge(task.priority)}>{task.priority}</span>
        </div>
        <div className="tc-meta">
          {dueLabel(task.dueDate)}
          {task.dueTime ? ` at ${task.dueTime}` : ""}
          {task.assignedBy ? ` · by ${task.assignedBy}` : ""}
          {task.project ? ` · ${task.project}` : ""}
        </div>
        <span className="bar-track">
          <span className="bar-fill" style={{ width: `${pct}%` }} />
        </span>
        <div className="tc-meta">{pct}% · {TASK_STATUSES.find((s) => s.id === task.status)?.label}</div>
        <div className="tc-actions">
          {task.status !== "completed" ? (
            <button className="btn btn-dark" type="button" onClick={() => beginTask(task)}>
              {task.status === "in_progress" ? "Continue Task" : "Start Task"}
            </button>
          ) : (
            <span className="badge ok">Completed</span>
          )}
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => {
              setSelectedId(task.id);
              setCompleting(false);
              document.getElementById("emp-task-detail")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            View Details
          </button>
        </div>
      </div>
    );
  }

  function priorityGroup(emoji: string, label: string, list: TeamTask[], emptyText: string) {
    return (
      <>
        <div className="priority-head">
          {emoji} {label} <span className="muted-line">({list.length})</span>
        </div>
        {list.length ? (
          <div className="task-cards">{list.map(taskCard)}</div>
        ) : (
          <p className="muted-line">{emptyText}</p>
        )}
      </>
    );
  }

  function renderGoal(g: EmployeeGoal) {
    const pct = goalPct(g);
    const proj = g.kind === "amount" ? goalProjection(g, now) : null;
    return (
      <div key={g.id} style={{ marginBottom: "0.7rem" }}>
        <p>
          <strong>{g.title}</strong> <span className="muted-line">{formatGoalValue(g)} · {pct}%</span>
        </p>
        <span className="bar-track" style={{ display: "block", margin: "0.35rem 0" }}>
          <span className="bar-fill" style={{ width: `${pct}%` }} />
        </span>
        {proj ? (
          <>
            <p className="muted-line">
              {proj.projected > g.target * 1.5 ? (
                <>You&apos;re {formatGoalNumber(g, proj.away)} away — well ahead of pace to beat your {formatGoalNumber(g, g.target)} goal.</>
              ) : (
                <>
                  You&apos;re {formatGoalNumber(g, proj.away)} away. At your current pace you&apos;re projected to reach{" "}
                  {formatGoalNumber(g, proj.projected)}
                  {proj.onTrack ? " — ahead of pace!" : "."}
                </>
              )}
            </p>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => setGoalPlanId(goalPlanId === g.id ? null : g.id)}
            >
              Show me how to reach my goal
            </button>
            {goalPlanId === g.id ? (
              <div className="list" style={{ marginTop: "0.5rem" }}>
                {goalActionPlan(g).map((a) => (
                  <div className="list-row" key={a}>
                    <span className="badge">Atlas</span>
                    <p>{a}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    );
  }

  function renderWidget(id: string) {
    switch (id) {
      case "tasks": {
        const open = priorities.doNow.length + priorities.today.length + priorities.comingUp.length + priorities.whenever.length;
        const top = priorities.doNow[0] ?? priorities.today[0] ?? null;
        return (
          <>
            <div className="stat-grid metrics-dense">
              <div className="stat"><span>Open</span><strong>{open}</strong><small>tasks</small></div>
              <div className="stat"><span>Do now</span><strong>{priorities.doNow.length}</strong><small>urgent</small></div>
            </div>
            {top ? <p className="muted-line" style={{ marginTop: "0.5rem" }}>Top: <strong>{top.title}</strong></p> : null}
          </>
        );
      }
      case "schedule":
        return (
          <div className="timeline">
            {schedule.slice(0, 6).map((e, i) => (
              <div className="timeline-item" key={`${e.minutes}-${i}`}>
                <strong>{e.time} — {e.label}</strong>
              </div>
            ))}
          </div>
        );
      case "goals":
        return goals.length ? <div>{goals.map(renderGoal)}</div> : <p className="muted-line">No goals assigned.</p>;
      case "sales":
        return salesGoal ? renderGoal(salesGoal) : <p className="muted-line">No sales goal assigned.</p>;
      case "messages": {
        const mine = messages.filter((m) => channels.some((c) => c.id === m.channelId));
        const last = mine[mine.length - 1];
        return (
          <>
            <p className="muted-line">{channels.length} channels</p>
            {last ? (
              <div className="bubble bubble-ai">
                <span className="agent-tag">{last.authorName}</span>
                {last.text}
              </div>
            ) : (
              <p className="muted-line">No messages yet.</p>
            )}
            <button className="btn btn-outline" type="button" style={{ marginTop: "0.5rem" }} onClick={() => scrollTo("emp-messages")}>
              Open messages
            </button>
          </>
        );
      }
      case "team": {
        const avail = teammates.filter((tm) => isAvailableStatus(derivedStatus(getPresence(tm.id), now)));
        return (
          <>
            <div className="list">
              {teammates.length ? (
                teammates.map((tm) => {
                  const s = derivedStatus(getPresence(tm.id), now);
                  const m = STATUS_META[s];
                  return (
                    <div className="list-row" key={tm.id}>
                      <span className={`presence-badge ${s}`}>
                        <span className={`presence-dot ${s}`} aria-hidden />
                        {m.label}
                      </span>
                      <p>
                        <strong>{tm.name}</strong>
                        <span className="muted-line">{tm.role}</span>
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="muted-line">No teammates.</p>
              )}
            </div>
            <div className="memory-card" style={{ marginTop: "0.6rem" }}>
              <div className="label">Who&apos;s available?</div>
              <p>
                {avail.length
                  ? `${avail.map((a) => a.name.split(" ")[0]).join(", ")} — message them if you need help.`
                  : "No one is free right now."}
              </p>
            </div>
          </>
        );
      }
      case "announcements":
        return announcements.length ? (
          <div className="list">
            {announcements.map((a) => (
              <div className="list-row" key={a.id}>
                <span className="badge warn">New</span>
                <p><strong>{a.title}</strong></p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-line">You&apos;re all caught up.</p>
        );
      case "training": {
        const inc = training.filter((m) => trainingState(m, trainingNow) !== "complete");
        return inc.length ? (
          <div className="list">
            {inc.map((m) => (
              <div className="list-row" key={m.id}>
                <span className="badge">{m.progress}%</span>
                <p>{m.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-line">All training complete ✅</p>
        );
      }
      case "files":
        return docs.length ? (
          <div className="list">
            {docs.slice(0, 5).map((d) => (
              <div className="list-row" key={d.id}>
                <span className="badge">{d.category}</span>
                <p>{d.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-line">No files.</p>
        );
      case "timeclock": {
        if (!timesheet) return null;
        return (
          <>
            <p className="muted-line">
              {!timesheet.clockedIn ? "Clocked out" : onBreak ? "On break" : `Clocked in ${formatDuration(clockedInMs)}`} ·{" "}
              {formatHours(timesheet.hoursToday * 3_600_000)} today
            </p>
            {!timesheet.clockedIn ? (
              <button className="btn btn-dark" type="button" onClick={doClockIn}>Clock in</button>
            ) : (
              <button className="btn btn-outline" type="button" onClick={doClockOut}>Clock out</button>
            )}
          </>
        );
      }
      case "appointments":
        return appointments.length ? (
          <div className="list">
            {appointments.map((t) => (
              <div className="list-row" key={t.id}>
                <span className="badge">{t.dueTime || "Today"}</span>
                <p>{t.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-line">No appointments.</p>
        );
      default:
        return null;
    }
  }

  return (
    <div className="emp-shell">
      <header className="emp-top">
        <div className="container">
          <div className="emp-id">
            <span className="emp-avatar" aria-hidden>
              {employee.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </span>
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
              {timesheet.clockedIn ? ` · ${formatDuration(clockedInMs)}` : ""}
            </span>
            {!timesheet.clockedIn ? (
              <button className="emp-iconbtn" type="button" onClick={doClockIn}>
                Clock in
              </button>
            ) : (
              <button className="emp-iconbtn" type="button" onClick={doClockOut}>
                Clock out
              </button>
            )}
            <button className="emp-iconbtn" type="button" onClick={() => scrollTo("emp-announcements")} aria-label="Notifications">
              🔔
              {announcements.length ? <span className="dot-count">{announcements.length}</span> : null}
            </button>
            <button className="emp-iconbtn" type="button" onClick={() => scrollTo("emp-messages")}>
              Messages
            </button>
            <button className="emp-iconbtn" type="button" onClick={() => scrollTo("emp-assistant")}>
              Atlas AI
            </button>
            <button
              className="emp-iconbtn"
              type="button"
              onClick={() => setTopNote("Your profile and settings are managed by your admin.")}
            >
              Settings
            </button>
            <button className="btn btn-outline" type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="emp-main">
        <div className="container">
          {announcements.length ? (
            <section className="panel" id="emp-announcements" style={{ borderLeft: "4px solid var(--sand)" }}>
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

          <section className="panel emp-hero">
            <h2>
              {greeting()}, {employee.name.split(" ")[0]}
            </h2>
            <p className="panel-lead">
              {meta.emoji} {meta.label}
              {timesheet.clockedIn ? ` · Clocked in ${formatDuration(clockedInMs)}` : " · Not clocked in"}
            </p>
            <form className="hero-ask" onSubmit={askHero}>
              <input
                value={heroAsk}
                onChange={(e) => setHeroAsk(e.target.value)}
                placeholder="Ask Atlas — e.g. What should I work on next?"
                aria-label="Ask Atlas"
              />
              <button className="btn btn-dark" type="submit">
                Ask Atlas
              </button>
            </form>
            {heroAnswer ? (
              <div className="hero-answer memory-card">
                <div className="label">Atlas</div>
                <p>{heroAnswer.text}</p>
                {heroAnswer.actions && heroAnswer.actions.length ? (
                  <div className="train-actions" style={{ marginTop: "0.5rem" }}>
                    {heroAnswer.actions.map((a) => (
                      <button key={a.label} type="button" className="btn btn-outline" onClick={() => runAction(a)}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {topNote ? (
              <p className="muted-line" style={{ marginTop: "0.6rem" }}>
                {topNote}
              </p>
            ) : null}
            <div className="stat-grid metrics-dense" style={{ marginTop: "1.1rem" }}>
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

          {runningTask ? (
            <div className="work-banner">
              <div className="wb-head">
                <div>
                  <div className="label">Currently working on</div>
                  <div className="wb-title">{runningTask.title}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="muted-line">Started {formatClock(runningTask.startedAt)}</div>
                  <strong>{formatDuration(elapsedMs(runningTask, now))}</strong>
                </div>
              </div>
              <div className="bars">
                <div className="bar-row">
                  <span>Progress</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${taskProgress(runningTask)}%` }} />
                  </span>
                  <strong>{taskProgress(runningTask)}%</strong>
                </div>
              </div>
              <div className="train-actions">
                <button className="btn btn-outline" type="button" onClick={() => pauseCurrent(runningTask)}>
                  Pause
                </button>
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => {
                    setSelectedId(runningTask.id);
                    setCompleting(true);
                  }}
                >
                  Complete
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setBlockingTaskId(runningTask.id)}>
                  I&apos;m Blocked
                </button>
              </div>
            </div>
          ) : null}

          {blockingTaskId ? (() => {
            const bt = tasks.find((t) => t.id === blockingTaskId);
            if (!bt) return null;
            return (
              <section className="panel" style={{ borderLeft: "4px solid #d1495b" }}>
                <h2>Why are you blocked?</h2>
                <p className="panel-lead">&quot;{bt.title}&quot; — Atlas will notify the right person automatically.</p>
                <div className="cta-row">
                  {BLOCK_REASONS.map((r) => (
                    <button key={r.id} className="btn btn-outline" type="button" onClick={() => chooseBlock(bt, r)}>
                      {r.label}
                    </button>
                  ))}
                  <button className="btn btn-outline" type="button" onClick={() => setBlockingTaskId(null)}>
                    Cancel
                  </button>
                </div>
              </section>
            );
          })() : null}

          {blockFlash ? (
            <div className="memory-card">
              <div className="label">Blocker reported</div>
              <p>{blockFlash}</p>
            </div>
          ) : null}

          <section className="panel" id="emp-workspace">
            <div className="train-head">
              <div>
                <h2>My Workspace</h2>
                <p className="panel-lead">Drag widgets to rearrange, or customize what shows up.</p>
              </div>
              <button className="btn btn-outline" type="button" onClick={() => setCustomizing((v) => !v)}>
                {customizing ? "Done" : "Customize"}
              </button>
            </div>
            {customizing ? (
              <div className="list">
                {layout.map((w, i) => (
                  <div className="list-row" key={w.id}>
                    <label className="check-inline">
                      <input type="checkbox" checked={w.enabled} onChange={() => toggleWidget(w.id)} /> {widgetTitle(w.id)}
                    </label>
                    <div className="train-actions">
                      <button className="btn btn-outline" type="button" disabled={i === 0} onClick={() => nudgeWidget(w.id, -1)}>
                        ↑
                      </button>
                      <button className="btn btn-outline" type="button" disabled={i === layout.length - 1} onClick={() => nudgeWidget(w.id, 1)}>
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="widget-grid" style={{ marginTop: "0.8rem" }}>
              {layout.filter((w) => w.enabled).map((w) => (
                <section
                  className="panel widget-card"
                  key={w.id}
                  draggable
                  onDragStart={() => setDragId(w.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dropWidget(w.id)}
                >
                  <h3>⠿ {widgetTitle(w.id)}</h3>
                  {renderWidget(w.id)}
                </section>
              ))}
            </div>
          </section>

          {perf ? (
            <section className="panel">
              <h2>My performance — this month</h2>
              <div className="stat-grid metrics-dense">
                <div className="stat"><span>Tasks completed</span><strong>{perf.tasksCompleted}</strong><small>All-time</small></div>
                <div className="stat"><span>Completed on time</span><strong>{perf.onTimePct}%</strong><small>Met the due date</small></div>
                <div className="stat"><span>Customer rating</span><strong>{perf.csat} ⭐</strong><small>From reviews</small></div>
                <div className="stat"><span>Goals completed</span><strong>{goalsDone.done} / {goalsDone.total}</strong><small>This period</small></div>
                <div className="stat"><span>Attendance</span><strong>{perf.attendancePct}%</strong><small>This month</small></div>
              </div>
              {employee.perfFeedback ? (
                <div className="memory-card" style={{ marginTop: "0.8rem" }}>
                  <div className="label">Atlas</div>
                  <p>{employee.perfFeedback}</p>
                </div>
              ) : null}
            </section>
          ) : null}

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

          <section className="panel">
            <h2>Priorities</h2>
            <p className="panel-lead">Atlas organizes your work so you know what matters — no guessing.</p>
            {tasks.length === 0 ? (
              <p className="muted-line">No tasks yet. Assigned work will appear here.</p>
            ) : (
              <>
                {priorityGroup("🔴", "Do Now", priorities.doNow, "Nothing urgent.")}
                {priorityGroup("🟠", "Today", priorities.today, "Nothing due today.")}
                {priorityGroup("🟡", "Coming Up", priorities.comingUp, "Nothing coming up.")}
                {priorityGroup("🟢", "Whenever Available", priorities.whenever, "Nothing here.")}
                {priorities.completed.length ? priorityGroup("✅", "Completed", priorities.completed, "") : null}
              </>
            )}
          </section>

          <div id="emp-task-detail">
            <section className="panel">
              {selected ? (
                <>
                  <h2>{selected.title}</h2>
                  <p className="panel-lead">
                    {selected.priority} priority · {dueLabel(selected.dueDate)}
                    {selected.dueTime ? ` at ${selected.dueTime}` : ""}
                    {selected.project ? ` · ${selected.project}` : ""}
                  </p>
                  <p className="muted-line">
                    Assigned by {selected.assignedBy} · {taskProgress(selected)}% done ·{" "}
                    {formatDuration(elapsedMs(selected, now))} logged
                    {selected.estimatedTime ? ` of ${selected.estimatedTime} est.` : ""}
                  </p>
                  <span className="bar-track" style={{ display: "block", margin: "0.5rem 0" }}>
                    <span className="bar-fill" style={{ width: `${taskProgress(selected)}%` }} />
                  </span>
                  <div className="train-actions" style={{ marginBottom: "0.3rem" }}>
                    <button className="btn btn-outline" type="button" onClick={() => askAboutTask(selected)}>
                      Ask Atlas About This Task
                    </button>
                  </div>

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
                      <button className="btn btn-outline" type="button" onClick={() => setBlockingTaskId(selected.id)}>
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

                  {(selected.goal || selected.requiredResult || selected.estimatedTime || selected.result || selected.dependencies.length || selected.people.length) ? (
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
                      {selected.dependencies.length ? (
                        <div className="list-row"><span className="badge">Depends on</span><p>{selected.dependencies.join(", ")}</p></div>
                      ) : null}
                      {selected.people.length ? (
                        <div className="list-row"><span className="badge">People</span><p>{selected.people.join(", ")}</p></div>
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
            <section className="panel command-panel" id="emp-messages">
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
          <section className="panel command-panel" id="emp-assistant">
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
