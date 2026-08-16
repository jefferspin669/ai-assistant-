import { getAppUrl } from "@/lib/integrations/config";
import { buildVoiceGatherTwiml, sendSms } from "@/lib/integrations/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const text = await req.text();
  const form = Object.fromEntries(new URLSearchParams(text).entries());
  const speech = form.SpeechResult || form.Digits || "";
  const from = form.From || "";
  const bookUrl = `${getAppUrl()}/api/webhooks/twilio/voice/book`;

  if ((speech.includes("1") || /book|schedule/i.test(speech)) && from) {
    await sendSms({
      to: from,
      body: `Atlas here — reply BOOK tomorrow or send a day/time and I’ll hold a slot.`,
    });
  }

  const twiml = buildVoiceGatherTwiml(speech, bookUrl);
  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}
