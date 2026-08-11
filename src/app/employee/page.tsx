"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  acceptOpenShift,
  acknowledgeAnnouncement,
  addTaskAttachment,
  addTaskComment,
  ACHIEVEMENT_BADGES,
  acceptHandoff,
  appsFor,
  assetsFor,
  atlasSidebarReply,
  awaitingApproval,
  BLOCK_REASONS,
  blockTask,
  bottleneckOf,
  buildHandoffSummary,
  cadenceLabel,
  careerLadderFor,
  completeOnboardingStep,
  createExpense,
  createHandoff,
  createServiceRequest,
  dependencyStatus,
  employeeProjects,
  expensesFor,
  generateRecurringTasks,
  handoffsFor,
  inboxItems,
  INTERNAL_OPENINGS,
  isShared,
  memoryFor,
  mentorPlan,
  ONBOARDING_STEPS,
  onboardingFor,
  onboardingPct,
  openingMatch,
  payDashboard,
  projectSummary,
  recurringFor,
  reportAssetProblem,
  sampleReceiptExtraction,
  searchWiki,
  SERVICE_CATEGORIES,
  serviceRequestsFor,
  WIKI_ARTICLES,
  sharedProgress,
  universalSearch,
  updateTaskPart,
  buildDaySchedule,
  bumpTraining,
  createTeamTask,
  dailyBrief,
  dmChannelId,
  endOfDaySummary,
  HELP_CATEGORIES,
  loadDocuments,
  saveDocuments,
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
  type Asset,
  type EmployeeApp,
  type Expense,
  type Handoff,
  type MemoryEntry,
  type MentorPlan,
  type OnboardingState,
  type RecurringTemplate,
  type SearchGroup,
  type ServiceRequest,
  type TeamPerson,
  type WikiArticle,
  type TeamTask,
  type TimeShift,
  type TimeOffType,
  type TrainingModule,
  type WidgetPref,
} from "@/lib/user-workspace";

type ChatMsg = { role: "user" | "ai"; text: string; actions?: AssistantAction[]; items?: string[] };

function priorityBadge(priority: TaskPriority) {
  return priority === "Urgent" || priority === "High" ? "badge warn" : "badge";
}

function dueLabel(dueDate: string) {
  return dueDate ? `Due ${dueDate.slice(0, 10)}` : "No due date";
}

