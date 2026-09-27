import {
  getCurrentAccount,
  mutateAccountSetup,
  type NotificationSettings,
  type Result,
  type SetupProfile,
} from "@/lib/account";
import { DEFAULT_CATEGORIES, loadCalendarState, saveCalendarState } from "@/lib/smart-calendar";
import { createTask, loadTasks, saveTasks } from "@/lib/tasks";

export type AccountType = "personal" | "business";
export type { SetupProfile };

export type SetupAnswers = {
  accountType: AccountType;
  businessName: string;
  industry: string;
  timezone: string;
  taxState: string;
  goals: string[];
  calendarColors: Record<string, string>;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    desktop: boolean;
    calendar: boolean;
    tax: boolean;
    ai: boolean;
  };
  connectApps: string[];
};

export type StarterWidget = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

export type StarterDashboard = {
  accountId: string;
  accountType: AccountType;
  goals: string[];
  widgets: StarterWidget[];
  createdAt: string;
};

const DASHBOARD_KEY = "atlas-starter-dashboard-v1";

export const SETUP_GOALS = [
  "Track taxes and receipts",
  "Book and manage appointments",
  "Stay on top of tasks",
  "Talk to Atlas daily",
  "Organize files and notes",
  "Grow revenue and follow-ups",
  "Keep family and work schedules separate",
  "Prepare accountant-ready reports",
] as const;

export const SETUP_APPS = [
  { id: "google-calendar", name: "Google Calendar" },
  { id: "outlook", name: "Outlook Calendar" },
  { id: "apple-calendar", name: "Apple Calendar" },
  { id: "quickbooks", name: "QuickBooks" },
  { id: "stripe", name: "Stripe" },
  { id: "gmail", name: "Gmail" },
  { id: "slack", name: "Slack" },
  { id: "bank", name: "Bank feed (CSV)" },
] as const;

export const COLOR_CATEGORY_IDS = ["meetings", "personal", "work", "deadlines", "bills", "family"] as const;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA",
  "ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
  "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as const;

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
] as const;

export function defaultSetupProfile(completed = false): SetupProfile {
  return {
    completed,
    completedAt: completed ? new Date().toISOString() : null,
    accountType: "business",
    taxState: "TX",
    goals: [],
    calendarColors: Object.fromEntries(
      DEFAULT_CATEGORIES.slice(0, 6).map((c) => [c.id, c.color]),
    ),
  };
}

export function defaultSetupAnswers(seed?: {
  businessName?: string;
  industry?: string;
  timezone?: string;
}): SetupAnswers {
  const tz =
    seed?.timezone ||
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/Chicago");
  return {
    accountType: "business",
    businessName: seed?.businessName || "My Business",
    industry: seed?.industry || "HVAC",
    timezone: TIMEZONES.includes(tz as (typeof TIMEZONES)[number]) ? tz : "America/Chicago",
    taxState: "TX",
    goals: ["Track taxes and receipts", "Book and manage appointments", "Talk to Atlas daily"],
    calendarColors: Object.fromEntries(
      COLOR_CATEGORY_IDS.map((id) => {
        const cat = DEFAULT_CATEGORIES.find((c) => c.id === id);
        return [id, cat?.color || "#3b82f6"];
      }),
    ),
    notifications: {
      push: true,
      email: true,
      sms: false,
      desktop: true,
      calendar: true,
      tax: true,
      ai: true,
    },
    connectApps: ["google-calendar"],
  };
}

function widgetForGoal(goal: string): StarterWidget | null {
  const map: Record<string, StarterWidget> = {
    "Track taxes and receipts": {
      id: "tax",
      title: "Tax Center",
      detail: "Log income, expenses, and estimate quarterly tax.",
      href: "/app/tax",
    },
    "Book and manage appointments": {
      id: "cal",
      title: "Smart Calendar",
      detail: "Color-coded schedule with AI daily planning.",
      href: "/app/appointments",
    },
    "Stay on top of tasks": {
      id: "tasks",
      title: "Task board",
      detail: "Open work sorted by priority and due date.",
      href: "/app/tasks",
    },
    "Talk to Atlas daily": {
      id: "chat",
      title: "Ask Atlas",
      detail: "Ask Atlas about the business anytime.",
      href: "/app/ask",
    },
    "Organize files and notes": {
      id: "files",
      title: "Files",
      detail: "Upload receipts, notes, and tax documents.",
      href: "/app/files",
    },
    "Grow revenue and follow-ups": {
      id: "crm",
      title: "Customers",
      detail: "Keep leads and follow-ups in one place.",
      href: "/app/customers",
    },
    "Keep family and work schedules separate": {
      id: "layers",
      title: "Calendar layers",
      detail: "Toggle personal, business, and family views.",
      href: "/app/appointments",
    },
    "Prepare accountant-ready reports": {
      id: "export",
      title: "Import & export",
      detail: "Export CSV, PDF summaries, and accountant packs.",
      href: "/app/data",
    },
  };
  return map[goal] || null;
}

