import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { listApprovals } from "@/lib/services/approvals";
import { resolveApproval } from "@/lib/domain/actions";

export async function GET(req: Request) {
  try {
    const ctx = resolveSession(req);
    return apiResponse(ok(listApprovals(ctx)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = resolveSession(req);
    const body = asRecord(await readJson(req));
    const decision = body.decision === "rejected" ? "rejected" : "approved";
    return apiResponse(ok(resolveApproval(ctx, String(body.id || body.approvalId || ""), decision)));
  } catch (error) {
    return jsonError(error);
  }
}
