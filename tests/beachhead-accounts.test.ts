import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, loadDatabase } from "../src/lib/db/store";
import { authenticate } from "../src/lib/auth/session";
import { hasPermission } from "../src/lib/auth/permissions";
import {
  authenticateEmployeeLogin,
  createEmployee,
  listEmployees,
} from "../src/lib/services/employees";
import { executeBrainTool } from "../src/lib/brain/tools";
import { requireOrganizationId } from "../src/lib/auth/tenant";
import { ValidationError } from "../src/lib/domain/errors";
import type { SessionContext } from "../src/lib/domain/types";

function ownerCtx(): SessionContext {
  const db = loadDatabase();
  const org = db.organizations[0]!;
  const user = db.users.find((u) => u.email === "demo@atlas.ai")!;
  return {
    userId: user.id,
    organizationId: org.id,
    role: "owner",
    sessionId: "test",
  };
}

describe("beachhead accounts + tenant + brain", () => {
  beforeEach(() => {
    resetDatabase();
    delete process.env.ATLAS_ENV;
  });

  it("seeds owner, manager, and worker password accounts with roles", () => {
    const owner = authenticate("demo@atlas.ai", "atlas-demo", "test");
    expect(owner.role).toBe("owner");
    expect(
      hasPermission(
        {
          userId: owner.user.id,
          organizationId: owner.organizationId,
          role: owner.role,
          sessionId: "t",
        },
        "employees.manage",
      ),
    ).toBe(true);

    const manager = authenticate("alex@atlas.ai", "atlas-manager", "test");
    expect(manager.role).toBe("manager");
    expect(
      hasPermission(
        {
          userId: manager.user.id,
          organizationId: manager.organizationId,
          role: manager.role,
          sessionId: "t",
        },
        "employees.manage",
      ),
    ).toBe(false);

    const worker = authenticate("sam@atlas.ai", "atlas-worker", "test");
    expect(worker.role).toBe("employee");
    expect(
      hasPermission(
        {
          userId: worker.user.id,
          organizationId: worker.organizationId,
          role: worker.role,
          sessionId: "t",
        },
        "tasks.write",
      ),
    ).toBe(true);
  });

  it("keeps field workers tenant-scoped and lets owners provision staff", () => {
    const orgId = loadDatabase().organizations[0]!.id;
    const marcus = authenticateEmployeeLogin({
      email: "marcus@business.local",
      accessCode: "MARCUS",
      organizationId: orgId,
    });
    expect(marcus.employee.organizationId).toBe(orgId);

    const created = createEmployee(ownerCtx(), {
      name: "Pat Lee",
      email: "pat@business.local",
      role: "Installer",
      accessCode: "PATLEE",
    });
    expect(created.accessCode).toBe("PATLEE");
    expect(listEmployees(orgId).some((e) => e.email === "pat@business.local")).toBe(true);

    expect(() =>
      authenticateEmployeeLogin({
        email: "pat@business.local",
        accessCode: "PATLEE",
        organizationId: "org_other_tenant",
      }),
    ).toThrow();
  });

  it("builds business briefs from real org data and stages brain approvals", () => {
    const ctx = ownerCtx();
    const brief = JSON.parse(executeBrainTool("get_business_brief", {}, ctx).content);
    expect(brief.source).toBe("organization_database");
    expect(brief.organizationId).toBe(ctx.organizationId);
    expect(typeof brief.revenueLast30Days).toBe("number");

    const proposed = executeBrainTool(
      "propose_risky_action",
      {
        kind: "mass_sms",
        title: "Text overdue customers",
        summary: "Send collection texts",
        confirmPrompt: "Approve mass SMS?",
        doneLabel: "Approved",
        to: "+15550001111",
        body: "Please pay your overdue invoice.",
      },
      ctx,
    );
    expect(proposed.proposedAction?.approvalId).toBeTruthy();
    const db = loadDatabase();
    const row = db.approvals.find((a) => a.id === proposed.proposedAction?.approvalId);
    expect(row?.organization_id).toBe(ctx.organizationId);
    expect(row?.action_type).toBe("SEND_SMS");
    expect(row?.status).toBe("pending");
  });

  it("blocks default org fallbacks in production", () => {
    process.env.ATLAS_ENV = "production";
    expect(() => requireOrganizationId(undefined)).toThrow(ValidationError);
  });
});
