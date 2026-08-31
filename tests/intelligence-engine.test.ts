import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASSUMPTIONS,
  runSimulation,
  testDecision,
} from "../src/lib/business-engine";
import { buildBackendSecurityEvents } from "../src/lib/security-center-server";
import { riskBand } from "../src/lib/security-center";

describe("intelligence engine", () => {
  it("maps risk bands to LOW/MEDIUM/HIGH/CRITICAL thresholds", () => {
    expect(riskBand(18)).toBe("LOW");
    expect(riskBand(53)).toBe("MEDIUM");
    expect(riskBand(82)).toBe("HIGH");
    expect(riskBand(96)).toBe("CRITICAL");
  });

  it("builds backend security events from health payload", () => {
    const events = buildBackendSecurityEvents({
      deadLetters: 2,
      worker: { ok: false, stale: true },
      postgres: { ok: false },
    });
    expect(events.some((e) => e.kind === "mass_export" && e.riskScore === 96)).toBe(true);
    expect(events.some((e) => e.band === "HIGH")).toBe(true);
  });

  it("models decisions and simulations", () => {
    const decision = testDecision("Hire 5 salespeople");
    expect(decision.newCustomers).toBe(183);
    expect(decision.confidence).toBe(76);
    expect(decision.why).toContain("14%");

    const sim = runSimulation("Raise prices 10%", [
      ...DEFAULT_ASSUMPTIONS.map((a) => (a.id === "price" ? { ...a, enabled: true } : a)),
    ]);
    expect(sim.expected).toContain("% profit");
  });
});
