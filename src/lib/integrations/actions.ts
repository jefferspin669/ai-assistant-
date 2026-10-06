import { sendSms } from "@/lib/integrations/twilio";
import { atlasStore } from "@/lib/integrations/supabase";
import { loadDatabase, newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { SessionContext } from "@/lib/domain/types";
import {
  ACTION_INVOICE,
  ACTION_SMS,
  consumeApprovedConfirmation,
  stageActionApproval,
} from "@/lib/services/action-confirmations";
import { writeAudit } from "@/lib/services/audit";
import { sendStripeInvoice } from "@/lib/integrations/stripe";

/**
 * Real side-effect actions. Money / outreach require a server-side approved confirmation.
 * Client `approved` flags are ignored.
 */

export async function sendCustomerSms(
  ctx: SessionContext,
  input: {
    to: string;
    body: string;
    /** If omitted, stages a pending approval instead of sending. */
    confirmationId?: string;
  },
) {
  if (!input.confirmationId) {
    const approval = stageActionApproval(ctx, ACTION_SMS, {
      to: input.to,
      body: input.body,
    });
    return {
      status: "needs_approval" as const,
      approvalId: approval.id,
      proposal: approval,
      message: "SMS staged — approve in Approvals, then resend with confirmationId.",
    };
  }

  const confirmation = consumeApprovedConfirmation(ctx, input.confirmationId, ACTION_SMS);
  const payload = confirmation.payload as { to?: string; body?: string };
  const to = String(payload.to || input.to);
  const text = String(payload.body || input.body);

  const result = await sendSms({
    to,
    body: text,
    organizationId: ctx.organizationId,
  });
  writeAudit(ctx, {
    action: result.ok ? "sms.sent" : "sms.failed",
    entityType: "approval",
    entityId: confirmation.id,
  });
  return {
    status: result.ok ? ("sent" as const) : ("failed" as const),
    result,
    confirmationId: confirmation.id,
  };
}

export async function createAndSendInvoice(
  ctx: SessionContext,
  input: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    amountCents: number;
    memo?: string;
    confirmationId?: string;
  },
) {
  if (!input.confirmationId) {
    const approval = stageActionApproval(ctx, ACTION_INVOICE, {
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      amountCents: input.amountCents,
      memo: input.memo,
    });
    return {
      status: "needs_approval" as const,
      approvalId: approval.id,
      proposal: approval,
      message: "Invoice drafted — approve in Approvals, then return to Invoices & payments to send.",
    };
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error(
      "Configure Stripe invoicing and its signed payment webhook before sending. Approval was not consumed.",
    );
  }

  const confirmation = consumeApprovedConfirmation(ctx, input.confirmationId, ACTION_INVOICE);
  const payload = confirmation.payload as {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    amountCents?: number;
    memo?: string;
  };

  const customerName = String(payload.customerName || input.customerName);
  const amountCents = Number(payload.amountCents ?? input.amountCents);
  const customerEmail = payload.customerEmail || input.customerEmail;
  const memo = payload.memo || input.memo;
  const orgId = ctx.organizationId;

  if (!customerEmail || !process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "A customer email and configured Stripe account are required to send a real invoice. Nothing was sent or recorded as paid.",
    );
  }
  if (!Number.isSafeInteger(amountCents) || amountCents < 50 || amountCents > 100_000_000) {
    throw new Error("Invoice amount must be between $0.50 and $1,000,000.00.");
  }

  let delivered: Awaited<ReturnType<typeof sendStripeInvoice>>;
  try {
    delivered = await sendStripeInvoice({
      organizationId: orgId,
      customerName,
      customerEmail,
      amountCents,
      memo,
      idempotencyKey: confirmation.id,
    });
  } catch {
    throw new Error(
      "Stripe could not confirm delivery. Check the Stripe dashboard for a draft or sent invoice before trying again; no payment was recorded.",
    );
  }

  const db = loadDatabase();
  const stamp = nowIso();
  const invoiceId = delivered.id;

  saveDatabase({
    ...db,
    documents: [
      {
        id: newId("doc"),
        userId: ctx.userId,
        orgId,
        title: `Invoice ${invoiceId}`,
        kind: "document",
        content: JSON.stringify({
          customer: customerName,
          amountCents,
          memo,
          status: "sent_unpaid",
          hostedInvoiceUrl: delivered.hostedInvoiceUrl,
        }),
        createdAt: stamp,
        updatedAt: stamp,
      },
      ...db.documents,
    ],
  });

  writeAudit(ctx, {
    action: "invoice.sent",
    entityType: "invoice",
    entityId: invoiceId,
  });
  await atlasStore.writeAudit({
    organizationId: orgId,
    actor: ctx.userId,
    action: "invoice.sent",
    detail: { invoiceId, amountCents, customer: customerName },
  });

  return {
    status: "sent" as const,
    invoiceId,
    amountCents,
    hostedInvoiceUrl: delivered.hostedInvoiceUrl,
    confirmationId: confirmation.id,
  };
}
