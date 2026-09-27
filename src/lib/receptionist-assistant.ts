/**
 * Account Assistant — receptionist control, autonomy levels, and call handling rules.
 * Powered by Business Memory.
 */

import { customerFacingMemories } from "@/lib/business-memory";

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

export type AutonomyMode = "manual" | "assisted" | "automatic";

export type ReceptionistPersonality = "professional" | "friendly" | "concise" | "custom";

export type ReceptionistConfig = {
  autonomyMode: AutonomyMode;
  personality: ReceptionistPersonality;
  customPersonality?: string;
  voice: string;
  capabilities: {
    bookAppointments: boolean;
    rescheduleAppointments: boolean;
    takeMessages: boolean;
    routeCalls: boolean;
    answerFaqs: boolean;
    checkOrders: boolean;
    sendTexts: boolean;
    issueRefunds: boolean;
    changePricing: boolean;
    answerPricing: boolean;
    missedCallTexts: boolean;
  };
  rules: {
    discountApprovalPct: number;
    refundsAlwaysApproval: boolean;
    neverDiscloseEmployeePrivate: boolean;
    transactionLimit: number;
  };
  escalateWhen: {
    managerRequest: boolean;
    upsetCustomer: boolean;
    lowConfidence: boolean;
    transactionExceedsLimit: boolean;
    legalSafety: boolean;
  };
};

export type BookedAppointment = {
  id: string;
  customerName: string;
  customerPhone?: string;
  slot: string;
  employee: string;
  service: string;
  at: string;
};

const CONFIG_KEY = "atlas-receptionist-config-v1";
const BOOKINGS_KEY = "atlas-receptionist-bookings-v1";

export const DEFAULT_RECEPTIONIST_CONFIG: ReceptionistConfig = {
  autonomyMode: "assisted",
  personality: "professional",
  voice: "Atlas Business — warm neutral",
  capabilities: {
    bookAppointments: true,
    rescheduleAppointments: true,
    takeMessages: true,
    routeCalls: true,
    answerFaqs: true,
    checkOrders: true,
    sendTexts: true,
    issueRefunds: false,
    changePricing: false,
    answerPricing: true,
    missedCallTexts: true,
  },
  rules: {
    discountApprovalPct: 10,
    refundsAlwaysApproval: true,
    neverDiscloseEmployeePrivate: true,
    transactionLimit: 500,
  },
  escalateWhen: {
    managerRequest: true,
    upsetCustomer: true,
    lowConfidence: true,
    transactionExceedsLimit: true,
    legalSafety: true,
  },
};

export const AUTONOMY_DESCRIPTIONS: Record<AutonomyMode, string> = {
  manual: "Atlas answers, summarizes, and suggests — a person approves anything important.",
  assisted: "Routine actions run automatically; refunds, discounts, sensitive changes, and major scheduling need approval.",
  automatic: "Atlas performs approved categories within rules the boss sets.",
};

export function loadReceptionistConfig(): ReceptionistConfig {
  return loadJson(CONFIG_KEY, DEFAULT_RECEPTIONIST_CONFIG);
}

export function saveReceptionistConfig(config: ReceptionistConfig) {
  saveJson(CONFIG_KEY, config);
}

export function loadBookedAppointments(): BookedAppointment[] {
  return loadJson<BookedAppointment[]>(BOOKINGS_KEY, []);
}

export function bookAppointment(input: {
  customerName: string;
  customerPhone?: string;
  slot: string;
  employee: string;
  service?: string;
}): BookedAppointment {
  const booking: BookedAppointment = {
    id: newId("appt"),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    slot: input.slot,
    employee: input.employee,
    service: input.service ?? "Service visit",
    at: nowIso(),
  };
  saveJson(BOOKINGS_KEY, [booking, ...loadBookedAppointments()]);
  return booking;
}

export type AppointmentOffer = {
  slots: { time: string; employee: string }[];
  message: string;
};

/** Demo scheduling using business memory (hours, staff). */
export function offerWednesdayAfternoonSlots(): AppointmentOffer {
  const memories = customerFacingMemories();
  const noSunday = memories.some((m) => /no sunday/i.test(m.content));
  const slots = [
    { time: "2:30 PM", employee: "Marcus Lee" },
    { time: "4:00 PM", employee: "Sarah Williams" },
  ];
  let message =
    "Yes. I have 2:30 PM with Marcus or 4:00 PM with Sarah. Which works better?";
  if (noSunday) {
    message = "We're not open Sundays, but Wednesday afternoon works. " + message;
  }
  return { slots, message };
}

export function requiresApproval(action: "refund" | "discount" | "pricing_change" | "sensitive_customer"): boolean {
  const cfg = loadReceptionistConfig();
  if (cfg.autonomyMode === "manual") return true;
  if (action === "refund") return cfg.rules.refundsAlwaysApproval || cfg.autonomyMode !== "automatic";
  if (action === "discount") return cfg.autonomyMode === "assisted";
  if (action === "pricing_change") return !cfg.capabilities.changePricing;
  if (action === "sensitive_customer") return cfg.autonomyMode !== "automatic";
  return false;
}

export function canAutoBook(): boolean {
  const cfg = loadReceptionistConfig();
  return cfg.capabilities.bookAppointments && cfg.autonomyMode !== "manual";
}

export type ReceptionFlowStep = {
  id: string;
  label: string;
  done: boolean;
};

export function completeBookingFlow(customerName: string, slot: string, employee: string): ReceptionFlowStep[] {
  const booking = bookAppointment({ customerName, slot, employee });
  return [
    { id: "book", label: `Booked ${booking.slot} with ${booking.employee}`, done: true },
    { id: "confirm", label: "Sent confirmation text", done: canAutoBook() },
    { id: "calendar", label: "Updated calendar", done: canAutoBook() },
    { id: "crm", label: "Recorded in CRM", done: true },
    { id: "memory", label: "Saved interaction to customer memory", done: true },
    { id: "reminder", label: "Reminder scheduled", done: canAutoBook() },
  ];
}
