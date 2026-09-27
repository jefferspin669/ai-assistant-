import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, loadDatabase } from "../src/lib/db/store";
import { authenticate } from "../src/lib/auth/session";
import {
  authenticateEmployeeLogin,
  createEmployee,
} from "../src/lib/services/employees";
import {
  createOrgProject,
  createOrgTask,
  deleteOrgTask,
  listOrgTasks,
  updateOrgTask,
} from "../src/lib/services/workspace";
import { listAudit } from "../src/lib/services/audit";
import { executeStrictBrainTool } from "../src/lib/brain/tools-strict";
import { createApproval, listApprovals } from "../src/lib/services/approvals";
import { resolveApproval } from "../src/lib/domain/actions";
import type { SessionContext } from "../src/lib/domain/types";

function ownerCtx(): SessionContext {
  const auth = authenticate("demo@atlas.ai", "atlas-demo", "test");
  return {
    userId: auth.user.id,
    organizationId: auth.organizationId,
    role: "owner",
    sessionId: auth.sessionId || "owner-test",
  };
}

describe("owner → worker → approve workflow", () => {
  beforeEach(() => {
    resetDatabase();
    delete process.env.ATLAS_ENV;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  it("runs invite/login/assign/complete/approve with audit", async () => {
    const owner = ownerCtx();

    const created = createEmployee(owner, {
      name: "Pat Lee",
      email: "pat.workflow@business.local",
      role: "Technician",
      department: "Field",
      accessCode: "PATWF1",
    });
    expect(created.accessCode).toBe("PATWF1");

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

    const project = createOrgProject(owner, { name: "Johnson HVAC — Unit 2" });
    const projectTask = createOrgTask(owner, {
      title: "Replace condenser fan",
      projectId: project.id,
      assigneeId: worker.userId,
      notes: "Customer reported noise after 6pm.",
      priority: "high",
    });
    expect(projectTask.assigneeId).toBe(worker.userId);

    const mine = listOrgTasks(worker);
    expect(mine.some((t) => t.id === projectTask.id)).toBe(true);
    expect(() => updateOrgTask(worker, projectTask.id, { title: "Hijacked title" })).toThrow(
      /Workers can only update status and notes/,
    );
    expect(() => deleteOrgTask(worker, projectTask.id)).toThrow(/Workers cannot delete/);
    const completed = updateOrgTask(worker, projectTask.id, { status: "completed" });
    expect(completed.status).toBe("completed");

    const ownerView = listOrgTasks(owner).find((t) => t.id === projectTask.id);
    expect(ownerView?.status).toBe("completed");
    const audit = listAudit(owner.organizationId);
    expect(audit.some((row) => /employee\.created|created task/i.test(row.action))).toBe(true);

    const brief = await executeStrictBrainTool(owner, "get_business_brief", {});
    const parsed = JSON.parse(brief.content) as { source?: string; openTasks?: string };
    expect(parsed.source).toBe("organization_database");

    const customer = loadDatabase().customers.find(
      (c) => c.organization_id === owner.organizationId && c.phone,
    );
    expect(customer?.phone).toBeTruthy();

    const approval = createApproval(owner, {
      type: "SEND_MESSAGE",
      payload: {
        customerId: customer!.id,
        message: `Pat finished ${project.name}. Confirm satisfaction.`,
      },
    });
    expect(listApprovals(owner).some((a) => a.id === approval.id && a.status === "pending")).toBe(
      true,
    );

    const resolved = await resolveApproval(owner, approval.id, "approved");
    expect(resolved.approval.status).toBe("approved");
  });
});
