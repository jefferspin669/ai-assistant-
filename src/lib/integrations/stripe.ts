import Stripe from "stripe";
import { getAppUrl, requireLive } from "@/lib/integrations/config";
import { atlasStore } from "@/lib/integrations/supabase";
import { loadDatabase, saveDatabase } from "@/lib/db/store";
import { emitEvent } from "@/lib/events/bus";
import { bindStripeAccount, stripeAccountForOrg } from "@/lib/billing/stripe-accounts";
import type { DbSubscription } from "@/lib/db/schema";
import { requireOrganizationId } from "@/lib/auth/tenant";
import { isProduction } from "@/lib/ops/environment";
import { ValidationError } from "@/lib/domain/errors";

function stripeKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

function getStripe() {
  const key = stripeKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
}

/** Create and email a Stripe invoice. Payment is recorded only after a signed invoice.paid webhook. */
export async function sendStripeInvoice(input: {
  organizationId: string;
  customerName: string;
  customerEmail: string;
  amountCents: number;
  memo?: string;
  idempotencyKey: string;
}) {
  const stripe = getStripe();
  const customer = await stripe.customers.create(
    {
      name: input.customerName,
      email: input.customerEmail,
      metadata: { atlasOrganizationId: input.organizationId },
    },
    { idempotencyKey: `atlas-customer-${input.idempotencyKey}` },
  );
  const invoice = await stripe.invoices.create(
    {
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 30,
      metadata: { organization_id: input.organizationId },
    },
    { idempotencyKey: `atlas-invoice-${input.idempotencyKey}` },
  );
  await stripe.invoiceItems.create(
    {
      customer: customer.id,
      invoice: invoice.id,
      amount: input.amountCents,
      currency: "usd",
      description: input.memo || "Services",
    },
    { idempotencyKey: `atlas-item-${input.idempotencyKey}` },
  );
  const sent = await stripe.invoices.sendInvoice(invoice.id, {}, {
    idempotencyKey: `atlas-send-${input.idempotencyKey}`,
  });
  return { id: sent.id, hostedInvoiceUrl: sent.hosted_invoice_url };
}

export type AtlasPlan = "business_monthly";

export function defaultPriceId(plan: AtlasPlan = "business_monthly") {
  if (plan === "business_monthly") {
    return process.env.STRIPE_PRICE_BUSINESS || process.env.STRIPE_PRICE_ID || "";
  }
  return "";
}

function activateOrgSubscription(orgId: string, status: DbSubscription["status"] = "active") {
  const db = loadDatabase();
  const match = db.subscriptions.some((s) => s.orgId === orgId);
  const next: DbSubscription[] = match
    ? db.subscriptions.map((s) =>
        s.orgId === orgId ? { ...s, plan: "business" as const, status } : s,
      )
    : [
        {
          id: `sub_${orgId}`,
          orgId,
          plan: "business",
          status,
          renewsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
          seats: 5,
        },
        ...db.subscriptions,
      ];
  saveDatabase({ ...db, subscriptions: next });
}

export async function createCheckoutSession(input: {
  customerEmail?: string;
  organizationId?: string;
  plan?: AtlasPlan;
}) {
  const price = defaultPriceId(input.plan);
  const orgId = requireOrganizationId(input.organizationId);

  if (!requireLive("stripe") || !price) {
    if (isProduction()) {
      throw new ValidationError("Stripe is not configured — refusing to activate a simulated subscription in production.");
    }
    activateOrgSubscription(orgId, "trialing");
    bindStripeAccount(orgId, { priceId: price || "sim_price_business" });
    await atlasStore.writeAudit({
      organizationId: orgId,
      actor: "Stripe(simulation)",
      action: "checkout.simulated",
      detail: { plan: input.plan || "business_monthly" },
    });
    return {
      mode: "simulation" as const,
      url: `${getAppUrl()}/app/commercial?checkout=simulated`,
      sessionId: `sim_cs_${Date.now()}`,
      organizationId: orgId,
    };
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: `${getAppUrl()}/app/commercial?checkout=success`,
    cancel_url: `${getAppUrl()}/app/commercial?checkout=cancel`,
    line_items: [{ price, quantity: 1 }],
    customer_email: input.customerEmail,
    client_reference_id: orgId,
    metadata: { organization_id: orgId },
    subscription_data: { metadata: { organization_id: orgId } },
  });

  await atlasStore.writeAudit({
    organizationId: orgId,
    actor: "Stripe",
    action: "checkout.created",
    detail: { sessionId: session.id },
  });

  return {
    mode: "live" as const,
    url: session.url || `${getAppUrl()}/app/commercial`,
    sessionId: session.id,
    organizationId: orgId,
  };
}

