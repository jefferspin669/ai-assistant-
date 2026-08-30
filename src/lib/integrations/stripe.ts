import Stripe from "stripe";
import { getAppUrl, requireLive } from "@/lib/integrations/config";
import { atlasStore } from "@/lib/integrations/supabase";
import { loadDatabase, saveDatabase } from "@/lib/db/store";
import { emitEvent } from "@/lib/events/bus";

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

export async function createCheckoutSession(input: {
  customerEmail?: string;
  organizationId?: string;
  plan?: AtlasPlan;
}) {
  const price = defaultPriceId(input.plan);
  const orgId = input.organizationId || atlasStore.defaultOrgId();

  if (!requireLive("stripe") || !price) {
    const db = loadDatabase();
    const sub = db.subscriptions[0];
    if (sub) {
      saveDatabase({
        ...db,
        subscriptions: db.subscriptions.map((s) =>
          s.id === sub.id ? { ...s, plan: "business", status: "trialing" } : s,
        ),
      });
    }
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
    };
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: `${getAppUrl()}/app/commercial?checkout=success`,
    cancel_url: `${getAppUrl()}/app/commercial?checkout=cancel`,
    line_items: [{ price, quantity: 1 }],
    customer_email: input.customerEmail,
    metadata: { organization_id: orgId },
  });

  await atlasStore.writeAudit({
    organizationId: orgId,
    actor: "Stripe",
    action: "checkout.created",
    detail: { sessionId: session.id },
  });

  return { mode: "live" as const, url: session.url || `${getAppUrl()}/app/commercial`, sessionId: session.id };
}

export async function createBillingPortalSession(input: { customerId: string }) {
  if (!requireLive("stripe")) {
    return {
      mode: "simulation" as const,
      url: `${getAppUrl()}/app/commercial?portal=simulated`,
    };
  }
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: input.customerId,
    return_url: `${getAppUrl()}/app/commercial`,
  });
  return { mode: "live" as const, url: session.url };
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

  if (event.type === "checkout.session.completed") {
    const orgId = String(
      (event.data.object.metadata as { organization_id?: string } | undefined)?.organization_id ||
        atlasStore.defaultOrgId(),
    );
    const db = loadDatabase();
    saveDatabase({
      ...db,
      subscriptions: db.subscriptions.map((s, i) =>
        i === 0 ? { ...s, plan: "business", status: "active" } : s,
      ),
    });
    await atlasStore.writeAudit({
      organizationId: orgId,
      actor: "Stripe",
      action: "subscription.activated",
      detail: { session: event.data.object.id },
    });
    emitEvent({
      type: "payment.received",
      organizationId: orgId,
      actorLabel: "Stripe",
      payload: { session: event.data.object.id },
    });
  }

  return { received: true, type: event.type };
}
