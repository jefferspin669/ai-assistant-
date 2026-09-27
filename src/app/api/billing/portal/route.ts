import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { ok, err } from "@/lib/api/types";
import { createBillingPortalSession } from "@/lib/integrations/stripe";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    rateLimit(`billing-portal:${clientKey(req)}`, 10, 60_000);
    const ctx = await resolveSession(req);
    const session = await createBillingPortalSession({
      organizationId: ctx.organizationId,
    });
    return apiResponse(ok(session));
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    return apiResponse(err(error instanceof Error ? error.message : "portal failed", 502));
  }
}
