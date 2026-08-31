import { describe, expect, it, beforeEach, vi } from "vitest";
import { enterPreviewWorkspace } from "../src/lib/workspace-mode";
import {
  addBusinessMemory,
  loadBusinessMemories,
  memoriesByType,
  proposeMemoryCorrection,
  resolvePendingCorrection,
  customerFacingMemories,
} from "../src/lib/business-memory";
import {
  loadReceptionistConfig,
  offerWednesdayAfternoonSlots,
  requiresApproval,
  completeBookingFlow,
} from "../src/lib/receptionist-assistant";

function mockLocalStorage() {
  const store: Record<string, string> = {};
  const storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", { localStorage: storage });
}

describe("business memory and account assistant", () => {
  beforeEach(() => {
    mockLocalStorage();
    enterPreviewWorkspace();
  });

  it("stores memories by type with metadata", () => {
    addBusinessMemory({
      type: "company",
      content: "No Sunday appointments",
      source: "Owner",
      addedBy: "Owner",
      permission: "customer_facing",
    });
    expect(memoriesByType("company").some((m) => m.content.includes("Sunday"))).toBe(true);
    const m = loadBusinessMemories()[0];
    expect(m.source).toBeTruthy();
    expect(m.addedBy).toBe("Owner");
    expect(m.confidence).toBeGreaterThan(0);
  });

  it("proposes and resolves owner corrections", () => {
    const pending = proposeMemoryCorrection("We close at 5pm", "company");
    const saved = resolvePendingCorrection(pending.id, true, "Owner");
    expect(saved?.content).toContain("5pm");
  });

  it("powers receptionist scheduling from customer-facing memory", () => {
    const offer = offerWednesdayAfternoonSlots();
    expect(offer.slots.length).toBe(2);
    expect(offer.message).toContain("2:30");
    expect(customerFacingMemories().length).toBeGreaterThan(0);
  });

  it("enforces refund approval rules", () => {
    expect(requiresApproval("refund")).toBe(true);
    const cfg = loadReceptionistConfig();
    expect(cfg.rules.refundsAlwaysApproval).toBe(true);
  });

  it("completes booking flow steps", () => {
    const steps = completeBookingFlow("Elena Brooks", "2:30 PM", "Marcus Lee");
    expect(steps.some((s) => s.label.includes("Booked"))).toBe(true);
    expect(steps.some((s) => s.label.includes("CRM"))).toBe(true);
  });
});
