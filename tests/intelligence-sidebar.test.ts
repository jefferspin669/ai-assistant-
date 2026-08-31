import { describe, expect, it } from "vitest";
import { intelligenceHubs, isIntelligenceNavItemActive } from "../src/lib/intelligence-nav";
import { intelligenceFlowSteps } from "../src/lib/intelligence-flow";
import { navGroups } from "../src/lib/atlas-platform";
import { automationsNavItem, intelligenceHubs as sidebarHubs } from "../src/lib/sidebar-nav";

describe("intelligence sidebar", () => {
  it("defines Business Engine, Market Intelligence, and Security Center sub-nav", () => {
    const labels = intelligenceHubs.map((h) => h.label);
    expect(labels).toEqual(["Business Engine", "Market Intelligence", "Security Center"]);
    expect(intelligenceHubs[0].items.map((i) => i.label)).toEqual([
      "Overview",
      "Health Score",
      "Predictions",
      "Simulator",
      "Decisions",
      "Scenarios",
      "Recommendations",
    ]);
    expect(intelligenceHubs[1].items.map((i) => i.label)).toContain("Intelligence Feed");
    expect(intelligenceHubs[2].items.map((i) => i.label)).toContain("Audit Log");
  });

  it("matches default tab when query is empty", () => {
    const overview = intelligenceHubs[0].items[0];
    expect(isIntelligenceNavItemActive("/app/business-engine", "", overview)).toBe(true);
    expect(isIntelligenceNavItemActive("/app/business-engine", "tab=health", overview)).toBe(false);
  });

  it("links automations to workflows across Atlas", () => {
    expect(automationsNavItem.href).toBe("/app/workflows");
    expect(intelligenceFlowSteps.some((s) => s.href === "/app/workflows")).toBe(true);
  });

  it("keeps intelligence sidebar hubs separate from nav catalog", () => {
    const intelligence = navGroups.find((g) => g.label === "Intelligence");
    expect(intelligence?.items.map((i) => i.href)).toContain("/app/business-engine");
    expect(sidebarHubs.length).toBe(3);
  });
});
