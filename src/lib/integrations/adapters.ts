/**
 * Standardized integration adapters over EXISTING Twilio / Stripe / Calendar / Resend modules.
 * Not a second Integration Engine.
 */

import { sendSms } from "@/lib/integrations/twilio";
import { sendEmail } from "@/lib/integrations/resend";
import { createExternalEvent } from "@/lib/integrations/calendar";
import { createAndSendInvoice } from "@/lib/integrations/actions";
import { requireLive } from "@/lib/integrations/config";
import { writeAudit } from "@/lib/services/audit";
import type { SessionContext } from "@/lib/domain/types";
import { getCapability, assertCapabilityAvailable } from "@/lib/capabilities/registry";

export type AdapterResult = {
  ok: boolean;
  capability: string;
  mode: "live" | "simulation" | "blocked";
  detail: Record<string, unknown>;
  error?: string;
};

export async function invokeAdapter(
  ctx: SessionContext,
  capabilityId: string,
  input: Record<string, unknown>,
): Promise<AdapterResult> {
  const cap = getCapability(ctx, capabilityId);
  const available = assertCapabilityAvailable(cap, capabilityId);
  if (!available.ok) {
    return {
      ok: false,
      capability: capabilityId,
      mode: "blocked",
      detail: {},
      error: available.reason,
    };
  }

  if (capabilityId === "send_sms" || capabilityId === "twilio_call") {
    if (capabilityId === "twilio_call") {
      return {
        ok: false,
        capability: capabilityId,
        mode: "blocked",
        detail: {},
        error: "Voice calls go through the existing receptionist webhooks — this adapter does not place outbound PSTN calls yet.",
      };
    }
    const result = await sendSms({
      to: String(input.to || input.phone || ""),
      body: String(input.body || input.message || ""),
      organizationId: ctx.organizationId,
    });
    return {
      ok: result.ok,
      capability: capabilityId,
      mode: result.mode,
      detail: { sid: result.sid },
      error: result.error,
    };
  }

  if (capabilityId === "send_email") {
    const result = await sendEmail({
      to: String(input.to || input.email || ""),
      subject: String(input.subject || "Atlas"),
      text: String(input.body || input.message || ""),
      organizationId: ctx.organizationId,
    });
    if (!result.ok) {
      return {
        ok: false,
        capability: capabilityId,
        mode: "live",
        detail: {},
        error: result.error,
      };
    }
    return {
      ok: true,
      capability: capabilityId,
      mode: result.simulated ? "simulation" : "live",
      detail: { id: result.id || null },
    };
  }

  if (capabilityId === "stripe_invoice") {
    const result = await createAndSendInvoice({
      customerName: String(input.customerName || input.name || "Customer"),
      customerPhone: input.phone ? String(input.phone) : undefined,
      customerEmail: input.email ? String(input.email) : undefined,
      amountCents: Number(input.amountCents || 0),
      memo: input.memo ? String(input.memo) : undefined,
      approved: Boolean(input.approved),
    });
    return {
      ok: result.status === "sent" || result.status === "needs_approval",
      capability: capabilityId,
      mode: requireLive("stripe") ? "live" : "simulation",
      detail: result as unknown as Record<string, unknown>,
    };
  }

  if (capabilityId === "refund_payment") {
    writeAudit(ctx, {
      action: "adapter:stripe.refund.staged",
      entityType: "payment",
      entityId: String(input.customerId || "unknown"),
    });
    return {
      ok: true,
      capability: capabilityId,
      mode: requireLive("stripe") ? "live" : "simulation",
      detail: { staged: true, note: "Refunds still require owner approval via existing Atlas Actions." },
    };
  }

  if (capabilityId === "calendar_create") {
    const result = await createExternalEvent({
      title: String(input.title || "Atlas appointment"),
      startsAt: String(input.startsAt || input.startTime || new Date().toISOString()),
      endsAt: String(input.endsAt || input.endTime || new Date(Date.now() + 3600_000).toISOString()),
      description: input.description ? String(input.description) : undefined,
    });
    return {
      ok: true,
      capability: capabilityId,
      mode: result.mode,
      detail: { provider: result.provider },
    };
  }

  return {
    ok: false,
    capability: capabilityId,
    mode: "blocked",
    detail: {},
    error: `${capabilityId} has no adapter`,
  };
}
