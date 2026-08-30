import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { drainQueue } from "@/backend/jobs/queue";
import { requirePermission } from "@/lib/auth/permissions";

export async function POST(req: Request) {
  try {
    const ctx = resolveSession(req);
    requirePermission(ctx, "atlas.autonomous");
    return apiResponse(ok(drainQueue()));
  } catch (error) {
    return jsonError(error);
  }
}
