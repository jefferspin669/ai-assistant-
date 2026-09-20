import { getAppUrl } from "@/lib/integrations/config";
import { buildVoiceGatherTwiml, sendSms } from "@/lib/integrations/twilio";
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
    const form = await assertTwilioWebhook(req, "/api/webhooks/twilio/voice/gather", raw);
    const speech = form.SpeechResult || form.Digits || "";
    const from = form.From || "";
    const organizationId = resolveTwilioOrganizationId(form.To);
    claimTwilioIdempotency(organizationId, form.CallSid ? `${form.CallSid}:gather` : form.MessageSid);
    const bookUrl = `${getAppUrl()}/api/webhooks/twilio/voice/book`;

    if ((speech.includes("1") || /book|schedule/i.test(speech)) && from) {
      await sendSms({
        to: from,
        body: `Atlas here — reply BOOK tomorrow or send a day/time and I’ll hold a slot.`,
        organizationId,
      });
      await flushDatabaseWrites();
    }

    const twiml = buildVoiceGatherTwiml(speech, bookUrl);
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  } catch (error) {
    if (isAtlasError(error) && error.status === 409) {
      return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
    }
    const status = isAtlasError(error) ? error.status : 500;
    return new Response(isAtlasError(error) ? error.message : "Webhook error", { status });
  }
}
