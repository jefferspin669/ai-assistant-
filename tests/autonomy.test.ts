import { beforeEach, describe, expect, it } from "vitest";
import { decideWork, isAwayPhrase, levelFromAwayPhrase } from "../src/lib/autonomy/engine";
import { defaultPolicy } from "../src/lib/autonomy/defaults";
import { demoVendorPayment, submitWork } from "../src/lib/autonomy/submit";
import { patchPolicy } from "../src/lib/autonomy/policy";
import { processAutonomyQueue } from "../src/lib/autonomy/worker";
import type { AutonomyLevel, AutonomyPolicy, WorkIntent } from "../src/lib/autonomy/types";
import { AUTONOMOUS_AUTO_PERMISSIONS, levelToControlMode } from "../src/lib/autonomy/permissions";
import { resetDatabase } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";

function policy(level: AutonomyLevel, extra: Partial<AutonomyPolicy> = {}): AutonomyPolicy {
  return {
    ...defaultPolicy("org_test"),
    level,
    controlMode: levelToControlMode(level),
    autoPermissions:
      level >= 3 ? { ...AUTONOMOUS_AUTO_PERMISSIONS } : defaultPolicy("org_test").autoPermissions,
    ...extra,
  };
}

function reminder(): WorkIntent {
  return { kind: "send_reminder", title: "Appointment reminder", summary: "Text Jamie about tomorrow 9am" };
}

function vendor(amountCents = 1_842_000): WorkIntent {
  return {
    kind: "vendor_payment",
    title: "Vendor payment",
    summary: "HVAC Parts Co",
    amountCents,
  };
}

describe("Atlas autonomy engine", () => {
  it("Level 1 always asks, even for routine reminders", () => {
    const decision = decideWork(reminder(), policy(1));
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.reason).toMatch(/Manual mode/);
  });

  it("Level 2 executes routine work and still asks for refunds", () => {
    expect(decideWork(reminder(), policy(2)).verdict).toBe("execute");
    const refund = decideWork(
      { kind: "refund", title: "Customer refund", summary: "Goodwill", amountCents: 5_000 },
      policy(2),
    );
    expect(refund.verdict).toBe("ask_owner");
  });

  it("Level 3 refunds $50 automatically and asks for $200", () => {
    const under = decideWork(
      { kind: "refund", title: "Customer refund", summary: "Small refund", amountCents: 5_000 },
      policy(3),
    );
    const over = decideWork(
      { kind: "refund", title: "Customer refund", summary: "Large refund", amountCents: 20_000 },
      policy(3),
    );
    expect(under.verdict).toBe("execute");
    expect(over.verdict).toBe("ask_owner");
    expect(over.ownerPrompt).toContain("Your automatic-refund limit: $100");
  });

  it("payroll is never unrestricted, even on Autopilot", () => {
    const decision = decideWork(
      { kind: "payroll_change", title: "Payroll change", summary: "Raise Alex to $32/hr" },
      policy(4),
    );
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.band).toBe("restricted");
    expect(decision.ownerPrompt).toContain("Atlas needs you");
  });

  it("vendor payment $18,420 vs $5,000 auto-pay limit asks with the owner card", () => {
    const decision = decideWork(vendor(), policy(4));
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.ownerPrompt).toContain("Atlas needs you");
    expect(decision.ownerPrompt).toContain("Vendor payment: $18,420");
    expect(decision.ownerPrompt).toContain("Your automatic-payment limit: $5,000");
  });

  it("kill switch forces ask even for Level 4 reminders", () => {
    const decision = decideWork(reminder(), policy(4, { killSwitch: true }));
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.reason).toMatch(/Kill switch/);
  });

  it("vacation / run the company raises to Autopilot", () => {
    expect(isAwayPhrase("I'm going on vacation. Run the company.")).toBe(true);
    expect(levelFromAwayPhrase("I'm going on vacation. Run the company.")).toBe(4);
    expect(levelFromAwayPhrase("Going home — handle tonight")).toBe(2);
  });

  it("disabled auto permission asks even at Level 2", () => {
    const policy = {
      ...defaultPolicy("org_test"),
      level: 2 as const,
      controlMode: "assisted" as const,
      autoPermissions: { ...defaultPolicy("org_test").autoPermissions, reminders: false },
    };
    const decision = decideWork(reminder(), policy);
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.reason).toMatch(/reminder/i);
  });
});

describe("Atlas autonomy queue", () => {
  beforeEach(() => {
    resetDatabase();
  });

  function ownerCtx() {
    const db = database();
    return testSession(db.users[0].id, db.organizations[0].id, "owner");
  }

  it("demo vendor payment creates a pending owner card", () => {
    const ctx = ownerCtx();
    const submitted = demoVendorPayment(ctx);
    expect(submitted.decision.verdict).toBe("ask_owner");
    expect(submitted.approvalId).toBeTruthy();
    expect(submitted.decision.ownerPrompt).toContain("Vendor payment: $18,420");
    const pending = database().approvals.filter((row) => row.status === "pending");
    expect(pending.some((row) => row.id === submitted.approvalId)).toBe(true);
  });

  it("Level 3 within-limit refunds enqueue instead of asking", () => {
    const ctx = ownerCtx();
    patchPolicy(ctx.organizationId, { level: 3 });
    const submitted = submitWork(ctx, {
      kind: "refund",
      title: "Customer refund",
      summary: "Goodwill",
      amountCents: 5_000,
    });
    expect(submitted.decision.verdict).toBe("execute");
    expect(submitted.jobId).toBeTruthy();
    const tick = processAutonomyQueue();
    expect(tick.processed).toBeGreaterThan(0);
  });

  it("kill switch leaves queued autonomy jobs unprocessed", () => {
    const ctx = ownerCtx();
    patchPolicy(ctx.organizationId, { level: 4 });
    submitWork(ctx, reminder());
    patchPolicy(ctx.organizationId, { killSwitch: true });
    const tick = processAutonomyQueue();
    expect(tick.processed).toBe(0);
    expect(tick.skippedKillSwitch).toBeGreaterThan(0);
  });
});
