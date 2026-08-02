export type SupportArticle = {
  id: string;
  category: string;
  title: string;
  body: string;
};

export type SupportTicketKind = "support" | "bug" | "feature" | "recovery";

export type SupportTicket = {
  id: string;
  kind: SupportTicketKind;
  subject: string;
  detail: string;
  status: "open" | "atlas_replied" | "escalated" | "resolved";
  at: string;
  thread: { role: "user" | "atlas" | "human"; text: string; at: string }[];
};

export type SupportTutorial = {
  id: string;
  title: string;
  steps: string[];
  href: string;
};

const TICKETS_KEY = "atlas-support-tickets-v1";

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

export const HELP_ARTICLES: SupportArticle[] = [
  {
    id: "setup",
    category: "Getting started",
    title: "Finish first-time setup",
    body: "After signup, open First-time setup to choose personal or business, tax state, goals, colors, and apps. Atlas builds your starter dashboard automatically.",
  },
  {
    id: "confirm",
    category: "Safety",
    title: "Why does Atlas ask for confirmation?",
    body: "Risky actions like sending money, filing taxes, or removing teammates never run immediately. Review the summary and impact, then confirm.",
  },
  {
    id: "offline",
    category: "Reliability",
    title: "Working without internet",
    body: "Calendar, tasks, notes, recent chats, and important documents stay available offline. Changes queue and sync when you reconnect.",
  },
  {
    id: "export",
    category: "Data",
    title: "Export accountant-ready reports",
    body: "Open Import & export to download CSV, Excel, calendar files, or an accountant pack with income, expenses, and summary totals.",
  },
  {
    id: "recovery",
    category: "Safety",
    title: "Undo a mistake",
    body: "Use Undo & recovery for trash, version history, and backups. Example: restore yesterday’s calendar version after a bulk change.",
  },
];

export const TUTORIALS: SupportTutorial[] = [
  {
    id: "cal",
    title: "Add your first appointment",
    steps: ["Open Calendar", "Choose a color category", "Add title and time", "Save"],
    href: "/app/appointments",
  },
  {
    id: "tax",
    title: "Log a receipt",
    steps: ["Open Tax Center", "Add an expense", "Attach a receipt name", "Review estimate"],
    href: "/app/tax",
  },
  {
    id: "capture",
    title: "Turn a note into a task",
    steps: ["Open Quick capture", "Save a text note", "Click → Task", "Find it on the task board"],
    href: "/app/notes",
  },
];

export const SERVICE_COMPONENTS = [
  { name: "App shell", status: "operational" as const, detail: "Serving normally" },
  { name: "Local vault", status: "operational" as const, detail: "Browser storage OK" },
  { name: "AI chat", status: "operational" as const, detail: "Healthy" },
  { name: "Sync", status: "degraded" as const, detail: "Demo multi-device sync" },
  { name: "Payments", status: "operational" as const, detail: "Local simulation" },
  { name: "Email / SMS", status: "maintenance" as const, detail: "Prototype toggles" },
];

export function loadTickets(): SupportTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SupportTicket[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTickets(tickets: SupportTicket[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets.slice(0, 40)));
}

function atlasFirstReply(kind: SupportTicketKind, subject: string, detail: string) {
  const q = `${subject} ${detail}`.toLowerCase();
  if (kind === "recovery" || q.includes("recover") || q.includes("password")) {
    return {
      text: "I can help with account recovery. Try Forgot password on the login page, or use your recovery codes from Undo & recovery. If that fails, I’ll escalate to a person.",
      escalate: /codes lost|hacked|locked out permanently/.test(q),
    };
  }
  if (kind === "bug" || q.includes("error") || q.includes("crash")) {
    return {
      text: "Thanks for the bug report. Atlas keeps technical details in the error log for engineers, while you only see friendly messages. I’ve saved this ticket — escalate if it keeps happening.",
      escalate: q.includes("keeps happening") || q.includes("urgent"),
    };
  }
  if (kind === "feature") {
    return {
      text: "Got it — feature request logged. The product team reviews these weekly. Want me to also open a human follow-up?",
      escalate: false,
    };
  }
  const article = HELP_ARTICLES.find((a) => q.includes(a.title.toLowerCase().split(" ")[0]!));
  if (article) {
    return {
      text: `Here’s what usually helps: ${article.body} If that doesn’t solve it, I can pass you to a person.`,
      escalate: false,
    };
  }
  return {
    text: "I checked common fixes for that. Try refreshing the page, confirming you’re online, and checking Undo & recovery if data looks missing. Say “talk to a person” if you want a human.",
    escalate: q.includes("talk to a person") || q.includes("human"),
  };
}

export function createTicket(input: {
  kind: SupportTicketKind;
  subject: string;
  detail: string;
}): SupportTicket {
  const stamp = nowIso();
  const reply = atlasFirstReply(input.kind, input.subject, input.detail);
  const ticket: SupportTicket = {
    id: newId("tkt"),
    kind: input.kind,
    subject: input.subject.trim() || "Support request",
    detail: input.detail.trim(),
    status: reply.escalate ? "escalated" : "atlas_replied",
    at: stamp,
    thread: [
      { role: "user", text: input.detail.trim() || input.subject, at: stamp },
      {
        role: reply.escalate ? "human" : "atlas",
        text: reply.escalate
          ? `${reply.text} A teammate will follow up shortly.`
          : reply.text,
        at: stamp,
      },
    ],
  };
  saveTickets([ticket, ...loadTickets()]);
  return ticket;
}

export function escalateTicket(id: string) {
  const tickets = loadTickets();
  const next = tickets.map((t) =>
    t.id === id
      ? {
          ...t,
          status: "escalated" as const,
          thread: [
            ...t.thread,
            {
              role: "human" as const,
              text: "A person from Atlas support has joined. We’ll follow up from here.",
              at: nowIso(),
            },
          ],
        }
      : t,
  );
  saveTickets(next);
  return next.find((t) => t.id === id) || null;
}

export function answerSupportQuestion(question: string) {
  const q = question.toLowerCase();
  const article =
    HELP_ARTICLES.find((a) => q.includes(a.id) || a.title.toLowerCase().includes(q.slice(0, 12))) ||
    HELP_ARTICLES.find((a) => a.body.toLowerCase().includes(q.split(" ")[0] || "setup")) ||
    HELP_ARTICLES[0];
  return {
    answer: article.body,
    article,
    suggestHuman: /speak to|talk to|person|human|agent/.test(q),
  };
}
