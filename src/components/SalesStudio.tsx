"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "@/components/SiteLink";
import { DataProvenance } from "@/components/DataProvenance";
import { EmptyState } from "@/components/EmptyState";
import {
  addOpportunity,
  computeSalesMetrics,
  loadOpportunities,
  isSalesLive,
  type SalesOpportunity,
} from "@/lib/sales-workspace";
import { isDemoWorkspace } from "@/lib/workspace-mode";

export function SalesStudio() {
  const [metrics, setMetrics] = useState(computeSalesMetrics());
  const [opps, setOpps] = useState<SalesOpportunity[]>([]);
  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    setOpps(loadOpportunities());
    setMetrics(computeSalesMetrics());
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

  const live = isSalesLive();
  const empty = opps.length === 0 && !isDemoWorkspace();

  return (
    <div className="training-studio">
      <div className="memory-card">
        <div className="label">Sales · {metrics.mode}</div>
        <p>{metrics.note}</p>
      </div>

      <div className="stat-grid metrics-dense">
        <DataProvenance
          label="Pipeline"
          value={metrics.pipelineValue != null ? `$${metrics.pipelineValue.toLocaleString()}` : null}
          source={live ? "Stripe + CRM" : null}
          emptyMessage="Connect payments or add opportunities"
        />
        <DataProvenance
          label="Closed revenue"
          value={metrics.closedRevenue != null ? `$${metrics.closedRevenue.toLocaleString()}` : null}
          source={live ? "Stripe" : null}
          emptyMessage="No closed deals recorded"
        />
        <DataProvenance label="Win rate" value={metrics.winRate != null ? `${metrics.winRate}%` : null} />
        <DataProvenance
          label="Avg deal"
          value={metrics.avgDealSize != null ? `$${metrics.avgDealSize.toLocaleString()}` : null}
        />
      </div>

      {empty ? (
        <EmptyState
          title="No sales data connected yet"
          description="Connect Stripe, your CRM, or add your first opportunity manually."
          actions={[
            { label: "Connect Stripe", href: "/app/commercial", primary: true },
            { label: "Add first sale", href: "#add-opp" },
            { label: "Open CRM", href: "/app/customers" },
          ]}
        />
      ) : (
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
        </section>
      )}

      <section className="panel" id="add-opp">
        <h2>+ Opportunity</h2>
        <form className="form-grid" onSubmit={onAdd}>
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} /></label>
          <label>Amount (optional)<input value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <button className="btn btn-dark" type="submit">Add lead</button>
        </form>
        <p className="muted-line">
          Coach in <Link href="/app/sales-coach">Sales Coach</Link> · context in <Link href="/app/customers">CRM</Link>
        </p>
      </section>
    </div>
  );
}
