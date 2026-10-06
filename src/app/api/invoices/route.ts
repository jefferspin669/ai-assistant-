import { apiSuccess, withPermission } from "@/lib/api/http";
import { loadDatabase } from "@/lib/db/store";

export const GET = withPermission("actions.invoice", async ({ workspace }) => {
  const db = loadDatabase();
  const invoices = db.documents
    .filter((row) => row.orgId === workspace.organizationId && row.title.startsWith("Invoice in_"))
    .map((row) => {
      const id = row.title.slice("Invoice ".length);
      let content: Record<string, unknown> = {};
      try { content = JSON.parse(row.content) as Record<string, unknown>; } catch { /* legacy document */ }
      const amountCents = Number(content.amountCents || 0);
      const paid = db.transactions.some((transaction) =>
        transaction.orgId === workspace.organizationId && transaction.id === `paid_${id}` &&
        Math.round(transaction.amount * 100) === amountCents);
      let hostedInvoiceUrl: string | null = null;
      try {
        const url = new URL(String(content.hostedInvoiceUrl || ""));
        if (url.protocol === "https:" && ["invoice.stripe.com", "pay.stripe.com"].includes(url.hostname)) {
          hostedInvoiceUrl = url.toString();
        }
      } catch { /* untrusted or legacy invoice URL */ }
      return {
        id,
        customer: String(content.customer || "Customer"),
        amountCents,
        status: paid ? "paid" as const : "sent_unpaid" as const,
        hostedInvoiceUrl,
      };
    });
  return apiSuccess(invoices);
});
