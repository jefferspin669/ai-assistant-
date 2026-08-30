import { sessionFromToken, readCookie } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResult } from "@/lib/api/types";
import { err } from "@/lib/api/types";
import { isAtlasError } from "@/lib/domain/errors";
import type { SessionContext } from "@/lib/domain/types";

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
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

/** Identity comes only from the session cookie — never from body or client headers. */
export function resolveSession(req: Request, _body?: Record<string, unknown>): SessionContext {
  void _body;
  return sessionFromToken(readCookie(req));
}

/** @deprecated Use resolveSession. */
export function resolveUserId(req: Request, _bodyUserId?: string) {
  void _bodyUserId;
  return resolveSession(req).userId;
}
