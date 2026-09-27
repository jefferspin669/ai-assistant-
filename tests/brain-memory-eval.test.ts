import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, createEmptyOrganization } from "../src/lib/db/store";
import { resetEnsureCache } from "../src/lib/db/ensure";
import { database, testSession } from "../src/lib/services/access";
import { resetIdempotencyForTests } from "../src/lib/safety/idempotency";
import {
  canReadMemory,
  listUnifiedMemories,
  rememberBusinessFact,
  searchUnifiedMemories,
  recordMemoryOutcome,
} from "../src/lib/memory/unified";
import { buildBusinessContext, formatEvidenceAnswer } from "../src/lib/brain/context";
import { executeStrictBrainTool } from "../src/lib/brain/tools-strict";
import { runAtlasBrain } from "../src/lib/brain";
import { planGoal } from "../src/lib/orchestrator/planner";
import { listCapabilities } from "../src/lib/capabilities/registry";
import { AuthorizationError } from "../src/lib/domain/errors";
import { createCustomer, createOrgTask } from "../src/lib/services/workspace";

beforeEach(() => {
  resetEnsureCache();
  resetDatabase();
  resetIdempotencyForTests();
});

function owner() {
  const db = database();
  return testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
}

describe("Unified business memory", () => {
  it("stores source, org, author, confidence, access and never leaks tenants", () => {
    const a = owner();
    const b = createEmptyOrganization({
      businessName: "Other Co",
      ownerEmail: "other@co.test",
      ownerName: "Other",
    });
    const ownerB = testSession(b.userId, b.orgId, "owner");

    const mem = rememberBusinessFact(a, {
      content: "We only service zip 85001",
      memoryType: "company",
      source: "Owner",
      confidence: 95,
      accessLevel: "customer_facing",
    });
    expect(mem.organizationId).toBe(a.organizationId);
    expect(mem.source).toBe("Owner");
    expect(mem.confidence).toBe(95);

    expect(listUnifiedMemories(ownerB).map((m) => m.id)).not.toContain(mem.id);
    expect(canReadMemory(ownerB, mem)).toBe(false);
  });

  it("filters employee access to all_staff and below", () => {
    const a = owner();
    const secret = rememberBusinessFact(a, {
      content: "CEO will sell the company",
      memoryType: "leadership",
      accessLevel: "owner",
      confidence: 100,
    });
    const publicMem = rememberBusinessFact(a, {
      content: "Hours 7-6 weekdays",
      memoryType: "company",
      accessLevel: "customer_facing",
    });
    const db = database();
    const invited = db.organization_members.find(
      (m) => m.organization_id === a.organizationId && m.role === "employee",
    );
    expect(invited).toBeTruthy();
    invited!.status = "active";
    const worker = testSession(invited!.user_id, a.organizationId, "employee");
    expect(canReadMemory(worker, secret)).toBe(false);
    expect(canReadMemory(worker, publicMem)).toBe(true);
    expect(searchUnifiedMemories(worker, { query: "hours" }).map((m) => m.id)).toContain(publicMem.id);
  });
});

describe("Brain live context + evidence", () => {
  it("builds verified facts from the authenticated database", () => {
    const ctx = owner();
    createCustomer(ctx, { name: "Live Co", phone: "+15550009999" });
    const pack = buildBusinessContext(ctx, "how is business");
    expect(pack.facts.some((f) => f.id === "customers" && f.evidence === "verified")).toBe(true);
    expect(pack.summaryForPrompt).toMatch(/verified/);
    const answer = formatEvidenceAnswer({
      headline: "Brief",
      facts: pack.facts,
      missing: pack.missing,
    });
    expect(answer).toMatch(/\(fact\)/);
    expect(answer).toMatch(/I don’t know|not on file/i);
  });

  it("simulation brain uses DB context instead of fabricated metrics", async () => {
    const ctx = owner();
    const result = await runAtlasBrain({
      message: "How is business today?",
      session: ctx,
    });
    expect(result.reply).not.toMatch(/\$4,?280/);
    expect(result.reply).toMatch(/fact|Customers|workspace/i);
    expect(result.citations?.length).toBeGreaterThan(0);
  });
});

