import { describe, expect, it, beforeEach, vi } from "vitest";
import { enterPreviewWorkspace } from "../src/lib/workspace-mode";
import { loadTodayAttention } from "../src/lib/command-center";
import { detectQualityAlerts } from "../src/lib/quality-workspace";
import { parseReceiptText, approverForAmount } from "../src/lib/expenses-workspace";

function mockLocalStorage() {
  const store: Record<string, string> = {};
  const storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", { localStorage: storage });
}

describe("operations hub", () => {
  beforeEach(() => {
    mockLocalStorage();
    enterPreviewWorkspace();
  });
  it("builds today attention snapshot", () => {
    const attention = loadTodayAttention();
    expect(attention.summary).toBeTruthy();
    expect(Array.isArray(attention.bullets)).toBe(true);
  });

  it("detects quality alerts from signals in preview only", () => {
    const alerts = detectQualityAlerts();
    expect(alerts.length).toBeGreaterThan(0);
  });

  it("parses receipt and assigns approval tier", () => {
    const scan = parseReceiptText("Home Depot\n$184.27");
    expect(scan.amount).toBe(184.27);
    expect(approverForAmount(50)).toBe("auto");
    expect(approverForAmount(250)).toBe("manager");
    expect(approverForAmount(900)).toBe("owner");
  });
});
