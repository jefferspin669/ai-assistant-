"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/SiteLink";
import { apiGet, apiSend } from "@/lib/backend/client";
import type { Transaction } from "@/lib/domain/types";

type View = "money" | "banking" | "tax" | "payments";
type Bank = { id: string; name: string; last4: string | null; balance: number | null; currency: string | null; testMode: boolean; balanceAsOf: string | null };
type InvoiceApproval = { id: string; status: "pending" | "approved" | "rejected"; action_type: string; payload: { customerName?: string; customerEmail?: string; amountCents?: number; memo?: string; consumedAt?: string } };
type InvoiceRecord = { id: string; customer: string; amountCents: number; status: "sent_unpaid" | "paid"; hostedInvoiceUrl: string | null };
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function MoneyWorkspace({ view }: { view: View }) {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [approvals, setApprovals] = useState<InvoiceApproval[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [bankAvailable, setBankAvailable] = useState(false);
  const [canManageBank, setCanManageBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceMemo, setInvoiceMemo] = useState("");

  const refresh = useCallback(async () => {
    const result = await apiGet<Transaction[]>("/api/transactions");
    if (result.ok) setRows(result.data.filter((row) => row.provenance !== "DEMO"));
    else setMessage(result.error);
    if (view !== "tax") {
      const bankResult = await apiGet<{ configured: boolean; canManage: boolean; accounts: Bank[]; connectionError: string | null }>("/api/banking/connect");
      if (bankResult.ok) {
        setBankAvailable(bankResult.data.configured);
        setCanManageBank(bankResult.data.canManage);
        setBanks(bankResult.data.accounts);
        setBankError(bankResult.data.connectionError);
      } else {
        setBankError(bankResult.error);
      }
    }
    if (view === "payments") {
      const [drafts, sent] = await Promise.all([
        apiGet<InvoiceApproval[]>("/api/approvals"), apiGet<InvoiceRecord[]>("/api/invoices"),
      ]);
      if (drafts.ok) setApprovals(drafts.data.filter((row) => row.action_type === "SEND_INVOICE" && !row.payload.consumedAt));
      if (sent.ok) setInvoices(sent.data);
    }
    setLoaded(true);
  }, [view]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30_000);
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  const relevant = useMemo(() => rows.filter((row) => row.date.startsWith(String(year)) && row.category !== "invoice"), [rows, year]);
  const income = relevant.filter((r) => r.kind === "income").reduce((sum, r) => sum + r.amount, 0);
  const expenses = relevant.filter((r) => r.kind === "expense").reduce((sum, r) => sum + r.amount, 0);

  async function record(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await apiSend<Transaction>("/api/transactions", "POST", {
      kind, label: label.trim(), amount: Number(amount), date, category: category.trim() || "Uncategorized",
    });
    setBusy(false);
    if (!result.ok) { setMessage(result.error); return; }
    setRows((previous) => [result.data, ...previous]);
    setLabel(""); setAmount("");
    setMessage("Recorded in this workspace. This does not move funds or confirm payment.");
  }

  async function connectBank() {
    setBusy(true);
    setMessage("");
    const session = await apiSend<{ clientSecret: string }>("/api/banking/connect", "POST", {});
    if (!session.ok) { setMessage(session.error); setBusy(false); return; }
    try {
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) throw new Error("Stripe publishable key is missing.");
      if (!window.Stripe) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://js.stripe.com/v3/";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Stripe connection form could not load."));
          document.head.appendChild(script);
        });
      }
      const stripe = window.Stripe?.(publishableKey);
      if (!stripe) throw new Error("Stripe could not initialize.");
      const linked = await stripe.collectFinancialConnectionsAccounts({ clientSecret: session.data.clientSecret });
      if (linked.error) throw new Error(linked.error.message || "Bank connection was cancelled.");
      await refresh();
      setMessage("Bank connection returned. Verify the linked accounts below.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect bank.");
    } finally { setBusy(false); }
  }

  async function disconnectBank(bank: Bank) {
    if (!window.confirm(`Disconnect ${bank.name} from Atlas? Atlas will lose access to its balance.`)) return;
    setBusy(true);
    const result = await apiSend<{ disconnected: boolean }>("/api/banking/connect", "DELETE", { accountId: bank.id });
    setBusy(false);
    setMessage(result.ok ? "Bank connection disconnected. No funds were moved." : result.error);
    if (result.ok) void refresh();
  }

  async function invoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const result = await apiSend<{ status: string; approvalId?: string; invoiceId?: string; hostedInvoiceUrl?: string | null }>(
      "/api/actions/send-invoice", "POST", {
        customerName, customerEmail, amountCents: Math.round(Number(invoiceAmount) * 100),
        memo: invoiceMemo,
      });
    setBusy(false);
    if (!result.ok) { setMessage(result.error); return; }
    if (result.data.status === "needs_approval") {
      setMessage("Invoice staged. Review and approve it in Approvals, then return here to send.");
      void refresh();
    } else {
      setMessage(`Stripe invoice ${result.data.invoiceId} sent. No payment has been recorded yet.`);
      void refresh();
    }
  }

  async function sendApproved(row: InvoiceApproval) {
    setBusy(true);
    const result = await apiSend<{ invoiceId: string }>("/api/actions/send-invoice", "POST", {
      confirmationId: row.id,
      customerName: row.payload.customerName,
      customerEmail: row.payload.customerEmail,
      amountCents: row.payload.amountCents,
      memo: row.payload.memo,
    });
    setBusy(false);
    setMessage(result.ok ? `Stripe invoice ${result.data.invoiceId} sent. Waiting for verified payment.` : result.error);
    void refresh();
  }

  return (
    <div className="account-stack">
      {message ? <p role="status" className="panel">{message}</p> : null}
      {view !== "tax" ? <section className="panel">
        <h2>Bank accounts</h2>
        <p className="panel-lead">Connect through Stripe Financial Connections. Atlas does not ask for or store your routing number or online banking password. Linking an account only permits viewing account data; it does not deposit or transfer money.</p>
        {bankError ? <p role="alert" className="auth-error">{bankError}</p> : null}
        {banks.length ? <ul className="manage-list">{banks.map((bank) => <li key={bank.id}><div><strong>{bank.name} {bank.last4 ? `•••• ${bank.last4}` : ""} {bank.testMode ? "(Stripe test account)" : ""}</strong><small>{bank.balance === null ? "Balance unavailable" : `${usd(bank.balance)} ${bank.currency || "USD"} · reported ${bank.balanceAsOf ? new Date(bank.balanceAsOf).toLocaleDateString() : "at connection"}`}</small></div>{canManageBank ? <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void disconnectBank(bank)}>Disconnect</button> : null}</li>)}</ul> : <p>No verified bank accounts connected.</p>}
        {canManageBank || !bankAvailable ? <button type="button" className="btn btn-dark" disabled={!bankAvailable || busy || !canManageBank} onClick={() => void connectBank()}>Connect bank securely</button> : null}
        {!bankAvailable ? <p>To enable connections, configure Stripe server and publishable keys on a running Atlas server. Your Stripe account must have Financial Connections enabled.</p> : null}
      </section> : null}
      {view === "tax" ? <section className="panel">
        <h2>Tax preparation overview</h2>
        <p className="panel-lead">Amounts below update from recorded workspace transactions. They are bookkeeping totals, not a tax return or a calculation of tax owed. Review categories, other income, deductions, entity type, location, and prior payments with a tax professional.</p>
        <label>Tax year <input aria-label="Tax year" type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
        <div className="stat-grid metrics-dense">
          <div className="stat"><span>Recorded income</span><strong>{usd(income)}</strong></div>
          <div className="stat"><span>Recorded expenses</span><strong>{usd(expenses)}</strong></div>
          <div className="stat"><span>Net recorded activity</span><strong>{usd(income - expenses)}</strong></div>
          <div className="stat"><span>Tax due</span><strong>Needs review</strong></div>
        </div>
        <p>Invoices awaiting payment are excluded from these totals. Bank transactions do not enter the ledger automatically yet; review imports and duplicates before recording them.</p>
      </section> : <section className="panel"><h2>Recorded money movement</h2><p className="panel-lead">Manual entries are saved on the Atlas server. They are not bank deposits, bank transactions, or proof an invoice has been paid.</p></section>}
      <div className="split">
        <section className="panel"><h2>Transactions</h2>{!loaded ? <p>Loading…</p> : rows.length === 0 ? <p>No real entries yet. Demo rows are hidden here.</p> : <ul className="manage-list">{rows.slice(0, 50).map((row) => <li key={row.id}><strong>{row.kind === "income" ? "+" : "−"}{usd(row.amount)} · {row.label}</strong><small>{row.date} · {row.category || "Uncategorized"}{row.category === "invoice" ? " · invoice, payment unverified" : ""}</small></li>)}</ul>}</section>
        <section className="panel"><h2>Record income or expense</h2><form className="form-grid" onSubmit={(event) => void record(event)}>
          <label>Type<select value={kind} onChange={(e) => setKind(e.target.value as "income" | "expense")}><option value="income">Income received</option><option value="expense">Expense paid</option></select></label>
          <label>Description<input value={label} maxLength={200} onChange={(e) => setLabel(e.target.value)} required /></label>
          <label>Amount (USD)<input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
          <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
          <label>Category<input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="For review" /></label>
          <button type="submit" className="btn btn-dark" disabled={busy}>Save entry</button>
        </form></section>
      </div>
      {view === "payments" ? <section className="panel"><h2>Send an invoice</h2><p>Atlas stages the invoice first. An owner or admin must approve it in <Link href="/app/approvals">Approvals</Link> before Stripe emails it. Configure Stripe invoicing and signed webhooks on the server; enable desired customer payment methods in Stripe. Connecting your own bank for account data does not configure Stripe payouts.</p>
        {approvals.filter((row) => row.status === "approved").map((row) => <div className="confirm-card" key={row.id}>
          <p>Approved draft for {row.payload.customerName}: {usd((row.payload.amountCents || 0) / 100)} to {row.payload.customerEmail}. Not yet sent.</p>
          <button type="button" className="btn btn-dark" disabled={busy} onClick={() => void sendApproved(row)}>Send approved invoice</button>
        </div>)}
        {approvals.filter((row) => row.status === "pending").map((row) => <p key={row.id}>Awaiting approval: {row.payload.customerName} · {usd((row.payload.amountCents || 0) / 100)}. <Link href="/app/approvals">Review approval</Link></p>)}
        {invoices.length ? <div><h3>Sent invoices</h3><ul className="manage-list">{invoices.map((row) => <li key={row.id}><div><strong>{row.customer} · {usd(row.amountCents / 100)}</strong><small>{row.status === "paid" ? "Paid · verified by Stripe event" : "Sent · payment not verified"}</small></div>{row.hostedInvoiceUrl ? <a href={row.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">Open Stripe invoice</a> : null}</li>)}</ul></div> : null}
        <form className="form-grid" onSubmit={(event) => void invoice(event)}>
          <label>Customer name<input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label>
          <label>Customer email<input required type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} /></label>
          <label>Amount (USD)<input required min="0.50" max="1000000" step="0.01" type="number" value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} /></label>
          <label>Description<input required value={invoiceMemo} onChange={(event) => setInvoiceMemo(event.target.value)} /></label>
          <button className="btn btn-dark" type="submit" disabled={busy}>Stage invoice for approval</button>
        </form></section> : null}
    </div>
  );
}

declare global {
  interface Window {
    Stripe?: (key: string) => { collectFinancialConnectionsAccounts: (options: { clientSecret: string }) => Promise<{ error?: { message?: string } }> };
  }
}
