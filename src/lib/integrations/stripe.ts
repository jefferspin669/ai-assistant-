import Stripe from "stripe";
import { getAppUrl, requireLive } from "@/lib/integrations/config";
import { atlasStore } from "@/lib/integrations/supabase";
import { loadDatabase, saveDatabase } from "@/lib/db/store";
import { emitEvent } from "@/lib/events/bus";
import { bindStripeAccount, stripeAccountForOrg } from "@/lib/billing/stripe-accounts";
import type { DbSubscription } from "@/lib/db/schema";

function stripeKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

function getStripe() {
  const key = stripeKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
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
  const orgId = input.organizationId || atlasStore.defaultOrgId();

  if (!requireLive("stripe") || !price) {
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
  const bound = stripeAccountForOrg(input.organizationId);
  const customerId = input.customerId || bound?.customerId || "";
  if (!requireLive("stripe")) {
    return {
      mode: "simulation" as const,
      url: `${getAppUrl()}/app/commercial?portal=simulated`,
      organizationId: input.organizationId,
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
  return { mode: "live" as const, url: session.url, organizationId: input.organizationId };
}

function orgIdFromStripeObject(object: Record<string, unknown>, fallback: string) {
  const metadata = object.metadata as { organization_id?: string } | undefined;
  const clientRef = object.client_reference_id;
  return String(metadata?.organization_id || clientRef || fallback);
}

export async function handleStripeWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  let event: { type: string; data: { object: Record<string, unknown> } };

  if (secret && signature) {
    const stripe = getStripe();
    const verified = stripe.webhooks.constructEvent(rawBody, signature, secret);
    event = {
      type: verified.type,
      data: { object: verified.data.object as unknown as Record<string, unknown> },
    };
  } else if (requireLive("stripe") && secret && !signature) {
    throw new Error("Missing Stripe-Signature");
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

  return { received: true, type: event.type };
}
