"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  taxCenterReply,
  taxDeductionHints,
  taxExpenses,
  taxIncomeEntries,
  taxIncomeSources,
} from "@/lib/atlas-platform";

type Mode = "income" | "expenses" | "sources" | "review";
type ExpenseOverride = "Approved" | "Rejected" | "Needs Review" | "Categorized";

const modes: { id: Mode; label: string }[] = [
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "sources", label: "Sources" },
  { id: "review", label: "Needs Review" },
];

const incomeFilters = ["All", "Business", "Client", "Type"] as const;

function statusTone(status: string) {
  if (status === "Categorized" || status === "Connected" || status === "Approved" || status === "User entered") {
    return "ok";
  }
  if (status === "Needs Review" || status === "Needs auth" || status === "Rejected") {
    return "warn";
  }
  return "";
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseAmount(amount: string) {
  return Math.round(Number(amount.replace(/[^0-9.]/g, "")) * 100);
}

export function TaxCenterStudio() {
  const [mode, setMode] = useState<Mode>("income");
  const [incomeLens, setIncomeLens] = useState<(typeof incomeFilters)[number]>("All");
  const [incomeGroup, setIncomeGroup] = useState<string>("All");
  const [selectedIncomeId, setSelectedIncomeId] = useState<string>(taxIncomeEntries[0].id);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>(
    taxExpenses.find((e) => e.status === "Needs Review")?.id ?? taxExpenses[0].id,
  );
  const [expenseStatus, setExpenseStatus] = useState<Record<string, ExpenseOverride>>({});
  const [sourceStatus, setSourceStatus] = useState<Record<string, "Connected" | "Needs auth">>({});
  const [uploaded, setUploaded] = useState<
    {
      id: string;
      merchant: string;
      date: string;
      amount: string;
      salesTax: string;
      category: string;
      businessPurpose: string;
      paymentMethod: string;
      deduction: string;
      status: "Needs Review";
      confidence: number;
      receipt: string;
    }[]
  >([]);
  const [note, setNote] = useState<string | null>(null);
  const [ask, setAsk] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "ai",
      text: "I track income from banks, payroll, processors, accounting, and Atlas invoices — and extract receipts into deductions. Uncertain expenses stay in Needs Review.",
    },
  ]);

  const expenses = useMemo(() => [...uploaded, ...taxExpenses], [uploaded]);

  const resolvedStatus = (id: string, fallback: string) => expenseStatus[id] ?? fallback;

  const needsReview = expenses.filter((e) => resolvedStatus(e.id, e.status) === "Needs Review");
  const reviewCount =
    needsReview.length + taxIncomeEntries.filter((i) => i.status === "Needs Review").length;

  const incomeGroups = useMemo(() => {
    if (incomeLens === "Business") {
      return ["All", ...Array.from(new Set(taxIncomeEntries.map((e) => e.business)))];
    }
    if (incomeLens === "Client") {
      return ["All", ...Array.from(new Set(taxIncomeEntries.map((e) => e.client)))];
    }
    if (incomeLens === "Type") {
      return ["All", ...Array.from(new Set(taxIncomeEntries.map((e) => e.incomeType)))];
    }
    return ["All"];
  }, [incomeLens]);

  const filteredIncome = useMemo(() => {
    if (incomeGroup === "All" || incomeLens === "All") return [...taxIncomeEntries];
    if (incomeLens === "Business") return taxIncomeEntries.filter((e) => e.business === incomeGroup);
    if (incomeLens === "Client") return taxIncomeEntries.filter((e) => e.client === incomeGroup);
    return taxIncomeEntries.filter((e) => e.incomeType === incomeGroup);
  }, [incomeLens, incomeGroup]);

  const selectedIncome =
    taxIncomeEntries.find((e) => e.id === selectedIncomeId) ?? taxIncomeEntries[0];
  const selectedExpense = expenses.find((e) => e.id === selectedExpenseId) ?? expenses[0];

  const incomeTotal = taxIncomeEntries.reduce((sum, e) => sum + parseAmount(e.amount), 0);
  const expenseTotal = expenses
    .filter((e) => resolvedStatus(e.id, e.status) !== "Rejected")
    .reduce((sum, e) => sum + parseAmount(e.amount), 0);
  const deductionReady = expenses.filter((e) => {
    const status = resolvedStatus(e.id, e.status);
    return status === "Categorized" || status === "Approved";
  }).length;

  function setLens(lens: (typeof incomeFilters)[number]) {
    setIncomeLens(lens);
    setIncomeGroup("All");
  }

  function approveExpense(id: string, merchant: string) {
    setExpenseStatus((prev) => ({ ...prev, [id]: "Approved" }));
    setNote(`Approved “${merchant}” as a deduction. Atlas will include it in tax prep.`);
  }

  function keepInReview(id: string, merchant: string) {
    setExpenseStatus((prev) => ({ ...prev, [id]: "Needs Review" }));
    setNote(`“${merchant}” stays in Needs Review — Atlas will not claim it automatically.`);
  }

  function rejectExpense(id: string, merchant: string) {
    setExpenseStatus((prev) => ({ ...prev, [id]: "Rejected" }));
    setNote(`Marked “${merchant}” as personal / not deductible.`);
  }

  function connectSource(id: string, name: string) {
    setSourceStatus((prev) => ({ ...prev, [id]: "Connected" }));
    setNote(`${name} connected. Atlas will pull income on the next sync.`);
  }

  function simulateUpload() {
    const id = `upload-${Date.now()}`;
    const receipt = {
      id,
      merchant: "Office Depot",
      date: "Mar 19",
      amount: "$54.18",
      salesTax: "$4.06",
      category: "Office supplies",
      businessPurpose: "Paper, binders, shipping labels",
      paymentMethod: "Business debit",
      deduction: "Office supplies",
      status: "Needs Review" as const,
      confidence: 72,
      receipt: "Photo · just now",
    };
    setUploaded((prev) => [receipt, ...prev]);
    setSelectedExpenseId(id);
    setMode("expenses");
    setNote(
      "Receipt scanned: merchant, date, amount, sales tax, category, purpose, and payment method extracted. Marked Needs Review until you confirm.",
    );
  }

  function onAsk(e: FormEvent) {
    e.preventDefault();
    const trimmed = ask.trim();
    if (!trimmed) return;
    setChat((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "ai", text: taxCenterReply(trimmed) },
    ]);
    setAsk("");
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>YTD income tracked</span>
          <strong>{formatMoney(incomeTotal)}</strong>
          <small>{taxIncomeEntries.length} entries from connected sources</small>
        </div>
        <div className="stat">
          <span>Expenses logged</span>
          <strong>{formatMoney(expenseTotal)}</strong>
          <small>{deductionReady} ready as deductions</small>
        </div>
        <div className="stat">
          <span>Needs Review</span>
          <strong>{reviewCount}</strong>
          <small>Not claimed until you approve</small>
        </div>
        <div className="stat">
          <span>Sources live</span>
          <strong>
            {
              taxIncomeSources.filter(
                (s) => (sourceStatus[s.id] ?? s.status) === "Connected",
              ).length
            }
          </strong>
          <small>of {taxIncomeSources.length} connections</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Tax Center modes">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "training-tab active" : "training-tab"}
            onClick={() => setMode(item.id)}
          >
            {item.label}
            {item.id === "review" && reviewCount > 0 ? (
              <span className="hub-tab-count">{reviewCount}</span>
            ) : null}
          </button>
        ))}
      </div>

      {mode === "income" ? (
        <div className="split">
          <section className="panel">
            <h2>Automatic income tracking</h2>
            <p className="panel-lead">
              Organized by business, job, client, and income type — from banks, payroll, processors,
              accounting, Atlas invoices, 1099, and W-2 entries.
            </p>
            <div className="quality-filter-row">
              {incomeFilters.map((lens) => (
                <button
                  key={lens}
                  type="button"
                  className={incomeLens === lens ? "training-tab active" : "training-tab"}
                  onClick={() => setLens(lens)}
                >
                  {lens === "All" ? "All income" : `By ${lens.toLowerCase()}`}
                </button>
              ))}
            </div>
            {incomeLens !== "All" ? (
              <div className="quality-filter-row" style={{ marginTop: "0.55rem" }}>
                {incomeGroups.map((group) => (
                  <button
                    key={group}
                    type="button"
                    className={incomeGroup === group ? "training-tab active" : "training-tab"}
                    onClick={() => setIncomeGroup(group)}
                  >
                    {group}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="list" style={{ marginTop: "0.9rem" }}>
              {filteredIncome.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={
                    selectedIncomeId === entry.id ? "compliance-row active" : "compliance-row"
                  }
                  onClick={() => setSelectedIncomeId(entry.id)}
                >
                  <span className={`badge${statusTone(entry.status) === "ok" ? " ok" : statusTone(entry.status) === "warn" ? " warn" : ""}`}>
                    {entry.status}
                  </span>
                  <div>
                    <p>
                      <strong>
                        {entry.amount} · {entry.client === "—" ? entry.job : entry.client}
                      </strong>
                    </p>
                    <small className="muted-line">
                      {entry.business} · {entry.incomeType} · {entry.source} · {entry.date}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>{selectedIncome.job}</h2>
            <p className="panel-lead">
              {selectedIncome.amount} on {selectedIncome.date}
            </p>
            <div className="list">
              <div className="list-row">
                <span className="badge">Business</span>
                <p>{selectedIncome.business}</p>
              </div>
              <div className="list-row">
                <span className="badge">Client</span>
                <p>{selectedIncome.client}</p>
              </div>
              <div className="list-row">
                <span className="badge">Type</span>
                <p>{selectedIncome.incomeType}</p>
              </div>
              <div className="list-row">
                <span className="badge">Source</span>
                <p>{selectedIncome.source}</p>
              </div>
              <div className="list-row">
                <span
                  className={`badge${statusTone(selectedIncome.status) === "ok" ? " ok" : statusTone(selectedIncome.status) === "warn" ? " warn" : ""}`}
                >
                  {selectedIncome.status}
                </span>
                <p>Classification</p>
              </div>
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Atlas note</div>
              <p>
                {selectedIncome.status === "Needs Review"
                  ? "P2P payment matched to a job with medium confidence. Confirm client and income type before filing."
                  : selectedIncome.incomeType === "W-2"
                    ? "W-2 wages entered by you — kept under Personal and excluded from business revenue totals where appropriate."
                    : "Synced automatically and tagged to business, job, client, and income type."}
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {mode === "expenses" ? (
        <div className="split">
          <section className="panel">
            <h2>Expense & deduction tracking</h2>
            <p className="panel-lead">
              Photograph or upload receipts. Atlas extracts merchant, date, amount, sales tax,
              category, business purpose, and payment method — then suggests deductions.
            </p>
            <div className="train-actions" style={{ marginTop: 0, marginBottom: "0.85rem" }}>
              <button className="btn btn-dark" type="button" onClick={simulateUpload}>
                Upload / photograph receipt
              </button>
            </div>
            <div className="list">
              {expenses.map((expense) => {
                const status = resolvedStatus(expense.id, expense.status);
                return (
                  <button
                    key={expense.id}
                    type="button"
                    className={
                      selectedExpenseId === expense.id
                        ? "compliance-row active"
                        : "compliance-row"
                    }
                    onClick={() => setSelectedExpenseId(expense.id)}
                  >
                    <span
                      className={`badge${statusTone(status) === "ok" ? " ok" : statusTone(status) === "warn" ? " warn" : ""}`}
                    >
                      {status}
                    </span>
                    <div>
                      <p>
                        <strong>
                          {expense.merchant} · {expense.amount}
                        </strong>
                      </p>
                      <small className="muted-line">
                        {expense.deduction} · {expense.date} · {expense.confidence}% confidence
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>{selectedExpense.merchant}</h2>
            <p className="panel-lead">Extracted from {selectedExpense.receipt}</p>
            <div className="list">
              <div className="list-row">
                <span className="badge">Date</span>
                <p>{selectedExpense.date}</p>
              </div>
              <div className="list-row">
                <span className="badge">Amount</span>
                <p>{selectedExpense.amount}</p>
              </div>
              <div className="list-row">
                <span className="badge">Sales tax</span>
                <p>{selectedExpense.salesTax}</p>
              </div>
              <div className="list-row">
                <span className="badge">Category</span>
                <p>{selectedExpense.category}</p>
              </div>
              <div className="list-row">
                <span className="badge">Purpose</span>
                <p>{selectedExpense.businessPurpose}</p>
              </div>
              <div className="list-row">
                <span className="badge">Paid with</span>
                <p>{selectedExpense.paymentMethod}</p>
              </div>
              <div className="list-row">
                <span className="badge ok">Deduction</span>
                <p>{selectedExpense.deduction}</p>
              </div>
              <div className="list-row">
                <span
                  className={`badge${statusTone(resolvedStatus(selectedExpense.id, selectedExpense.status)) === "ok" ? " ok" : " warn"}`}
                >
                  {resolvedStatus(selectedExpense.id, selectedExpense.status)}
                </span>
                <p>{selectedExpense.confidence}% extraction confidence</p>
              </div>
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Possible deductions Atlas watches</div>
              <p>{taxDeductionHints.join(" · ")}</p>
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => approveExpense(selectedExpense.id, selectedExpense.merchant)}
                disabled={resolvedStatus(selectedExpense.id, selectedExpense.status) === "Approved"}
              >
                Approve deduction
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => keepInReview(selectedExpense.id, selectedExpense.merchant)}
              >
                Keep Needs Review
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => rejectExpense(selectedExpense.id, selectedExpense.merchant)}
              >
                Not deductible
              </button>
            </div>
            {note ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                {note}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "sources" ? (
        <div className="split">
          <section className="panel">
            <h2>Income sources</h2>
            <p className="panel-lead">
              Business and personal banks, payroll, Stripe, Square, PayPal, Venmo, Cash App,
              accounting platforms, Atlas invoices, contractor 1099, and W-2 income you enter.
            </p>
            <div className="list">
              {taxIncomeSources.map((source) => {
                const status = sourceStatus[source.id] ?? source.status;
                return (
                  <div className="list-row" key={source.id}>
                    <span
                      className={`badge${statusTone(status) === "ok" ? " ok" : statusTone(status) === "warn" ? " warn" : ""}`}
                    >
                      {status}
                    </span>
                    <div>
                      <p>
                        <strong>{source.name}</strong>
                      </p>
                      <small className="muted-line">
                        {source.kind} · Last sync {source.lastSync}
                      </small>
                      {status === "Needs auth" ? (
                        <div className="train-actions">
                          <button
                            className="btn btn-dark"
                            type="button"
                            onClick={() => connectSource(source.id, source.name)}
                          >
                            Connect
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>Ask Tax Center</h2>
            <div className="chat-mock">
              {chat.map((bubble, i) => (
                <div
                  className={`bubble ${bubble.role === "user" ? "bubble-user" : "bubble-ai"}`}
                  key={`${bubble.role}-${i}`}
                >
                  {bubble.text}
                </div>
              ))}
            </div>
            <form className="train-form" onSubmit={onAsk}>
              <input
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                placeholder="Ask about income, receipts, or deductions…"
                aria-label="Ask Tax Center"
              />
              <button className="btn btn-dark" type="submit">
                Ask
              </button>
            </form>
            {note ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                {note}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "review" ? (
        <section className="panel">
          <h2>Needs Review</h2>
          <p className="panel-lead">
            Uncertain expenses are never claimed automatically. Confirm, split, or reject before tax
            prep.
          </p>
          <div className="list">
            {needsReview.length === 0 ? (
              <div className="list-row">
                <span className="badge ok">Clear</span>
                <p>No uncertain expenses — nice work.</p>
              </div>
            ) : (
              needsReview.map((expense) => (
                <div className="list-row" key={expense.id}>
                  <span className="badge warn">Needs Review</span>
                  <div>
                    <p>
                      <strong>
                        {expense.merchant} · {expense.amount}
                      </strong>
                    </p>
                    <small className="muted-line">
                      Suggested: {expense.deduction} · {expense.confidence}% confidence ·{" "}
                      {expense.businessPurpose}
                    </small>
                    <div className="train-actions">
                      <button
                        className="btn btn-dark"
                        type="button"
                        onClick={() => {
                          setSelectedExpenseId(expense.id);
                          setMode("expenses");
                        }}
                      >
                        Open expense
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => approveExpense(expense.id, expense.merchant)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => rejectExpense(expense.id, expense.merchant)}
                      >
                        Not deductible
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            {taxIncomeEntries
              .filter((entry) => entry.status === "Needs Review")
              .map((entry) => (
                <div className="list-row" key={entry.id}>
                  <span className="badge warn">Needs Review</span>
                  <div>
                    <p>
                      <strong>
                        Income · {entry.amount} · {entry.client}
                      </strong>
                    </p>
                    <small className="muted-line">
                      {entry.source} · {entry.incomeType} · {entry.job}
                    </small>
                    <div className="train-actions">
                      <button
                        className="btn btn-dark"
                        type="button"
                        onClick={() => {
                          setSelectedIncomeId(entry.id);
                          setMode("income");
                        }}
                      >
                        Open income
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {note ? (
            <p className="muted-line" style={{ marginTop: "0.85rem" }}>
              {note}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
