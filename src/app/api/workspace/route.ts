import { NextResponse } from "next/server";
import { apiResponse, readJson } from "@/lib/api/http";
import { ok, err } from "@/lib/api/types";
import {
  WORKSPACE_DOMAINS,
  isWorkspaceDomain,
  loadWorkspace,
  putWorkspaceMany,
  workspaceStats,
} from "@/lib/backend/workspace-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return apiResponse(
    ok({
      domains: WORKSPACE_DOMAINS,
      store: loadWorkspace(),
      stats: workspaceStats(),
    }),
  );
}

export async function PUT(req: Request) {
  const body = await readJson<{ domains?: Record<string, unknown> }>(req);
  const incoming = body.domains || {};
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (isWorkspaceDomain(key)) filtered[key] = value;
  }
  if (!Object.keys(filtered).length) {
    return apiResponse(err("No valid workspace domains provided.", 422));
  }
  const store = putWorkspaceMany(filtered);
  return apiResponse(ok(store));
}

export async function POST(req: Request) {
  return PUT(req);
}
