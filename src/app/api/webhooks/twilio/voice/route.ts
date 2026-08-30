import { getAppUrl } from "@/lib/integrations/config";
import { buildVoiceAnswerTwiml, handleMissedCall } from "@/lib/integrations/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readTwilioForm(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    return Object.fromEntries(new URLSearchParams(text).entries());
  }
  try {
    return (await req.json()) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const form = await readTwilioForm(req);
  const callStatus = (form.CallStatus || form.DialCallStatus || "").toLowerCase();
  const from = form.From || "";
  const to = form.To || "";

  // Missed / no-answer → recovery SMS
  if (["no-answer", "busy", "failed", "canceled"].includes(callStatus)) {
    if (from) await handleMissedCall({ from, to, callSid: form.CallSid });
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
}
