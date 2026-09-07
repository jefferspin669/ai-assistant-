import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, loadDatabase } from "../src/lib/db/store";
import { authenticate } from "../src/lib/auth/session";
import {
  authenticateEmployeeLogin,
  createEmployee,
} from "../src/lib/services/employees";
import { createOrgTask, listOrgTasks, updateOrgTask } from "../src/lib/services/workspace";
import { listAudit } from "../src/lib/services/audit";
import { executeBrainTool } from "../src/lib/brain/tools";
import { resolveApproval } from "../src/lib/domain/actions";
import { ACTION_SMS } from "../src/lib/services/action-confirmations";
import type { SessionContext } from "../src/lib/domain/types";

function ownerCtx(): SessionContext {
  const auth = authenticate("demo@atlas.ai", "atlas-demo", "test");
  return {
    userId: auth.user.id,
    organizationId: auth.organizationId,
    role: auth.role,
    sessionId: auth.sessionId || "owner-test",
  };
}

describe("owner → worker → brain → approve → Twilio workflow", () => {
  beforeEach(() => {
    resetDatabase();
    delete process.env.ATLAS_ENV;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  it("runs the full beachhead loop with audit and SMS execution report", async () => {
    const owner = ownerCtx();

    // 1. Owner creates a worker account
    const created = createEmployee(owner, {
      name: "Pat Lee",
      email: "pat.workflow@business.local",
      role: "Technician",
      department: "Field",
      accessCode: "PATWF1",
    });
    expect(created.accessCode).toBe("PATWF1");

    // 2. Owner creates and assigns a project (server task + projectLabel)
    const projectTask = createOrgTask(owner, {
      title: "Replace condenser fan",
      projectLabel: "Johnson HVAC — Unit 2",
      assigneeEmployeeId: created.employee.id,
      notes: "Customer reported noise after 6pm.",
      priority: "high",
    });
    expect(projectTask.assigneeEmployeeId).toBe(created.employee.id);
    expect(projectTask.projectLabel).toBe("Johnson HVAC — Unit 2");

    // 3. Worker signs in and completes work
    const workerLogin = authenticateEmployeeLogin({
      email: "pat.workflow@business.local",
      accessCode: "PATWF1",
      organizationId: owner.organizationId,
    });
    const worker: SessionContext = {
      userId: workerLogin.employee.userId!,
      organizationId: workerLogin.employee.organizationId,
      role: "employee",
      sessionId: workerLogin.sessionId,
    };
    const mine = listOrgTasks(worker);
    expect(mine.some((t) => t.id === projectTask.id)).toBe(true);
    const completed = updateOrgTask(worker, projectTask.id, { status: "completed" });
    expect(completed.status).toBe("completed");

    // 4. Owner sees the update and audit trail
    const ownerView = listOrgTasks(owner).find((t) => t.id === projectTask.id);
    expect(ownerView?.status).toBe("completed");
    const audit = listAudit(owner.organizationId);
    expect(audit.some((row) => row.action.includes("employee.created") || row.action.includes("created"))).toBe(
      true,
    );
    expect(
      audit.some(
        (row) =>
          row.entity_id === projectTask.id &&
          (row.action.includes("completed project task") || row.action.includes("completed")),
      ),
    ).toBe(true);

    // 5. Atlas reads real business data and proposes an SMS action
    const brief = JSON.parse(executeBrainTool("get_business_brief", {}, owner).content);
    expect(brief.source).toBe("organization_database");
    expect(brief.openTasks).toBeGreaterThanOrEqual(0);

    const customer = loadDatabase().customers.find((c) => c.organization_id === owner.organizationId && c.phone);
    expect(customer?.phone).toBeTruthy();

    const proposed = executeBrainTool(
      "propose_risky_action",
      {
        kind: "mass_sms",
        title: "Follow up on completed job",
        summary: `Pat finished ${projectTask.projectLabel}. Confirm satisfaction.`,
        confirmPrompt: "Send the follow-up SMS?",
        doneLabel: "SMS sent",
        to: customer!.phone,
        body: `Hi ${customer!.name} — Atlas here. Your ${projectTask.projectLabel} work is complete. Reply if you need anything.`,
      },
      owner,
    );
    expect(proposed.proposedAction?.approvalId).toBeTruthy();
    const approvalId = proposed.proposedAction!.approvalId!;
    const pending = loadDatabase().approvals.find((a) => a.id === approvalId);
    expect(pending?.action_type).toBe(ACTION_SMS);
    expect(pending?.status).toBe("pending");

    // 6–7. Owner approves → Twilio integration executes and reports
    const resolved = await resolveApproval(owner, approvalId, "approved");
    expect(resolved.result).toMatchObject({
      executed: ACTION_SMS,
      integration: "twilio",
      ok: true,
      mode: "simulation",
    });
    expect((resolved.result as { sid?: string }).sid).toMatch(/^sim_/);

    const postAudit = listAudit(owner.organizationId);
    expect(
      postAudit.some(
        (row) =>
          row.entity_id === approvalId &&
          (row.action.includes("executed SEND_SMS") || row.action.includes("approved SEND_SMS")),
      ),
    ).toBe(true);
  });
});
