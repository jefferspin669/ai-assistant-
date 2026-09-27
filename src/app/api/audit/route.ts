import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { requirePermission } from "@/lib/auth/permissions";
import { listAudit } from "@/lib/services/audit";

export async function GET(req: Request) {
  try {
    const ctx = await resolveSession(req);
    requirePermission(ctx, "audit.read");
    return apiResponse(ok(listAudit(ctx.organizationId)));
  } catch (error) {
    return jsonError(error);
  }
}
