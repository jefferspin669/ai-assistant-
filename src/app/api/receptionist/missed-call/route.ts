import { NextResponse } from "next/server";
import { handleMissedCall, listMissedCalls } from "@/lib/integrations/twilio";
import { apiResponse, readJson } from "@/lib/api/http";
import { ok, err } from "@/lib/api/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, data: { calls: listMissedCalls() } });
}

/** Manual / demo trigger for missed-call recovery without Twilio. */
export async function POST(req: Request) {
  const body = await readJson(req);
  const from = String(body.from || body.phone || "");
  if (!from) return apiResponse(err("from phone required", 422));
  const record = await handleMissedCall({
    from,
    to: String(body.to || process.env.TWILIO_PHONE_NUMBER || ""),
    callSid: body.callSid ? String(body.callSid) : undefined,
  });
  return apiResponse(ok(record));
}