export async function createBillingPortalSession(input: { organizationId: string; customerId?: string }) {
  const organizationId = requireOrganizationId(input.organizationId);
  const bound = stripeAccountForOrg(organizationId);
  const customerId = input.customerId || bound?.customerId || "";
  if (!requireLive("stripe")) {
    if (isProduction()) {
      throw new ValidationError("Stripe is not configured — billing portal unavailable in production.");
    }
    return {
      mode: "simulation" as const,
      url: `${getAppUrl()}/app/commercial?portal=simulated`,
      organizationId,
    };
  }
  if (!customerId) {
    throw new Error("No Stripe customer is bound to this organization. Run Checkout first.");
  }
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/app/commercial`,
  });
  return { mode: "live" as const, url: session.url, organizationId };
}

function orgIdFromStripeObject(object: Record<string, unknown>, fallback: string) {
  const metadata = object.metadata as { organization_id?: string } | undefined;
  const clientRef = object.client_reference_id;
  return String(metadata?.organization_id || clientRef || fallback);
}

export async function handleStripeWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  let event: { type: string; data: { object: Record<string, unknown> } };

  if (requireLive("stripe") && (!secret || !signature)) {
    throw new Error("Live Stripe webhooks require STRIPE_WEBHOOK_SECRET and Stripe-Signature.");
  }

  if (secret && signature) {
    const stripe = getStripe();
    const verified = stripe.webhooks.constructEvent(rawBody, signature, secret);
    event = {
      type: verified.type,
      data: { object: verified.data.object as unknown as Record<string, unknown> },
    };
  } else {
    event = JSON.parse(rawBody) as typeof event;
  }

  if (event.type === "checkout.session.completed" || event.type === "customer.subscription.updated") {
    const object = event.data.object;
    const orgId = orgIdFromStripeObject(object, atlasStore.defaultOrgId());
    const customerId = object.customer ? String(object.customer) : undefined;
    const subscriptionId = object.subscription
      ? String(object.subscription)
      : object.id && event.type === "customer.subscription.updated"
        ? String(object.id)
        : undefined;
    activateOrgSubscription(orgId, "active");
    bindStripeAccount(orgId, { customerId, subscriptionId });
    await atlasStore.writeAudit({
      organizationId: orgId,
      actor: "Stripe",
      action: "subscription.activated",
      detail: { session: object.id, customerId, subscriptionId },
    });
    emitEvent({
      type: "payment.received",
      organizationId: orgId,
      actorLabel: "Stripe",
      payload: { session: object.id },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const object = event.data.object;
    const orgId = orgIdFromStripeObject(object, atlasStore.defaultOrgId());
    const db = loadDatabase();
    saveDatabase({
      ...db,
      subscriptions: db.subscriptions.map((s) =>
        s.orgId === orgId ? { ...s, status: "canceled" as const, plan: "free" as const } : s,
      ),
    });
  }

  if (event.type === "invoice.paid") {
    if (!secret || !signature) {
      throw new Error("Invoice payments require a verified Stripe signature.");
    }
    const object = event.data.object;
    const orgId = String(
      (object.metadata as Record<string, unknown> | undefined)?.organization_id || "",
    );
    const invoiceId = String(object.id || "");
    const amountCents = Number(object.amount_paid || 0);
    const db = loadDatabase();
    const document = db.documents.find(
      (row) => row.orgId === orgId && row.title === `Invoice ${invoiceId}`,
    );
    let expectedAmount = 0;
    try {
      expectedAmount = Number(JSON.parse(document?.content || "{}").amountCents);
    } catch {
      /* not a verified invoice */
    }
    if (
      document &&
      Number.isSafeInteger(amountCents) &&
      amountCents > 0 &&
      amountCents === expectedAmount &&
      !db.transactions.some((row) => row.orgId === orgId && row.id === `paid_${invoiceId}`)
    ) {
      saveDatabase({
        ...db,
        transactions: [
          {
            id: `paid_${invoiceId}`,
            orgId,
            userId: document.userId,
            kind: "income",
            label: `Paid invoice ${invoiceId}`,
            amount: amountCents / 100,
            category: "invoice_payment",
            date: new Date().toISOString().slice(0, 10),
            receiptName: null,
            createdAt: new Date().toISOString(),
            provenance: "LIVE",
          },
          ...db.transactions,
        ],
      });
    }
  }

  return { received: true, type: event.type };
}
