import { loadConfirmations, pendingCount, type PendingConfirmation } from "@/lib/confirmations";
import { formatMoneyFull } from "@/lib/data";
import { loadCalendarState, saveCalendarState, createEvent, type CalendarEvent } from "@/lib/smart-calendar";
import { loadTasks, taskCounts } from "@/lib/tasks";
import { loadTaxTransactions } from "@/lib/tax-ledger";

export type Provenance = "LIVE" | "CONNECTED DATA" | "DEMO";
export type Stance = "OBSERVE" | "SUGGEST" | "APPROVE" | "AUTOMATE";
export type OwnerEffectId =
  | "approve_johnson"
  | "fill_john_slot"
  | "follow_invoices"
  | "follow_missed_calls"
  | "fill_schedule"
  | "explain_expenses"
  | "move_john_appointment"
  | "do_all_three";

export type DashboardKpi = {
  id: string;
  label: string;
  value: string;
  detail: string;
  href: string;
  source: Provenance;
};

export type DashboardFinding = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  effect?: OwnerEffectId;
  stance: Stance;
  source: Provenance;
  open: boolean;
};

export type ActivityItem = {
  id: string;
  at: string;
  timeLabel: string;
  tone: "ok" | "warn" | "neutral";
  title: string;
  source: Provenance;
};

export type ActionReceipt = {
  label: string;
  source: Provenance;
};

export type DashboardSnapshot = {
  kpis: DashboardKpi[];
  findings: DashboardFinding[];
  activity: ActivityItem[];
  approvals: PendingConfirmation[];
  pendingApprovals: number;
  briefing: string;
  recommend: string;
};

type Pulse = {
  johnson: "pending" | "approved";
  johnMoved: boolean;
  overdueReminded: boolean;
  missedFollowUp: boolean;
  scheduleFill: "open" | "filling";
  pausedCampaign: boolean;
  activity: ActivityItem[];
};

const PULSE_KEY = "atlas-pulse-v1";

function money(amount: number) {
  return formatMoneyFull(Math.round(amount));
}

