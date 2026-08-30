import { apiResponse, readJson } from "@/lib/api/http";
import { ok, err } from "@/lib/api/types";
import { createAndSendInvoice } from "@/lib/integrations/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  const customerName = String(body.customerName || body.customer || "");
  const amountCents = Number(body.amountCents ?? Math.round(Number(body.amount || 0) * 100));
  if (!customerName || !amountCents) {
    return apiResponse(err("customerName and amountCents required", 422));
  }
  const result = await createAndSendInvoice({
    customerName,
    customerPhone: body.customerPhone ? String(body.customerPhone) : undefined,
    customerEmail: body.customerEmail ? String(body.customerEmail) : undefined,
    amountCents,
    memo: body.memo ? String(body.memo) : undefined,
    approved: Boolean(body.approved),
  });
  return apiResponse(ok(result));
}
