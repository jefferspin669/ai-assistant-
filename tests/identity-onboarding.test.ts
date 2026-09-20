import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, loadDatabase, saveDatabase, newId, nowIso } from "../src/lib/db/store";
import {
  authenticate,
  consumePasswordReset,
  createPasswordReset,
  createSession,
  listMemberships,
  switchOrganization,
} from "../src/lib/auth/session";
import {
  acceptOrganizationInvite,
  createOrganizationInvite,
  peekInvite,
} from "../src/lib/services/invitations";
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

describe("identity onboarding: invite, recovery, org switch", () => {
  beforeEach(() => {
    resetDatabase();
    delete process.env.ATLAS_ENV;
  });

  it("creates an invite, peeks it, and accepts into membership + session", async () => {
    const invite = await createOrganizationInvite(ownerCtx(), {
      email: "newhire@example.com",
      role: "employee",
      fullName: "New Hire",
    });
    expect(invite.token).toBeTruthy();
    expect(invite.acceptUrl).toContain("/invite?token=");

    const peek = peekInvite(invite.token!);
    expect(peek.email).toBe("newhire@example.com");
    expect(peek.role).toBe("employee");

    const accepted = acceptOrganizationInvite({
      token: invite.token!,
      password: "hire-pass-99",
      fullName: "New Hire",
    });
    expect(accepted.organizationId).toBe(ownerCtx().organizationId);
    expect(accepted.role).toBe("employee");
    expect(accepted.token).toBeTruthy();

    const login = authenticate("newhire@example.com", "hire-pass-99", "test");
    expect(login.role).toBe("employee");
    expect(login.organizationId).toBe(accepted.organizationId);
  });

  it("switches session between two active memberships", () => {
    const db = loadDatabase();
    const user = db.users.find((u) => u.email === "demo@atlas.ai")!;
    const primaryOrg = db.organizations[0]!;
    const stamp = nowIso();
    const secondOrgId = newId("org");

    saveDatabase({
      ...db,
      organizations: [
        ...db.organizations,
        {
          ...primaryOrg,
          id: secondOrgId,
          business_name: "Second Co",
          created_at: stamp,
        },
      ],
      organization_members: [
        ...db.organization_members,
        {
          id: newId("om"),
          organization_id: secondOrgId,
          user_id: user.id,
          role: "admin",
          status: "active",
          joined_at: stamp,
        },
      ],
    });

    const memberships = listMemberships(user.id);
    expect(memberships.length).toBeGreaterThanOrEqual(2);
    expect(memberships.some((m) => m.organizationId === secondOrgId)).toBe(true);

    const session = createSession(user.id, primaryOrg.id, "test");
    const switched = switchOrganization(
      {
        userId: user.id,
        organizationId: primaryOrg.id,
        role: "owner",
        sessionId: session.sessionId,
      },
      secondOrgId,
    );
    expect(switched.ctx.organizationId).toBe(secondOrgId);
    expect(switched.ctx.role).toBe("admin");
    expect(switched.token).toBeTruthy();
  });

  it("issues and consumes a password reset token", () => {
    const user = loadDatabase().users.find((u) => u.email === "demo@atlas.ai")!;
    const token = createPasswordReset(user.id);
    expect(token.length).toBeGreaterThan(10);

    const userId = consumePasswordReset(token, "atlas-demo-new");
    expect(userId).toBe(user.id);

    const login = authenticate("demo@atlas.ai", "atlas-demo-new", "test");
    expect(login.user.id).toBe(user.id);

    expect(() => consumePasswordReset(token, "another-pass")).toThrow();
  });
});
