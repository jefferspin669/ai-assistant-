import { sessionFromToken, readCookie } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import type { ApiResult } from "@/lib/api/types";
import { err, ok } from "@/lib/api/types";
import { isAtlasError, AuthenticationError } from "@/lib/domain/errors";
import type { Permission, SessionContext } from "@/lib/domain/types";
import { requirePermission } from "@/lib/auth/permissions";
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

export function apiSuccess<T>(data: T, headers?: HeadersInit) {
  return apiResponse(ok(data), headers);
}

export function apiError(error: unknown) {
  return jsonError(error);
}

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  return schema.parse(body);
}

export type ApiHandlerContext = {
  req: Request;
  workspace: SessionContext;
  body: Record<string, unknown>;
};

type ApiHandler = (ctx: ApiHandlerContext) => Promise<Response> | Response;

/**
 * Session + JSON body + error conversion. `workspace` is the authenticated org session.
 * Identity never comes from the request body.
 */
export function withAuth(handler: ApiHandler) {
  return async (req: Request) => {
    try {
      const workspace = await resolveSession(req);
      const body =
        req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS"
          ? {}
          : await readJson(req);
      return await handler({ req, workspace, body });
    } catch (error) {
      return jsonError(error);
    }
  };
}

/** Alias: session already carries organizationId. */
export const withWorkspace = withAuth;

export function withPermission(permission: Permission, handler: ApiHandler) {
  return withAuth(async (ctx) => {
    requirePermission(ctx.workspace, permission);
    return handler(ctx);
  });
}
