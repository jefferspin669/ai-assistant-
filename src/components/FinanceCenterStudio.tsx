"use client";

import { useState } from "react";
import {
  financeBudgets,
  financeForecast,
  financeInvoices,
  financePayroll,
  financeSubscriptions,
  financeTaxPlan,
} from "@/lib/atlas-platform";

type Mode = "overview" | "budget" | "forecast" | "subscriptions" | "invoices" | "payroll" | "tax";

const modes: { id: Mode; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "budget", label: "Budgeting" },
  { id: "forecast", label: "Cash-flow forecast" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "invoices", label: "Invoices" },
  { id: "payroll", label: "Payroll" },
  { id: "tax", label: "Tax planning" },
];

export function FinanceCenterStudio() {
  const [mode, setMode] = useState<Mode>("overview");
  const [note, setNote] = useState<string | null>(null);

  const cancelTargets = financeSubscriptions.filter((item) => item.status === "Cancel").length;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Month net</span>
          <strong>+$25k</strong>
          <small>Forecast</small>
        </div>
        <div className="stat">
          <span>Profit projection</span>
          <strong>18.4%</strong>
          <small>After ops</small>
        </div>
        <div className="stat">
          <span>Expense wins</span>
          <strong>$780/yr</strong>
          <small>Unused SaaS</small>
        </div>
        <div className="stat">
          <span>Overdue</span>
          <strong>1</strong>
          <small>Invoice to chase</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Financial command modes">
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
          </button>
        ))}
      </div>
      {note ? <p className="muted-line">{note}</p> : null}

      {mode === "overview" ? (
        <div className="split">
          <section className="panel">
            <h2>Financial Command Center</h2>
            <p className="panel-lead">
              Budgeting, cash-flow forecasting, profit projections, expense optimization,
              subscriptions, invoices, payroll, and tax planning — one surface.
            </p>
            <div className="list">
              <div className="list-row">
                <span className="badge ok">Cash</span>
                <p>Next 14 days net positive · peak outflows Friday payroll</p>
              </div>
              <div className="list-row">
                <span className="badge warn">Optimize</span>
                <p>
                  {cancelTargets} subscription{cancelTargets === 1 ? "" : "s"} flagged to cancel
                </p>
              </div>
              <div className="list-row">
                <span className="badge">Tax</span>
                <p>Set aside 22% for quarterly estimate</p>
              </div>
            </div>
          </section>
          <section className="panel">
            <h2>Profit projection</h2>
            <div className="memory-card">
              <div className="label">Atlas model</div>
              <p>
                Holding price and current booking velocity, month closes near 18% net. An 8% price
                lift on diagnostics adds ~$2.1k with low churn risk (see Digital Twin).
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {mode === "budget" ? (
        <section className="panel">
          <h2>Budgeting</h2>
          <div className="list">
            {financeBudgets.map((row) => (
              <div className="list-row" key={row.category}>
                <span className={`badge${row.status === "Over" ? " warn" : " ok"}`}>
                  {row.status}
                </span>
                <p>
                  <strong>{row.category}</strong>
                  <span className="muted-line">
                    Planned {row.planned} · Actual {row.actual}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "forecast" ? (
        <section className="panel">
          <h2>Cash-flow forecasting</h2>
          <div className="list">
            {financeForecast.map((row) => (
              <div className="list-row" key={row.period}>
                <span className="badge ok">{row.net}</span>
                <p>
                  <strong>{row.period}</strong>
                  <span className="muted-line">
                    In {row.cashIn} · Out {row.cashOut}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "subscriptions" ? (
        <section className="panel">
          <h2>Subscription tracking</h2>
          <div className="list">
            {financeSubscriptions.map((item) => (
              <div className="list-row" key={item.name}>
                <span className={`badge${item.status === "Cancel" ? " warn" : item.status === "Keep" ? " ok" : ""}`}>
                  {item.status}
                </span>
                <p>
                  <strong>
                    {item.name} · {item.amount}
                  </strong>
                  <span className="muted-line">{item.note}</span>
                </p>
                {item.status === "Cancel" ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => setNote(`Atlas drafted a cancel notice for ${item.name}.`)}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "invoices" ? (
        <section className="panel">
          <h2>Invoice management</h2>
          <div className="list">
            {financeInvoices.map((item) => (
              <div className="list-row" key={item.customer}>
                <span className={`badge${item.status === "Overdue" ? " warn" : " ok"}`}>
                  {item.status}
                </span>
                <p>
                  <strong>
                    {item.customer} · {item.amount}
                  </strong>
                  <span className="muted-line">Age {item.age}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "payroll" ? (
        <section className="panel">
          <h2>Payroll insights</h2>
          <div className="memory-card">
            <div className="label">Next run</div>
            <p>{financePayroll.nextRun}</p>
            <p style={{ marginTop: "0.6rem" }}>{financePayroll.overtimeRisk}</p>
            <p className="muted-line" style={{ marginTop: "0.6rem" }}>
              {financePayroll.tip}
            </p>
          </div>
        </section>
      ) : null}

      {mode === "tax" ? (
        <section className="panel">
          <h2>Tax planning</h2>
          <div className="list">
            {financeTaxPlan.map((item) => (
              <div className="list-row" key={item}>
                <span className="badge ok">Plan</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <p className="panel-lead" style={{ marginBottom: 0 }}>
            Deep filing and deductions live in Tax Center — this view is the forward plan.
          </p>
        </section>
      ) : null}
    </div>
  );
}
