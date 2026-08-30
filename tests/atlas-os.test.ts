import { describe, expect, it } from "vitest";
import {
  AWAY_POLICY,
  AUTONOMY_LEVELS,
  DEFAULT_RUNTIME,
  levelDef,
  pauseAtlas,
  returnFromAway,
  runtimeStatusLabel,
  setAutonomyLevel,
  startOwnerAway,
} from "../src/lib/atlas-runtime";
import { atlasCommandHits } from "../src/lib/global-search";
import { sidebarPrimary } from "../src/lib/sidebar-nav";

describe("Atlas OS product surface", () => {
  it("exposes four autonomy levels with Manager spend/refund limits", () => {
    expect(AUTONOMY_LEVELS.map((row) => row.id)).toEqual([
      "assistant",
      "automate",
      "manager",
      "autopilot",
    ]);
    const manager = levelDef("manager");
    expect(manager.spendLimit).toBe(250);
    expect(manager.refundLimit).toBe(100);
    expect(manager.mustAsk.some((item) => /refund/i.test(item))).toBe(true);
  });

  it("pauses Atlas and clears away mode", () => {
    const away = startOwnerAway(DEFAULT_RUNTIME);
    expect(away.away).toBe(true);
    expect(runtimeStatusLabel(away)).toBe("Running the business");
    const paused = pauseAtlas(away, true);
    expect(paused.paused).toBe(true);
    expect(paused.away).toBe(false);
    expect(runtimeStatusLabel(paused)).toBe("Paused");
  });

  it("returns from away with a report waiting", () => {
    const back = returnFromAway(startOwnerAway(DEFAULT_RUNTIME));
    expect(back.away).toBe(false);
    expect(back.awayReportDismissed).toBe(false);
  });

  it("keeps Autopilot above Manager for spend", () => {
    expect(levelDef("autopilot").spendLimit).toBeGreaterThan(levelDef("manager").spendLimit || 0);
    expect(AWAY_POLICY.spendLimit).toBe(500);
  });

  it("can raise the level without dropping the rest of runtime", () => {
    const next = setAutonomyLevel(DEFAULT_RUNTIME, "autopilot");
    expect(next.level).toBe("autopilot");
    expect(next.agentsActive).toBe(DEFAULT_RUNTIME.agentsActive);
  });

  it("groups the sidebar into six primary sections", () => {
    expect(sidebarPrimary.map((group) => group.id)).toEqual([
      "home",
      "business",
      "team",
      "atlas",
      "money",
      "settings",
    ]);
    const hrefs = sidebarPrimary.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toContain("/app/approvals");
    expect(hrefs).not.toContain("/app/confirmations");
  });

  it("offers Atlas commands from the command bar", () => {
    const empty = atlasCommandHits("");
    expect(empty.some((hit) => /overdue invoices/i.test(hit.title))).toBe(true);
    expect(atlasCommandHits("johnson")[0]?.title).toMatch(/Johnson/);
  });
});
