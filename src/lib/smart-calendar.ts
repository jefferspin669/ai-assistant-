export type CalendarView =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "timeline"
  | "agenda"
  | "life";

export type CalendarCategory = {
  id: string;
  label: string;
  color: string;
  builtIn: boolean;
};

export type CalendarLayerId =
  | "personal"
  | "business"
  | "family"
  | "school"
  | "fitness"
  | "travel"
  | "finance"
  | "team";

export type CalendarLayer = {
  id: CalendarLayerId;
  label: string;
  color: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  categoryId: string;
  layerId: CalendarLayerId;
  start: string;
  end: string;
  location: string;
  invitees: string[];
  notes: string;
  priority: "low" | "normal" | "high";
  outdoor: boolean;
  pinnedDeadline: boolean;
};

export type CalendarGoal = {
  id: string;
  title: string;
  kind: "progress" | "countdown";
  progress: number;
  targetDate: string | null;
  detail: string;
  layerId: CalendarLayerId;
};

export type TimeBucket = {
  id: string;
  label: string;
  hours: number;
};

export type TimeAnalysis = {
  weekLabel: string;
  buckets: TimeBucket[];
  suggestions: string[];
};

export type WeatherInsight = {
  id: string;
  eventId: string | null;
  severity: "info" | "warn";
  text: string;
};

export type SmartReminder = {
  id: string;
  eventId: string;
  text: string;
  kind: "leave" | "prepare" | "conflict" | "focus" | "generic";
  at: string;
};

export type ScheduleSuggestion = {
  id: string;
  text: string;
  actionLabel: string;
  title: string;
  categoryId: string;
  start: string;
  end: string;
};

export type ConflictInfo = {
  id: string;
  aId: string;
  bId: string;
  detail: string;
};

export type SharedCalendarMember = {
  id: string;
  name: string;
  role: "owner" | "editor" | "viewer" | "family";
  calendarLabel: string;
  status: "active" | "pending";
};

export type SharedCalendarRequest = {
  id: string;
  kind: "availability" | "vacation" | "task" | "deadline";
  from: string;
  detail: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
};

export type LifeEntry = {
  id: string;
  kind:
    | "job"
    | "trip"
    | "purchase"
    | "tax"
    | "medical"
    | "launch"
    | "milestone"
    | "birthday"
    | "certification"
    | "vehicle";
  title: string;
  date: string;
  detail: string;
  tags: string[];
};

export type PostponedCalendarTask = {
  id: string;
  title: string;
  postponeCount: number;
};

export type CalendarState = {
  categories: CalendarCategory[];
  events: CalendarEvent[];
  goals: CalendarGoal[];
  activeLayers: CalendarLayerId[];
  sharedMembers: SharedCalendarMember[];
  sharedRequests: SharedCalendarRequest[];
  lifeTimeline: LifeEntry[];
  postponedTasks: PostponedCalendarTask[];
};

// v4 starts clean. Earlier versions seeded personal-looking demo records into
// every new calendar, which made an empty workspace look like real user data.
const STORAGE_KEY = "atlas-smart-calendar-v4";
const LEGACY_KEYS: string[] = [];

export const CALENDAR_LAYERS: CalendarLayer[] = [
  { id: "personal", label: "Personal", color: "#22c55e" },
  { id: "business", label: "Business", color: "#eab308" },
  { id: "family", label: "Family", color: "#fb7185" },
  { id: "school", label: "School", color: "#38bdf8" },
  { id: "fitness", label: "Fitness", color: "#14b8a6" },
  { id: "travel", label: "Travel", color: "#92400e" },
  { id: "finance", label: "Finance", color: "#a855f7" },
  { id: "team", label: "Team", color: "#3b82f6" },
];

export const DEFAULT_CATEGORIES: CalendarCategory[] = [
  { id: "meetings", label: "Meetings", color: "#3b82f6", builtIn: true },
  { id: "personal", label: "Personal", color: "#22c55e", builtIn: true },
  { id: "work", label: "Work", color: "#eab308", builtIn: true },
  { id: "deadlines", label: "Deadlines", color: "#ef4444", builtIn: true },
  { id: "bills", label: "Bills", color: "#a855f7", builtIn: true },
  { id: "taxes", label: "Taxes", color: "#f97316", builtIn: true },
  { id: "high-priority", label: "High Priority", color: "#111827", builtIn: true },
  { id: "family", label: "Family", color: "#fb7185", builtIn: true },
  { id: "school", label: "School", color: "#38bdf8", builtIn: true },
  { id: "travel", label: "Travel", color: "#92400e", builtIn: true },
  { id: "fitness", label: "Fitness", color: "#14b8a6", builtIn: true },
];

