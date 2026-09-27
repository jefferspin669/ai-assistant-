import Stripe from "stripe";
import { z } from "zod";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { loadDatabase, nowIso, saveDatabase } from "@/lib/db/store";
import { NotFoundError, ValidationError } from "@/lib/domain/errors";
import { writeAudit } from "@/lib/services/audit";
import { rateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function client() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new ValidationError("Configure STRIPE_SECRET_KEY on the server to connect a bank.");
  return new Stripe(key);
}

export const GET = withPermission("payments.read", async ({ workspace }) => {
  const configured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  if (workspace.role !== "owner" && workspace.role !== "admin" && workspace.role !== "accountant") {
    return apiSuccess({ configured: false, canManage: false, accounts: [] });
  }
  if (!configured) return apiSuccess({ configured: false, canManage: false, accounts: [] });
  const sessions = loadDatabase().integrations.filter((row) =>
    row.organization_id === workspace.organizationId && row.provider === "stripe_financial_connections",
  );
  const stripe = client();
  const accounts = new Map<string, { id: string; name: string; last4: string | null; balance: number | null; currency: string | null; testMode: boolean; balanceAsOf: string | null }>();
  let failedSessions = 0;
  for (const entry of sessions.slice(0, 10)) {
    try {
      const session = await stripe.financialConnections.sessions.retrieve(entry.id);
      for (const account of session.accounts.data) {
        if (account.status !== "active") continue;
        const cents = account.balance?.current?.usd;
        accounts.set(account.id, {
          id: account.id,
          name: account.institution_name || account.display_name || "Bank account",
          last4: account.last4,
          balance: typeof cents === "number" ? cents / 100 : null,
          currency: typeof cents === "number" ? "USD" : null,
          testMode: !account.livemode,
          balanceAsOf: account.balance?.as_of ? new Date(account.balance.as_of * 1000).toISOString() : null,
        });
      }
    } catch {
      failedSessions += 1;
    }
  }
  return apiSuccess({ configured, canManage: workspace.role === "owner" || workspace.role === "admin",
    accounts: [...accounts.values()], connectionError: failedSessions > 0
      ? `${failedSessions} bank connection${failedSessions === 1 ? "" : "s"} could not be verified with Stripe. Do not assume the account was disconnected.`
      : null });
});

export const POST = withPermission("payments.read", async ({ workspace }) => {
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    throw new ValidationError("Only owners or admins can connect a business bank account.");
  }
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new ValidationError("Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to show the secure bank connection form.");
  }
  rateLimit(`bank-link:${workspace.organizationId}:${workspace.userId}`, 5, 60_000);
  const stripe = client();
  const customer = await stripe.customers.create({ metadata: { atlasOrganizationId: workspace.organizationId } });
  const session = await stripe.financialConnections.sessions.create({
    account_holder: { type: "customer", customer: customer.id },
    permissions: ["balances"],
    prefetch: ["balances"],
  });
  if (!session.client_secret) throw new Error("Bank connection session did not return a client secret.");
  const db = loadDatabase();
  saveDatabase({ ...db, integrations: [
    { id: session.id, organization_id: workspace.organizationId,
      provider: "stripe_financial_connections", status: "disconnected",
      account_label: null, last_error: null, updated_at: nowIso() },
    ...db.integrations,
  ] });
  writeAudit(workspace, { action: "started bank connection", entityType: "bank_session", entityId: session.id });
  return apiSuccess({ clientSecret: session.client_secret });
});

export const DELETE = withPermission("payments.read", async ({ workspace, body }) => {
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    throw new ValidationError("Only owners or admins can disconnect a business bank account.");
  }
  const { accountId } = parseBody(z.object({ accountId: z.string().regex(/^fca_[A-Za-z0-9_]+$/) }), body);
  const stripe = client();
  const sessions = loadDatabase().integrations.filter((row) =>
    row.organization_id === workspace.organizationId && row.provider === "stripe_financial_connections");
  let owned = false;
  for (const row of sessions) {
    try {
      const session = await stripe.financialConnections.sessions.retrieve(row.id);
      if (session.accounts.data.some((account) => account.id === accountId)) { owned = true; break; }
    } catch { /* expired provider sessions cannot grant access */ }
  }
  if (!owned) throw new NotFoundError("Connected bank account not found in this workspace.");
  await stripe.financialConnections.accounts.disconnect(accountId);
  writeAudit(workspace, { action: "disconnected bank account", entityType: "bank_account", entityId: accountId });
  return apiSuccess({ disconnected: true });
});
