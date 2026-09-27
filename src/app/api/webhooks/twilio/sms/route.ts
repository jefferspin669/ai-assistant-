import { assertTwilioWebhook, claimTwilioIdempotency, resolveTwilioOrganizationId } from "@/lib/integrations/twilio-security";
import { handleInboundSms } from "@/lib/integrations/twilio";
import { flushDatabaseWrites } from "@/lib/db/store";
import { isAtlasError } from "@/lib/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const form = await assertTwilioWebhook(req, "/api/webhooks/twilio/sms", raw);
    const from = form.From || "";
    const body = form.Body || "";
    if (!from) {
      return new Response("<Response></Response>", {
        headers: { "Content-Type": "text/xml" },
      });
    }
    const organizationId = resolveTwilioOrganizationId(form.To);
    claimTwilioIdempotency(organizationId, form.MessageSid || form.SmsSid);
    await handleInboundSms({ from, body, organizationId });
    await flushDatabaseWrites();
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  } catch (error) {
    if (isAtlasError(error) && error.status === 409) {
      return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
    }
    const status = isAtlasError(error) ? error.status : 500;
    return new Response(isAtlasError(error) ? error.message : "Webhook error", { status });
  }
}
