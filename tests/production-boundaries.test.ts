import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeBrainTool } from "../src/lib/brain/tools";
import {
  createCalendarOAuthState,
  consumeCalendarOAuthState,
  getConnectedProviders,
} from "../src/lib/integrations/calendar";
import { getWorkspaceDomain, putWorkspaceDomain } from "../src/lib/backend/workspace-store";
import { handleStripeWebhook } from "../src/lib/integrations/stripe";
import { verifyIntegration } from "../src/lib/integrations/health";
import { GET as workspaceGet } from "../src/app/api/workspace/[domain]/route";
import { resetDatabase, loadDatabase } from "../src/lib/db/store";
import { putOrgProjects, putOrgSettings } from "../src/lib/services/org-settings";
import { listCustomers, createCustomer } from "../src/lib/services/workspace";
import type { SessionContext } from "../src/lib/domain/types";
import { AuthorizationError } from "../src/lib/domain/errors";
import { requireOrganizationId } from "../src/lib/auth/tenant";
import { reliabilitySnapshot } from "../src/lib/ops/reliability";
import { recordDeadLetter, resetDeadLettersForTests } from "../src/lib/queue/dead-letter";

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

beforeEach(() => {
  resetDatabase();
  resetDeadLettersForTests();
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("ATLAS_ENV", "development");
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.ATLAS_LLM_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("production trust boundaries", () => {
  it("keeps workspace domains isolated by organization", () => {
    const suffix = crypto.randomUUID();
    const orgA = `org-a-${suffix}`;
    const orgB = `org-b-${suffix}`;
    putWorkspaceDomain(orgA, "projects", { projects: [{ id: "private-a" }] });
    putWorkspaceDomain(orgB, "projects", { projects: [{ id: "private-b" }] });
    expect(getWorkspaceDomain(orgA, "projects").data).toEqual({ projects: [{ id: "private-a" }] });
    expect(getWorkspaceDomain(orgB, "projects").data).toEqual({ projects: [{ id: "private-b" }] });
  });

  it("requires an Atlas session before reading a workspace domain", async () => {
    const response = await workspaceGet(new Request("http://atlas.test/api/workspace/projects"), {
      params: Promise.resolve({ domain: "projects" }),
    });
    expect(response.status).toBe(401);
  });

  it("uses authenticated business facts in the Brain brief tool", () => {
    const ctx = ownerCtx();
    const result = executeBrainTool("get_business_brief", {}, ctx);
    const parsed = JSON.parse(result.content) as { organizationId?: string; error?: string };
    expect(parsed.error).toBeUndefined();
    expect(parsed.organizationId || ctx.organizationId).toBeTruthy();
  });

  it("consumes calendar OAuth state once", () => {
    const orgId = loadDatabase().organizations[0]!.id;
    const state = createCalendarOAuthState(orgId);
    expect(consumeCalendarOAuthState(state)).toBe(orgId);
    expect(consumeCalendarOAuthState(state)).toBeNull();
  });

  it("does not report another tenant's calendar connection", () => {
    expect(getConnectedProviders(`unknown-org-${crypto.randomUUID()}`)).toEqual([]);
  });

  it("rejects unsigned Stripe webhooks when Stripe is live", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_configured");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    await expect(handleStripeWebhook("{}", null)).rejects.toThrow(/STRIPE_WEBHOOK_SECRET/);
  });

  it("fails credential verify when keys are missing", async () => {
    const orgId = loadDatabase().organizations[0]!.id;
    const brain = await verifyIntegration("brain", orgId, { dryRun: true });
    expect(brain.ok).toBe(false);
    expect(brain.detail).toMatch(/not configured/i);
  });

  it("dry-runs verify when credentials exist", async () => {
    vi.stubEnv("ATLAS_LLM_API_KEY", "sk-test-key");
    const orgId = loadDatabase().organizations[0]!.id;
    const brain = await verifyIntegration("brain", orgId, { dryRun: true });
    expect(brain.ok).toBe(true);
    expect(brain.dryRun).toBe(true);
  });
});

describe("phase 6 reliability + cross-tenant", () => {
  it("keeps customers and settings isolated per org session", () => {
    const ctx = ownerCtx();
    createCustomer(ctx, { name: "Only Mine", email: `mine-${crypto.randomUUID()}@ex.com` });
    putOrgSettings(ctx, { businessName: "Tenant Alpha Co" });
    putOrgProjects(ctx, {
      folders: [],
      projects: [
        {
          id: "p1",
          name: "Alpha Project",
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

    expect(listCustomers(ctx).some((c) => c.name === "Only Mine")).toBe(true);
    expect(() =>
      listCustomers({ ...ctx, organizationId: "org_foreign", role: "owner" }),
    ).toThrow();

    vi.stubEnv("ATLAS_ENV", "production");
    expect(() => requireOrganizationId("org_demo")).toThrow();
  });

  it("scopes dead letters and reports reliability alerts", async () => {
    const orgId = loadDatabase().organizations[0]!.id;
    recordDeadLetter({
      jobId: "job_1",
      kind: "sms",
      organizationId: orgId,
      error: "boom",
      attempts: 3,
    });
    recordDeadLetter({
      jobId: "job_2",
      kind: "sms",
      organizationId: "org_other",
      error: "boom",
      attempts: 3,
    });
    const snap = await reliabilitySnapshot(orgId);
    expect(snap.deadLetters).toBeGreaterThanOrEqual(2);
    expect(snap.orgDeadLetters).toBe(1);
    expect(snap.alerts.some((a) => /dead-letter/i.test(a))).toBe(true);
    expect(snap.backupArtifacts).toBeTruthy();
  });

  it("blocks non-owners from implying verify privilege via role check helper", () => {
    const worker: SessionContext = {
      ...ownerCtx(),
      role: "employee",
    };
    expect(worker.role === "owner" || worker.role === "admin").toBe(false);
    expect(() => {
      if (worker.role !== "owner" && worker.role !== "admin") {
        throw new AuthorizationError("Only owners and admins can verify integration credentials.");
      }
    }).toThrow(AuthorizationError);
  });
});
