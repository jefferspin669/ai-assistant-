import { apiResponse, readJson } from "@/lib/api/http";
import { ok, err } from "@/lib/api/types";
import { sendCustomerSms } from "@/lib/integrations/actions";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    rateLimit(`sms:${clientKey(req)}`, 30, 60_000);
  } catch (error) {
    return apiResponse(err(error instanceof Error ? error.message : "Too many requests", 429));
  }
  const body = await readJson(req);
  const to = String(body.to || body.phone || "");
  const text = String(body.body || body.message || "");
  if (!to || !text) return apiResponse(err("to and body required", 422));
  const result = await sendCustomerSms({
    to,
    body: text,
    approved: Boolean(body.approved),
    confirmationId: body.confirmationId ? String(body.confirmationId) : undefined,
  });
  return apiResponse(ok(result));
}
