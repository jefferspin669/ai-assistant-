import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { deleteOrganizationData, exportOrganization } from "@/lib/privacy/account";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    rateLimit(`privacy-export:${clientKey(req)}`, 10, 60_000);
    const ctx = await resolveSession(req);
    return apiResponse(ok(exportOrganization(ctx)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    rateLimit(`privacy-delete:${clientKey(req)}`, 3, 60 * 60 * 1000);
    const ctx = await resolveSession(req);
    return apiResponse(ok(deleteOrganizationData(ctx)));
  } catch (error) {
    return jsonError(error);
  }
}
