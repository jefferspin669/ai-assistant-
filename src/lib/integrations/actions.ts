import { sendSms } from "@/lib/integrations/twilio";
import { atlasStore } from "@/lib/integrations/supabase";
import { loadDatabase, newId, nowIso, saveDatabase } from "@/lib/db/store";
import { requestConfirmation } from "@/lib/confirmations";

/**
 * Real side-effect actions. Money / mass outreach should go through approvals.
 * For API routes we accept `approved: true` only after owner confirmation id is provided
 * or the action is low-risk.
 */

export async function sendCustomerSms(input: {
  to: string;
  body: string;
  approved?: boolean;
  confirmationId?: string;
}) {
  if (!input.approved) {
    const proposal = await atlasStore.createActionProposal({
      organizationId: atlasStore.defaultOrgId(),
      kind: "mass_sms",
      title: `SMS to ${input.to}`,
      summary: input.body.slice(0, 140),
      payload: input,
    });
    return {
      status: "needs_approval" as const,
      proposal,
      message: "SMS staged — approve to send for real.",
    };
  }

  const result = await sendSms({
    to: input.to,
    body: input.body,
    organizationId: atlasStore.defaultOrgId(),
  });
  return {
    status: result.ok ? ("sent" as const) : ("failed" as const),
    result,
  };
}

export async function createAndSendInvoice(input: {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  amountCents: number;
  memo?: string;
  approved?: boolean;
}) {
  const orgId = atlasStore.defaultOrgId();
  if (!input.approved) {
    const proposal = await atlasStore.createActionProposal({
      organizationId: orgId,
      kind: "send_money",
      title: `Invoice ${input.customerName}`,
      summary: `$${(input.amountCents / 100).toFixed(2)} — ${input.memo || "Service"}`,
      payload: input,
    });
    return {
      status: "needs_approval" as const,
      proposal,
      message: "Invoice drafted — approve to create + notify customer.",
    };
  }

  const db = loadDatabase();
  const stamp = nowIso();
  const invoiceId = newId("inv");
  const amount = input.amountCents / 100;

  // Record as transaction + document in file DB; Supabase invoices table when live.
  saveDatabase({
    ...db,
    transactions: [
      {
        id: invoiceId,
        orgId,
        userId: db.users[0]?.id || "user_demo",
        kind: "income",
        label: `Invoice · ${input.customerName}`,
        amount,
        category: "invoice",
        date: stamp.slice(0, 10),
        receiptName: null,
        createdAt: stamp,
      },
      ...db.transactions,
    ],
    documents: [
      {
        id: newId("doc"),
        userId: db.users[0]?.id || "user_demo",
        orgId,
        title: `Invoice ${invoiceId}`,
        kind: "document",
        content: JSON.stringify({
          customer: input.customerName,
          amountCents: input.amountCents,
          memo: input.memo,
          status: "sent",
        }),
        createdAt: stamp,
        updatedAt: stamp,
      },
      ...db.documents,
    ],
  });

  if (input.customerPhone) {
    await sendSms({
      to: input.customerPhone,
      body: `Invoice from ${db.organizations[0]?.business_name || "Atlas"}: $${amount.toFixed(2)}${input.memo ? ` — ${input.memo}` : ""}. Reply with questions anytime.`,
      organizationId: orgId,
    });
  }

  await atlasStore.writeAudit({
    organizationId: orgId,
    actor: "Atlas",
    action: "invoice.sent",
    detail: { invoiceId, amountCents: input.amountCents, customer: input.customerName },
  });

  return {
    status: "sent" as const,
    invoiceId,
    amountCents: input.amountCents,
  };
}

/** Helper for UI to create a local confirmation card mirroring Command Center. */
export function stageUiConfirmation(input: {
  title: string;
  summary: string;
  details: string[];
}) {
  return requestConfirmation({
    kind: "other",
    title: input.title,
    summary: input.summary,
    details: input.details,
    impact: "Atlas executes only after you approve.",
    requestedBy: "Atlas Actions",
  });
}
