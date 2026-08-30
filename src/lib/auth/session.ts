import { AuthenticationError } from "@/lib/domain/errors";
import type { OrgRole, SessionContext } from "@/lib/domain/types";
import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import { database } from "@/lib/services/access";
import { hashPassword, verifyPassword } from "@/lib/secure-store";

export const SESSION_COOKIE = "atlas_session";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const LOCK_AFTER = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

export function cookieHeader(token: string) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_MS / 1000)}`;
}

export function clearCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookie(req: Request, name = SESSION_COOKIE): string | null {
  const header = req.headers.get("cookie") || "";
  const parts = header.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) return part.slice(name.length + 1);
  }
  return null;
}

function randomToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  return `${Date.now()}${Math.random().toString(36).slice(2)}`;
}

export function recordLoginAttempt(email: string, success: boolean, ip: string) {
  const db = database();
  saveDatabase({
    ...db,
    login_attempts: [
      { id: newId("login"), email: email.toLowerCase(), success, at: nowIso(), ip },
      ...db.login_attempts,
    ].slice(0, 400),
  });
}

export function isLocked(email: string) {
  const since = Date.now() - LOCK_WINDOW_MS;
  const fails = database().login_attempts.filter(
    (row) => row.email === email.toLowerCase() && !row.success && +new Date(row.at) >= since,
  );
  return fails.length >= LOCK_AFTER;
}

export function createSession(userId: string, organizationId: string, deviceName = "web"): { token: string; sessionId: string } {
  const db = database();
  const value = randomToken();
  const row = {
    id: newId("sess"),
    token: value,
    user_id: userId,
    organization_id: organizationId,
    created_at: nowIso(),
    expires_at: new Date(Date.now() + SESSION_MS).toISOString(),
    revoked_at: null,
    device_name: deviceName,
  };
  saveDatabase({ ...db, sessions: [row, ...db.sessions] });
  return { token: value, sessionId: row.id };
}

export function sessionFromToken(raw: string | null): SessionContext {
  if (!raw) throw new AuthenticationError();
  const db = database();
  const row = db.sessions.find((item) => item.token === raw && !item.revoked_at);
  if (!row) throw new AuthenticationError();
  if (+new Date(row.expires_at) < Date.now()) throw new AuthenticationError("Session expired.");
  const member = db.organization_members.find(
    (item) =>
      item.user_id === row.user_id &&
      item.organization_id === row.organization_id &&
      item.status === "active",
  );
  if (!member) throw new AuthenticationError("No active organization membership.");
  return {
    userId: row.user_id,
    organizationId: row.organization_id,
    role: member.role as OrgRole,
    sessionId: row.id,
  };
}

export function revokeSession(sessionId: string) {
  const db = database();
  saveDatabase({
    ...db,
    sessions: db.sessions.map((row) =>
      row.id === sessionId ? { ...row, revoked_at: nowIso() } : row,
    ),
  });
}

export function revokeAllSessions(userId: string) {
  const db = database();
  const stamp = nowIso();
  saveDatabase({
    ...db,
    sessions: db.sessions.map((row) =>
      row.user_id === userId && !row.revoked_at ? { ...row, revoked_at: stamp } : row,
    ),
  });
}

export function createPasswordReset(userId: string) {
  const db = database();
  const resetToken = randomToken();
  saveDatabase({
    ...db,
    password_resets: [
      {
        token: resetToken,
        user_id: userId,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        used_at: null,
      },
      ...db.password_resets,
    ],
  });
  return resetToken;
}

export function consumePasswordReset(resetToken: string, password: string) {
  const db = database();
  const row = db.password_resets.find((item) => item.token === resetToken && !item.used_at);
  if (!row || +new Date(row.expires_at) < Date.now()) {
    throw new AuthenticationError("Reset link is invalid or expired.");
  }
  saveDatabase({
    ...db,
    password_resets: db.password_resets.map((item) =>
      item.token === resetToken ? { ...item, used_at: nowIso() } : item,
    ),
    user_credentials: db.user_credentials.map((item) =>
      item.user_id === row.user_id ? { ...item, password_hash: hashPassword(password) } : item,
    ),
    sessions: db.sessions.map((item) =>
      item.user_id === row.user_id && !item.revoked_at ? { ...item, revoked_at: nowIso() } : item,
    ),
  });
  return row.user_id;
}

export function authenticate(emailRaw: string, password: string, ip: string) {
  const email = emailRaw.trim().toLowerCase();
  if (isLocked(email)) {
    throw new AuthenticationError("Account is locked after too many failed logins.");
  }
  const db = database();
  const user = db.users.find((row) => row.email === email);
  const credential = user
    ? db.user_credentials.find((row) => row.user_id === user.id)
    : undefined;
  if (!user || !credential || !verifyPassword(password, credential.password_hash)) {
    recordLoginAttempt(email, false, ip);
    throw new AuthenticationError("Email or password doesn’t match.");
  }
  recordLoginAttempt(email, true, ip);
  const member = db.organization_members.find(
    (row) => row.user_id === user.id && row.status === "active",
  );
  if (!member) throw new AuthenticationError("No active organization membership.");
  const session = createSession(user.id, member.organization_id);
  return {
    user,
    organizationId: member.organization_id,
    role: member.role as OrgRole,
    ...session,
    mfaRequired: Boolean(credential.mfa_enabled),
  };
}

export function mintDevSession(): { token: string; ctx: SessionContext } {
  const db = database();
  const user = db.users[0];
  const org = db.organizations[0];
  if (!user || !org) throw new AuthenticationError("No workspace is seeded.");
  const session = createSession(user.id, org.id, "dev-bootstrap");
  const member = db.organization_members.find(
    (row) => row.user_id === user.id && row.organization_id === org.id,
  );
  return {
    token: session.token,
    ctx: {
      userId: user.id,
      organizationId: org.id,
      role: (member?.role as OrgRole) || "owner",
      sessionId: session.sessionId,
    },
  };
}

export function createEmailVerification(userId: string) {
  const db = database();
  const verifyToken = randomToken();
  saveDatabase({
    ...db,
    email_verifications: [
      {
        token: verifyToken,
        user_id: userId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used_at: null,
      },
      ...db.email_verifications,
    ],
  });
  return verifyToken;
}

export function verifyEmail(verifyToken: string) {
  const db = database();
  const row = db.email_verifications.find((item) => item.token === verifyToken && !item.used_at);
  if (!row || +new Date(row.expires_at) < Date.now()) {
    throw new AuthenticationError("Verification link is invalid or expired.");
  }
  saveDatabase({
    ...db,
    email_verifications: db.email_verifications.map((item) =>
      item.token === verifyToken ? { ...item, used_at: nowIso() } : item,
    ),
    users: db.users.map((user) =>
      user.id === row.user_id ? { ...user, email_verified_at: nowIso() } : user,
    ),
  });
}

export function enableMfa(userId: string, secret: string) {
  const db = database();
  saveDatabase({
    ...db,
    user_credentials: db.user_credentials.map((row) =>
      row.user_id === userId ? { ...row, mfa_secret: secret, mfa_enabled: true } : row,
    ),
  });
}

