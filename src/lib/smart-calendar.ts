export type CalendarView = "daily" | "weekly" | "monthly" | "yearly" | "timeline" | "agenda";

export type CalendarCategory = {
  id: string;
  label: string;
  color: string;
  builtIn: boolean;
};

export type CalendarEvent = {
  id: string;
  title: string;
  categoryId: string;
  start: string;
  end: string;
  location: string;
  invitees: string[];
  notes: string;
  priority: "low" | "normal" | "high";
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

const STORAGE_KEY = "atlas-smart-calendar-v1";

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
];

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function atDay(base: Date, dayOffset: number, hour: number, minute = 0) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function seedEvents(now = new Date()): CalendarEvent[] {
  return [
    {
      id: newId(),
      title: "Team standup",
      categoryId: "meetings",
      start: atDay(now, 0, 9, 0),
      end: atDay(now, 0, 9, 30),
      location: "Zoom",
      invitees: ["Alex", "Sam"],
      notes: "Daily ops sync",
      priority: "normal",
    },
    {
      id: newId(),
      title: "Elena Brooks · drain clearing",
      categoryId: "work",
      start: atDay(now, 0, 10, 0),
      end: atDay(now, 0, 11, 30),
      location: "12 Willow St",
      invitees: ["Alex"],
      notes: "Bring cable machine",
      priority: "high",
    },
    {
      id: newId(),
      title: "CallbackFlow deep work",
      categoryId: "high-priority",
      start: atDay(now, 0, 14, 0),
      end: atDay(now, 0, 15, 0),
      location: "Office",
      invitees: [],
      notes: "Focus block — protect if possible",
      priority: "high",
    },
    {
      id: newId(),
      title: "School pickup",
      categoryId: "family",
      start: atDay(now, 0, 15, 30),
      end: atDay(now, 0, 16, 0),
      location: "Lincoln Elementary",
      invitees: [],
      notes: "",
      priority: "normal",
    },
    {
      id: newId(),
      title: "Estimate presentation prep",
      categoryId: "deadlines",
      start: atDay(now, 1, 11, 0),
      end: atDay(now, 1, 12, 0),
      location: "Office",
      invitees: ["Jamie Cole"],
      notes: "Slides still incomplete",
      priority: "high",
    },
    {
      id: newId(),
      title: "Pay vendor invoice",
      categoryId: "bills",
      start: atDay(now, 2, 9, 0),
      end: atDay(now, 2, 9, 30),
      location: "",
      invitees: [],
      notes: "Due this week",
      priority: "normal",
    },
    {
      id: newId(),
      title: "Quarterly estimated taxes",
      categoryId: "taxes",
      start: atDay(now, 5, 10, 0),
      end: atDay(now, 5, 11, 0),
      location: "",
      invitees: ["Accountant"],
      notes: "Review Atlas Tax draft first",
      priority: "high",
    },
    {
      id: newId(),
      title: "Dentist checkup",
      categoryId: "personal",
      start: atDay(now, 3, 16, 0),
      end: atDay(now, 3, 17, 0),
      location: "Bright Smile Dental",
      invitees: [],
      notes: "",
      priority: "low",
    },
    {
      id: newId(),
      title: "Drive to regional supply run",
      categoryId: "travel",
      start: atDay(now, 4, 8, 0),
      end: atDay(now, 4, 10, 30),
      location: "Depot → warehouse",
      invitees: ["Sam"],
      notes: "Heavy traffic corridor",
      priority: "normal",
    },
    {
      id: newId(),
      title: "Parent-teacher night",
      categoryId: "school",
      start: atDay(now, 6, 18, 0),
      end: atDay(now, 6, 19, 30),
      location: "Lincoln Elementary",
      invitees: [],
      notes: "",
      priority: "normal",
    },
  ];
}

export type CalendarState = {
  categories: CalendarCategory[];
  events: CalendarEvent[];
};

export function loadCalendarState(): CalendarState {
  if (typeof window === "undefined") {
    return { categories: DEFAULT_CATEGORIES, events: seedEvents() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = { categories: DEFAULT_CATEGORIES, events: seedEvents() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as CalendarState;
    return {
      categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
      events: parsed.events?.length ? parsed.events : seedEvents(),
    };
  } catch {
    return { categories: DEFAULT_CATEGORIES, events: seedEvents() };
  }
}

export function saveCalendarState(state: CalendarState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      text: `You have a ${Math.round(longGap.minutes / 60)}-hour gap this afternoon. Would you like me to schedule work on the CallbackFlow project?`,
      actionLabel: "Reserve CallbackFlow block",
      title: "CallbackFlow focus block",
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
}): CalendarEvent {
  return {
    id: newId(),
    title: input.title.trim() || "Untitled",
    categoryId: input.categoryId,
    start: input.start,
    end: input.end,
    location: input.location || "",
    invitees: input.invitees || [],
    notes: input.notes || "",
    priority: input.priority || "normal",
  };
}

export const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am–6pm
