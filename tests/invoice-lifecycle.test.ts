import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase, loadDatabase, saveDatabase, createEmptyOrganization } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import { createAndSendInvoice } from "../src/lib/integrations/actions";
import { resolveApproval } from "../src/lib/domain/actions";
import { handleStripeWebhook } from "../src/lib/integrations/stripe";
import { createSession, cookieHeader } from "../src/lib/auth/session";
import { GET as approvalsGet, POST as approvalsPost } from "../src/app/api/approvals/route";
import { GET as invoicesGet } from "../src/app/api/invoices/route";
import { DELETE as bankDisconnect } from "../src/app/api/banking/connect/route";

describe("invoice approval and payment integrity", () => {
  beforeEach(() => { vi.stubEnv("STRIPE_SECRET_KEY", ""); vi.stubEnv("STRIPE_WEBHOOK_SECRET", ""); resetDatabase(); });
  afterEach(() => vi.unstubAllEnvs());

  function owner() {
    const db = database();
    return testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
  }

  it("stages, approves, and never confuses approval with delivery or payment", async () => {
    const ctx = owner();
    const draft = await createAndSendInvoice(ctx, {
      customerName: "Customer", customerEmail: "customer@example.com", amountCents: 12_500,
    });
    expect(draft.status).toBe("needs_approval");
    const approved = await resolveApproval(ctx, draft.approvalId, "approved");
    expect(approved.result).toEqual({ awaitingSend: true });
    expect(loadDatabase().transactions.find((row) => row.category === "invoice_payment")).toBeUndefined();
    await expect(createAndSendInvoice(ctx, { customerName: "Customer", customerEmail: "customer@example.com",
      amountCents: 12_500, confirmationId: draft.approvalId })).rejects.toThrow("Approval was not consumed");
    expect(loadDatabase().approvals.find((row) => row.id === draft.approvalId)?.payload.consumedAt).toBeUndefined();
  });

  it("rejects unsigned invoice payments, mismatched amounts, and duplicate signed events", async () => {
    const ctx = owner();
    const db = loadDatabase();
    const document = { id: "doc_invoice_test", userId: ctx.userId, orgId: ctx.organizationId,
      title: "Invoice in_test", kind: "document" as const,
      content: JSON.stringify({ customer: "Customer", amountCents: 12_500, status: "sent_unpaid" }),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    saveDatabase({ ...db, documents: [document, ...db.documents] });
    const payload = (cents: number) => JSON.stringify({ type: "invoice.paid",
      data: { object: { id: "in_test", metadata: { organization_id: ctx.organizationId }, amount_paid: cents } } });
    await expect(handleStripeWebhook(payload(12_500), null)).rejects.toThrow(/signature/i);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    const stripe = new Stripe("sk_test_dummy");
    const signed = async (body: string) => {
      const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret: "whsec_test" });
      await handleStripeWebhook(body, signature);
    };
    await signed(payload(10_000));
    expect(loadDatabase().transactions.find((row) => row.id === "paid_in_test")).toBeUndefined();
    await signed(payload(12_500));
    await signed(payload(12_500));
    expect(loadDatabase().transactions.filter((row) => row.id === "paid_in_test")).toHaveLength(1);
  });

  it("exposes only this owner's approval and invoices, and blocks cross-tenant bank disconnect", async () => {
    const a = owner();
    const b = createEmptyOrganization({ businessName: "Business B", ownerEmail: "second@example.com",
      ownerName: "Second Owner", password: "atlas-demo" });
    const cookieA = cookieHeader(createSession(a.userId, a.organizationId).token);
    const cookieB = cookieHeader(createSession(b.userId, b.orgId).token);
    const draft = await createAndSendInvoice(a, {
      customerName: "Customer", customerEmail: "customer@example.com", amountCents: 13_000,
    });
    const listA = await approvalsGet(new Request("http://atlas.test/api/approvals", { headers: { cookie: cookieA } }));
    const listB = await approvalsGet(new Request("http://atlas.test/api/approvals", { headers: { cookie: cookieB } }));
    expect((await listA.json()).data.some((row: { id: string }) => row.id === draft.approvalId)).toBe(true);
    expect((await listB.json()).data.some((row: { id: string }) => row.id === draft.approvalId)).toBe(false);
    const approved = await approvalsPost(new Request("http://atlas.test/api/approvals", {
      method: "POST", headers: { cookie: cookieA, "content-type": "application/json" },
      body: JSON.stringify({ id: draft.approvalId, decision: "approved" }),
    }));
    expect(approved.status).toBe(200);
    expect((await invoicesGet(new Request("http://atlas.test/api/invoices", { headers: { cookie: cookieA } }))).status).toBe(200);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
    const db = loadDatabase();
    saveDatabase({ ...db, integrations: [{ id: "fcs_account_a", organization_id: a.organizationId,
      provider: "stripe_financial_connections", status: "connected", account_label: "A",
      last_error: null, updated_at: new Date().toISOString() }, ...db.integrations] });
    const disconnected = await bankDisconnect(new Request("http://atlas.test/api/banking/connect", {
      method: "DELETE", headers: { cookie: cookieB, "content-type": "application/json" },
      body: JSON.stringify({ accountId: "fca_belongs_to_a" }),
    }));
    expect(disconnected.status).toBe(404);
  });
});
