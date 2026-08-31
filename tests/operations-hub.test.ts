import { describe, expect, it } from "vitest";
import { loadTodayAttention } from "../src/lib/command-center";
import { detectQualityAlerts } from "../src/lib/quality-workspace";
import { parseReceiptText, approverForAmount } from "../src/lib/expenses-workspace";

describe("operations hub", () => {
  it("builds today attention snapshot", () => {
    const attention = loadTodayAttention();
    expect(attention.summary).toBeTruthy();
    expect(Array.isArray(attention.bullets)).toBe(true);
  });

  it("detects quality alerts from signals", () => {
    const alerts = detectQualityAlerts();
    expect(alerts.some((a) => a.pattern.toLowerCase().includes("installation") || a.pattern.length > 0)).toBe(true);
  });

  it("parses receipt and assigns approval tier", () => {
    const scan = parseReceiptText("Home Depot\n$184.27");
    expect(scan.amount).toBe(184.27);
    expect(approverForAmount(50)).toBe("auto");
    expect(approverForAmount(250)).toBe("manager");
    expect(approverForAmount(900)).toBe("owner");
  });
});
