import { apiSuccess, withWorkspace } from "@/lib/api/http";
import { listApprovals } from "@/lib/services/approvals";
import { resolveApproval } from "@/lib/domain/actions";

export const GET = withWorkspace(async ({ workspace }) => {
  return apiSuccess(listApprovals(workspace));
});

export const POST = withWorkspace(async ({ workspace, body }) => {
  const decision = body.decision === "rejected" ? "rejected" : "approved";
  return apiSuccess(resolveApproval(workspace, String(body.id || body.approvalId || ""), decision));
});