export function buildStarterDashboard(
  accountId: string,
  answers: SetupAnswers,
): StarterDashboard {
  const fromGoals = answers.goals
    .map(widgetForGoal)
    .filter((w): w is StarterWidget => Boolean(w));
  const base: StarterWidget[] = [
    {
      id: "dash",
      title: "Command Center",
      detail: "Talk to Atlas and run day-one actions.",
      href: "/app",
    },
    {
      id: "search",
      title: "Global search",
      detail: "Find events, receipts, chats, and files instantly.",
      href: "/app",
    },
    {
      id: "recovery",
      title: "Undo & recovery",
      detail: "Trash, backups, and version history when mistakes happen.",
      href: "/app/recovery",
    },
  ];
  const seen = new Set<string>();
  const widgets = [...base, ...fromGoals].filter((w) => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });
  return {
    accountId,
    accountType: answers.accountType,
    goals: answers.goals,
    widgets,
    createdAt: new Date().toISOString(),
  };
}

export function saveStarterDashboard(dashboard: StarterDashboard) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DASHBOARD_KEY, JSON.stringify(dashboard));
}

export function loadStarterDashboard(accountId?: string): StarterDashboard | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DASHBOARD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StarterDashboard;
    if (accountId && parsed.accountId !== accountId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function applyCalendarColors(colors: Record<string, string>) {
  const state = loadCalendarState();
  const categories = state.categories.map((cat) =>
    colors[cat.id] ? { ...cat, color: colors[cat.id] } : cat,
  );
  saveCalendarState({ ...state, categories });
}

function seedStarterTasks(answers: SetupAnswers) {
  const tasks = loadTasks();
  const extras = [
    createTask({
      title: answers.accountType === "business" ? "Finish Atlas setup checklist" : "Review personal Atlas dashboard",
      notes: "Generated during first-time setup",
      priority: "high",
      category: "Atlas",
    }),
    createTask({
      title: `Confirm tax state (${answers.taxState})`,
      notes: "Used for Tax Center estimates",
      priority: "normal",
      category: "Tax",
    }),
    ...answers.goals.slice(0, 2).map((goal) =>
      createTask({
        title: `Get started: ${goal}`,
        notes: "Starter goal from setup",
        priority: "normal",
        category: "Goals",
      }),
    ),
  ];
  saveTasks([...extras, ...tasks].slice(0, 40));
}

export function completeFirstTimeSetup(answers: SetupAnswers): Result {
  const account = getCurrentAccount();
  if (!account) return { ok: false, error: "You’re not signed in." };

  const notificationPatch: Partial<NotificationSettings> = {
    push: answers.notifications.push,
    email: answers.notifications.email,
    sms: answers.notifications.sms,
    desktop: answers.notifications.desktop,
    categories: {
      ...account.notifications.categories,
      ai: answers.notifications.ai,
      billing: answers.notifications.tax,
      team: answers.notifications.calendar,
      security: true,
      marketing: false,
    },
  };

  const result = mutateAccountSetup({
    accountType: answers.accountType,
    businessName:
      answers.accountType === "personal"
        ? answers.businessName.trim() || "Personal"
        : answers.businessName.trim() || "My Business",
    industry: answers.industry,
    timezone: answers.timezone,
    taxState: answers.taxState,
    goals: answers.goals,
    calendarColors: answers.calendarColors,
    notifications: notificationPatch,
    connectApps: answers.connectApps,
  });

  if (!result.ok) return result;

  applyCalendarColors(answers.calendarColors);
  seedStarterTasks(answers);
  saveStarterDashboard(buildStarterDashboard(result.account.id, answers));
  return result;
}
