import { beforeEach, describe, expect, it, vi } from "vitest";
import { getWorkspaceDomain, putWorkspaceDomain } from "../src/lib/backend/workspace-store";
import { GET as workspaceGet } from "../src/app/api/workspace/[domain]/route";
import { resetDatabase, loadDatabase } from "../src/lib/db/store";
import { requireOrganizationId } from "../src/lib/auth/tenant";
import { mintDevSession } from "../src/lib/auth/session";
import { isProduction } from "../src/lib/ops/environment";

beforeEach(() => {
  resetDatabase();
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("ATLAS_ENV", "development");
});

describe("production trust boundaries", () => {
  it("keeps workspace domains isolated by organization", () => {
    const suffix = crypto.randomUUID();
    const orgA = `org-a-${suffix}`;
    const orgB = `org-b-${suffix}`;
    putWorkspaceDomain(orgA, "tasks", { items: [{ id: "private-a" }] });
    putWorkspaceDomain(orgB, "tasks", { items: [{ id: "private-b" }] });
    expect(getWorkspaceDomain(orgA, "tasks").data).toEqual({ items: [{ id: "private-a" }] });
    expect(getWorkspaceDomain(orgB, "tasks").data).toEqual({ items: [{ id: "private-b" }] });
  });

  it("requires an Atlas session before reading a workspace domain", async () => {
    const response = await workspaceGet(new Request("http://atlas.test/api/workspace/projects"), {
      params: Promise.resolve({ domain: "projects" }),
    });
    expect(response.status).toBe(401);
  });

  it("forbids demo org fallbacks in production", () => {
    vi.stubEnv("ATLAS_ENV", "production");
    expect(() => requireOrganizationId(undefined)).toThrow(/required/i);
    expect(() => requireOrganizationId("org_demo")).toThrow(/required/i);
    vi.stubEnv("ATLAS_ENV", "development");
    const fallback = requireOrganizationId(undefined);
    expect(fallback).toBe(loadDatabase().organizations[0]!.id);
  });

  it("refuses to mint a dev session when ATLAS_ENV is production", () => {
    vi.stubEnv("ATLAS_ENV", "production");
    expect(isProduction()).toBe(true);
    expect(() => mintDevSession()).toThrow(/disabled in production/i);
  });
});
