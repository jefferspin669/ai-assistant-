import { handleInboundSms } from "@/lib/integrations/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const text = await req.text();
  const form = Object.fromEntries(new URLSearchParams(text).entries());
  const from = form.From || "";
  const body = form.Body || "";
  if (!from) {
    return new Response("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }
  const result = await handleInboundSms({ from, body });
  // Twilio can also use empty response if we already sent via API.
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  void result;
  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}
