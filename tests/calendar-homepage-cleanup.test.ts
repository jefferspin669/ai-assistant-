import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyCalendarState } from "@/lib/smart-calendar";
import { loadDatabase, resetDatabase } from "@/lib/db/store";
import { workspaceDashboard } from "@/lib/services/dashboard";
import type { SessionContext } from "@/lib/domain/types";

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

  describe("honest homepage KPIs without Postgres", () => {
    beforeEach(() => {
      resetDatabase();
    });

    it("labels file-store dashboard data as DEMO and seeds no org appointments", () => {
      const db = loadDatabase();
      const owner = db.users.find((user) => user.email === "demo@atlas.ai");
      expect(owner).toBeTruthy();
      const membership = db.organization_members.find((row) => row.user_id === owner!.id);
      expect(membership).toBeTruthy();
      expect(db.calendar_events).toEqual([]);

      const ctx: SessionContext = {
        userId: owner!.id,
        organizationId: membership!.organization_id,
        role: membership!.role,
        sessionId: "sess_test_dashboard_honesty",
      };
      const snap = workspaceDashboard(ctx);
      expect(snap.provenance).toBe("DEMO");
      expect(snap.kpis.every((kpi) => kpi.source === "DEMO")).toBe(true);
      expect(snap.findings.some((row) => /johnson/i.test(row.detail) || /johnson/i.test(row.title))).toBe(
        false,
      );
    });
  });
});
