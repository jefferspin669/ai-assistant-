import { apiResponse, readJson } from "@/lib/api/http";
import { ok, err } from "@/lib/api/types";
import { createCheckoutSession } from "@/lib/integrations/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  try {
    const session = await createCheckoutSession({
      customerEmail: body.email ? String(body.email) : undefined,
      organizationId: body.organizationId ? String(body.organizationId) : undefined,
    });
    return apiResponse(ok(session));
  } catch (error) {
    return apiResponse(err(error instanceof Error ? error.message : "checkout failed", 502));
  }
}
