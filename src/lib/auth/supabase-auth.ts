/**
 * Supabase Auth alongside the existing atlas_session cookie.
 * When configured, Bearer tokens and sign-in go through Supabase Auth.
 * Local users/orgs still live in the Atlas database (Postgres when live).
 */

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { loadDatabase, newId, nowIso, saveDatabase } from "@/lib/db/store";
import { createSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/secure-store";
import type { OrgRole, SessionContext } from "@/lib/domain/types";

export function supabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export function createSupabaseAuthClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function userFromSupabaseAccessToken(accessToken: string) {
  const client = createSupabaseAuthClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

export async function signInWithSupabase(email: string, password: string) {
  const client = createSupabaseAuthClient();
  if (!client) return null;
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;
  return data;
}

export async function signUpWithSupabase(email: string, password: string) {
  const client = createSupabaseAuthClient();
  if (!client) return null;
  const { data, error } = await client.auth.signUp({ email, password });
  if (error || !data.user) return { error: error?.message || "Supabase sign-up failed" };
  return { user: data.user };
}

export async function provisionAtlasUserFromSupabase(
  user: User,
): Promise<{ ctx: SessionContext; token: string }> {
  await ensureServerDatabase();
  const email = (user.email || "").trim().toLowerCase();
  if (!email) throw new Error("Supabase user has no email.");
  const db = loadDatabase();
  let atlasUser = db.users.find((row) => row.email === email);
  const stamp = nowIso();

  if (!atlasUser) {
    const userId = newId("user");
    const orgId = newId("org");
    atlasUser = {
      id: userId,
      email,
      full_name: (user.user_metadata?.full_name as string | undefined) || email.split("@")[0] || "Atlas User",
      profile_image: null,
      timezone: "America/Chicago",
      preferred_language: "en",
      email_verified_at: user.email_confirmed_at || stamp,
      created_at: stamp,
      updated_at: stamp,
    };
    saveDatabase({
      ...db,
      users: [atlasUser, ...db.users],
      user_credentials: [
        {
          user_id: userId,
          password_hash: hashPassword(`supabase:${user.id}`),
          mfa_secret: null,
          mfa_enabled: false,
        },
        ...db.user_credentials,
      ],
      organizations: [
        {
          id: orgId,
          owner_id: userId,
          business_name: "My Business",
          logo_url: null,
          business_type: "service",
          tax_structure: "LLC",
          state: "TX",
          created_at: stamp,
        },
        ...db.organizations,
      ],
      organization_members: [
        {
          id: newId("om"),
          organization_id: orgId,
          user_id: userId,
          role: "owner",
          status: "active",
          joined_at: stamp,
        },
        ...db.organization_members,
      ],
    });
  }

  const latest = loadDatabase();
  const member = latest.organization_members.find(
    (row) => row.user_id === atlasUser!.id && row.status === "active",
  );
  if (!member) throw new Error("No active organization membership.");
  const session = createSession(atlasUser.id, member.organization_id, "supabase");
  return {
    token: session.token,
    ctx: {
      userId: atlasUser.id,
      organizationId: member.organization_id,
      role: member.role as OrgRole,
      sessionId: session.sessionId,
    },
  };
}

export function supabaseAccessTokenFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization") || "";
  if (/^bearer\s+/i.test(header)) {
    const token = header.replace(/^bearer\s+/i, "").trim();
    if (token && token !== (process.env.CRON_SECRET || "").trim()) return token;
  }
  const cookieHeader = req.headers.get("cookie") || "";
  for (const name of ["sb-access-token", "atlas_supabase_access"]) {
    const parts = cookieHeader.split(";").map((part) => part.trim());
    for (const part of parts) {
      if (part.startsWith(`${name}=`)) return decodeURIComponent(part.slice(name.length + 1));
    }
  }
  return null;
}
