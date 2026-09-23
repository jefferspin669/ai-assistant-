import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createEmptyCalendarState } from "@/lib/smart-calendar";

describe("calendar and homepage cleanup", () => {
  it("starts a new calendar without sample personal or business records", () => {
    const state = createEmptyCalendarState();

    expect(state.categories.length).toBeGreaterThan(0);
    expect(state.events).toEqual([]);
    expect(state.goals).toEqual([]);
    expect(state.sharedMembers).toEqual([]);
    expect(state.sharedRequests).toEqual([]);
    expect(state.lifeTimeline).toEqual([]);
    expect(state.postponedTasks).toEqual([]);
  });

  it("does not ship the previously seeded trip, customer, or project examples", () => {
    const files = [
      "src/lib/smart-calendar.ts",
      "src/components/CommandDashboard.tsx",
      "src/components/DashboardAskAtlas.tsx",
    ].map((file) => readFileSync(join(process.cwd(), file), "utf8").toLowerCase());

    const shippedText = files.join("\n");
    expect(shippedText).not.toContain("paris vacation");
    expect(shippedText).not.toContain("jb hunt");
    expect(shippedText).not.toContain("johnson construction");
    expect(shippedText).not.toContain("callbackflow");
  });
});
