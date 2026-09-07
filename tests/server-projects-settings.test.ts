import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, loadDatabase } from "../src/lib/db/store";
import { putWorkspaceDomain, loadWorkspace } from "../src/lib/backend/workspace-store";
import { getOrgProjects, getOrgSettings, putOrgProjects, putOrgSettings } from "../src/lib/services/org-settings";
import { isWorkspaceDomain, WORKSPACE_DOMAINS } from "../src/lib/backend/domains";
import type { SessionContext } from "../src/lib/domain/types";

function ownerCtx(organizationId?: string): SessionContext {
  const db = loadDatabase();
  const org = db.organizations.find((o) => o.id === organizationId) || db.organizations[0]!;
  const user = db.users.find((u) => u.email === "demo@atlas.ai")!;
  return {
    userId: user.id,
    organizationId: org.id,
    role: "owner",
    sessionId: "test",
  };
}

describe("phase 3 server projects + settings", () => {
  beforeEach(() => {
    resetDatabase();
    delete process.env.ATLAS_ENV;
  });

  it("registers projects and settings workspace domains", () => {
    expect(isWorkspaceDomain("projects")).toBe(true);
    expect(isWorkspaceDomain("settings")).toBe(true);
    expect(WORKSPACE_DOMAINS).toContain("projects");
    expect(WORKSPACE_DOMAINS).toContain("settings");
  });

  it("keeps projects tenant-scoped on the server store", () => {
    const orgA = loadDatabase().organizations[0]!.id;
    putOrgProjects(ownerCtx(orgA), {
      folders: [],
      projects: [
        {
          id: "proj-a",
          name: "Tenant A only",
          description: "",
          status: "active",
          progress: 0,
          priority: "Normal",
          dueDate: "",
          budget: "",
          spent: "$0",
          teamMemberIds: [],
          milestones: [],
          tasks: [],
          files: [],
          comments: [],
          activity: [],
          riskWarnings: [],
          aiSuggestions: [],
          createdAt: new Date().toISOString(),
        },
      ],
    });

    expect(getOrgProjects(ownerCtx(orgA)).projects[0]?.name).toBe("Tenant A only");
    expect(loadWorkspace("org_other").domains.projects).toBeUndefined();
  });

  it("writes settings to org row + workspace domain", () => {
    const ctx = ownerCtx();
    const saved = putOrgSettings(ctx, {
      businessName: "Phase Three HVAC",
      businessType: "HVAC",
      taxStructure: "S-Corp",
      state: "AZ",
      timezone: "America/Phoenix",
      preferredLanguage: "en",
    });
    expect(saved.businessName).toBe("Phase Three HVAC");
    expect(getOrgSettings(ctx).businessName).toBe("Phase Three HVAC");

    const org = loadDatabase().organizations.find((o) => o.id === ctx.organizationId)!;
    expect(org.business_name).toBe("Phase Three HVAC");
    expect(org.state).toBe("AZ");

    const bag = loadWorkspace(ctx.organizationId);
    expect((bag.domains.settings as { businessName?: string } | undefined)?.businessName).toBe(
      "Phase Three HVAC",
    );
  });

  it("isolates workspace domain writes between orgs", () => {
    putWorkspaceDomain("org_a", "projects", { projects: [{ id: "1" }], folders: [] });
    putWorkspaceDomain("org_b", "projects", { projects: [{ id: "2" }], folders: [] });
    expect((loadWorkspace("org_a").domains.projects as { projects: { id: string }[] }).projects[0]?.id).toBe(
      "1",
    );
    expect((loadWorkspace("org_b").domains.projects as { projects: { id: string }[] }).projects[0]?.id).toBe(
      "2",
    );
  });
});
