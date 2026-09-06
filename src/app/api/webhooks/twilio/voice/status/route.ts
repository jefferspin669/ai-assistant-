import { handleMissedCall } from "@/lib/integrations/twilio";
import {
  assertTwilioWebhook,
  claimTwilioIdempotency,
  resolveTwilioOrganizationId,
} from "@/lib/integrations/twilio-security";
import { flushDatabaseWrites } from "@/lib/db/store";
import { isAtlasError } from "@/lib/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Explicit missed-call / no-answer callback from Twilio status webhooks. */
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const form = await assertTwilioWebhook(req, "/api/webhooks/twilio/voice/status", raw);
    const status = (form.CallStatus || "").toLowerCase();
    if (["no-answer", "busy", "failed", "canceled"].includes(status) && form.From) {
      const organizationId = resolveTwilioOrganizationId(form.To);
      claimTwilioIdempotency(organizationId, form.CallSid ? `${form.CallSid}:status:${status}` : undefined);
      const record = await handleMissedCall({
        from: form.From,
        to: form.To || "",
        callSid: form.CallSid,
        organizationId,
      });
      await flushDatabaseWrites();
      return Response.json({ ok: true, data: record });
    }
    return Response.json({ ok: true, data: { ignored: true, status } });
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