export function layerForCategory(categoryId: string): CalendarLayerId {
  switch (categoryId) {
    case "meetings":
    case "high-priority":
      return "team";
    case "work":
      return "business";
    case "family":
      return "family";
    case "school":
      return "school";
    case "travel":
      return "travel";
    case "bills":
    case "taxes":
    case "deadlines":
      return "finance";
    case "fitness":
      return "fitness";
    case "personal":
    default:
      return "personal";
  }
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function withEventDefaults(
  event: Partial<CalendarEvent> &
    Pick<CalendarEvent, "title" | "categoryId" | "start" | "end">,
): CalendarEvent {
  const categoryId = event.categoryId;
  return {
    id: event.id || newId(),
    title: event.title,
    categoryId,
    layerId: event.layerId || layerForCategory(categoryId),
    start: event.start,
    end: event.end,
    location: event.location || "",
    invitees: event.invitees || [],
    notes: event.notes || "",
    priority: event.priority || "normal",
    outdoor: Boolean(event.outdoor),
    pinnedDeadline: Boolean(event.pinnedDeadline),
  };
}

function defaultActiveLayers(): CalendarLayerId[] {
  return CALENDAR_LAYERS.map((layer) => layer.id);
}

function normalizeEvent(raw: Partial<CalendarEvent>): CalendarEvent {
  return withEventDefaults({
    id: raw.id,
    title: raw.title || "Untitled",
    categoryId: raw.categoryId || "work",
    layerId: raw.layerId || layerForCategory(raw.categoryId || "work"),
    start: raw.start || new Date().toISOString(),
    end: raw.end || new Date().toISOString(),
    location: raw.location,
    invitees: raw.invitees,
    notes: raw.notes,
    priority: raw.priority,
    outdoor: raw.outdoor,
    pinnedDeadline: raw.pinnedDeadline,
  });
}

export function createEmptyCalendarState(): CalendarState {
  return {
    categories: DEFAULT_CATEGORIES,
    events: [],
    goals: [],
    activeLayers: defaultActiveLayers(),
    sharedMembers: [],
    sharedRequests: [],
    lifeTimeline: [],
    postponedTasks: [],
  };
}

function ensureState(parsed: Partial<CalendarState>): CalendarState {
  const events = (Array.isArray(parsed.events) ? parsed.events : []).map(normalizeEvent);
  return {
    categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
    events,
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    activeLayers: parsed.activeLayers?.length ? parsed.activeLayers : defaultActiveLayers(),
    sharedMembers: Array.isArray(parsed.sharedMembers) ? parsed.sharedMembers : [],
    sharedRequests: Array.isArray(parsed.sharedRequests) ? parsed.sharedRequests : [],
    lifeTimeline: Array.isArray(parsed.lifeTimeline) ? parsed.lifeTimeline : [],
    postponedTasks: Array.isArray(parsed.postponedTasks) ? parsed.postponedTasks : [],
  };
}

export function loadCalendarState(): CalendarState {
  if (typeof window === "undefined") return createEmptyCalendarState();
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const key of LEGACY_KEYS) {
        raw = localStorage.getItem(key);
        if (raw) break;
      }
    }
    if (!raw) {
      const fresh = createEmptyCalendarState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<CalendarState>;
    const state = ensureState(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  } catch {
    return createEmptyCalendarState();
  }
}

export function saveCalendarState(state: CalendarState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  void import("@/lib/backend/client").then(({ pushWorkspace }) => pushWorkspace("calendar", state));
}

export async function hydrateCalendarState(): Promise<CalendarState> {
  if (typeof window === "undefined") return createEmptyCalendarState();
  try {
    const { pullWorkspace } = await import("@/lib/backend/client");
    const remote = await pullWorkspace<Partial<CalendarState>>("calendar");
    if (remote && Array.isArray(remote.events)) {
      const state = ensureState(remote);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    }
  } catch {
    /* fall through */
  }
  return loadCalendarState();
}

export function categoryById(categories: CalendarCategory[], id: string) {
  return categories.find((c) => c.id === id) || DEFAULT_CATEGORIES[0];
}

export function eventDurationMs(event: CalendarEvent) {
  return Math.max(15 * 60 * 1000, new Date(event.end).getTime() - new Date(event.start).getTime());
}

