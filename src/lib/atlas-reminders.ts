/** Employee reminders — Atlas nudges without the boss chasing everyone. */

import { loadMeetings, type UserMeeting } from "./surface-workspace";
import { loadTeamMembers, loadTeamTasks, isOpenTask, type TeamPerson } from "./user-workspace";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export type ReminderRule = {
  id: string;
  label: string;
  minutesBefore: number;
  enabled: boolean;
};

export type AtlasReminder = {
  id: string;
  memberId: string;
  title: string;
  body: string;
  dueAt: string;
  kind: "task" | "meeting" | "comment" | "overdue" | "manager";
  relatedId?: string;
  dismissed: boolean;
  createdAt: string;
};

const RULES_KEY = "atlas-reminder-rules-v1";
const REMINDERS_KEY = "atlas-reminders-v1";

export const DEFAULT_REMINDER_RULES: ReminderRule[] = [
  { id: "1d", label: "1 day before", minutesBefore: 24 * 60, enabled: true },
  { id: "1h", label: "1 hour before", minutesBefore: 60, enabled: true },
  { id: "15m", label: "15 minutes before", minutesBefore: 15, enabled: true },
  { id: "now", label: "Meeting starting now", minutesBefore: 0, enabled: true },
];

export function loadReminderRules(): ReminderRule[] {
  const saved = loadJson<ReminderRule[]>(RULES_KEY, []);
  return saved.length ? saved : DEFAULT_REMINDER_RULES;
}

export function saveReminderRules(rules: ReminderRule[]) {
  saveJson(RULES_KEY, rules);
}

export function loadAtlasReminders(): AtlasReminder[] {
  return loadJson(REMINDERS_KEY, []);
}

export function saveAtlasReminders(items: AtlasReminder[]) {
  saveJson(REMINDERS_KEY, items);
}

function memberByName(name: string, members: TeamPerson[]): TeamPerson | null {
  const first = name.trim().toLowerCase().split(/\s+/)[0];
  return members.find((m) => m.name.toLowerCase().startsWith(first)) ?? null;
}

export function generateEmployeeReminders(now = Date.now()): AtlasReminder[] {
  const members = loadTeamMembers();
  const tasks = loadTeamTasks();
  const meetings = loadMeetings();
  const existing = loadAtlasReminders();
  const out: AtlasReminder[] = [...existing];

  for (const member of members) {
    const mine = tasks.filter((t) => t.memberId === member.id);
    for (const task of mine) {
      if (!isOpenTask(task.status)) continue;
      const due = task.dueDate?.slice(0, 10);
      if (!due) continue;
      const dueMs = new Date(`${due}T09:00:00`).getTime();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      if (due === tomorrowStr) {
        const id = `task-tmr-${task.id}`;
        if (!out.some((r) => r.id === id)) {
          out.push({
            id,
            memberId: member.id,
            title: "Due tomorrow",
            body: `Your “${task.title}” is due tomorrow.`,
            dueAt: nowIso(),
            kind: "task",
            relatedId: task.id,
            dismissed: false,
            createdAt: nowIso(),
          });
        }
      }
      if (dueMs < now && task.status !== "completed") {
        const id = `task-od-${task.id}`;
        if (!out.some((r) => r.id === id)) {
          out.push({
            id,
            memberId: member.id,
            title: "Task overdue",
            body: `Task “${task.title}” is overdue.`,
            dueAt: nowIso(),
            kind: "overdue",
            relatedId: task.id,
            dismissed: false,
            createdAt: nowIso(),
          });
        }
      }
    }
  }

  for (const meeting of meetings) {
    if (!meeting.date || meeting.status === "ended") continue;
    const startMs = new Date(`${meeting.date}T${meeting.startTime || "09:00"}:00`).getTime();
    const rules = meeting.reminderRules ?? loadReminderRules();
    for (const rule of rules.filter((r) => r.enabled)) {
      const triggerAt = startMs - rule.minutesBefore * 60_000;
      if (now >= triggerAt && now < startMs + 5 * 60_000) {
        for (const attendee of meeting.attendees) {
          const member = memberByName(attendee, members);
          if (!member) continue;
          const id = `meet-${meeting.id}-${rule.id}`;
          if (out.some((r) => r.id === id)) continue;
          const mins = rule.minutesBefore;
          out.push({
            id,
            memberId: member.id,
            title: mins === 0 ? "Meeting starting now" : `${rule.label}`,
            body:
              mins === 0
                ? `${meeting.title} is starting now.`
                : `${mins} minutes until ${meeting.title}`,
            dueAt: nowIso(),
            kind: "meeting",
            relatedId: meeting.id,
            dismissed: false,
            createdAt: nowIso(),
          });
        }
      }
    }
  }

  saveAtlasReminders(out);
  return out;
}

export function remindersForMember(memberId: string): AtlasReminder[] {
  return generateEmployeeReminders().filter((r) => r.memberId === memberId && !r.dismissed);
}

export function dismissReminder(id: string) {
  saveAtlasReminders(
    loadAtlasReminders().map((r) => (r.id === id ? { ...r, dismissed: true } : r)),
  );
}

export function notifyManagerComment(memberId: string, projectName: string, managerName = "Manager") {
  const reminder: AtlasReminder = {
    id: newId("rem"),
    memberId,
    title: "New comment",
    body: `Your manager added a comment to ${projectName}.`,
    dueAt: nowIso(),
    kind: "manager",
    dismissed: false,
    createdAt: nowIso(),
  };
  saveAtlasReminders([reminder, ...loadAtlasReminders()]);
}
