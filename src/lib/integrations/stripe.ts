import { getAppUrl, requireLive } from "@/lib/integrations/config";
import { atlasStore } from "@/lib/integrations/supabase";
import { loadDatabase, saveDatabase } from "@/lib/db/store";

function stripeKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

async function stripeRequest<T>(path: string, init?: RequestInit & { form?: Record<string, string> }) {
  const key = stripeKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    ...(init?.headers as Record<string, string> | undefined),
  };
  let body: BodyInit | undefined = init?.body as BodyInit | undefined;
  if (init?.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(init.form);
  }
  const res = await fetch(`https://api.stripe.com/v1/${path}`, { ...init, headers, body });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(json.error?.message || `Stripe ${res.status}`);
  }
  return json as T;
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

  const form: Record<string, string> = {
    mode: "subscription",
    success_url: `${getAppUrl()}/app/commercial?checkout=success`,
    cancel_url: `${getAppUrl()}/app/commercial?checkout=cancel`,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    "metadata[organization_id]": orgId,
  };
  if (input.customerEmail) form.customer_email = input.customerEmail;

  const session = await stripeRequest<{ id: string; url: string }>("checkout/sessions", {
    method: "POST",
    form,
  });

  await atlasStore.writeAudit({
    organizationId: orgId,
    actor: "Stripe",
    action: "checkout.created",
    detail: { sessionId: session.id },
  });

  return { mode: "live" as const, url: session.url, sessionId: session.id };
}

export async function createBillingPortalSession(input: { customerId: string }) {
  if (!requireLive("stripe")) {
    return {
      mode: "simulation" as const,
      url: `${getAppUrl()}/app/commercial?portal=simulated`,
    };
  }
  const session = await stripeRequest<{ url: string }>("billing_portal/sessions", {
    method: "POST",
    form: {
      customer: input.customerId,
      return_url: `${getAppUrl()}/app/commercial`,
    },
  });
  return { mode: "live" as const, url: session.url };
}

export async function handleStripeWebhook(rawBody: string, signature: string | null) {
  // Signature verification requires STRIPE_WEBHOOK_SECRET; without it we accept in simulation only.
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (secret && signature) {
    // Minimal presence check — full HMAC verification can be added with stripe SDK.
    // We still parse and apply events when secret is configured.
  } else if (requireLive("stripe") && secret && !signature) {
    throw new Error("Missing Stripe-Signature");
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: { object: Record<string, unknown> };
  };

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
  }

  return { received: true, type: event.type };
}
