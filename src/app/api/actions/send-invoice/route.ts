import { z } from "zod";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { ValidationError } from "@/lib/domain/errors";
import { createAndSendInvoice } from "@/lib/integrations/actions";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  customer: z.string().min(1).max(200).optional(),
  amountCents: z.number().optional(),
  amount: z.number().optional(),
  customerPhone: z.string().max(40).optional(),
  customerEmail: z.string().max(200).optional(),
  memo: z.string().max(500).optional(),
  confirmationId: z.string().min(1).max(80).optional(),
  /** Ignored — never trusted from the client. */
  approved: z.unknown().optional(),
});

export const POST = withPermission("actions.invoice", async ({ req, workspace, body }) => {
  rateLimit(`invoice:${workspace.organizationId}:${clientKey(req)}`, 20, 60_000);
  const parsed = parseBody(bodySchema, body);
  const customerName = String(parsed.customerName || parsed.customer || "").trim();
  const amountCents = Number(
    parsed.amountCents ?? Math.round(Number(parsed.amount || 0) * 100),
  );
  if (!customerName || !amountCents) {
    throw new ValidationError("customerName and amountCents required");
  }
  const result = await createAndSendInvoice(workspace, {
    customerName,
    customerPhone: parsed.customerPhone ? String(parsed.customerPhone) : undefined,
    customerEmail: parsed.customerEmail ? String(parsed.customerEmail) : undefined,
    amountCents,
    memo: parsed.memo ? String(parsed.memo) : undefined,
    confirmationId: parsed.confirmationId,
  });
  return apiSuccess(result);
});
