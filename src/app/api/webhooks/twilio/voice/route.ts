import { getAppUrl } from "@/lib/integrations/config";
import { buildVoiceAnswerTwiml, handleMissedCall } from "@/lib/integrations/twilio";
import {
  assertTwilioWebhook,
  claimTwilioIdempotency,
  resolveTwilioOrganizationId,
} from "@/lib/integrations/twilio-security";
import { flushDatabaseWrites } from "@/lib/db/store";
import { isAtlasError } from "@/lib/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const form = await assertTwilioWebhook(req, "/api/webhooks/twilio/voice", raw);
    const callStatus = (form.CallStatus || form.DialCallStatus || "").toLowerCase();
    const from = form.From || "";
    const to = form.To || "";
    const organizationId = resolveTwilioOrganizationId(to);

    if (["no-answer", "busy", "failed", "canceled"].includes(callStatus)) {
      if (from) {
        claimTwilioIdempotency(organizationId, form.CallSid ? `${form.CallSid}:${callStatus}` : undefined);
        await handleMissedCall({ from, to, callSid: form.CallSid, organizationId });
        await flushDatabaseWrites();
      }
      return new Response("<Response></Response>", {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const gatherUrl = `${getAppUrl()}/api/webhooks/twilio/voice/gather`;
    const twiml = buildVoiceAnswerTwiml({
      gatherActionUrl: gatherUrl,
      businessName: process.env.ATLAS_BUSINESS_NAME || "the shop",
    });
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  } catch (error) {
    if (isAtlasError(error) && error.status === 409) {
      return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
    }
    const status = isAtlasError(error) ? error.status : 500;
    return new Response(isAtlasError(error) ? error.message : "Webhook error", { status });
  }
}
