import { sessionFromToken, readCookie } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResult } from "@/lib/api/types";
import { err } from "@/lib/api/types";
import { isAtlasError, AuthenticationError } from "@/lib/domain/errors";
import type { SessionContext } from "@/lib/domain/types";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { readCachedSession } from "@/lib/auth/session-cache";
import {
  provisionAtlasUserFromSupabase,
  supabaseAccessTokenFromRequest,
  supabaseAuthConfigured,
  userFromSupabaseAccessToken,
} from "@/lib/auth/supabase-auth";

export async function readJson<T extends Record<string, unknown> = Record<string, unknown>>(
  req: Request,
): Promise<T> {
  try {
    return asRecord(await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function apiResponse<T>(result: ApiResult<T>, headers?: HeadersInit) {
  if (!result.success) {
    return NextResponse.json(
      { success: false, ok: false, error: result.error },
      { status: result.status, headers },
    );
  }
  return NextResponse.json({ success: true, ok: true, data: result.data }, { headers });
}

export function jsonError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message || "Invalid request.";
    return apiResponse(err(message, 400));
  }
  if (isAtlasError(error)) {
    return apiResponse(err(error.message, error.status));
  }
  if (error instanceof Error) {
    return apiResponse(err(error.message, 500));
  }
  return apiResponse(err("Unexpected error.", 500));
}

/** Identity comes from the session cookie, Redis session cache, or Supabase Auth — never from body userId. */
export async function resolveSession(req: Request, _body?: Record<string, unknown>): Promise<SessionContext> {
  void _body;
  await ensureServerDatabase();
  const cookie = readCookie(req);
  if (cookie) {
    const cached = await readCachedSession(cookie);
    if (cached) {
      return {
        userId: cached.userId,
        organizationId: cached.organizationId,
        role: cached.role as SessionContext["role"],
        sessionId: cached.sessionId,
      };
    }
    return sessionFromToken(cookie);
  }
  if (supabaseAuthConfigured()) {
    const access = supabaseAccessTokenFromRequest(req);
    if (access) {
      const user = await userFromSupabaseAccessToken(access);
      if (user) {
        const provisioned = await provisionAtlasUserFromSupabase(user);
        return provisioned.ctx;
      }
    }
  }
  throw new AuthenticationError();
}

/** @deprecated Use resolveSession. */
export async function resolveUserId(req: Request, _bodyUserId?: string) {
  void _bodyUserId;
  return (await resolveSession(req)).userId;
}
