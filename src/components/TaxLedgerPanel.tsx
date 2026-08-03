"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  computeTaxEstimate,
  createTaxTransaction,
  loadTaxTransactions,
  money,
  removeTaxTransaction,
  saveTaxTransactions,
  type TaxBucket,
  type TaxTransaction,
  type TaxTxnKind,
} from "@/lib/tax-ledger";

export function TaxLedgerPanel() {
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<TaxTransaction[]>([]);
  const [kind, setKind] = useState<TaxTxnKind>("expense");
  const [bucket, setBucket] = useState<TaxBucket>("business");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("85");
  const [category, setCategory] = useState("Supplies");
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [filter, setFilter] = useState<"all" | TaxBucket>("all");

  useEffect(() => {
    setRows(loadTaxTransactions());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveTaxTransactions(rows);
  }, [ready, rows]);

  const estimate = useMemo(() => computeTaxEstimate(rows), [rows]);
  const visible = filter === "all" ? rows : rows.filter((row) => row.bucket === filter);

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!label.trim() || !Number.isFinite(value) || value <= 0) {
      setFlash("Enter a label and a positive amount.");
      return;
    }
    setRows((prev) => [
      createTaxTransaction({
        kind,
        bucket,
        label,
        amount: value,
        category,
        receiptName,
      }),
      ...prev,
    ]);
    setLabel("");
    setReceiptName(null);
    setFlash(
      kind === "income"
        ? `${bucket === "personal" ? "Personal" : "Business"} income recorded.`
        : `${bucket === "personal" ? "Personal" : "Business"} expense recorded.`,
    );
  }

  function onReceipt(file: File | null) {
    if (!file) {
      setReceiptName(null);
      return;
    }
    if (file.size > 900_000) {
      setFlash("Keep receipts under ~900KB for this demo vault.");
      return;
    }
    setReceiptName(file.name);
    if (!label.trim()) setLabel(file.name.replace(/\.[^.]+$/, ""));
  }

  if (!ready) return <div className="panel">Loading tax ledger…</div>;

  return (
    <div className="account-stack" style={{ marginBottom: "1rem" }}>
      {flash ? (
        <p className={flash.includes("Enter") || flash.includes("Keep") ? "auth-error" : "auth-success"}>
          {flash}
        </p>
      ) : null}

      <section className="panel sc-daily-plan">
        <p className="briefing-kicker">Basic tax estimate</p>
        <h2>Planning estimate from your ledger</h2>
        <p className="panel-lead">
          Business income & expenses drive the estimate. Personal expenses stay tracked separately.
        </p>
        <div className="stat-grid metrics-dense">
          <div className="stat">
            <span>Gross income</span>
            <strong>{money(estimate.grossIncome)}</strong>
          </div>
          <div className="stat">
            <span>Business expenses</span>
            <strong>{money(estimate.businessExpenses)}</strong>
          </div>
          <div className="stat">
            <span>Personal expenses</span>
            <strong>{money(estimate.personalExpenses)}</strong>
          </div>
          <div className="stat">
            <span>Est. tax owed</span>
            <strong>{money(estimate.totalEstimated)}</strong>
            <small>{estimate.effectiveRate}% effective · profit {money(estimate.taxableProfit)}</small>
          </div>
        </div>
        <ul className="sc-plan-list">
          <li>
            <strong>{money(estimate.federal)}</strong> federal
          </li>
          <li>
            <strong>{money(estimate.state)}</strong> state
          </li>
          <li>
            <strong>{money(estimate.selfEmployment)}</strong> self-employment
          </li>
        </ul>
      </section>

      <div className="split">
        <section className="panel">
          <div className="train-head">
            <div>
              <h2>Income & expense tracking</h2>
              <p className="panel-lead">Saved on this device — feeds the estimate above.</p>
            </div>
            <div className="cta-row">
              {(["all", "business", "personal"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={filter === item ? "training-tab active" : "training-tab"}
                  onClick={() => setFilter(item)}
                >
                  {item === "all" ? "All" : item === "business" ? "Business" : "Personal"}
                </button>
              ))}
            </div>
          </div>
          <ul className="manage-list">
            {visible.map((row) => (
              <li key={row.id}>
                <div>
                  <strong>
                    {row.kind === "income" ? "+" : "−"}
                    {money(row.amount)} · {row.label}
                  </strong>
                  <small>
                    {row.bucket} · {row.date} · {row.category}
                    {row.receiptName ? ` · receipt ${row.receiptName}` : ""}
                  </small>
                </div>
                <button
                  type="button"
                  className="ghost-link"
                  onClick={() => setRows((prev) => removeTaxTransaction(prev, row.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Add expense or income</h2>
          <p className="panel-lead">Choose Business or Personal for every transaction.</p>
          <form className="form-grid" onSubmit={onAdd}>
            <label>
              Type
              <select value={kind} onChange={(e) => setKind(e.target.value as TaxTxnKind)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label>
              For
              <select value={bucket} onChange={(e) => setBucket(e.target.value as TaxBucket)}>
                <option value="business">Business</option>
                <option value="personal">Personal</option>
              </select>
            </label>
            <label>
              Label
              <input value={label} onChange={(e) => setLabel(e.target.value)} required />
            </label>
            <label>
              Amount
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <label>
              Category
              <input value={category} onChange={(e) => setCategory(e.target.value)} />
            </label>
            <label>
              Receipt upload
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => onReceipt(e.target.files?.[0] || null)}
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Save {bucket} {kind}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