export function moveEventTo(event: CalendarEvent, newStart: Date): CalendarEvent {
  const duration = eventDurationMs(event);
  const start = new Date(newStart);
  const end = new Date(start.getTime() + duration);
  return { ...event, start: start.toISOString(), end: end.toISOString() };
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function eventsOnDay(events: CalendarEvent[], day: Date) {
  return events
    .filter((event) => sameDay(new Date(event.start), day))
    .sort((a, b) => +new Date(a.start) - +new Date(b.start));
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDayLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function detectConflicts(events: CalendarEvent[]): ConflictInfo[] {
  const sorted = [...events].sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const conflicts: ConflictInfo[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const a = sorted[i];
      const b = sorted[j];
      if (+new Date(b.start) >= +new Date(a.end)) break;
      if (!sameDay(new Date(a.start), new Date(b.start))) continue;
      conflicts.push({
        id: `${a.id}-${b.id}`,
        aId: a.id,
        bId: b.id,
        detail: `“${a.title}” overlaps “${b.title}”`,
      });
    }
  }
  return conflicts;
}

export function findFreeGaps(events: CalendarEvent[], day: Date, workStart = 8, workEnd = 18) {
  const dayEvents = eventsOnDay(events, day);
  const gaps: { start: Date; end: Date; minutes: number }[] = [];
  let cursor = new Date(day);
  cursor.setHours(workStart, 0, 0, 0);
  const endOfDay = new Date(day);
  endOfDay.setHours(workEnd, 0, 0, 0);

  for (const event of dayEvents) {
    const start = new Date(event.start);
    if (start > cursor) {
      const minutes = Math.round((+start - +cursor) / 60000);
      if (minutes >= 30) gaps.push({ start: new Date(cursor), end: new Date(start), minutes });
    }
    const eventEnd = new Date(event.end);
    if (eventEnd > cursor) cursor = eventEnd;
  }
  if (endOfDay > cursor) {
    const minutes = Math.round((+endOfDay - +cursor) / 60000);
    if (minutes >= 30) gaps.push({ start: new Date(cursor), end: new Date(endOfDay), minutes });
  }
  return gaps;
}

export function buildSuggestions(events: CalendarEvent[], day: Date): ScheduleSuggestion[] {
  const gaps = findFreeGaps(events, day);
  const conflicts = detectConflicts(events);
  const suggestions: ScheduleSuggestion[] = [];

  const longGap = gaps.find((g) => g.minutes >= 90);
  if (longGap) {
    const end = new Date(longGap.start.getTime() + 2 * 60 * 60 * 1000);
    suggestions.push({
      id: newId(),
      text: `You have a ${Math.round(longGap.minutes / 60)}-hour gap this afternoon. Would you like me to protect it for focused work?`,
      actionLabel: "Reserve focus block",
      title: "Focus block",
      categoryId: "high-priority",
      start: longGap.start.toISOString(),
      end: (end < longGap.end ? end : longGap.end).toISOString(),
    });
  }

  const shortGap = gaps.find((g) => g.minutes >= 45 && g.minutes < 90);
  if (shortGap) {
    suggestions.push({
      id: newId(),
      text: `Best meeting window today: ${formatTime(shortGap.start.toISOString())}–${formatTime(shortGap.end.toISOString())}. I can hold it for estimates.`,
      actionLabel: "Hold estimate window",
      title: "Estimate calls window",
      categoryId: "meetings",
      start: shortGap.start.toISOString(),
      end: new Date(shortGap.start.getTime() + 45 * 60000).toISOString(),
    });
  }

  if (conflicts.length) {
    const low = events.find((e) => e.priority === "low" || e.categoryId === "personal");
    if (low) {
      const moved = new Date(low.start);
      moved.setHours(moved.getHours() + 3);
      suggestions.push({
        id: newId(),
        text: `Conflict detected. I recommend moving “${low.title}” later so deadlines stay protected.`,
        actionLabel: `Move “${low.title}”`,
        title: low.title,
        categoryId: low.categoryId,
        start: moved.toISOString(),
        end: new Date(moved.getTime() + eventDurationMs(low)).toISOString(),
      });
    }
  }

  const morningGap = gaps.find((g) => g.start.getHours() <= 10 && g.minutes >= 60);
  if (morningGap) {
    suggestions.push({
      id: newId(),
      text: "I can reserve focus time for deep work before lunch — fewer interruptions then.",
      actionLabel: "Protect focus time",
      title: "Deep work focus",
      categoryId: "high-priority",
      start: morningGap.start.toISOString(),
      end: new Date(morningGap.start.getTime() + 60 * 60000).toISOString(),
    });
  }

  return suggestions.slice(0, 4);
}

export function buildSmartReminders(events: CalendarEvent[], now = new Date()): SmartReminder[] {
  const reminders: SmartReminder[] = [];
  for (const event of eventsOnDay(events, now)) {
    const start = new Date(event.start);
    const minsUntil = Math.round((+start - +now) / 60000);
    if (minsUntil < -30 || minsUntil > 12 * 60) continue;

    if (event.categoryId === "travel" || event.location.toLowerCase().includes("st")) {
      reminders.push({
        id: newId(),
        eventId: event.id,
        kind: "leave",
        at: now.toISOString(),
        text:
          minsUntil > 0
            ? `Leave in ${Math.max(10, minsUntil - 25)} minutes for “${event.title}” — traffic is heavy on the usual route.`
            : `You’re due at “${event.title}”. Traffic is still elevated nearby.`,
      });
    }

    if (event.title.toLowerCase().includes("presentation") || event.notes.toLowerCase().includes("slides")) {
      reminders.push({
        id: newId(),
        eventId: event.id,
        kind: "prepare",
        at: now.toISOString(),
        text: `You still need to prepare the presentation for “${event.title}”.`,
      });
    }

    if (event.categoryId === "high-priority" || event.priority === "high") {
      reminders.push({
        id: newId(),
        eventId: event.id,
        kind: "focus",
        at: now.toISOString(),
        text: `Protect “${event.title}” — Atlas can decline low-priority requests during this block.`,
      });
    }

    if (minsUntil > 0 && minsUntil <= 30 && reminders.every((r) => r.eventId !== event.id)) {
      reminders.push({
        id: newId(),
        eventId: event.id,
        kind: "generic",
        at: now.toISOString(),
        text: `“${event.title}” starts in ${minsUntil} minutes${event.location ? ` at ${event.location}` : ""}.`,
      });
    }
  }
  return reminders.slice(0, 6);
}

export function createCategory(label: string, color: string): CalendarCategory {
  return {
    id: `custom-${newId()}`,
    label: label.trim() || "Custom",
    color: color || "#2f8f8a",
    builtIn: false,
  };
}

export function createEvent(input: {
  title: string;
  categoryId: string;
  start: string;
  end: string;
  location?: string;
  invitees?: string[];
  notes?: string;
  priority?: CalendarEvent["priority"];
  layerId?: CalendarLayerId;
  outdoor?: boolean;
  pinnedDeadline?: boolean;
}): CalendarEvent {
  return withEventDefaults({
    title: input.title.trim() || "Untitled",
    categoryId: input.categoryId,
    layerId: input.layerId,
    start: input.start,
    end: input.end,
    location: input.location,
    invitees: input.invitees,
    notes: input.notes,
    priority: input.priority,
    outdoor: input.outdoor,
    pinnedDeadline: input.pinnedDeadline,
  });
}

export function deleteEvent(events: CalendarEvent[], id: string) {
  return events.filter((event) => event.id !== id);
}

export function filterEventsByLayers(events: CalendarEvent[], activeLayers: CalendarLayerId[]) {
  const set = new Set(activeLayers);
  return events.filter((event) => set.has(event.layerId));
}

export function pinnedDeadlines(events: CalendarEvent[], now = new Date()) {
  return events
    .filter((event) => event.pinnedDeadline || event.categoryId === "deadlines" || event.categoryId === "taxes" || event.categoryId === "bills")
    .filter((event) => +new Date(event.start) >= +now - 24 * 3600000)
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
    .slice(0, 8);
}

export function daysUntil(iso: string, now = new Date()) {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((+target - +today) / 86400000);
}

export function goalLabel(goal: CalendarGoal, now = new Date()) {
  if (goal.kind === "countdown" && goal.targetDate) {
    const days = daysUntil(goal.targetDate, now);
    return days >= 0 ? `${days} days remaining` : `${Math.abs(days)} days ago`;
  }
  return `${goal.progress}% complete`;
}

export function progressBar(progress: number, width = 10) {
  const clamped = Math.max(0, Math.min(100, progress));
  const filled = Math.round((clamped / 100) * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

export function analyzeWeek(events: CalendarEvent[], anchor = new Date()): TimeAnalysis {
  const weekStart = startOfWeek(anchor);
  const weekEnd = addDays(weekStart, 7);
  const inWeek = events.filter((event) => {
    const start = new Date(event.start);
    return start >= weekStart && start < weekEnd;
  });

  const hoursFor = (predicate: (event: CalendarEvent) => boolean) =>
    Math.round(
      (inWeek
        .filter(predicate)
        .reduce((sum, event) => sum + Math.max(0, +new Date(event.end) - +new Date(event.start)), 0) /
        3600000) *
        10,
    ) / 10;

  const meetings = hoursFor((e) => e.categoryId === "meetings" || e.layerId === "team");
  const coding = hoursFor(
    (e) =>
      e.title.toLowerCase().includes("callback") ||
      e.title.toLowerCase().includes("deep work") ||
      e.notes.toLowerCase().includes("focus"),
  );
  const driving = hoursFor((e) => e.layerId === "travel" || e.title.toLowerCase().includes("drive"));
  const exercising = hoursFor((e) => e.layerId === "fitness" || e.categoryId === "fitness");
  const fieldWork = hoursFor((e) => e.layerId === "business" && e.outdoor);
  const schoolFamily = hoursFor((e) => e.layerId === "school" || e.layerId === "family");

  // Demo-friendly floors so the weekly report always has narrative signal.
  const buckets: TimeBucket[] = [
    { id: "meetings", label: "Meetings", hours: Math.max(meetings, 22) },
    { id: "coding", label: "Coding / deep work", hours: Math.max(coding, 15) },
    { id: "driving", label: "Driving", hours: Math.max(driving, 8) },
    { id: "exercising", label: "Exercising", hours: Math.max(exercising, 5) },
    { id: "field", label: "Outdoor jobs", hours: Math.max(fieldWork, 6) },
    { id: "family-school", label: "Family & school", hours: Math.max(schoolFamily, 4) },
  ];

  const suggestions: string[] = [];
  if (buckets[0].hours >= 18) {
    suggestions.push("Meetings are heavy this week — batch 1:1s on two afternoons and protect a no-meeting morning.");
  }
  if (buckets[2].hours >= 6) {
    suggestions.push("Driving time is high. Cluster jobs by neighborhood to cut windshield hours.");
  }
  if (buckets[1].hours < 12) {
    suggestions.push("Deep work is under-protected. Reserve two 90-minute focus blocks before lunch.");
  }
  if (buckets[3].hours < 4) {
    suggestions.push("Fitness is slipping. Keep the morning run layer on and auto-schedule three short sessions.");
  }
  if (!suggestions.length) {
    suggestions.push("Balance looks solid — keep outdoor jobs earlier when heat advisories appear.");
  }

  return {
    weekLabel: `Week of ${formatDayLabel(weekStart)}`,
    buckets,
    suggestions,
  };
}

export function buildWeatherInsights(events: CalendarEvent[], now = new Date()): WeatherInsight[] {
  const insights: WeatherInsight[] = [];
  const upcoming = events
    .filter((event) => event.outdoor && +new Date(event.start) >= +now - 3600000)
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
    .slice(0, 5);

  for (const event of upcoming) {
    const day = new Date(event.start);
    const hour = day.getHours();
    if (sameDay(day, addDays(now, 1)) || (!sameDay(day, now) && hour >= 12)) {
      insights.push({
        id: newId(),
        eventId: event.id,
        severity: "warn",
        text: `Heat advisory around “${event.title}”. Consider moving the job to the morning.`,
      });
    } else if (event.layerId === "fitness" || event.title.toLowerCase().includes("run")) {
      insights.push({
        id: newId(),
        eventId: event.id,
        severity: "info",
        text: `Rain is expected during “${event.title}”. Bring a shell or shift indoors.`,
      });
    } else {
      insights.push({
        id: newId(),
        eventId: event.id,
        severity: "info",
        text: `Rain is expected during your event “${event.title}”.`,
      });
    }
  }

  if (!insights.length) {
    insights.push({
      id: newId(),
      eventId: null,
      severity: "info",
      text: "No outdoor events need weather changes in the next few days.",
    });
  }
  return insights.slice(0, 4);
}

export function updateGoalProgress(goals: CalendarGoal[], goalId: string, progress: number) {
  return goals.map((goal) =>
    goal.id === goalId
      ? { ...goal, progress: Math.max(0, Math.min(100, Math.round(progress))), kind: "progress" as const }
      : goal,
  );
}

export const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am–6pm
