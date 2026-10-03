import {
  assertTwilioWebhook,
  claimTwilioIdempotency,
  resolveTwilioOrganizationId,
} from "@/lib/integrations/twilio-security";
import { recordSmsDeliveryStatus } from "@/lib/integrations/twilio";
import { flushDatabaseWrites } from "@/lib/db/store";
import { isAtlasError } from "@/lib/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Outbound SMS delivery status callback from Twilio.
 * Confirms delivered / failed / undelivered after approve→send.
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const form = await assertTwilioWebhook(req, "/api/webhooks/twilio/sms/status", raw);
    const messageSid = form.MessageSid || form.SmsSid || "";
    const messageStatus = form.MessageStatus || form.SmsStatus || "";
    if (!messageSid || !messageStatus) {
      return Response.json({ ok: true, data: { ignored: true, reason: "missing sid or status" } });
    }
    // Outbound status callbacks: From is the business Twilio number, To is the customer.
    const organizationId = resolveTwilioOrganizationId(form.From || form.To);
    // Dedupe by sid+status so retries of the same status are no-ops; later statuses still apply.
    claimTwilioIdempotency(organizationId, `${messageSid}:status:${messageStatus.toLowerCase()}`);
    const result = await recordSmsDeliveryStatus({
      organizationId,
      messageSid,
      messageStatus,
      to: form.To,
      errorCode: form.ErrorCode,
    });
    await flushDatabaseWrites();
    return Response.json({ ok: true, data: result });
  } catch (error) {
    if (isAtlasError(error) && error.status === 409) {
      return Response.json({ ok: true, data: { duplicate: true } });
    }
    const status = isAtlasError(error) ? error.status : 500;
    return Response.json(
      { ok: false, error: isAtlasError(error) ? error.message : "Webhook error" },
      { status },
    );
  }
}
