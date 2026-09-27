import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { processJobs } from "@/lib/services/jobs";
import { requirePermission } from "@/lib/auth/permissions";

export async function POST(req: Request) {
  try {
    const ctx = await resolveSession(req);
    requirePermission(ctx, "atlas.autonomous");
    return apiResponse(ok(processJobs()));
  } catch (error) {
    return jsonError(error);
  }
}
