import { apiResponse, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok, err } from "@/lib/api/types";
import { createCheckoutSession } from "@/lib/integrations/stripe";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    rateLimit(`billing-checkout:${clientKey(req)}`, 10, 60_000);
    let organizationId: string | undefined;
    let email: string | undefined;
    try {
      const ctx = await resolveSession(req);
      organizationId = ctx.organizationId;
    } catch {
      organizationId = undefined;
    }
    const body = await readJson(req);
    email = body.email ? String(body.email) : undefined;
    const session = await createCheckoutSession({
      customerEmail: email,
      organizationId,
    });
    return apiResponse(ok(session));
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    return apiResponse(err(error instanceof Error ? error.message : "checkout failed", 502));
  }
}
