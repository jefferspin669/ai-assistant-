"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useEffect, useState } from "react";
import {
  createPurchaseFromReceipt,
  flagUnmatchedTransactions,
  loadApprovalTiers,
  loadPurchases,
  parseReceiptText,
  pendingInventoryFromPurchase,
  saveApprovalTiers,
  type ApprovalTier,
  type ExpensePurchase,
} from "@/lib/expenses-workspace";
import {
  addInventoryFromReceipt,
  type ReceiptInventoryLine,
} from "@/lib/inventory-workspace";
import { loadTeamMembers, seedDemoTeamIfEmpty } from "@/lib/user-workspace";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ExpensesStudioInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "purchases";
  const [purchases, setPurchases] = useState<ExpensePurchase[]>([]);
  const [tiers, setTiers] = useState<ApprovalTier[]>([]);
  const [receiptText, setReceiptText] = useState("Office Depot\n$840.00\n20 boxes printer paper");
  const [project, setProject] = useState("Office Renovation");
  const [employeeId, setEmployeeId] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [pendingInventory, setPendingInventory] = useState<ReceiptInventoryLine[] | null>(null);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    const members = loadTeamMembers();
    if (members[0]) setEmployeeId(members[0].id);
    setPurchases(loadPurchases());
    setTiers(loadApprovalTiers());
  }, []);

  function onScan(e: FormEvent) {
    e.preventDefault();
    const member = loadTeamMembers().find((m) => m.id === employeeId);
    if (!member) return;
    const scan = parseReceiptText(receiptText);
    const purchase = createPurchaseFromReceipt(scan, member.id, member.name, project, receiptText);
    setPurchases(loadPurchases());
    const lines = pendingInventoryFromPurchase(purchase);
    if (lines.length) {
      setPendingInventory(lines);
      setNote(
        `Purchase AI recognized: ${lines.map((l) => `${l.quantity} × ${l.itemName}`).join(", ")}. Add to inventory?`,
      );
    } else {
      setPendingInventory(null);
      setNote(
        `${purchase.merchant} $${purchase.amount.toFixed(2)} · Receipt ✓ · Card ${purchase.cardMatched ? "✓ matched" : "pending"} · ${purchase.status}`,
      );
    }
  }

  function onAddInventory() {
    const member = loadTeamMembers().find((m) => m.id === employeeId);
    if (!pendingInventory?.length) return;
    for (const line of pendingInventory) {
      addInventoryFromReceipt(line.itemName, line.quantity, line.unit, member?.name);
    }
    const summary = pendingInventory.map((l) => `${l.quantity} ${l.unit} ${l.itemName}`).join(", ");
    setPendingInventory(null);
    setNote(`Added ${summary} to inventory.`);
  }

  function saveRules() {
    saveApprovalTiers(tiers);
    setNote("Approval rules saved.");
  }

  const unmatched = flagUnmatchedTransactions();

  return (
    <div className="training-studio">
      {note ? (
        <div className="memory-card">
          <div className="label">Atlas</div>
          <p>{note}</p>
          {pendingInventory?.length ? (
            <div className="cta-row" style={{ marginTop: "0.75rem" }}>
              <button className="btn btn-dark" type="button" onClick={onAddInventory}>
                Add inventory
              </button>
              <Link className="btn btn-outline" href="/app/inventory">Open inventory</Link>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "scan" ? (
        <section className="panel">
          <h2>Scan receipt</h2>
          <p className="panel-lead">
            Atlas reads merchant, date, amount, taxes, and items. Receipts with stock lines link to inventory automatically.
          </p>
          <form className="form-grid" onSubmit={onScan}>
            <label>
              Employee
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                {loadTeamMembers().map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label>Project<input value={project} onChange={(e) => setProject(e.target.value)} /></label>
            <label>
              Receipt text (demo scan)
              <textarea rows={5} value={receiptText} onChange={(e) => setReceiptText(e.target.value)} />
            </label>
            <button className="btn btn-dark" type="submit">Scan receipt</button>
          </form>
        </section>
      ) : null}

      {tab === "rules" ? (
        <section className="panel">
          <h2>Approval rules</h2>
          <div className="list">
            {tiers.map((t, i) => (
              <div key={t.id} className="form-grid">
                <label>
                  Max amount
                  <input
                    type="number"
                    value={t.maxAmount}
                    onChange={(e) => {
                      const next = [...tiers];
                      next[i] = { ...t, maxAmount: Number(e.target.value) };
                      setTiers(next);
                    }}
                  />
                </label>
                <label>
                  Approver
                  <select
                    value={t.approver}
                    onChange={(e) => {
                      const next = [...tiers];
                      next[i] = { ...t, approver: e.target.value as ApprovalTier["approver"] };
                      setTiers(next);
                    }}
                  >
                    <option value="auto">Auto</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </label>
                <p className="muted-line">{t.label}</p>
              </div>
            ))}
          </div>
          <button className="btn btn-dark" type="button" onClick={saveRules}>Save rules</button>
        </section>
      ) : null}

      {tab === "purchases" || tab === "scan" ? (
        <section className="panel">
          <h2>Recent purchases</h2>
          {unmatched.length ? (
            <p className="badge warn">⚠️ {unmatched.length} transaction(s) missing receipt — Atlas can message employees.</p>
          ) : null}
          <div className="list">
            {purchases.map((p) => (
              <div key={p.id} className="compliance-row">
                <div>
                  <p><strong>{p.merchant}</strong> · ${p.amount.toFixed(2)}</p>
                  <p className="muted-line">
                    {p.purchasedBy} · {p.date} · {p.category}
                    {p.project ? ` · ${p.project}` : ""}
                  </p>
                  <p className="muted-line">
                    Receipt: {p.receiptMatched ? "✓" : "✗"} · Card: {p.cardMatched ? "✓ matched" : "pending"} · {p.status}
                    {p.inventoryLines?.length
                      ? ` · Inventory: ${p.inventoryLines.map((l) => `${l.quantity} ${l.unit} ${l.itemName}`).join(", ")}`
                      : ""}
                  </p>
                </div>
                {!p.receiptMatched ? (
                  <Link className="btn btn-outline" href={`/app/messages?to=${encodeURIComponent(p.purchasedById)}`}>
                    Message employee
                  </Link>
                ) : p.inventoryLines?.length ? (
                  <Link className="btn btn-outline" href="/app/inventory">View inventory</Link>
                ) : null}
              </div>
            ))}
          </div>
          {purchases.length === 0 ? <p className="muted-line">No purchases yet — scan a receipt to start.</p> : null}
        </section>
      ) : null}
    </div>
  );
}

export function ExpensesStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading expenses…</p>}>
      <ExpensesStudioInner />
    </Suspense>
  );
}
