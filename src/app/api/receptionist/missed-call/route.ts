import { apiSuccess, withPermission, parseBody } from "@/lib/api/http";
import { z } from "zod";
import { handleMissedCall, listMissedCalls } from "@/lib/integrations/twilio";
import { requireLive } from "@/lib/integrations/config";
import { isProduction } from "@/lib/ops/environment";
import { ValidationError } from "@/lib/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  from: z.string().min(3).max(40).optional(),
  phone: z.string().min(3).max(40).optional(),
  to: z.string().max(40).optional(),
  callSid: z.string().max(80).optional(),
});

export const GET = withPermission("workspace.read", async ({ workspace }) => {
  return apiSuccess({ calls: listMissedCalls(workspace.organizationId) });
});

/** Trigger missed-call recovery for the signed-in organization. Live Twilio required in production. */
export const POST = withPermission("actions.sms", async ({ workspace, body }) => {
  if (isProduction() && !requireLive("twilio")) {
    throw new ValidationError("Twilio is not live — missed-call recovery is unavailable in production.");
  }
  const parsed = parseBody(bodySchema, body);
  const from = String(parsed.from || parsed.phone || "").trim();
  if (!from) throw new ValidationError("from phone required");
  const record = await handleMissedCall({
    from,
    to: String(parsed.to || process.env.TWILIO_PHONE_NUMBER || ""),
    callSid: parsed.callSid,
    organizationId: workspace.organizationId,
  });
  return apiSuccess(record);
});
