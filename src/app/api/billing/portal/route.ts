import { apiResponse, readJson } from "@/lib/api/http";
import { ok, err } from "@/lib/api/types";
import { createBillingPortalSession } from "@/lib/integrations/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  const customerId = String(body.customerId || process.env.STRIPE_CUSTOMER_ID || "");
  if (!customerId) {
    return apiResponse(err("customerId required (or set STRIPE_CUSTOMER_ID)", 422));
  }
  try {
    const session = await createBillingPortalSession({ customerId });
    return apiResponse(ok(session));
  } catch (error) {
    return apiResponse(err(error instanceof Error ? error.message : "portal failed", 502));
  }
}
