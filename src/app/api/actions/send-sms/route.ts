import { z } from "zod";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { ValidationError } from "@/lib/domain/errors";
import { sendCustomerSms } from "@/lib/integrations/actions";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  to: z.string().min(3).max(40).optional(),
  phone: z.string().min(3).max(40).optional(),
  body: z.string().min(1).max(1600).optional(),
  message: z.string().min(1).max(1600).optional(),
  confirmationId: z.string().min(1).max(80).optional(),
  /** Ignored — never trusted from the client. */
  approved: z.unknown().optional(),
});

export const POST = withPermission("actions.sms", async ({ req, workspace, body }) => {
  rateLimit(`sms:${workspace.organizationId}:${clientKey(req)}`, 30, 60_000);
  const parsed = parseBody(bodySchema, body);
  const to = String(parsed.to || parsed.phone || "").trim();
  const text = String(parsed.body || parsed.message || "").trim();
  if (!to || !text) throw new ValidationError("to and body required");
  const result = await sendCustomerSms(workspace, {
    to,
    body: text,
    confirmationId: parsed.confirmationId,
  });
  return apiSuccess(result);
});
