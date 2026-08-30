import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { err, ok } from "@/lib/api/types";
import { requirePermission } from "@/lib/auth/permissions";
import {
  askAtlasAboutApproval,
  demoVendorPayment,
  isAutonomyKind,
  pendingAutonomyCards,
  submitWork,
} from "@/lib/autonomy";
import type { WorkIntent } from "@/lib/autonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ctx = resolveSession(req);
    requirePermission(ctx, "atlas.autonomous");
    const body = asRecord(await readJson(req));

    if (typeof body.askApprovalId === "string" && body.askApprovalId) {
      const asked = askAtlasAboutApproval(ctx, body.askApprovalId);
      if (!asked) return apiResponse(err("Approval not found.", 404));
      return apiResponse(ok({ asked, pending: pendingAutonomyCards(ctx.organizationId) }));
    }

    if (body.demo === "vendor_payment") {
      const submitted = demoVendorPayment(ctx);
      return apiResponse(
        ok({
          ...submitted,
          pending: pendingAutonomyCards(ctx.organizationId),
        }),
      );
    }

    const kind = String(body.kind || "");
    if (!isAutonomyKind(kind)) return apiResponse(err("Unknown work kind.", 422));

    const amountCents =
      typeof body.amountCents === "number"
        ? Math.round(body.amountCents)
        : typeof body.amount === "number"
          ? Math.round(body.amount * 100)
          : undefined;

    const intent: WorkIntent = {
      kind,
      title: String(body.title || kind.replace(/_/g, " ")),
      summary: String(body.summary || body.title || kind),
      amountCents,
      discountPercent: typeof body.discountPercent === "number" ? body.discountPercent : undefined,
      payload: asRecord(body.payload),
    };

    const submitted = submitWork(ctx, intent);
    return apiResponse(ok({ ...submitted, pending: pendingAutonomyCards(ctx.organizationId) }));
  } catch (error) {
    return jsonError(error);
  }
}