function sameDay(iso: string, day: Date) {
  const d = new Date(iso);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

function atDay(base: Date, offset: number, hour: number, minute: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function timeLabel(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function defaultPulse(): Pulse {
  const now = new Date();
  const overnight = new Date(now);
  overnight.setHours(6, 10, 0, 0);
  return {
    johnson: "pending",
    johnMoved: false,
    overdueReminded: false,
    missedFollowUp: false,
    scheduleFill: "open",
    pausedCampaign: false,
    activity: [
      {
        id: "act-overnight",
        at: overnight.toISOString(),
        timeLabel: "Overnight",
        tone: "ok",
        title: "Reviewed customer interactions and queued follow-ups",
        source: "DEMO",
      },
      {
        id: "act-import",
        at: atDay(now, 0, 8, 12).toISOString(),
        timeLabel: timeLabel(atDay(now, 0, 8, 12)),
        tone: "ok",
        title: "Imported ledger rows into Tax Center",
        source: "DEMO",
      },
    ],
  };
}

export function loadPulse(): Pulse {
  if (typeof window === "undefined") return defaultPulse();
  try {
    const raw = localStorage.getItem(PULSE_KEY);
    if (!raw) {
      const seeded = defaultPulse();
      localStorage.setItem(PULSE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Pulse;
    return { ...defaultPulse(), ...parsed, activity: parsed.activity?.length ? parsed.activity : defaultPulse().activity };
  } catch {
    return defaultPulse();
  }
}

export function savePulse(pulse: Pulse) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PULSE_KEY, JSON.stringify(pulse));
}

function pushActivity(pulse: Pulse, item: Omit<ActivityItem, "id" | "at"> & { id?: string }) {
  const now = new Date();
  pulse.activity = [
    {
      id: item.id || `act_${now.getTime()}`,
      at: now.toISOString(),
      timeLabel: item.timeLabel,
      tone: item.tone,
      title: item.title,
      source: item.source,
    },
    ...pulse.activity,
  ].slice(0, 24);
}

function johnEvent(events: CalendarEvent[]) {
  return events.find((event) => /john/i.test(event.title));
}

export function applyOwnerEffect(effect: OwnerEffectId): { receipts: ActionReceipt[]; note: string } {
  const pulse = loadPulse();
  const receipts: ActionReceipt[] = [];
  let note = "Done.";

  if (effect === "approve_johnson") {
    pulse.johnson = "approved";
    pushActivity(pulse, {
      timeLabel: timeLabel(new Date()),
      tone: "ok",
      title: "Johnson Construction estimate approved",
      source: "LIVE",
    });
    receipts.push(
      { label: "Estimate marked approved", source: "LIVE" },
      { label: "Deposit invoice queued", source: "DEMO" },
      { label: "Customer email sent", source: "DEMO" },
    );
    note = "Johnson Construction $18,400 estimate is approved in Atlas. Email and deposit invoice are still DEMO — no mail or payments connection yet.";
  }

  if (effect === "fill_john_slot" || effect === "fill_schedule") {
    pulse.scheduleFill = "filling";
    pushActivity(pulse, {
      timeLabel: timeLabel(new Date()),
      tone: "ok",
      title: "Waitlist texts queued for the open window",
      source: "LIVE",
    });
    receipts.push(
      { label: "Open window flagged on the schedule", source: "LIVE" },
      { label: "Waitlist customers texted", source: "DEMO" },
    );
    note = "Atlas marked the gap on your calendar. Customer texts are DEMO until a phone connection exists.";
  }

  if (effect === "follow_invoices") {
    pulse.overdueReminded = true;
    pushActivity(pulse, {
      timeLabel: timeLabel(new Date()),
      tone: "ok",
      title: "Overdue invoice reminders queued",
      source: "LIVE",
    });
    receipts.push(
      { label: "Reminders queued in Approvals", source: "LIVE" },
      { label: "Customer emails sent", source: "DEMO" },
    );
    note = "Reminders are queued. Sending still needs a connected inbox.";
  }

  if (effect === "follow_missed_calls") {
    pulse.missedFollowUp = true;
    pushActivity(pulse, {
      timeLabel: timeLabel(new Date()),
      tone: "ok",
      title: "Missed-call follow-up started",
      source: "LIVE",
    });
    receipts.push(
      { label: "Follow-up task created", source: "LIVE" },
      { label: "Outbound calls/texts placed", source: "DEMO" },
    );
    note = "Atlas will treat missed-call recovery as work in this workspace. Live dialing needs a phone connection.";
  }

  if (effect === "explain_expenses") {
    receipts.push({ label: "Advertising called out on the Money hub", source: "DEMO" });
    note = "Expense mix is from the DEMO ledger. Connect a bank to replace this with CONNECTED DATA.";
  }

  if (effect === "move_john_appointment") {
    if (typeof window !== "undefined") {
      const state = loadCalendarState();
      const existing = johnEvent(state.events);
      const start = atDay(new Date(), 1, 14, 0);
      const end = atDay(new Date(), 1, 15, 0);
      if (existing) {
        state.events = state.events.map((event) =>
          event.id === existing.id
            ? { ...event, start: start.toISOString(), end: end.toISOString(), notes: `${event.notes} Moved by Atlas.`.trim() }
            : event,
        );
        receipts.push({ label: "Calendar updated", source: "LIVE" });
      } else {
        state.events = [
          createEvent({
            title: "John Smith · AC Repair",
            categoryId: "work",
            layerId: "business",
            start: start.toISOString(),
            end: end.toISOString(),
            location: "Customer site",
            invitees: ["John Smith", "Alex"],
            notes: "Moved by Atlas from today 2:00 PM.",
            priority: "high",
          }),
          ...state.events,
        ];
        receipts.push({ label: "Appointment created on calendar", source: "LIVE" });
      }
      saveCalendarState(state);
    }
    pulse.johnMoved = true;
    pushActivity(pulse, {
      timeLabel: timeLabel(new Date()),
      tone: "ok",
      title: "John Smith appointment moved to tomorrow 2:00 PM",
      source: "LIVE",
    });
    receipts.push(
      { label: "John notified", source: "DEMO" },
      { label: "Technician notified", source: "DEMO" },
      { label: "CRM note added", source: "DEMO" },
    );
    note = "Calendar is updated in this workspace. Customer and technician messages are DEMO until phone/SMS is connected.";
  }

  if (effect === "do_all_three") {
    const missed = applyOwnerEffect("follow_missed_calls");
    const fill = applyOwnerEffect("fill_schedule");
    const next = loadPulse();
    next.pausedCampaign = true;
    pushActivity(next, {
      timeLabel: timeLabel(new Date()),
      tone: "warn",
      title: "Campaign B pause noted — no ads account connected",
      source: "DEMO",
    });
    savePulse(next);
    return {
      receipts: [
        ...missed.receipts,
        ...fill.receipts,
        { label: "Campaign B pause noted", source: "DEMO" },
      ],
      note: "Follow-up and schedule fill are in motion. Pausing ads is DEMO — no ad account is connected.",
    };
  }

  savePulse(pulse);
  return { receipts, note };
}

export function loadDashboardSnapshot(): DashboardSnapshot {
  const pulse = loadPulse();
  const tasks = typeof window !== "undefined" ? loadTasks() : [];
  const txns = typeof window !== "undefined" ? loadTaxTransactions() : [];
  const calendar = typeof window !== "undefined" ? loadCalendarState() : { events: [] as CalendarEvent[] };
  const confirmations = typeof window !== "undefined" ? loadConfirmations() : [];
  const counts = taskCounts(tasks);
  const now = new Date();
  const tomorrow = atDay(now, 1, 0, 0);

  const income = txns.filter((row) => row.kind === "income").reduce((sum, row) => sum + row.amount, 0);
  const expenses = txns.filter((row) => row.kind === "expense").reduce((sum, row) => sum + row.amount, 0);
  const todayEvents = calendar.events.filter((event) => sameDay(event.start, now));
  const tomorrowEvents = calendar.events.filter((event) => sameDay(event.start, tomorrow));
  const openTasks = counts.todo + counts.doing;

  const kpis: DashboardKpi[] = [
    {
      id: "revenue",
      label: "Revenue",
      value: money(income || 8500),
      detail: income ? "Sum of DEMO ledger income" : "No ledger yet · showing placeholder",
      href: "/app/money",
      source: "DEMO",
    },
    {
      id: "appointments",
      label: "Appointments",
      value: String(todayEvents.length),
      detail: todayEvents.length ? `${todayEvents.length} on today’s calendar` : "Nothing on the calendar today",
      href: "/app/appointments",
      source: todayEvents.length ? "DEMO" : "LIVE",
    },
    {
      id: "customers",
      label: "Customers",
      value: "3",
      detail: "Sample CRM rows · not a live customer list",
      href: "/app/customers",
      source: "DEMO",
    },
    {
      id: "tasks",
      label: "Tasks",
      value: String(openTasks),
      detail: counts.high ? `${counts.high} high priority` : "Nothing marked urgent",
      href: "/app/tasks",
      source: tasks.length ? "DEMO" : "LIVE",
    },
  ];

  const findings: DashboardFinding[] = [
    {
      id: "invoices",
      icon: "⚠",
      title: pulse.overdueReminded ? "Invoice reminders are queued" : "3 invoices are overdue",
      detail: pulse.overdueReminded ? "Sending still needs a connected inbox." : "$2,440 outstanding on the DEMO ledger",
      href: "/app/payments",
      actionLabel: pulse.overdueReminded ? "Review invoices" : "Let Atlas follow up",
      effect: pulse.overdueReminded ? undefined : "follow_invoices",
      stance: pulse.overdueReminded ? "OBSERVE" : "SUGGEST",
      source: "DEMO",
      open: !pulse.overdueReminded,
    },
    {
      id: "missed",
      icon: "📞",
      title: pulse.missedFollowUp ? "Missed-call follow-up is in motion" : "4 missed calls weren’t returned",
      detail: pulse.missedFollowUp ? "Live dialing needs a phone connection." : "Potential value: ~$1,100 · DEMO",
      href: "/app/missed-calls",
      actionLabel: pulse.missedFollowUp ? "Open missed calls" : "Let Atlas follow up",
      effect: pulse.missedFollowUp ? undefined : "follow_missed_calls",
      stance: pulse.missedFollowUp ? "OBSERVE" : "SUGGEST",
      source: "DEMO",
      open: !pulse.missedFollowUp,
    },
    {
      id: "gap",
      icon: "📅",
      title: pulse.scheduleFill === "filling" ? "Atlas is filling tomorrow’s gap" : "Tomorrow has an empty 2-hour window",
      detail: tomorrowEvents.length ? `${tomorrowEvents.length} jobs already on the board` : "Calendar is light tomorrow",
      href: "/app/appointments",
      actionLabel: pulse.scheduleFill === "filling" ? "Open calendar" : "Fill schedule",
      effect: pulse.scheduleFill === "filling" ? undefined : "fill_schedule",
      stance: pulse.scheduleFill === "filling" ? "OBSERVE" : "SUGGEST",
      source: "DEMO",
      open: pulse.scheduleFill === "open",
    },
    {
      id: "expenses",
      icon: "💰",
      title: `Expenses ${money(expenses)} on the DEMO ledger`,
      detail: "Mainly supplies and software in sample rows — not a bank feed",
      href: "/app/money",
      actionLabel: "See why",
      effect: "explain_expenses",
      stance: "OBSERVE",
      source: "DEMO",
      open: true,
    },
  ];

  if (pulse.johnson === "pending") {
    findings.unshift({
      id: "johnson",
      icon: "✎",
      title: "Johnson Construction estimate waiting",
      detail: "$18,400 remodel · Atlas will not send it until you approve",
      href: "/app/approvals",
      actionLabel: "Review estimate",
      effect: "approve_johnson",
      stance: "APPROVE",
      source: "DEMO",
      open: true,
    });
  }

  const briefing = [
    `Ledger income ${money(income)} (DEMO — not a bank).`,
    `${todayEvents.length} appointments on today’s calendar.`,
    `${openTasks} open tasks${counts.high ? `, ${counts.high} high priority` : ""}.`,
    pulse.johnson === "pending" ? "Johnson Construction estimate still needs approval." : "Johnson Construction estimate is approved in this workspace.",
  ].join(" ");

  const recommend = [
    pulse.missedFollowUp ? null : "1. Follow up on missed calls. Estimated DEMO opportunity: $1,100.",
    pulse.scheduleFill === "open" ? "2. Fill tomorrow’s open window from the waitlist." : null,
    pulse.pausedCampaign ? null : "3. Pause Campaign B only after an ads connection exists (DEMO).",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    kpis,
    findings,
    activity: pulse.activity,
    approvals: confirmations.filter((item) => item.status === "pending"),
    pendingApprovals: pendingCount(confirmations),
    briefing,
    recommend: recommend || "Nothing urgent. Ask Atlas if you want a deeper pass.",
  };
}

export function dashboardChatReply(kind: "brief" | "week" | "next"): string {
  const snap = loadDashboardSnapshot();
  if (kind === "next") {
    return `${snap.recommend}\n\nSay “Do all three” if you want Atlas to start the items it can touch in this workspace. DEMO items will stay labeled DEMO.`;
  }
  if (kind === "week") {
    return `Here’s this week from the workspace — every dollar is DEMO until a bank or payments connection exists.\n\n${snap.briefing}\n\n${snap.recommend}`;
  }
  return snap.briefing;
}
