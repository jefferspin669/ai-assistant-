import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, saveDatabase, newId, nowIso, loadDatabase } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import { patchPolicy } from "../src/lib/autonomy/policy";
import { AUTONOMOUS_AUTO_PERMISSIONS } from "../src/lib/autonomy/permissions";
import { orchestrate, tickRun } from "../src/lib/orchestrator";
import { resetOrchestratorForTests } from "../src/lib/orchestrator/store";
import { listMemoryOutcomes, searchUnifiedMemories } from "../src/lib/memory/unified";
import { planGoal } from "../src/lib/orchestrator/planner";
import { listCapabilities } from "../src/lib/capabilities/registry";

describe("Brain / orchestrator outcome verification", () => {
  beforeEach(() => {
    resetDatabase();
    resetOrchestratorForTests();
  });

  function owner() {
    const db = database();
    return testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
  }

  it("plans recover-invoice with wait + check_payment + escalate", () => {
    const plan = planGoal("Get Johnson Construction's overdue invoice paid.", listCapabilities(owner()));
    expect(plan.steps.map((s) => s.kind)).toContain("wait");
    expect(plan.steps.map((s) => s.kind)).toContain("check_payment");
    expect(plan.steps.map((s) => s.kind)).toContain("escalate");
  });

  it("re-queries the ledger on check_payment and records a successful memory outcome when paid", async () => {
    const ctx = owner();
    patchPolicy(ctx.organizationId, {
      level: 2,
      autoPermissions: { ...AUTONOMOUS_AUTO_PERMISSIONS, customer_replies: true },
    });

    const { run } = await orchestrate(ctx, "Get Johnson Construction's overdue invoice paid.");
    expect(run.status).toBe("waiting");

    // Simulate the customer paying during the wait window.
    const db = loadDatabase();
    const stamp = nowIso();
    saveDatabase({
      ...db,
      transactions: [
        {
          id: newId("txn"),
          orgId: ctx.organizationId,
          userId: ctx.userId,
          kind: "income",
          label: "Payment · Johnson Construction invoice",
          amount: 4200,
          category: "payment",
          date: stamp.slice(0, 10),
          receiptName: null,
          createdAt: stamp,
        },
        ...db.transactions,
      ],
    });

    const waiting = run.steps.find((s) => s.kind === "wait")!;
    waiting.waitUntil = new Date(Date.now() - 1000).toISOString();
    const resumed = await tickRun(run, { now: Date.now() });

    const check = resumed.steps.find((s) => s.kind === "check_payment");
    expect(check?.status).toBe("done");
    expect(check?.result?.paid).toBe(true);
    expect(check?.result?.source).toBe("ledger_requery");

    const escalate = resumed.steps.find((s) => s.kind === "escalate");
    expect(escalate?.status).toBe("skipped");

    const outcomes = listMemoryOutcomes(ctx);
    expect(outcomes.some((o) => o.status === "successful" && /Johnson/i.test(o.recommendation))).toBe(
      true,
    );
    expect(
      searchUnifiedMemories(ctx, { query: "Preference learned" }).some((m) =>
        /Invoice recovery succeeded/i.test(m.content),
      ),
    ).toBe(true);
  });

  it("records a rejected outcome and escalates when still unpaid after wait", async () => {
    const ctx = owner();
    patchPolicy(ctx.organizationId, {
      level: 2,
      autoPermissions: { ...AUTONOMOUS_AUTO_PERMISSIONS, customer_replies: true },
    });

    const { run } = await orchestrate(ctx, "Get Johnson Construction's overdue invoice paid.");
    const waiting = run.steps.find((s) => s.kind === "wait")!;
    waiting.waitUntil = new Date(Date.now() - 1000).toISOString();
    const resumed = await tickRun(run, { now: Date.now() });

    expect(resumed.steps.find((s) => s.kind === "check_payment")?.result?.paid).toBe(false);
    expect(resumed.steps.find((s) => s.kind === "escalate")?.status).toBe("done");
    expect(listMemoryOutcomes(ctx).some((o) => o.status === "rejected")).toBe(true);
  });
});
