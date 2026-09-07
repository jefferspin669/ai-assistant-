import "server-only";
import { randomBytes } from "crypto";
import { AuthenticationError, ConflictError, ValidationError } from "@/lib/domain/errors";
import type { OrgRole, SessionContext } from "@/lib/domain/types";
import { requirePermission } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/integrations/config";
import { sendEmail } from "@/lib/integrations/resend";
import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { DbOrganizationInvite, OrgMemberRole } from "@/lib/db/schema";
import { database } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";
import { provisionEmployee } from "@/lib/services/employees";
import { isProduction } from "@/lib/ops/environment";

function inviteToken() {
  return randomBytes(24).toString("hex");
}

export async function createOrganizationInvite(
  ctx: SessionContext,
  input: { email: string; role?: OrgRole; fullName?: string },
) {
  requirePermission(ctx, "employees.manage");
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new ValidationError("Valid email required.");
  const role = (input.role || "employee") as OrgMemberRole;
  if (role === "owner") throw new ValidationError("Cannot invite someone as owner.");

  const db = database();
  const org = db.organizations.find((o) => o.id === ctx.organizationId);
  if (!org) throw new ValidationError("Organization not found.");

  const existingUser = db.users.find((u) => u.email === email);
  if (
    existingUser &&
    db.organization_members.some(
      (m) =>
        m.organization_id === ctx.organizationId &&
        m.user_id === existingUser.id &&
        (m.status === "active" || m.status === "invited"),
    )
  ) {
    throw new ConflictError("That person is already a member or has a pending invite.");
  }

  const token = inviteToken();
  const invite: DbOrganizationInvite = {
    token,
    organization_id: ctx.organizationId,
    email,
    role,
    invited_by: ctx.userId,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: null,
    created_at: nowIso(),
  };

  saveDatabase({
    ...db,
    organization_invites: [invite, ...db.organization_invites.filter((i) => !(i.email === email && i.organization_id === ctx.organizationId && !i.accepted_at))],
  });

  writeAudit(ctx, {
    action: `invited ${email} as ${role}`,
    entityType: "organization_invite",
    entityId: token.slice(0, 12),
  });

  const acceptUrl = `${getAppUrl()}/invite?token=${encodeURIComponent(token)}`;
  const mail = await sendEmail({
    to: email,
    subject: `You're invited to ${org.business_name} on Atlas`,
    text: [
      `You've been invited to join ${org.business_name} as ${role}.`,
      ``,
      `Accept your invite: ${acceptUrl}`,
      ``,
      `This link expires in 7 days.`,
    ].join("\n"),
    organizationId: ctx.organizationId,
  });

  return {
    invite: {
      email,
      role,
      organizationId: ctx.organizationId,
      expiresAt: invite.expires_at,
    },
    acceptUrl,
    /** Dev-only — never returned in production. */
    token: isProduction() ? undefined : token,
    email: mail.ok
      ? { sent: true, simulated: "simulated" in mail ? mail.simulated : false }
      : { sent: false, error: !mail.ok ? mail.error : undefined },
  };
}

export function peekInvite(token: string) {
  const invite = database().organization_invites.find((i) => i.token === token);
  if (!invite || invite.accepted_at) throw new AuthenticationError("Invite is invalid or already used.");
  if (+new Date(invite.expires_at) < Date.now()) throw new AuthenticationError("Invite has expired.");
  const org = database().organizations.find((o) => o.id === invite.organization_id);
  return {
    email: invite.email,
    role: invite.role,
    organizationId: invite.organization_id,
    organizationName: org?.business_name || "Atlas",
    expiresAt: invite.expires_at,
  };
}

export function acceptOrganizationInvite(input: {
  token: string;
  password: string;
  fullName: string;
}) {
  const password = input.password;
  if (password.length < 8) throw new ValidationError("Password must be at least 8 characters.");
  const fullName = input.fullName.trim();
  if (!fullName) throw new ValidationError("Name is required.");

  const db = database();
  const invite = db.organization_invites.find((i) => i.token === input.token);
  if (!invite || invite.accepted_at) throw new AuthenticationError("Invite is invalid or already used.");
  if (+new Date(invite.expires_at) < Date.now()) throw new AuthenticationError("Invite has expired.");

  const stamp = nowIso();
  let user = db.users.find((u) => u.email === invite.email);
  let userId = user?.id;
  let nextUsers = db.users;
  let nextCredentials = db.user_credentials;
  let nextMembers = db.organization_members;

  if (!userId) {
    userId = newId("user");
    nextUsers = [
      {
        id: userId,
        email: invite.email,
        full_name: fullName,
        profile_image: null,
        timezone: "America/Chicago",
        preferred_language: "en",
        email_verified_at: stamp,
        created_at: stamp,
        updated_at: stamp,
      },
      ...db.users,
    ];
    nextCredentials = [
      {
        user_id: userId,
        password_hash: hashPassword(password),
        mfa_secret: null,
        mfa_enabled: false,
      },
      ...db.user_credentials,
    ];
  } else {
    nextUsers = db.users.map((u) =>
      u.id === userId ? { ...u, full_name: fullName, updated_at: stamp, email_verified_at: u.email_verified_at || stamp } : u,
    );
    const hasCred = db.user_credentials.some((c) => c.user_id === userId);
    nextCredentials = hasCred
      ? db.user_credentials.map((c) =>
          c.user_id === userId ? { ...c, password_hash: hashPassword(password) } : c,
        )
      : [
          {
            user_id: userId,
            password_hash: hashPassword(password),
            mfa_secret: null,
            mfa_enabled: false,
          },
          ...db.user_credentials,
        ];
  }

  const existingMember = nextMembers.find(
    (m) => m.organization_id === invite.organization_id && m.user_id === userId,
  );
  if (existingMember) {
    nextMembers = nextMembers.map((m) =>
      m.id === existingMember.id
        ? { ...m, status: "active" as const, role: invite.role, joined_at: stamp }
        : m,
    );
  } else {
    nextMembers = [
      {
        id: newId("om"),
        organization_id: invite.organization_id,
        user_id: userId!,
        role: invite.role,
        status: "active",
        joined_at: stamp,
      },
      ...nextMembers,
    ];
  }

  saveDatabase({
    ...db,
    users: nextUsers,
    user_credentials: nextCredentials,
    organization_members: nextMembers,
    organization_invites: db.organization_invites.map((i) =>
      i.token === invite.token ? { ...i, accepted_at: stamp } : i,
    ),
  });

  const sessionCtx: SessionContext = {
    userId: userId!,
    organizationId: invite.organization_id,
    role: invite.role as OrgRole,
    sessionId: "invite-accept",
  };
  writeAudit(sessionCtx, {
    action: `accepted invite as ${invite.role}`,
    entityType: "organization_invite",
    entityId: invite.token.slice(0, 12),
  });

  // Field workers also get an employee portal roster row.
  if (invite.role === "employee") {
    try {
      provisionEmployee(
        invite.organization_id,
        {
          name: fullName,
          email: invite.email,
          role: "Team member",
          department: "Operations",
        },
        sessionCtx,
      );
    } catch {
      /* already on roster */
    }
  }

  const session = createSession(userId!, invite.organization_id, "invite-accept");
  return {
    userId: userId!,
    organizationId: invite.organization_id,
    role: invite.role,
    token: session.token,
    sessionId: session.sessionId,
  };
}
