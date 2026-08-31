import { describe, expect, it } from "vitest";
import { computeSalesMetrics } from "../src/lib/sales-workspace";
import { parseReceiptInventoryLines } from "../src/lib/inventory-workspace";
import { optimizeRoute, loadRouteStops, trafficMultiplier } from "../src/lib/routes-workspace";
import { campaignSummary } from "../src/lib/marketing-workspace";
import { reputationMode } from "../src/lib/reputation-workspace";
import { phoneMode } from "../src/lib/phone-reception-workspace";
import { coachingInsightsForEmployee } from "../src/lib/sales-coach-workspace";
import { navGroups } from "../src/lib/atlas-platform";

describe("growth and ops restructure", () => {
  it("defines Operations, Growth, Communication, People nav groups", () => {
    const labels = navGroups.map((g) => g.label);
    expect(labels).toContain("Operations");
    expect(labels).toContain("Growth");
    expect(labels).toContain("Communication");
    expect(labels).toContain("People");
    const ops = navGroups.find((g) => g.label === "Operations")?.items.map((i) => i.href) ?? [];
    expect(ops).toEqual(["/app/appointments", "/app/routes", "/app/inventory", "/app/purchasing"]);
    const growth = navGroups.find((g) => g.label === "Growth")?.items.map((i) => i.href) ?? [];
    expect(growth).toContain("/app/sales");
    expect(growth).toContain("/app/customers");
    expect(growth).not.toContain("/app/timeline");
    expect(growth).not.toContain("/app/quotes");
  });

  it("sales metrics avoid fake revenue when unverified", () => {
    const m = computeSalesMetrics();
    expect(m.mode === "DEMO" || m.mode === "MANUAL").toBe(true);
    expect(m.closedRevenue).toBeNull();
    expect(m.note.toLowerCase()).toMatch(/connect|manual|verified/);
  });

  it("optimizes route stops with traffic factor", () => {
    expect(trafficMultiplier()).toBeGreaterThan(0);
    const stops = loadRouteStops();
    const plan = optimizeRoute("emp-demo", 10);
    expect(plan.stops.length).toBeGreaterThan(1);
    expect(plan.stops.length).toBeLessThanOrEqual(stops.length);
  });

  it("marketing and reputation default to DEMO mode", () => {
    expect(campaignSummary().mode).toBe("DEMO");
    expect(reputationMode()).toBe("DEMO");
    expect(phoneMode()).toBe("DEMO");
  });

  it("sales coach generates employee insights", () => {
    const insights = coachingInsightsForEmployee("any-id");
    // empty for unknown id
    expect(Array.isArray(insights)).toBe(true);
  });
});
