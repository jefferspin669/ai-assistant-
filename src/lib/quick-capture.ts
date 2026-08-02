import { createContact, loadContacts, saveContacts } from "@/lib/contacts";
import { loadCalendarState, saveCalendarState } from "@/lib/smart-calendar";
import { createTask, loadTasks, saveTasks } from "@/lib/tasks";

export type CaptureKind = "text" | "voice" | "photo" | "checklist" | "link" | "idea";

export type CaptureNote = {
  id: string;
  kind: CaptureKind;
  title: string;
  body: string;
  checklist: { id: string; text: string; done: boolean }[];
  linkUrl: string | null;
  photoName: string | null;
  voiceSeconds: number | null;
  createdAt: string;
  updatedAt: string;
  convertedTo: { type: "task" | "event" | "customer" | "reminder"; id: string; label: string } | null;
};

const STORAGE_KEY = "atlas-quick-capture-v1";

function newId(prefix = "note") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function seedCaptures(): CaptureNote[] {
  const stamp = nowIso();
  return [
    {
      id: newId(),
      kind: "idea",
      title: "Offer evening maintenance slots",
      body: "Two customers asked for 6–8pm windows this week.",
      checklist: [],
      linkUrl: null,
      photoName: null,
      voiceSeconds: null,
      createdAt: stamp,
      updatedAt: stamp,
      convertedTo: null,
    },
    {
      id: newId(),
      kind: "checklist",
      title: "Truck restock",
      body: "",
      checklist: [
        { id: newId("chk"), text: "Filters", done: true },
        { id: newId("chk"), text: "Fittings", done: false },
        { id: newId("chk"), text: "Sealant", done: false },
      ],
      linkUrl: null,
      photoName: null,
      voiceSeconds: null,
      createdAt: stamp,
      updatedAt: stamp,
      convertedTo: null,
    },
    {
      id: newId(),
      kind: "link",
      title: "Competitor pricing page",
      body: "Compare tune-up packages before spring campaign.",
      checklist: [],
      linkUrl: "https://example.com/pricing",
      photoName: null,
      voiceSeconds: null,
      createdAt: stamp,
      updatedAt: stamp,
      convertedTo: null,
    },
  ];
}

export function loadCaptures(): CaptureNote[] {
  if (typeof window === "undefined") return seedCaptures();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedCaptures();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as CaptureNote[];
    return Array.isArray(parsed) ? parsed : seedCaptures();
  } catch {
    return seedCaptures();
  }
}

export function saveCaptures(notes: CaptureNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(0, 200)));
}

export function createCapture(input: {
  kind: CaptureKind;
  title?: string;
  body?: string;
  linkUrl?: string;
  photoName?: string;
  voiceSeconds?: number;
  checklist?: string[];
}): CaptureNote {
  const stamp = nowIso();
  const title =
    input.title?.trim() ||
    input.body?.trim().slice(0, 48) ||
    (input.kind === "photo" ? input.photoName || "Photo note" : "Quick note");
  return {
    id: newId(),
    kind: input.kind,
    title,
    body: (input.body || "").trim(),
    checklist: (input.checklist || []).map((text) => ({
      id: newId("chk"),
      text,
      done: false,
    })),
    linkUrl: input.linkUrl || null,
    photoName: input.photoName || null,
    voiceSeconds: input.voiceSeconds ?? null,
    createdAt: stamp,
    updatedAt: stamp,
    convertedTo: null,
  };
}

export function convertCapture(
  note: CaptureNote,
  target: "task" | "event" | "customer" | "reminder",
): { ok: true; note: CaptureNote; label: string } | { ok: false; error: string } {
  if (note.convertedTo) return { ok: false, error: "Already converted." };

  if (target === "task" || target === "reminder") {
    const task = createTask({
      title: target === "reminder" ? `Reminder: ${note.title}` : note.title,
      notes: note.body || note.checklist.map((c) => `- ${c.text}`).join("\n"),
      priority: target === "reminder" ? "high" : "normal",
      category: target === "reminder" ? "Reminders" : "Inbox",
      dueDate: target === "reminder" ? new Date(Date.now() + 86400000).toISOString() : null,
    });
    saveTasks([task, ...loadTasks()]);
    const updated = {
      ...note,
      convertedTo: { type: target, id: task.id, label: task.title },
      updatedAt: nowIso(),
    };
    return { ok: true, note: updated, label: `Created ${target} “${task.title}”.` };
  }

  if (target === "event") {
    const state = loadCalendarState();
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 2);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const event = {
      id: newId("evt"),
      title: note.title,
      categoryId: "meetings",
      layerId: "business" as const,
      start: start.toISOString(),
      end: end.toISOString(),
      location: "",
      invitees: [] as string[],
      notes: note.body,
      priority: "normal" as const,
      outdoor: false,
      pinnedDeadline: false,
    };
    saveCalendarState({ ...state, events: [event, ...state.events] });
    const updated = {
      ...note,
      convertedTo: { type: "event" as const, id: event.id, label: event.title },
      updatedAt: nowIso(),
    };
    return { ok: true, note: updated, label: `Created calendar event “${event.title}”.` };
  }

  const contact = createContact({
    kind: "customer",
    name: note.title,
    notes: note.body || "Created from quick capture",
  });
  saveContacts([contact, ...loadContacts()]);
  const updated = {
    ...note,
    convertedTo: { type: "customer" as const, id: contact.id, label: contact.name },
    updatedAt: nowIso(),
  };
  return { ok: true, note: updated, label: `Created customer “${contact.name}”.` };
}

export const CAPTURE_KINDS: { id: CaptureKind; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "voice", label: "Voice" },
  { id: "photo", label: "Photo" },
  { id: "checklist", label: "Checklist" },
  { id: "link", label: "Link" },
  { id: "idea", label: "Idea" },
];
