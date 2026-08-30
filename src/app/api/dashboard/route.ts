import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { workspaceDashboard } from "@/lib/services/dashboard";

export async function GET(req: Request) {
  try {
    const ctx = resolveSession(req);
    return apiResponse(ok(workspaceDashboard(ctx)));
  } catch (error) {
    return jsonError(error);
  }
}
