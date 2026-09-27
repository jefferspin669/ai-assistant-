import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../src/lib/db/store";
import { authenticate } from "../src/lib/auth/session";
import { GET as atlasGet, POST as atlasPost } from "../src/app/api/atlas/[...path]/route";
import { NextRequest } from "next/server";

function cookieForOwner() {
  const auth = authenticate("demo@atlas.ai", "atlas-demo", "atlas-lockdown");
  return `atlas_session=${auth.token}`;
}

function req(method: string, path: string[], body?: unknown, cookie?: string) {
  const url = `http://localhost/api/atlas/${path.join("/")}`;
  const init: RequestInit = {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest(url, init);
}

describe("/api/atlas catch-all lockdown", () => {
  beforeEach(() => {
    resetDatabase();
    delete process.env.ATLAS_ENV;
  });

  it("allows public meta health without a session", async () => {
    const res = await atlasGet(req("GET", ["meta", "health"]), {
      params: Promise.resolve({ path: ["meta", "health"] }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok === true || json.success === true || json.data || json.status).toBeTruthy();
  });

  it("rejects listing users without a session", async () => {
    const res = await atlasGet(req("GET", ["users"]), {
      params: Promise.resolve({ path: ["users"] }),
    });
    expect(res.status).toBeGreaterThanOrEqual(401);
  });

  it("scopes businesses to the authenticated organization", async () => {
    const cookie = cookieForOwner();
    const res = await atlasGet(req("GET", ["businesses"], undefined, cookie), {
      params: Promise.resolve({ path: ["businesses"] }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    const rows = json.data || [];
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);
  });

  it("ignores body organization_id when inviting members", async () => {
    const cookie = cookieForOwner();
    const auth = authenticate("demo@atlas.ai", "atlas-demo", "atlas-lockdown-2");
    const res = await atlasPost(
      req(
        "POST",
        ["organization-members", "invite"],
        {
          organization_id: "org_other_tenant",
          email: "worker.lock@example.com",
          full_name: "Lock Worker",
          role: "employee",
        },
        cookie,
      ),
      { params: Promise.resolve({ path: ["organization-members", "invite"] }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    // Invite must bind to the session org, never the forged body org.
    if (json.data?.organization_id) {
      expect(json.data.organization_id).toBe(auth.organizationId);
    }
    expect(json.data?.organization_id !== "org_other_tenant").toBe(true);
  });
});
