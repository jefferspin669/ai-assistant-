import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyOrganization, resetDatabase } from "../src/lib/db/store";
import { database } from "../src/lib/services/access";
import { createSession, cookieHeader } from "../src/lib/auth/session";
import { getWorkspaceDomain } from "../src/lib/backend/workspace-store";
import { GET as customersGet, POST as customersPost } from "../src/app/api/customers/route";
import { GET as customerGet } from "../src/app/api/customers/[id]/route";
import { GET as workspaceGet, PUT as workspacePut } from "../src/app/api/workspace/[domain]/route";

/**
 * Real two-business security trial at the HTTP API boundary.
 * Business A must never read Business B's customers or workspace bags.
 */
describe("two-business security trial", () => {
  beforeEach(() => {
    resetDatabase();
  });

  function sessionCookie(userId: string, organizationId: string) {
    const { token } = createSession(userId, organizationId, "security-trial");
    return cookieHeader(token);
  }

  it("isolates customers and workspace domains across two businesses via HTTP", async () => {
    const db = database();
    const orgA = db.organizations[0]!;
    const userA = db.users[0]!;
    const bizB = createEmptyOrganization({
      businessName: "Beta Plumbing LLC",
      ownerEmail: `beta-${crypto.randomUUID()}@trial.test`,
      ownerName: "Beta Owner",
      password: "atlas-demo",
    });

    const cookieA = sessionCookie(userA.id, orgA.id);
    const cookieB = sessionCookie(bizB.userId, bizB.orgId);

    const createA = await customersPost(
      new Request("http://atlas.test/api/customers", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: cookieA },
        body: JSON.stringify({
          name: "Alpha Only Customer",
          email: "alpha@ex.com",
          phone: "+15551110001",
        }),
      }),
    );
    expect(createA.status).toBe(200);
    const createdA = (await createA.json()).data;
    expect(createdA.id).toBeTruthy();

    const createB = await customersPost(
      new Request("http://atlas.test/api/customers", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: cookieB },
        body: JSON.stringify({
          name: "Beta Only Customer",
          email: "beta@ex.com",
          phone: "+15552220002",
        }),
      }),
    );
    expect(createB.status).toBe(200);
    const createdB = (await createB.json()).data;

    const listA = await customersGet(
      new Request("http://atlas.test/api/customers", { headers: { cookie: cookieA } }),
    );
    const listB = await customersGet(
      new Request("http://atlas.test/api/customers", { headers: { cookie: cookieB } }),
    );
    const namesA = ((await listA.json()).data as { name: string }[]).map((c) => c.name);
    const namesB = ((await listB.json()).data as { name: string }[]).map((c) => c.name);
    expect(namesA).toContain("Alpha Only Customer");
    expect(namesA).not.toContain("Beta Only Customer");
    expect(namesB).toContain("Beta Only Customer");
    expect(namesB).not.toContain("Alpha Only Customer");

    const leak = await customerGet(
      new Request(`http://atlas.test/api/customers/${createdB.id}`, {
        headers: { cookie: cookieA },
      }),
      { params: Promise.resolve({ id: createdB.id }) },
    );
    expect(leak.status).toBe(404);

    const putA = await workspacePut(
      new Request("http://atlas.test/api/workspace/tasks", {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: cookieA },
        body: JSON.stringify({ data: { secret: "alpha-tasks" } }),
      }),
      { params: Promise.resolve({ domain: "tasks" }) },
    );
    expect(putA.status).toBe(200);

    const readB = await workspaceGet(
      new Request("http://atlas.test/api/workspace/tasks", { headers: { cookie: cookieB } }),
      { params: Promise.resolve({ domain: "tasks" }) },
    );
    const bagB = (await readB.json()).data;
    expect(bagB.data).not.toEqual({ secret: "alpha-tasks" });
    expect(getWorkspaceDomain(bizB.orgId, "tasks").data).not.toEqual({ secret: "alpha-tasks" });
    expect(getWorkspaceDomain(orgA.id, "tasks").data).toEqual({ secret: "alpha-tasks" });
  });

  it("rejects unauthenticated customer and workspace access", async () => {
    const customers = await customersGet(new Request("http://atlas.test/api/customers"));
    expect(customers.status).toBe(401);
    const workspace = await workspaceGet(new Request("http://atlas.test/api/workspace/tasks"), {
      params: Promise.resolve({ domain: "tasks" }),
    });
    expect(workspace.status).toBe(401);
  });
});
