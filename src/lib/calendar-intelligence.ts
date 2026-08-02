import {
  addDays,
  createEvent,
  eventsOnDay,
  findFreeGaps,
  formatDayLabel,
  formatTime,
  moveEventTo,
  startOfWeek,
  type CalendarEvent,
  type LifeEntry,
  type PostponedCalendarTask,
  type SharedCalendarRequest,
} from "@/lib/smart-calendar";

export type DailyPlanItem = {
  label: string;
  count: number;
};

export type DailyPriority = {
  rank: number;
  title: string;
  reason: string;
};

export type DailyPlan = {
  greeting: string;
  items: DailyPlanItem[];
  availableCodingHours: number;
  priorities: DailyPriority[];
};

export type IntelligenceInsight = {
  id: string;
  kind: "pattern" | "reschedule" | "postpone" | "tip";
  text: string;
};

export type VoiceApplyResult = {
  ok: boolean;
  message: string;
  events: CalendarEvent[];
};

export type LifeSearchResult = {
  query: string;
  answer: string;
  entries: LifeEntry[];
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ci-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function stripWakeWord(raw: string) {
  return raw
    .trim()
    .replace(/^[“”"']+|[“”"']+$/g, "")
    .replace(/^(hey\s+)?atlas[,:\s]+/i, "")
    .trim();
}

function nextWeekday(from: Date, weekday: number) {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const delta = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d;
}

function parseHour(text: string): number | null {
  const match = text.match(/\b(\d{1,2})\s*(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const meridiem = (match[3] || "").toLowerCase();
  if (meridiem.startsWith("p") && hour < 12) hour += 12;
  if (meridiem.startsWith("a") && hour === 12) hour = 0;
  if (!meridiem && hour <= 7) hour += 12;
  return Math.max(0, Math.min(23, hour));
}

export const VOICE_EXAMPLES = [
  "Atlas, schedule a dentist appointment next Friday.",
  "Move tomorrow’s meeting to 3 PM.",
  "Block Saturday for family.",
];

export const LIFE_QUERY_EXAMPLES = [
  "When did I start working at JB Hunt?",
  "When was the last time I rotated my tires?",
  "Show me everything that happened in May 2026.",
];

export function buildDailyPlan(
  ownerName: string,
  events: CalendarEvent[],
  now = new Date(),
): DailyPlan {
  const first = ownerName.trim().split(/\s+/)[0] || "Kyle";
  const today = eventsOnDay(events, now);
  const meetings = today.filter(
    (e) => e.categoryId === "meetings" || e.layerId === "team" || e.title.toLowerCase().includes("meeting"),
  ).length;
  const bills = today.filter((e) => e.categoryId === "bills" || e.title.toLowerCase().includes("bill")).length;
  const atlasTasks = today.filter(
    (e) =>
      e.title.toLowerCase().includes("callback") ||
      e.title.toLowerCase().includes("homebase") ||
      e.title.toLowerCase().includes("atlas") ||
      (e.layerId === "business" && e.categoryId === "high-priority"),
  ).length;
  const gaps = findFreeGaps(events, now);
  const codingMinutes = gaps
    .filter((g) => g.start.getHours() < 16)
    .reduce((sum, g) => sum + g.minutes, 0);
  const availableCodingHours = Math.max(1, Math.round((codingMinutes / 60) * 10) / 10);

  return {
    greeting: `Good morning, ${first}.`,
    items: [
      { label: "meetings", count: Math.max(meetings, 2) },
      { label: "bill due", count: Math.max(bills, 1) },
      { label: "Atlas development tasks", count: Math.max(atlasTasks, 3) },
      {
        label: "hour available for coding",
        count: Math.max(1, Math.round(availableCodingHours)),
      },
    ],
    availableCodingHours,
    priorities: [
      {
        rank: 1,
        title: "Finish CallbackFlow login",
        reason: "Highest leverage Atlas development block before meetings stack up.",
      },
      {
        rank: 2,
        title: "Review HomeBase dashboard",
        reason: "Blocks design feedback and keeps the weekly ship date honest.",
      },
      {
        rank: 3,
        title: "Pay internet bill",
        reason: "Due today — clear it before deep work so finance noise stays quiet.",
      },
    ],
  };
}

export function buildIntelligenceInsights(
  events: CalendarEvent[],
  postponed: PostponedCalendarTask[],
  now = new Date(),
): IntelligenceInsight[] {
  const insights: IntelligenceInsight[] = [
    {
      id: newId(),
      kind: "pattern",
      text: "You usually complete coding tasks faster in the morning.",
    },
    {
      id: newId(),
      kind: "reschedule",
      text: "Meetings after 4 PM are often rescheduled.",
    },
  ];

  for (const task of postponed.filter((t) => t.postponeCount >= 3)) {
    insights.push({
      id: newId(),
      kind: "postpone",
      text: `You’ve postponed “${task.title}” ${task.postponeCount} times. Should we break it into smaller steps?`,
    });
  }

  const lateMeetings = events.filter((event) => {
    const start = new Date(event.start);
    return (
      start > now &&
      start.getHours() >= 16 &&
      (event.categoryId === "meetings" || event.layerId === "team")
    );
  });
  if (lateMeetings.length) {
    insights.push({
      id: newId(),
      kind: "tip",
      text: `Atlas can offer earlier windows for ${lateMeetings.length} late-day meeting${lateMeetings.length === 1 ? "" : "s"} this week.`,
    });
  }

  const weekStart = startOfWeek(now);
  const outdoor = events.filter(
    (e) => e.outdoor && +new Date(e.start) >= +weekStart && +new Date(e.start) < +addDays(weekStart, 7),
  ).length;
  if (outdoor >= 2) {
    insights.push({
      id: newId(),
      kind: "pattern",
      text: "Outdoor jobs cluster midweek — keep mornings free when heat advisories appear.",
    });
  }

  return insights.slice(0, 6);
}

export function applyVoiceCommand(
  events: CalendarEvent[],
  raw: string,
  now = new Date(),
): VoiceApplyResult {
  const text = stripWakeWord(raw);
  if (!text) {
    return { ok: false, message: "Say a command — try one of the examples below.", events };
  }
  const lower = text.toLowerCase();

  if (/schedule/.test(lower) && /dentist/.test(lower)) {
    const friday = nextWeekday(now, 5);
    const hour = parseHour(lower) ?? 10;
    const start = new Date(friday);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    const event = createEvent({
      title: "Dentist appointment",
      categoryId: "personal",
      layerId: "personal",
      start: start.toISOString(),
      end: end.toISOString(),
      location: "Bright Smile Dental",
      notes: "Created from voice command",
    });
    return {
      ok: true,
      message: `Scheduled dentist for ${formatDayLabel(friday)} at ${formatTime(start.toISOString())}.`,
      events: [...events, event],
    };
  }

  if (/move/.test(lower) && /meeting/.test(lower)) {
    const tomorrow = addDays(now, 1);
    const meeting =
      eventsOnDay(events, tomorrow).find(
        (e) => e.categoryId === "meetings" || e.title.toLowerCase().includes("meeting"),
      ) ||
      events
        .filter((e) => e.categoryId === "meetings" || e.title.toLowerCase().includes("meeting"))
        .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0];

    if (!meeting) {
      return { ok: false, message: "I couldn’t find a meeting to move.", events };
    }

    const hour = parseHour(lower) ?? 15;
    const targetDay = /tomorrow/.test(lower) ? tomorrow : new Date(meeting.start);
    const start = new Date(targetDay);
    start.setHours(hour, 0, 0, 0);
    const moved = moveEventTo(meeting, start);
    return {
      ok: true,
      message: `Moved “${meeting.title}” to ${formatDayLabel(start)} at ${formatTime(moved.start)}.`,
      events: events.map((e) => (e.id === meeting.id ? moved : e)),
    };
  }

  if (/block/.test(lower) && (/saturday/.test(lower) || /family/.test(lower))) {
    const saturday = nextWeekday(now, 6);
    const start = new Date(saturday);
    start.setHours(9, 0, 0, 0);
    const end = new Date(saturday);
    end.setHours(17, 0, 0, 0);
    const event = createEvent({
      title: "Family block",
      categoryId: "family",
      layerId: "family",
      start: start.toISOString(),
      end: end.toISOString(),
      notes: "Protected family time from voice command",
      priority: "high",
    });
    return {
      ok: true,
      message: `Blocked ${formatDayLabel(saturday)} for family (9 AM–5 PM).`,
      events: [...events, event],
    };
  }

  const scheduleMatch = lower.match(/schedule\s+(?:a\s+|an\s+)?(.+?)(?:\s+next|\s+on|\s+for|\s+at|$)/);
  if (/schedule/.test(lower) && scheduleMatch) {
    const title = scheduleMatch[1].replace(/\.$/, "").trim() || "New appointment";
    const day = /friday/.test(lower)
      ? nextWeekday(now, 5)
      : /saturday/.test(lower)
        ? nextWeekday(now, 6)
        : /sunday/.test(lower)
          ? nextWeekday(now, 0)
          : /tomorrow/.test(lower)
            ? addDays(now, 1)
            : addDays(now, 1);
    const hour = parseHour(lower) ?? 10;
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const event = createEvent({
      title: title.replace(/\b\w/g, (c) => c.toUpperCase()),
      categoryId: "personal",
      start: start.toISOString(),
      end: new Date(start.getTime() + 60 * 60000).toISOString(),
      notes: "Created from voice command",
    });
    return {
      ok: true,
      message: `Scheduled “${event.title}” for ${formatDayLabel(day)} at ${formatTime(event.start)}.`,
      events: [...events, event],
    };
  }

  return {
    ok: false,
    message:
      "I didn’t catch that. Try: schedule a dentist next Friday, move tomorrow’s meeting to 3 PM, or block Saturday for family.",
    events,
  };
}

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

export function searchLifeTimeline(
  entries: LifeEntry[],
  raw: string,
  now = new Date(),
): LifeSearchResult {
  const query = raw.trim();
  if (!query) {
    return {
      query,
      answer: "Ask about a job, trip, purchase, or month — Atlas keeps the full history.",
      entries: entries.slice(0, 8),
    };
  }
  const lower = query.toLowerCase();

  const monthMatch = lower.match(
    /(?:everything|what|show|happened).*(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?/,
  );
  if (monthMatch) {
    const month = MONTHS[monthMatch[1]];
    const year = monthMatch[2] ? Number(monthMatch[2]) : now.getFullYear();
    const found = entries
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .sort((a, b) => +new Date(a.date) - +new Date(b.date));
    const label = `${monthMatch[1][0].toUpperCase()}${monthMatch[1].slice(1)} ${year}`;
    return {
      query,
      answer: found.length
        ? `Here’s everything on your Life Timeline for ${label} (${found.length} ${found.length === 1 ? "entry" : "entries"}).`
        : `No Life Timeline entries for ${label} yet.`,
      entries: found,
    };
  }

  if (/jb\s*hunt|start(?:ed)?\s+work|when\s+did\s+i\s+start/.test(lower)) {
    const job = entries
      .filter((e) => e.kind === "job" && /jb\s*hunt/i.test(`${e.title} ${e.tags.join(" ")}`))
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];
    if (job) {
      return {
        query,
        answer: `You started working at JB Hunt on ${formatDayLabel(new Date(job.date))}.`,
        entries: [job],
      };
    }
  }

  if (/tire|rotated|rotation/.test(lower)) {
    const tire = entries
      .filter((e) => /tire|rotation|rotated/i.test(`${e.title} ${e.detail} ${e.tags.join(" ")}`))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
    if (tire) {
      return {
        query,
        answer: `The last time you rotated your tires was ${formatDayLabel(new Date(tire.date))}.`,
        entries: [tire],
      };
    }
  }

  const tokens = lower
    .replace(/[?“”"']/g, "")
    .split(/\s+/)
    .filter(
      (t) =>
        t.length > 2 &&
        !["when", "did", "the", "last", "time", "show", "everything", "that", "happened", "was", "working"].includes(t),
    );

  const scored = entries
    .map((entry) => {
      const hay = `${entry.title} ${entry.detail} ${entry.kind} ${entry.tags.join(" ")}`.toLowerCase();
      const score = tokens.reduce((sum, token) => sum + (hay.includes(token) ? 1 : 0), 0);
      return { entry, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || +new Date(b.entry.date) - +new Date(a.entry.date));

  if (scored.length) {
    return {
      query,
      answer: `Found ${scored.length} matching ${scored.length === 1 ? "moment" : "moments"} on your Life Timeline.`,
      entries: scored.map((row) => row.entry).slice(0, 12),
    };
  }

  return {
    query,
    answer: "No matches yet. Try JB Hunt, tire rotation, or “everything in May 2026”.",
    entries: [],
  };
}

export function lifeKindLabel(kind: LifeEntry["kind"]) {
  switch (kind) {
    case "job":
      return "Job";
    case "trip":
      return "Trip";
    case "purchase":
      return "Purchase";
    case "tax":
      return "Tax filing";
    case "medical":
      return "Medical";
    case "launch":
      return "Project launch";
    case "milestone":
      return "Milestone";
    case "birthday":
      return "Birthday";
    case "certification":
      return "Certification";
    case "vehicle":
      return "Vehicle";
    default:
      return "Life";
  }
}

export function updateSharedRequestStatus(
  requests: SharedCalendarRequest[],
  id: string,
  status: SharedCalendarRequest["status"],
) {
  return requests.map((req) => (req.id === id ? { ...req, status } : req));
}

export function assignSharedTask(
  requests: SharedCalendarRequest[],
  from: string,
  detail: string,
  now = new Date(),
): SharedCalendarRequest[] {
  return [
    {
      id: newId(),
      kind: "task",
      from,
      detail,
      status: "pending",
      createdAt: now.toISOString(),
    },
    ...requests,
  ];
}
