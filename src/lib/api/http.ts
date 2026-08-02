import { NextResponse } from "next/server";
import type { ApiResult } from "@/lib/api/types";

export async function readJson<T extends Record<string, unknown> = Record<string, unknown>>(
  req: Request,
): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export function apiResponse<T>(result: ApiResult<T>) {
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, data: result.data });
}

export function resolveUserId(req: Request, bodyUserId?: string) {
  return (
    bodyUserId ||
    req.headers.get("x-user-id") ||
    new URL(req.url).searchParams.get("user_id") ||
    ""
  );
}
