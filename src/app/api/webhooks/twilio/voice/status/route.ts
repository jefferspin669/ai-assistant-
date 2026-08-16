import { handleMissedCall } from "@/lib/integrations/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Explicit missed-call / no-answer callback from Twilio status webhooks. */
export async function POST(req: Request) {
  const text = await req.text();
  const form = Object.fromEntries(new URLSearchParams(text).entries());
  const status = (form.CallStatus || "").toLowerCase();
  if (["no-answer", "busy", "failed", "canceled"].includes(status) && form.From) {
    const record = await handleMissedCall({
      from: form.From,
      to: form.To || "",
      callSid: form.CallSid,
    });
    return Response.json({ ok: true, data: record });
  }
  return Response.json({ ok: true, data: { ignored: true, status } });
}
