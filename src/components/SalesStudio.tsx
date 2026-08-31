"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "@/components/SiteLink";
import {
  addOpportunity,
  computeSalesMetrics,
  loadOpportunities,
  setSalesLive,
  isSalesLive,
  type SalesOpportunity,
} from "@/lib/sales-workspace";

function formatMoney(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
}

export function SalesStudio() {
  const [metrics, setMetrics] = useState(computeSalesMetrics());
  const [opps, setOpps] = useState<SalesOpportunity[]>([]);
  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [live, setLive] = useState(false);

  useEffect(() => {
    setOpps(loadOpportunities());
    setMetrics(computeSalesMetrics());
    setLive(isSalesLive());
  }, []);

  function refresh() {
    setOpps(loadOpportunities());
    setMetrics(computeSalesMetrics());
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const amt = amount.trim() ? Number(amount) : null;
    addOpportunity({
      name: name.trim() || "New opportunity",
      customer: customer.trim() || "Unknown",
      employee: "You",
      stage: "lead",
      amount: amt,
      hasVerifiedAmount: amt != null && !Number.isNaN(amt),
    });
    refresh();
    setName("");
    setCustomer("");
    setAmount("");
  }

  function toggleLive() {
    setSalesLive(!live);
    setLive(!live);
    refresh();
  }

  return (
    <div className="training-studio">
      <div className="memory-card">
        <div className="label">Sales · {metrics.mode}</div>
        <p>{metrics.note}</p>
        <button className="btn btn-outline" type="button" onClick={toggleLive}>
          {live ? "Mark as manual entry" : "Simulate connected revenue (demo)"}
        </button>
      </div>

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Pipeline</span>
          <strong>{formatMoney(metrics.pipelineValue)}</strong>
        </div>
        <div className="stat">
          <span>Closed revenue</span>
          <strong>{formatMoney(metrics.closedRevenue)}</strong>
        </div>
        <div className="stat">
          <span>Win rate</span>
          <strong>{metrics.winRate != null ? `${metrics.winRate}%` : "—"}</strong>
        </div>
        <div className="stat">
          <span>Avg deal</span>
          <strong>{formatMoney(metrics.avgDealSize)}</strong>
        </div>
        <div className="stat">
          <span>Leads</span>
          <strong>{metrics.leadCount}</strong>
        </div>
        <div className="stat">
          <span>Open opps</span>
          <strong>{metrics.opportunityCount}</strong>
        </div>
      </div>

      <section className="panel">
        <h2>Pipeline</h2>
        <div className="list">
          {opps.map((o) => (
            <div key={o.id} className="compliance-row">
              <div>
                <p>
                  <strong>{o.name}</strong> · {o.stage}
                  {o.amount != null ? ` · $${o.amount.toLocaleString()}` : " · amount not verified"}
                </p>
                <p className="muted-line">{o.customer} · {o.employee}</p>
              </div>
              {!o.hasVerifiedAmount ? <span className="badge warn">No verified $</span> : null}
            </div>
          ))}
        </div>
        <p className="muted-line">
          Coach your team in <Link href="/app/sales-coach">Sales Coach</Link>. Customer context in{" "}
          <Link href="/app/customers">CRM</Link>.
        </p>
      </section>

      <section className="panel">
        <h2>+ Opportunity</h2>
        <form className="form-grid" onSubmit={onAdd}>
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} /></label>
          <label>Amount (optional)<input value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <button className="btn btn-dark" type="submit">Add lead</button>
        </form>
      </section>
    </div>
  );
}
