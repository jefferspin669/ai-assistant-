import { isDemoWorkspace } from "@/lib/workspace-mode";

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

export type PhoneLine = {
  id: string;
  number: string;
  label: string;
  routing: string;
  hours: string;
  live: boolean;
};

export type CallRecord = {
  id: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  duration: string;
  summary: string;
  transcript?: string;
  routedTo?: string;
  missed: boolean;
  at: string;
};

export type ReceptionScenario = {
  id: string;
  callerSays: string;
  atlasDoes: string;
};

const CALLS_KEY = "atlas-phone-calls-v1";
const LINES_KEY = "atlas-phone-lines-v1";

export const RECEPTION_SCENARIOS: ReceptionScenario[] = [
  {
    id: "reschedule",
    callerSays: "I need to reschedule my appointment.",
    atlasDoes:
      "Atlas Reception answers, verifies the customer, checks Calendar, offers available times, updates the appointment, and records the call in CRM.",
  },
  {
    id: "billing",
    callerSays: "I need to speak with billing.",
    atlasDoes: "Atlas routes to the billing queue or correct employee extension based on business hours.",
  },
];

const SEED_LINES: PhoneLine[] = [
  {
    id: "main",
    number: "(555) 014-2200",
    label: "Main business line",
    routing: "Receptionist AI → queue",
    hours: "Mon–Fri 7am–6pm",
    live: false,
  },
];

const SEED_CALLS: CallRecord[] = [
  {
    id: "call-1",
    direction: "inbound",
    from: "Elena Brooks",
    to: "Main line",
    duration: "4:12",
    summary: "Rescheduled Thursday install to Friday 10am — CRM updated.",
    transcript: "Caller asked to move appointment. Atlas offered 3 slots, confirmed Friday.",
    routedTo: "Receptionist AI",
    missed: false,
    at: nowIso(),
  },
  {
    id: "call-2",
    direction: "inbound",
    from: "Unknown",
    to: "Main line",
    duration: "0:00",
    summary: "Missed call — follow-up text drafted.",
    missed: true,
    at: nowIso(),
  },
];

export function loadPhoneLines(): PhoneLine[] {
  const saved = loadJson<PhoneLine[]>(LINES_KEY, []);
  if (saved.length) return saved;
  return isDemoWorkspace() ? SEED_LINES : [];
}

export function loadCallRecords(): CallRecord[] {
  const saved = loadJson<CallRecord[]>(CALLS_KEY, []);
  if (saved.length) return saved;
  return isDemoWorkspace() ? SEED_CALLS : [];
}

export function phoneMode(): "LIVE" | "DEMO" {
  return loadPhoneLines().some((l) => l.live) ? "LIVE" : "DEMO";
}

export function missedCalls(): CallRecord[] {
  return loadCallRecords().filter((c) => c.missed);
}