describe("Strict tools + permissions + idempotency", () => {
  it("create_task validates, writes once, and blocks replay", async () => {
    const ctx = owner();
    const first = await executeStrictBrainTool(ctx, "create_task", {
      title: "Replace filter",
      idempotencyKey: "task-key-1",
    });
    expect(JSON.parse(first.content).created).toBe(true);
    const second = await executeStrictBrainTool(ctx, "create_task", {
      title: "Replace filter again",
      idempotencyKey: "task-key-1",
    });
    expect(second.idempotentReplay).toBe(true);
  });

  it("send_customer_message requires approval path and refuses when kill switch on", async () => {
    const ctx = owner();
    const customer = createCustomer(ctx, { name: "Notify Me", phone: "+15550001212" });
    const { patchPolicy } = await import("../src/lib/autonomy/policy");
    patchPolicy(ctx.organizationId, { killSwitch: true });
    await expect(
      executeStrictBrainTool(ctx, "send_customer_message", {
        customerId: customer.id,
        message: "Hi",
        idempotencyKey: "sms-1",
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("assign_worker updates assignee", async () => {
    const ctx = owner();
    const task = createOrgTask(ctx, { title: "Needs owner" });
    const workerId = database().users[1]!.id;
    const result = await executeStrictBrainTool(ctx, "assign_worker", {
      taskId: task.id,
      assigneeId: workerId,
      idempotencyKey: "assign-1",
    });
    expect(JSON.parse(result.content).assigned).toBe(true);
    expect(JSON.parse(result.content).task.assigneeId).toBe(workerId);
  });
});

describe("Planner pause + outcome learning", () => {
  it("pauses with a clarifying question when customer is missing", () => {
    const ctx = owner();
    const planned = planGoal("Collect the overdue invoice", listCapabilities(ctx));
    expect(planned.clarifyingQuestion).toMatch(/customer/i);
    expect(planned.steps.some((s) => s.kind === "ask_owner")).toBe(true);
  });

  it("records accepted outcomes without auto-changing critical refund rules", () => {
    const ctx = owner();
    const outcome = recordMemoryOutcome(ctx, {
      recommendation: "Prefer morning summaries",
      status: "accepted",
    });
    expect(outcome.status).toBe("accepted");
    expect(
      listUnifiedMemories(ctx).some((m) => m.content.includes("Preference learned")),
    ).toBe(true);

    recordMemoryOutcome(ctx, {
      recommendation: "Always auto-refund without approval",
      status: "accepted",
    });
    expect(
      listUnifiedMemories(ctx).some((m) => /auto-refund/i.test(m.content) && m.source === "Outcome learning"),
    ).toBe(false);
  });
});

describe("Brain eval suite", () => {
  const cases = [
    {
      id: "business_question",
      message: "How is business?",
      expectReply: /fact|Customers|Open tasks/i,
      forbid: /\$4,?280/,
    },
    {
      id: "missing_evidence",
      message: "What is our inventory of compressors?",
      expectReply: /don’t know|not on the server|missing|Inventory/i,
    },
  ] as const;

  for (const c of cases) {
    it(`eval:${c.id}`, async () => {
      const ctx = owner();
      const result = await runAtlasBrain({ message: c.message, session: ctx });
      expect(result.reply).toMatch(c.expectReply);
      if ("forbid" in c && c.forbid) expect(result.reply).not.toMatch(c.forbid);
    });
  }

  it("eval:tenant_leakage_memory_search", () => {
    const a = owner();
    rememberBusinessFact(a, { content: "Secret A only", accessLevel: "all_staff" });
    const b = createEmptyOrganization({
      businessName: "B Co",
      ownerEmail: "b@co.test",
      ownerName: "B",
    });
    const ownerB = testSession(b.userId, b.orgId, "owner");
    expect(searchUnifiedMemories(ownerB, { query: "Secret" })).toHaveLength(0);
  });

  it("eval:tool_selection_create_task", async () => {
    const ctx = owner();
    const tool = await executeStrictBrainTool(ctx, "create_task", {
      title: "Eval task",
      idempotencyKey: "eval-task-1",
    });
    expect(JSON.parse(tool.content).task.title).toBe("Eval task");
  });
});