function estMinutes(est: string): number {
  const h = /(\d+)\s*h/.exec(est);
  const m = /(\d+)\s*m/.exec(est);
  const mins = (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  return mins > 0 ? mins : 47;
}

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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
  const [briefOpen, setBriefOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMsgs, setSidebarMsgs] = useState<ChatMsg[]>([]);
  const [sidebarInput, setSidebarInput] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpFlash, setHelpFlash] = useState<string | null>(null);
  const [eodOpen, setEodOpen] = useState(false);
  const [eodNote, setEodNote] = useState("");
  const [handoffTo, setHandoffTo] = useState("");
  const [actionFlash, setActionFlash] = useState<string | null>(null);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [memory, setMemory] = useState<MemoryEntry[]>([]);
  const [recurring, setRecurring] = useState<RecurringTemplate[]>([]);
  const [apps, setApps] = useState<EmployeeApp[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchGroups, setSearchGroups] = useState<SearchGroup[] | null>(null);
  const [wikiQ, setWikiQ] = useState("");
  const [wikiHits, setWikiHits] = useState<WikiArticle[] | null>(null);
  const [mentorAsk, setMentorAsk] = useState("");
  const [mentorResult, setMentorResult] = useState<MentorPlan | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [serviceReqs, setServiceReqs] = useState<ServiceRequest[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [serviceCat, setServiceCat] = useState<string | null>(null);
  const [serviceDetail, setServiceDetail] = useState("");
  const [reportAsset, setReportAsset] = useState<Asset | null>(null);
  const [reportDetail, setReportDetail] = useState("");
  const [expenseDraft, setExpenseDraft] = useState<{ merchant: string; date: string; amount: string; category: string; project: string } | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectTab, setProjectTab] = useState<"tasks" | "files" | "messages" | "timeline">("tasks");
  const [achievementsPublic, setAchievementsPublic] = useState(true);
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
    generateRecurringTasks(); // Atlas auto-creates any due recurring responsibilities
    setTasks(loadTeamTasks().filter((t) => t.memberId === me.id || t.parts.some((p) => p.memberId === me.id)));
    setHandoffs(handoffsFor(me.id));
    setMemory(memoryFor(me.id));
    setRecurring(recurringFor(me.id));
    setApps(appsFor(me));
    setOnboarding(onboardingFor(me.id));
    setAssets(assetsFor(me.id));
    setServiceReqs(serviceRequestsFor(me.id));
    setExpenses(expensesFor(me.id));
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
    setSidebarMsgs([
      {
        role: "ai",
        text: "Hi — I'm here on every page. Ask me what's due today, to find a document, how to handle a refund, to summarize a project, and more.",
      },
    ]);
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

  // Focus Mode countdown.
  useEffect(() => {
    if (!focusMode) return;
    const t = window.setInterval(() => setFocusSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [focusMode]);

  const status = derivedStatus(presence, now);
  const summary = useMemo(() => (employee ? dailySummary(employee, tasks) : null), [employee, tasks]);
  const timesheet = useMemo(
    () => (employee ? timesheetFor(employee, undefined, now) : null),
    // `shift` is included so the sheet recomputes right after a clock punch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employee, now, shift],
  );
  const priorities = useMemo(() => smartPriorities(tasks.filter((t) => !isShared(t))), [tasks]);
  const sharedTasks = useMemo(() => tasks.filter(isShared), [tasks]);
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
  // Recompute when the underlying stores change (helpers read from storage).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inbox = useMemo(() => (employee ? inboxItems(employee, now) : []), [employee, now, tasks, messages, announcements]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const projectNames = useMemo(() => (employee ? employeeProjects(employee, loadTeamTasks()) : []), [employee, tasks]);
  const perf = useMemo(() => (employee ? performanceSummary(employee, tasks) : null), [employee, tasks]);
  const goalsDone = useMemo(
    () => (employee ? goalsCompletedFor(employee.id) : { done: 0, total: 0 }),
    // Recompute when goals change (goalsCompletedFor reads from storage).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employee, goals],
  );
  const trainingNow = Date.now();

  const saveMyTasks = useCallback((_memberId: string, mine: TeamTask[]) => {
    setTasks(mine);
    const mineIds = new Set(mine.map((t) => t.id));
    const others = loadTeamTasks().filter((t) => !mineIds.has(t.id));
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

  function setPartStatus(task: TeamTask, partId: string, status: TaskStatus) {
    if (!employee) return;
    saveMyTasks(employee.id, replaceTask(tasks, updateTaskPart(task, partId, status)));
  }

  function doAcceptHandoff(id: string) {
    if (!employee) return;
    acceptHandoff(id);
    setHandoffs(handoffsFor(employee.id));
    setActionFlash("Handoff accepted — the task is now on your board.");
  }

  function runSearch(e: FormEvent) {
    e.preventDefault();
    if (!employee) return;
    setSearchGroups(searchQ.trim() ? universalSearch(employee, searchQ) : null);
  }

  function runWiki(question: string) {
    setWikiQ(question);
    setWikiHits(question.trim() ? searchWiki(question) : null);
  }

  function completeStep(stepId: string) {
    if (!employee) return;
    const st = completeOnboardingStep(employee.id, stepId);
    setOnboarding({ ...st });
    setActionFlash("Onboarding step completed.");
  }

  function askMentor(e: FormEvent) {
    e.preventDefault();
    if (!employee || !mentorAsk.trim()) return;
    setMentorResult(mentorPlan(employee, mentorAsk));
  }

  function submitService(e: FormEvent) {
    e.preventDefault();
    if (!employee || !serviceCat) return;
    const req = createServiceRequest({ memberId: employee.id, categoryId: serviceCat, detail: serviceDetail });
    setServiceReqs(serviceRequestsFor(employee.id));
    setActionFlash(`${req.label} request routed to ${req.routedTo}.`);
    setServiceCat(null);
    setServiceDetail("");
  }

  function scanReceipt() {
    const x = sampleReceiptExtraction();
    setExpenseDraft({ merchant: x.merchant, date: x.date, amount: String(x.amount), category: x.category, project: x.project });
  }

  function submitExpense(e: FormEvent) {
    e.preventDefault();
    if (!employee || !expenseDraft) return;
    createExpense({
      memberId: employee.id,
      merchant: expenseDraft.merchant,
      date: expenseDraft.date,
      amount: Number(expenseDraft.amount) || 0,
      category: expenseDraft.category,
      project: expenseDraft.project,
    });
    setExpenses(expensesFor(employee.id));
    setActionFlash(`Expense submitted — routed to your manager for approval.`);
    setExpenseDraft(null);
  }

  function submitAssetReport(e: FormEvent) {
    e.preventDefault();
    if (!employee || !reportAsset) return;
    reportAssetProblem(employee, reportAsset, reportDetail);
    setServiceReqs(serviceRequestsFor(employee.id));
    setActionFlash(`Reported a problem with ${reportAsset.kind} ${reportAsset.tag} — an IT/facilities request was created.`);
    setReportAsset(null);
    setReportDetail("");
  }

  function handOff(task: TeamTask, toId: string) {
    if (!employee) return;
    const to = allMembers.find((m) => m.id === toId);
    if (!to) return;
    createHandoff(task, employee, to);
    // The task was reassigned away, so drop it from my list.
    setTasks(loadTeamTasks().filter((t) => t.memberId === employee.id || t.parts.some((p) => p.memberId === employee.id)));
    setActionFlash(`Handed off "${task.title}" to ${to.name} with a summary.`);
  }

  function enterFocus(task: TeamTask) {
    if (!employee) return;
    if (task.status !== "in_progress" || !task.startedAt) beginTask(task);
    setFocusSeconds(estMinutes(task.estimatedTime) * 60);
    setFocusMode(true);
  }

  function askSidebar(e: FormEvent) {
    e.preventDefault();
    if (!employee || !sidebarInput.trim()) return;
    const r = atlasSidebarReply(employee, sidebarInput);
    setSidebarMsgs((prev) => [...prev, { role: "user", text: sidebarInput.trim() }, { role: "ai", text: r.text, items: r.items }]);
    setSidebarInput("");
  }
  function askSidebarPrompt(text: string) {
    if (!employee) return;
    const r = atlasSidebarReply(employee, text);
    setSidebarMsgs((prev) => [...prev, { role: "user", text }, { role: "ai", text: r.text, items: r.items }]);
  }

  function requestClockOut() {
    setEodOpen(true);
  }
  function confirmClockOut(withNote: boolean) {
    if (!employee) return;
    if (withNote && eodNote.trim()) {
      sendMessage(dmChannelId(employee.id), employee.id, employee.name, `End-of-day note: ${eodNote.trim()}`);
      setMessages(loadMessages());
    }
    doClockOut();
    setEodOpen(false);
    setEodNote("");
  }

  function chooseHelp(cat: (typeof HELP_CATEGORIES)[number]) {
    if (!employee) return;
    if (cat.id === "atlas") {
      setHelpOpen(false);
      setSidebarOpen(true);
      return;
    }
    sendMessage(dmChannelId(employee.id), employee.id, employee.name, `Help request — ${cat.label}`);
    setMessages(loadMessages());
    setHelpFlash(`✓ Atlas routed your ${cat.label} request to ${cat.route}.`);
  }

  function qaNewTask() {
    if (!employee) return;
    const t = createTeamTask({ memberId: employee.id, title: "New task", assignedBy: employee.name });
    saveTeamTasks([t, ...loadTeamTasks()]);
    setTasks(loadTeamTasks().filter((x) => x.memberId === employee.id));
    setQuickOpen(false);
    setActionFlash('Created a task ("New task") — open it to add details.');
  }
  function qaReminder() {
    if (!employee) return;
    const t = createTeamTask({ memberId: employee.id, title: "Reminder", assignedBy: employee.name, priority: "Normal" });
    saveTeamTasks([t, ...loadTeamTasks()]);
    setTasks(loadTeamTasks().filter((x) => x.memberId === employee.id));
    setQuickOpen(false);
    setActionFlash("Reminder added to your tasks.");
  }
  function qaUpload() {
    if (!employee) return;
    const doc = { id: `doc-${Date.now()}`, memberId: employee.id, title: "Uploaded file", category: "Employment" as const, visibility: "employee" as const, addedAt: new Date().toISOString() };
    saveDocuments([doc, ...loadDocuments()]);
    setDocs(loadDocuments().filter((d) => d.memberId === employee.id && d.visibility === "employee"));
    setQuickOpen(false);
    setActionFlash("Document uploaded to your files.");
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
              <button className="btn btn-outline" type="button" onClick={requestClockOut}>Clock out</button>
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
              <button className="emp-iconbtn" type="button" onClick={requestClockOut}>
                Clock out
              </button>
            )}
            <button className="emp-iconbtn" type="button" onClick={() => scrollTo("emp-inbox")} aria-label="Notifications">
              🔔
              {inbox.length ? <span className="dot-count">{inbox.length}</span> : null}
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
          {briefOpen ? (
            <section className="panel emp-hero" style={{ borderLeft: "4px solid var(--teal)" }}>
              <h2>Your day</h2>
              <div className="list" style={{ marginTop: "0.4rem" }}>
                {dailyBrief(employee, tasks, now).map((line) => (
                  <div className="list-row" key={line}>
                    <span className="badge">Atlas</span>
                    <p>{line}</p>
                  </div>
                ))}
              </div>
              <div className="train-actions" style={{ marginTop: "0.8rem" }}>
                <button className="btn btn-dark" type="button" onClick={() => setBriefOpen(false)}>
                  Start my day
                </button>
              </div>
            </section>
          ) : null}

          {actionFlash || helpFlash ? (
            <div className="memory-card">
              <div className="label">Atlas</div>
              <p>{actionFlash ?? helpFlash}</p>
            </div>
          ) : null}

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
            <form className="hero-ask" style={{ marginTop: "0.6rem" }} onSubmit={runSearch}>
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="🔍 Search everything — customers, docs, tasks, invoices…"
                aria-label="Company search"
              />
              <button className="btn btn-outline" type="submit">Search</button>
            </form>
            {searchGroups ? (
              <div className="memory-card" style={{ marginTop: "0.5rem" }}>
                {searchGroups.length === 0 ? (
                  <p>No permitted results for &ldquo;{searchQ}&rdquo;.</p>
                ) : (
                  searchGroups.map((g) => (
                    <div key={g.category} style={{ marginBottom: "0.5rem" }}>
                      <div className="label">{g.emoji} {g.category}</div>
                      {g.hits.map((h, i) => (
                        <p key={i} style={{ margin: "0.15rem 0" }}>
                          <strong>{h.title}</strong> <span className="muted-line">{h.sub}</span>
                        </p>
                      ))}
                    </div>
                  ))
                )}
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
                <button className="btn btn-outline" type="button" onClick={() => enterFocus(runningTask)}>
                  Focus mode
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

          <section className="panel" id="emp-inbox">
            <h2>Inbox</h2>
            <p className="panel-lead">Everything that needs your attention, in one place.</p>
            {focusMode ? <p className="muted-line">🔕 Notifications are paused during Focus Mode.</p> : null}
            {inbox.length === 0 ? (
              <p className="muted-line">You&apos;re all caught up.</p>
            ) : (
              <div className="list">
                {inbox.map((it) => (
                  <div className="list-row" key={it.id}>
                    <span className="badge" style={{ fontSize: "1rem" }}>{it.emoji}</span>
                    <p>
                      <strong>{it.text}</strong>
                      {it.ago ? <span className="muted-line">{it.ago}</span> : null}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {handoffs.length ? (
            <section className="panel">
              <h2>Handoffs to you</h2>
              <p className="panel-lead">Context handed over so you can pick up right where they left off.</p>
              <div className="list">
                {handoffs.map((h) => (
                  <div className="list-row" key={h.id}>
                    <span className={h.status === "accepted" ? "badge ok" : "badge warn"}>🔄</span>
                    <div style={{ flex: 1 }}>
                      <p>
                        <strong>{h.fromName} → you · {h.taskTitle}</strong>
                        <span className="muted-line">{h.summary}</span>
                      </p>
                    </div>
                    {h.status === "pending" ? (
                      <button className="btn btn-dark" type="button" onClick={() => doAcceptHandoff(h.id)}>Accept</button>
                    ) : (
                      <span className="badge ok">Accepted</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {sharedTasks.length ? (
            <section className="panel">
              <h2>Team tasks</h2>
              <p className="panel-lead">Shared work — everyone sees their own part.</p>
              {sharedTasks.map((t) => (
                <div key={t.id} style={{ marginBottom: "1rem" }}>
                  <div className="tc-top">
                    <strong>{t.title}{t.project ? ` · ${t.project}` : ""}</strong>
                    <span className="badge">{sharedProgress(t)}%</span>
                  </div>
                  <span className="bar-track" style={{ display: "block", margin: "0.4rem 0" }}>
                    <span className="bar-fill" style={{ width: `${sharedProgress(t)}%` }} />
                  </span>
                  <div className="list">
                    {t.parts.map((p) => {
                      const who = allMembers.find((m) => m.id === p.memberId);
                      const mine = p.memberId === employee.id;
                      return (
                        <div className="list-row" key={p.id}>
                          <span className={p.status === "completed" ? "badge ok" : p.status === "in_progress" ? "badge warn" : "badge"}>
                            {p.status === "completed" ? "✅" : p.status === "in_progress" ? "🟡" : "⏳"}
                          </span>
                          <p>
                            <strong>{p.label}</strong>
                            <span className="muted-line">{who?.name ?? "Unassigned"}{mine ? " (you)" : ""}</span>
                          </p>
                          {mine ? (
                            <select value={p.status} onChange={(e) => setPartStatus(t, p.id, e.target.value as TaskStatus)} aria-label={`Your ${p.label} status`}>
                              {TASK_STATUSES.map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          ) : null}

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

          <section className="panel">
            <h2>Projects</h2>
            {projectNames.length === 0 ? (
              <p className="muted-line">You&apos;re not on any projects yet.</p>
            ) : selectedProject ? (() => {
              const ps = projectSummary(selectedProject, loadTeamTasks(), allMembers, employee.id);
              const ptasks = loadTeamTasks().filter((t) => t.project === selectedProject);
              return (
                <>
                  <div className="train-head">
                    <div>
                      <h3>{ps.name}</h3>
                      <p className="panel-lead">Progress {ps.progress}%</p>
                    </div>
                    <button className="btn btn-outline" type="button" onClick={() => setSelectedProject(null)}>
                      All projects
                    </button>
                  </div>
                  <div className="stat-grid metrics-dense">
                    <div className="stat"><span>Progress</span><strong>{ps.progress}%</strong></div>
                    <div className="stat"><span>My tasks</span><strong>{ps.myTasks}</strong></div>
                    <div className="stat"><span>Project tasks</span><strong>{ps.projectTasks}</strong></div>
                    <div className="stat"><span>Next deadline</span><strong style={{ fontSize: "0.95rem" }}>{ps.nextDeadline || "—"}</strong></div>
                  </div>
                  <p className="muted-line" style={{ marginTop: "0.5rem" }}>Team: {ps.team.join(", ")}</p>
                  <div className="training-tabs" role="tablist" aria-label="Project tabs" style={{ marginTop: "0.6rem" }}>
                    {(["tasks", "files", "messages", "timeline"] as const).map((t) => (
                      <button key={t} type="button" role="tab" aria-selected={projectTab === t} className={projectTab === t ? "training-tab active" : "training-tab"} onClick={() => setProjectTab(t)}>
                        {t[0].toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                  {projectTab === "tasks" ? (
                    <div className="list">
                      {ptasks.map((t) => {
                        const who = allMembers.find((m) => m.id === t.memberId);
                        return (
                          <div className="list-row" key={t.id}>
                            <span className={t.status === "completed" ? "badge ok" : "badge"}>{TASK_STATUSES.find((s) => s.id === t.status)?.label}</span>
                            <p><strong>{t.title}</strong><span className="muted-line">{who?.name}{t.memberId === employee.id ? " (you)" : ""}</span></p>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {projectTab === "files" ? (
                    <div className="list">
                      {docs.length ? docs.map((d) => (
                        <div className="list-row" key={d.id}><span className="badge">{d.category}</span><p>{d.title}</p></div>
                      )) : <p className="muted-line">No files.</p>}
                    </div>
                  ) : null}
                  {projectTab === "messages" ? (
                    <p className="muted-line">Project chat lives in <button className="btn btn-outline" type="button" onClick={() => scrollTo("emp-messages")}>Messages</button>.</p>
                  ) : null}
                  {projectTab === "timeline" ? (
                    <div className="timeline">
                      {[...ptasks].filter((t) => t.dueDate).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)).map((t) => (
                        <div className="timeline-item" key={t.id}>
                          <strong>{t.dueDate.slice(0, 10)}{t.dueTime ? ` ${t.dueTime}` : ""} — {t.title}</strong>
                          <p className="muted-line">{TASK_STATUSES.find((s) => s.id === t.status)?.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              );
            })() : (
              <div className="task-cards">
                {projectNames.map((p) => {
                  const ps = projectSummary(p, loadTeamTasks(), allMembers, employee.id);
                  return (
                    <div className="task-card" key={p}>
                      <div className="tc-top"><h4>{p}</h4><span className="badge">{ps.progress}%</span></div>
                      <span className="bar-track"><span className="bar-fill" style={{ width: `${ps.progress}%` }} /></span>
                      <div className="tc-meta">{ps.myTasks} of {ps.projectTasks} tasks yours · next {ps.nextDeadline || "—"}</div>
                      <div className="tc-meta">Team: {ps.team.slice(0, 4).join(", ")}</div>
                      <div className="tc-actions">
                        <button className="btn btn-dark" type="button" onClick={() => { setSelectedProject(p); setProjectTab("tasks"); }}>Open</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="panel">
            <h2>My profile</h2>
            <div className="split">
              <div>
                <h3>Personal</h3>
                <div className="list">
                  <div className="list-row"><span className="badge">Name</span><p>{employee.name}</p></div>
                  <div className="list-row"><span className="badge">Title</span><p>{employee.role}</p></div>
                  <div className="list-row"><span className="badge">Department</span><p>{employee.department || "—"}</p></div>
                  <div className="list-row"><span className="badge">Manager</span><p>Michael</p></div>
                </div>
                <h3 style={{ marginTop: "1rem" }}>Work</h3>
                <div className="list">
                  <div className="list-row"><span className="badge">Email</span><p>{employee.email}</p></div>
                  <div className="list-row"><span className="badge">Employee ID</span><p>{employee.employeeId || "—"}</p></div>
                  <div className="list-row"><span className="badge">Location</span><p>{employee.location || "—"}</p></div>
                  <div className="list-row"><span className="badge">Start date</span><p>{employee.startDate || "—"}</p></div>
                </div>
              </div>
              <div>
                <h3>Skills</h3>
                {employee.skills && employee.skills.length ? (
                  employee.skills.map((sk) => (
                    <div className="skill-row" key={sk.name}>
                      <span>{sk.name}</span>
                      <span className="stars">{"★".repeat(sk.level)}{"☆".repeat(Math.max(0, 5 - sk.level))}</span>
                    </div>
                  ))
                ) : (
                  <p className="muted-line">No skills listed.</p>
                )}
                <h3 style={{ marginTop: "1rem" }}>Certifications</h3>
                <div className="list">
                  {certs.length ? certs.map((c) => (
                    <div className="list-row" key={c.id}>
                      <span className={certState(c, trainingNow) === "valid" ? "badge ok" : "badge warn"}>
                        {certState(c, trainingNow) === "valid" ? "✅" : "⏳"}
                      </span>
                      <p>{c.name}</p>
                    </div>
                  )) : <p className="muted-line">No certifications.</p>}
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Achievements</h2>
            <label className="check-inline">
              <input type="checkbox" checked={achievementsPublic} onChange={(e) => setAchievementsPublic(e.target.checked)} /> Show my achievements to teammates
            </label>
            <div className="achv-grid" style={{ marginTop: "0.8rem" }}>
              {ACHIEVEMENT_BADGES.map((b) => {
                const earned = (employee.earnedAchievements || []).includes(b.id);
                return (
                  <div className={earned ? "achv-card" : "achv-card locked"} key={b.id}>
                    <div className="achv-emoji">{b.emoji}</div>
                    <strong>{b.title}</strong>
                    <p className="muted-line">{earned ? b.desc : "Locked"}</p>
                  </div>
                );
              })}
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
                    <button className="btn btn-outline" type="button" onClick={requestClockOut}>
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

          <section className="panel" id="emp-priorities">
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

                  {selected.dependsOn.length ? (() => {
                    const all = loadTeamTasks();
                    const dep = dependencyStatus(selected, all);
                    const bn = bottleneckOf(selected, all);
                    if (dep.ready) {
                      return (
                        <div className="memory-card" style={{ marginBottom: "0.5rem" }}>
                          <div className="label">Dependencies clear</div>
                          <p>All upstream tasks are done — you&apos;re good to start.</p>
                        </div>
                      );
                    }
                    const who = bn ? allMembers.find((m) => m.id === bn.memberId) : null;
                    return (
                      <div className="confirm-card" style={{ marginBottom: "0.5rem" }}>
                        <div className="confirm-prompt">⛔ Waiting on an upstream task</div>
                        <p>
                          This can&apos;t start yet. The bottleneck is <strong>{bn?.title}</strong>
                          {who ? ` (${who.name})` : ""} — Atlas is tracking it, not blaming you.
                        </p>
                      </div>
                    );
                  })() : null}

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

            <section className="panel" id="emp-timeoff">
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

          {onboarding && onboardingPct(onboarding) < 100 ? (
            <section className="panel" style={{ borderLeft: "4px solid var(--teal)" }}>
              <h2>Welcome to Atlas, {employee.name.split(" ")[0]} 👋</h2>
              <p className="panel-lead">I&apos;ll help you get set up — you&apos;re {onboardingPct(onboarding)}% through onboarding.</p>
              <span className="bar-track" style={{ display: "block", margin: "0.4rem 0" }}>
                <span className="bar-fill" style={{ width: `${onboardingPct(onboarding)}%` }} />
              </span>
              <div className="list">
                {ONBOARDING_STEPS.map((step) => {
                  const done = onboarding.done.includes(step.id);
                  return (
                    <div className="list-row" key={step.id}>
                      <span className={done ? "badge ok" : "badge"}>{done ? "✅" : "○"}</span>
                      <div style={{ flex: 1 }}>
                        <p><strong>{step.label}</strong><span className="muted-line">{step.detail}</span></p>
                      </div>
                      {done ? (
                        <span className="badge ok">Done</span>
                      ) : (
                        <button className="btn btn-outline" type="button" onClick={() => completeStep(step.id)}>Mark done</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {recurring.length ? (
            <section className="panel">
              <h2>Recurring responsibilities</h2>
              <p className="panel-lead">Atlas creates these automatically so you never miss them.</p>
              <div className="list">
                {recurring.map((r) => (
                  <div className="list-row" key={r.id}>
                    <span className="badge">🔁</span>
                    <p><strong>{r.title}</strong><span className="muted-line">{cadenceLabel(r.cadence)}{r.department ? ` · ${r.department}` : ""}</span></p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {apps.length ? (
            <section className="panel">
              <h2>My apps</h2>
              <p className="panel-lead">The tools your company allows — right inside Atlas.</p>
              <div className="pack-grid">
                {apps.map((a) => (
                  <button key={a.id} type="button" className="pack-card" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => setActionFlash(`Opening ${a.name}… (demo)`)}>
                    <div style={{ fontSize: "1.4rem" }}>{a.emoji}</div>
                    <strong>{a.name}</strong>
                    <span className="muted-line">{a.desc}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel">
            <h2>Company wiki</h2>
            <p className="panel-lead">Search approved company documentation instead of asking around — Atlas shows the source.</p>
            <form className="hero-ask" onSubmit={(e) => { e.preventDefault(); runWiki(wikiQ); }}>
              <input value={wikiQ} onChange={(e) => setWikiQ(e.target.value)} placeholder="e.g. How do refunds work?" aria-label="Wiki search" />
              <button className="btn btn-outline" type="submit">Ask the wiki</button>
            </form>
            {wikiHits ? (
              wikiHits.length === 0 ? (
                <p className="muted-line" style={{ marginTop: "0.5rem" }}>No article found — try different words or ask your manager.</p>
              ) : (
                <div className="memory-card" style={{ marginTop: "0.5rem" }}>
                  <div className="label">{wikiHits[0].question}</div>
                  <p>{wikiHits[0].answer}</p>
                  <p className="muted-line">📚 Source: {wikiHits[0].source}</p>
                </div>
              )
            ) : (
              <div className="train-actions" style={{ marginTop: "0.5rem" }}>
                {WIKI_ARTICLES.slice(0, 4).map((a) => (
                  <button key={a.id} type="button" className="btn btn-outline" onClick={() => runWiki(a.question)}>{a.question}</button>
                ))}
              </div>
            )}
          </section>

          <section className="panel" id="emp-mentor">
            <h2>AI Mentor</h2>
            <p className="panel-lead">Your personal coach — tell Atlas a career goal and it maps the path.</p>
            <form className="hero-ask" onSubmit={askMentor}>
              <input value={mentorAsk} onChange={(e) => setMentorAsk(e.target.value)} placeholder="e.g. I want to become a manager" aria-label="Career goal" />
              <button className="btn btn-dark" type="submit">Ask my mentor</button>
            </form>
            {mentorResult ? (
              <div className="memory-card" style={{ marginTop: "0.6rem" }}>
                <div className="label">Path to {mentorResult.target}</div>
                <p><strong>Career path:</strong> {mentorResult.path.join(" → ")}</p>
                {mentorResult.skillsMissing.length ? (
                  <p><strong>Skills to build:</strong> {mentorResult.skillsMissing.join(", ")}</p>
                ) : (
                  <p>You already have the core skills — keep delivering results.</p>
                )}
                {mentorResult.skillsHave.length ? <p className="muted-line">Already strong: {mentorResult.skillsHave.join(", ")}</p> : null}
                <p><strong>Training available:</strong> {mentorResult.training.join(", ")}</p>
                <p><strong>Performance expectations:</strong> {mentorResult.expectations.join("; ")}</p>
                {mentorResult.goals.length ? (
                  <>
                    <p><strong>Goals to work toward:</strong></p>
                    <ul style={{ margin: "0.3rem 0 0 1.1rem" }}>
                      {mentorResult.goals.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </>
                ) : null}
              </div>
            ) : null}
          </section>

          {(() => {
            const ladder = careerLadderFor(employee);
            if (!ladder) return null;
            return (
              <section className="panel">
                <h2>Career center</h2>
                <p className="panel-lead">Your internal path in {ladder.track.name}.</p>
                <div className="list">
                  {ladder.track.rungs.map((r, i) => (
                    <div className="list-row" key={r.role}>
                      <span className={i <= ladder.currentIndex ? "badge ok" : "badge"}>
                        {i < ladder.currentIndex ? "✓" : i === ladder.currentIndex ? "●" : "○"}
                      </span>
                      <p><strong>{r.role}</strong>{i === ladder.currentIndex ? <span className="muted-line">You are here</span> : null}</p>
                    </div>
                  ))}
                </div>
                {ladder.nextRole ? (
                  <p style={{ marginTop: "0.5rem" }}>
                    Next role: <strong>{ladder.nextRole}</strong>. {ladder.missingForNext.length ? `Skills to add: ${ladder.missingForNext.join(", ")}.` : "You meet the skills for the next step."}
                  </p>
                ) : (
                  <p style={{ marginTop: "0.5rem" }}>You&apos;re at the top of this track — nice.</p>
                )}
              </section>
            );
          })()}

          <section className="panel">
            <h2>Internal opportunities</h2>
            <p className="panel-lead">Open roles you may qualify for — before we hire externally.</p>
            <div className="list">
              {INTERNAL_OPENINGS.map((o) => {
                const m = openingMatch(employee, o);
                return (
                  <div className="list-row" key={o.id}>
                    <span className={m.met >= Math.ceil(m.total * 0.7) ? "badge ok" : "badge"}>{m.met}/{m.total}</span>
                    <div style={{ flex: 1 }}>
                      <p>
                        <strong>{o.role} · {o.department}</strong>
                        <span className="muted-line">Based on your skills and experience, you meet {m.met}/{m.total} requirements.{m.missing.length ? ` Missing: ${m.missing.join(", ")}.` : ""}</span>
                      </p>
                    </div>
                    <button className="btn btn-outline" type="button" onClick={() => setActionFlash(`Viewing ${o.role} — application routed to HR.`)}>View position</button>
                  </div>
                );
              })}
            </div>
          </section>

          {(() => {
            const pay = payDashboard(employee);
            return (
              <section className="panel">
                <h2>Pay dashboard</h2>
                <p className="panel-lead">🔒 Payroll data is private to you.</p>
                <p><strong>Next payday:</strong> {pay.nextPayday}</p>
                <div className="stat-grid metrics-dense">
                  <div className="stat"><span>Regular</span><strong>{pay.regularHours}h</strong><small>This period</small></div>
                  <div className="stat"><span>Overtime</span><strong>{pay.overtimeHours}h</strong><small>This period</small></div>
                  <div className="stat"><span>PTO</span><strong>{pay.ptoHours}h</strong><small>Used</small></div>
                </div>
                <h3 style={{ marginTop: "0.6rem" }}>Paystubs</h3>
                <div className="list">
                  {pay.paystubs.map((p) => (
                    <div className="list-row" key={p.id}>
                      <span className="badge">🧾</span>
                      <div style={{ flex: 1 }}><p><strong>{p.period}</strong><span className="muted-line">Gross ${p.gross} · Net ${p.net} · {p.date}</span></p></div>
                      <button className="btn btn-outline" type="button" onClick={() => setActionFlash(`Opening paystub ${p.period}… (demo)`)}>View</button>
                    </div>
                  ))}
                </div>
                <p className="muted-line" style={{ marginTop: "0.4rem" }}>Tax documents: {pay.taxDocs.join(", ")}</p>
              </section>
            );
          })()}

          <section className="panel">
            <h2>Expense center</h2>
            <p className="panel-lead">Snap a receipt — Atlas reads it, you confirm, your manager approves.</p>
            {!expenseDraft ? (
              <button className="btn btn-dark" type="button" onClick={scanReceipt}>📷 Scan a receipt</button>
            ) : (
              <form className="form-grid" onSubmit={submitExpense}>
                <label>Merchant<input value={expenseDraft.merchant} onChange={(e) => setExpenseDraft({ ...expenseDraft, merchant: e.target.value })} /></label>
                <div className="field-row">
                  <label>Date<input type="date" value={expenseDraft.date} onChange={(e) => setExpenseDraft({ ...expenseDraft, date: e.target.value })} /></label>
                  <label>Amount<input value={expenseDraft.amount} onChange={(e) => setExpenseDraft({ ...expenseDraft, amount: e.target.value })} /></label>
                </div>
                <div className="field-row">
                  <label>Category<input value={expenseDraft.category} onChange={(e) => setExpenseDraft({ ...expenseDraft, category: e.target.value })} /></label>
                  <label>Project / client<input value={expenseDraft.project} onChange={(e) => setExpenseDraft({ ...expenseDraft, project: e.target.value })} /></label>
                </div>
                <p className="muted-line">✨ Atlas extracted these from your receipt — edit anything, then submit.</p>
                <div className="train-actions">
                  <button className="btn btn-dark" type="submit">Submit expense</button>
                  <button className="btn btn-outline" type="button" onClick={() => setExpenseDraft(null)}>Cancel</button>
                </div>
              </form>
            )}
            {expenses.length ? (
              <div className="list" style={{ marginTop: "0.6rem" }}>
                {expenses.map((x) => (
                  <div className="list-row" key={x.id}>
                    <span className={x.status === "approved" ? "badge ok" : x.status === "rejected" ? "badge warn" : "badge"}>${x.amount.toFixed(2)}</span>
                    <p><strong>{x.merchant} · {x.category}</strong><span className="muted-line">{x.project} · {x.date} · {x.status === "submitted" ? "Awaiting manager approval" : x.status}</span></p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {assets.length ? (
            <section className="panel">
              <h2>Equipment &amp; assets</h2>
              <p className="panel-lead">Assigned to you. Report a problem and Atlas opens an IT/facilities request.</p>
              <div className="list">
                {assets.map((a) => (
                  <div className="list-row" key={a.id}>
                    <span className="badge">🛠️</span>
                    <div style={{ flex: 1 }}><p><strong>{a.kind} {a.tag}</strong><span className="muted-line">{a.name}</span></p></div>
                    <button className="btn btn-outline" type="button" onClick={() => { setReportAsset(a); setReportDetail(""); }}>Report problem</button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel">
            <h2>Employee self-service</h2>
            <p className="panel-lead">Common HR &amp; workplace requests — Atlas routes each to the right place.</p>
            <div className="pack-grid">
              {SERVICE_CATEGORIES.map((c) => (
                <button key={c.id} type="button" className="pack-card" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => { setServiceCat(c.id); setServiceDetail(""); }}>
                  <div style={{ fontSize: "1.4rem" }}>{c.emoji}</div>
                  <strong>{c.label}</strong>
                  <span className="muted-line">→ {c.routeTo}</span>
                </button>
              ))}
            </div>
            {serviceReqs.length ? (
              <>
                <h3 style={{ marginTop: "0.6rem" }}>My requests</h3>
                <div className="list">
                  {serviceReqs.map((r) => (
                    <div className="list-row" key={r.id}>
                      <span className={r.status === "resolved" ? "badge ok" : "badge"}>{r.status}</span>
                      <p><strong>{r.label}</strong><span className="muted-line">Routed to {r.routedTo}{r.detail ? ` · ${r.detail}` : ""}</span></p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>

          <section className="panel">
            <h2>Work memory</h2>
            <p className="panel-lead">Atlas remembers your projects, procedures, training, and past cases — within company permissions.</p>
            {memory.length === 0 ? (
              <p className="muted-line">No memory yet — it builds as you work.</p>
            ) : (
              <div className="list">
                {memory.map((m) => (
                  <div className="list-row" key={m.id}>
                    <span className="badge">{m.kind}</span>
                    <p>
                      <strong>{m.title}</strong>
                      <span className="muted-line">{m.detail}</span>
                      {m.docs.length ? <span className="muted-line">📄 {m.docs.join(", ")}</span> : null}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="muted-line" style={{ marginTop: "0.6rem" }}>
              Ask the Atlas sidebar: <em>&quot;What did we do last time the Johnson account had this problem?&quot;</em>
            </p>
          </section>

          <section className="panel" id="emp-privacy">
            <h2>Privacy center</h2>
            <p className="panel-lead">You can see exactly what Atlas records — and what it never does.</p>
            <div className="split">
              <div>
                <h3>Atlas tracks</h3>
                <div className="list">
                  <div className="list-row"><span className="badge ok">✅</span><p>Clock-in / clock-out</p></div>
                  <div className="list-row"><span className="badge ok">✅</span><p>Task status</p></div>
                  <div className="list-row"><span className="badge ok">✅</span><p>Business application activity</p></div>
                  <div className="list-row"><span className="badge ok">✅</span><p>Assigned work progress</p></div>
                </div>
              </div>
              <div>
                <h3>Atlas does not track</h3>
                <div className="list">
                  <div className="list-row"><span className="badge warn">❌</span><p>Personal browser activity</p></div>
                  <div className="list-row"><span className="badge warn">❌</span><p>Personal messages</p></div>
                  <div className="list-row"><span className="badge warn">❌</span><p>Webcam</p></div>
                  <div className="list-row"><span className="badge warn">❌</span><p>Microphone recordings without consent</p></div>
                  <div className="list-row"><span className="badge warn">❌</span><p>Keystrokes</p></div>
                </div>
              </div>
            </div>
          </section>

          <p className="muted-line">
            Need to switch accounts? <Link href="/employee/login">Back to employee sign-in</Link>
          </p>
        </div>
      </main>

      {/* Floating actions: Need help, Quick actions, Atlas */}
      <div className="fab-stack">
        {quickOpen ? (
          <div className="fab-menu">
            <button type="button" onClick={qaNewTask}>➕ New Task</button>
            <button type="button" onClick={() => { setQuickOpen(false); scrollTo("emp-messages"); }}>✉️ Send Message</button>
            <button type="button" onClick={() => { setQuickOpen(false); scrollTo("emp-timeoff"); }}>🌴 Request Time Off</button>
            <button type="button" onClick={() => { setQuickOpen(false); setHelpOpen(true); }}>🚩 Report Problem</button>
            <button type="button" onClick={qaUpload}>📎 Upload Document</button>
            <button type="button" onClick={() => { setQuickOpen(false); setHelpOpen(true); }}>🙋 Ask for Help</button>
            <button type="button" onClick={qaReminder}>⏰ Create Reminder</button>
          </div>
        ) : null}
        <button className="fab" type="button" onClick={() => setHelpOpen(true)}>
          Need help?
        </button>
        <button className="fab" type="button" onClick={() => setQuickOpen((v) => !v)} aria-label="Quick actions">
          {quickOpen ? "✕ Close" : "＋ Quick actions"}
        </button>
        <button className="fab primary" type="button" onClick={() => setSidebarOpen(true)}>
          ✨ Atlas
        </button>
      </div>

      {/* Atlas right sidebar */}
      {sidebarOpen ? (
        <>
          <div className="drawer-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className="atlas-drawer" aria-label="Atlas assistant">
            <div className="drawer-head">
              <h2>Atlas</h2>
              <button className="btn btn-outline" type="button" onClick={() => setSidebarOpen(false)}>
                Close
              </button>
            </div>
            <div className="cta-row">
              {["What's due today?", "Find the customer contract", "How do I handle this refund?", "Summarize this project", "Draft a reply to this customer", "Who should I contact about this problem?", "Show me the training guide"].map((p) => (
                <button key={p} type="button" className="btn btn-outline" onClick={() => askSidebarPrompt(p)}>
                  {p}
                </button>
              ))}
            </div>
            <div className="drawer-thread">
              {sidebarMsgs.map((m, i) => (
                <div key={i} className={`bubble ${m.role === "ai" ? "bubble-ai" : "bubble-user"}`}>
                  {m.text}
                  {m.items && m.items.length ? (
                    <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
                      {m.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
            <form className="command-form" onSubmit={askSidebar}>
              <input value={sidebarInput} onChange={(e) => setSidebarInput(e.target.value)} placeholder="Ask Atlas anything…" />
              <button className="btn btn-dark" type="submit">Ask</button>
            </form>
          </aside>
        </>
      ) : null}

      {/* Self-service request */}
      {serviceCat ? (
        <div className="modal-overlay" onClick={() => setServiceCat(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{SERVICE_CATEGORIES.find((c) => c.id === serviceCat)?.label}</h2>
            <p className="muted-line">Routes to {SERVICE_CATEGORIES.find((c) => c.id === serviceCat)?.routeTo}.</p>
            <form onSubmit={submitService}>
              <textarea value={serviceDetail} onChange={(e) => setServiceDetail(e.target.value)} rows={3} placeholder="Add any details (dates, what you need)…" />
              <div className="train-actions" style={{ marginTop: "0.5rem" }}>
                <button className="btn btn-dark" type="submit">Submit request</button>
                <button className="btn btn-outline" type="button" onClick={() => setServiceCat(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Equipment problem report */}
      {reportAsset ? (
        <div className="modal-overlay" onClick={() => setReportAsset(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Report a problem</h2>
            <p className="muted-line">{reportAsset.kind} {reportAsset.tag} · {reportAsset.name}</p>
            <form onSubmit={submitAssetReport}>
              <textarea value={reportDetail} onChange={(e) => setReportDetail(e.target.value)} rows={3} placeholder="What's wrong? (e.g. won't power on)" />
              <div className="train-actions" style={{ marginTop: "0.5rem" }}>
                <button className="btn btn-dark" type="submit">Create IT request</button>
                <button className="btn btn-outline" type="button" onClick={() => setReportAsset(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Need Help routing */}
      {helpOpen ? (
        <div className="modal-overlay" onClick={() => setHelpOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Need help?</h2>
            <p className="panel-lead">Pick a category and Atlas routes it automatically.</p>
            <div className="cta-row" style={{ marginTop: "0.8rem" }}>
              {HELP_CATEGORIES.map((c) => (
                <button key={c.id} type="button" className="btn btn-outline" onClick={() => chooseHelp(c)}>
                  {c.label}
                </button>
              ))}
            </div>
            {helpFlash ? (
              <div className="memory-card" style={{ marginTop: "0.9rem" }}>
                <div className="label">Atlas</div>
                <p>{helpFlash}</p>
              </div>
            ) : null}
            <div className="train-actions" style={{ marginTop: "1rem" }}>
              <button className="btn btn-dark" type="button" onClick={() => { setHelpOpen(false); setHelpFlash(null); }}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* End-of-day summary */}
      {eodOpen ? (() => {
        const eod = endOfDaySummary(employee, tasks, now);
        return (
          <div className="modal-overlay" onClick={() => setEodOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>Today&apos;s summary</h2>
              <div className="list" style={{ marginTop: "0.6rem" }}>
                <div className="list-row"><span className="badge ok">✅</span><p>{eod.completed} task{eod.completed === 1 ? "" : "s"} completed</p></div>
                <div className="list-row"><span className="badge">⏳</span><p>{eod.moved} moved to tomorrow</p></div>
                <div className="list-row"><span className="badge warn">🚧</span><p>{eod.blocked} blocked</p></div>
                <div className="list-row"><span className="badge">📅</span><p>{eod.meetings} meeting{eod.meetings === 1 ? "" : "s"} attended</p></div>
                <div className="list-row"><span className="badge ok">⭐</span><p>{eod.compliments} recognition{eod.compliments === 1 ? "" : "s"}</p></div>
              </div>
              {(() => {
                const unfinished = tasks.filter((t) => t.memberId === employee.id && (t.status === "in_progress" || t.status === "waiting" || t.status === "blocked"));
                if (!unfinished.length) return null;
                return (
                  <div style={{ marginTop: "1rem" }}>
                    <h3>Hand off unfinished work</h3>
                    <p className="muted-line">Atlas drafts the summary so a teammate can pick up seamlessly.</p>
                    <label className="check-inline" style={{ marginTop: "0.4rem" }}>
                      Hand off to
                      <select value={handoffTo} onChange={(e) => setHandoffTo(e.target.value)}>
                        <option value="">Choose teammate…</option>
                        {teammates.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </label>
                    <div className="list" style={{ marginTop: "0.5rem" }}>
                      {unfinished.map((t) => (
                        <div className="list-row" key={t.id}>
                          <span className="badge">{taskProgress(t)}%</span>
                          <div style={{ flex: 1 }}>
                            <p><strong>{t.title}</strong><span className="muted-line">{buildHandoffSummary(t)}</span></p>
                          </div>
                          <button className="btn btn-outline" type="button" disabled={!handoffTo} onClick={() => handOff(t, handoffTo)}>Hand off</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <label style={{ display: "block", marginTop: "1rem" }}>
                <span className="muted-line">Anything your manager should know?</span>
                <textarea value={eodNote} onChange={(e) => setEodNote(e.target.value)} rows={2} placeholder="e.g. Waiting on supplier pricing before I can finish tomorrow." />
              </label>
              <div className="train-actions" style={{ marginTop: "0.8rem" }}>
                <button className="btn btn-dark" type="button" onClick={() => confirmClockOut(true)}>Submit &amp; clock out</button>
                <button className="btn btn-outline" type="button" onClick={() => confirmClockOut(false)}>Just clock out</button>
                <button className="btn btn-outline" type="button" onClick={() => setEodOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })() : null}

      {/* Focus Mode */}
      {focusMode && runningTask ? (() => {
        const nextUp = priorities.today.find((t) => t.id !== runningTask.id) ?? priorities.doNow.find((t) => t.id !== runningTask.id) ?? null;
        const pct = taskProgress(runningTask);
        return (
          <div className="focus-overlay">
            <div className="focus-card">
              <div className="focus-label">Current task</div>
              <h1>{runningTask.title}</h1>
              <div className="focus-timer">{formatCountdown(focusSeconds)}</div>
              <div className="focus-label">{Math.ceil(focusSeconds / 60)} minutes remaining</div>
              <div className="focus-bar"><span style={{ width: `${pct}%` }} /></div>
              <div className="focus-actions">
                <button className="btn btn-dark" type="button" onClick={() => { setFocusMode(false); setSelectedId(runningTask.id); setCompleting(true); }}>Complete</button>
                <button className="btn btn-outline" type="button" onClick={() => { setFocusMode(false); setBlockingTaskId(runningTask.id); }}>I&apos;m Blocked</button>
                <button className="btn btn-outline" type="button" onClick={() => setFocusMode(false)}>Exit focus</button>
              </div>
              {nextUp ? (
                <p style={{ opacity: 0.85, marginTop: "1rem" }}>Next: {nextUp.title}{nextUp.dueTime ? ` at ${nextUp.dueTime}` : ""}</p>
              ) : null}
              <p className="focus-label">🔕 Non-urgent notifications are paused</p>
            </div>
          </div>
        );
      })() : null}

      {/* Mobile bottom navigation */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><strong>🏠</strong>Home</button>
        <button type="button" onClick={() => scrollTo("emp-priorities")}><strong>✓</strong>Tasks</button>
        <button type="button" onClick={() => setSidebarOpen(true)}><strong>✨</strong>Atlas</button>
        <button type="button" onClick={() => scrollTo("emp-messages")}><strong>✉️</strong>Messages</button>
        <button type="button" onClick={() => setQuickOpen((v) => !v)}><strong>⋯</strong>More</button>
      </nav>
    </div>
  );
}
