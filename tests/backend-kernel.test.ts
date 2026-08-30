import { beforeEach, describe, expect, it } from "vitest";
import { authorizeAction } from "../src/backend/permissions/engine";
import { emitEvent, recentEvents } from "../src/backend/events/bus";
import { registerAutomationHandlers } from "../src/backend/automation/engine";
import { BRAIN_STEPS } from "../src/backend/ai/pipeline";
import { formatActivityLine } from "../src/backend/audit/activity";
import { queueDriver } from "../src/backend/jobs/queue";
import { resetDatabase } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import { createCustomer, createCustomerScopedEvent, deleteOrgEvent } from "../src/lib/services/workspace";
import { executeAtlasAction } from "../src/lib/domain/actions";

describe("Atlas backend kernel", () => {
  it("allows a $85 refund and asks for $1,800", () => {
    const small = authorizeAction({ action: "issue_refund", amount: 85 });
    const large = authorizeAction({ action: "refund", amount: 1800 });
    expect(small.permission).toBe("AUTO_ALLOWED");
    expect(large.permission).toBe("OWNER_APPROVAL_REQUIRED");
  });

  it("never auto-executes employee termination", () => {
    const decision = authorizeAction({ action: "employee_termination" });
    expect(decision.permission).toBe("OWNER_APPROVAL_REQUIRED");
  });

  it("runs AI only through the Brain pipeline steps", () => {
    expect([...BRAIN_STEPS]).toEqual([
      "load_context",
      "determine_intent",
      "select_tools",
      "check_permission",
      "execute",
      "store_result",
    ]);
    expect(queueDriver()).toBe("file");
  });

  it("formats audit lines the owner can read", () => {
    const line = formatActivityLine({
      created_at: "2026-08-30T08:16:00.000Z",
      actor_label: "Atlas Receptionist",
      action: "Created customer: John Smith",
      entity_type: "customer",
      entity_id: "cust_1",
    });
    expect(line).toContain("Atlas Receptionist Created customer: John Smith");
  });
});

describe("Atlas event bus + jobs", () => {
  beforeEach(() => {
    resetDatabase();
    registerAutomationHandlers();
  });

  it("emits customer.created when a customer is persisted", () => {
    const db = database();
    const ctx = testSession(db.users[0].id, db.organizations[0].id, "owner");
    const customer = createCustomer(ctx, { name: "John Smith" });
    const events = recentEvents(ctx.organizationId);
    expect(events.some((item) => item.type === "customer.created" && item.payload.id === customer.id)).toBe(true);
  });

  it("queues waitlist contact when an appointment inside 72h is cancelled", () => {
    const db = database();
    const ctx = testSession(db.users[0].id, db.organizations[0].id, "owner");
    const customer = createCustomer(ctx, { name: "Jamie Cole" });
    const start = new Date(Date.now() + 24 * 36e5).toISOString();
    const end = new Date(Date.now() + 25 * 36e5).toISOString();
    const event = createCustomerScopedEvent(ctx, {
      customerId: customer.id,
      startTime: start,
      endTime: end,
      title: "AC repair",
    });
    deleteOrgEvent(ctx, event.id);
    const jobs = database().jobs.filter((job) => job.kind === "waitlist-contact");
    expect(jobs.length).toBeGreaterThan(0);
  });

  it("can emit domain events without a browser session", () => {
    emitEvent({
      type: "invoice.overdue",
      organizationId: "org_test",
      payload: { amount: 2840 },
    });
    expect(recentEvents("org_test")[0]?.type).toBe("invoice.overdue");
  });
});

describe("Refund policy in typed actions", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("executes a $50 refund and asks for $200", () => {
    const db = database();
    const ctx = testSession(db.users[0].id, db.organizations[0].id, "owner");
    const customer = createCustomer(ctx, { name: "Pat Lee" });
    const small = executeAtlasAction(
      { type: "REFUND_CUSTOMER", payload: { customerId: customer.id, amount: 50 } },
      ctx,
    );
    const large = executeAtlasAction(
      { type: "REFUND_CUSTOMER", payload: { customerId: customer.id, amount: 200 } },
      ctx,
    );
    expect(small.requiresApproval).toBe(false);
    expect(small.approvalId).toBe("executed");
    expect(large.requiresApproval).toBe(true);
    expect(large.approvalId).not.toBe("executed");
    expect(
      database().approvals.some(
        (row) => row.action_type === "REFUND_CUSTOMER" && row.status === "pending",
      ),
    ).toBe(true);
  });
});

describe("Permission table", () => {
  it("asks for vendor payments even under $1,000 because the mode is approval", () => {
    const decision = authorizeAction({ action: "vendor_payment", amount: 500 });
    expect(decision.permission).toBe("OWNER_APPROVAL_REQUIRED");
  });

  it("allows a 10% discount and asks above the cap", () => {
    expect(authorizeAction({ action: "discount", discountPercent: 10 }).permission).toBe("AUTO_ALLOWED");
    expect(authorizeAction({ action: "discount", discountPercent: 15 }).permission).toBe(
      "OWNER_APPROVAL_REQUIRED",
    );
  });
});
