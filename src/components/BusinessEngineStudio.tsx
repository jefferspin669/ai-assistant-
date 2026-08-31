"use client";

import Link from "@/components/SiteLink";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { IntelligenceFlowBanner } from "@/components/IntelligenceFlowBanner";
import {
  DEFAULT_ASSUMPTIONS,
  addCustomHealthMetric,
  healthMovements,
  loadCompanyModel,
  loadDecisions,
  loadHealthMetrics,
  loadPredictions,
  loadRecommendations,
  overallHealthScore,
  runSimulation,
  saveCompanyModel,
  simulateEmployeeScenario,
  testDecision,
  type CompanyModel,
  type DecisionResult,
  type HealthMetric,
  type PredictionCard,
  type SimulationAssumption,
  type SimulationResult,
} from "@/lib/business-engine";
import { decisionFlowHref } from "@/lib/intelligence-flow";
import {
  BUSINESS_ENGINE_TABS,
  resolveBusinessEngineTab,
} from "@/lib/intelligence-nav";

type TabId = (typeof BUSINESS_ENGINE_TABS)[number];

function isBusinessTab(value: string): value is TabId {
  return (BUSINESS_ENGINE_TABS as readonly string[]).includes(value);
}

function BusinessEngineStudioInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const promptParam = searchParams.get("prompt");
  const flowParam = searchParams.get("flow");
  const resolved = resolveBusinessEngineTab(tabParam);
  const tab: TabId = isBusinessTab(resolved) ? resolved : "overview";

  const [model, setModel] = useState<CompanyModel | null>(null);
  const [decisions, setDecisions] = useState<DecisionResult[]>([]);
  const [decisionPrompt, setDecisionPrompt] = useState(promptParam ?? "Hire 5 salespeople");
  const [lastDecision, setLastDecision] = useState<DecisionResult | null>(null);
  const [simulatePrompt, setSimulatePrompt] = useState(
    promptParam ?? "What if I increase prices by 10%?",
  );
  const [assumptions, setAssumptions] = useState<SimulationAssumption[]>(DEFAULT_ASSUMPTIONS);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [employeePrompt, setEmployeePrompt] = useState("What happens if Sarah leaves?");
  const [employeeResult, setEmployeeResult] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [predictions, setPredictions] = useState<PredictionCard[]>([]);
  const [recommendations, setRecommendations] = useState(loadRecommendations());
  const [customMetricName, setCustomMetricName] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setModel(loadCompanyModel());
    setDecisions(loadDecisions());
    setMetrics(loadHealthMetrics());
    setPredictions(loadPredictions());
    setRecommendations(loadRecommendations());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  useEffect(() => {
    if (promptParam) {
      if (tab === "simulate" || tabParam === "simulate") setSimulatePrompt(promptParam);
      if (tab === "decision" || tabParam === "decision") setDecisionPrompt(promptParam);
    }
  }, [promptParam, tab, tabParam]);

  const healthOverall = useMemo(() => overallHealthScore(), [metrics, ready]);
  const showFlow = Boolean(flowParam) || tab === "simulate" || tab === "decision";

  function onTestDecision(e: FormEvent) {
    e.preventDefault();
    const result = testDecision(decisionPrompt);
    setLastDecision(result);
    setDecisions(loadDecisions());
    setNote("Decision modeled against your company data and shared Workforce records.");
  }

  function onSimulate(e: FormEvent) {
    e.preventDefault();
    setSimResult(runSimulation(simulatePrompt, assumptions));
    setNote("Ran best / expected / worst scenarios with your selected assumptions.");
  }

  function onEmployeeScenario(e: FormEvent) {
    e.preventDefault();
    setEmployeeResult(simulateEmployeeScenario(employeePrompt));
  }

  function toggleAssumption(id: string) {
    setAssumptions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  }

  function onAddMetric(e: FormEvent) {
    e.preventDefault();
    if (!customMetricName.trim()) return;
    addCustomHealthMetric(customMetricName.trim());
    setCustomMetricName("");
    setMetrics(loadHealthMetrics());
    setNote(`Added custom health metric: ${customMetricName.trim()}`);
  }

  return (
    <AppShell
      title="Atlas Business Engine"
      subtitle="Company model, health, predictions, simulation, and decisions — connected to Workforce, Projects, Calendar, and Automations."
    >
      <div className="training-studio">
        {showFlow ? <IntelligenceFlowBanner activeStep={tab === "simulate" ? 3 : tab === "decision" ? 4 : 2} /> : null}

        {note ? (
          <div className="memory-card">
            <div className="label">Atlas</div>
            <p>{note}</p>
          </div>
        ) : null}

        {tab === "overview" && model ? (
          <>
            <section className="panel employee-hero-card">
              <div>
                <p className="briefing-kicker">Overview</p>
                <h2>Digital model of your company.</h2>
                <p style={{ color: "rgba(244,248,247,0.8)" }}>
                  Overall health {healthOverall}/100 · {model.employeeCount} employees · {model.customers} customers
                </p>
              </div>
            </section>
            <div className="stat-grid metrics-dense">
              <div className="stat"><span>Revenue</span><strong>{model.revenue}</strong></div>
              <div className="stat"><span>Cash</span><strong>{model.cash}</strong></div>
              <div className="stat"><span>Pipeline</span><strong>{model.pipeline}</strong></div>
              <div className="stat"><span>Churn</span><strong>{model.churn}%</strong></div>
            </div>
            <div className="split">
              <section className="panel">
                <h2>Business</h2>
                <div className="form-grid">
                  <label>Revenue<input value={model.revenue} onChange={(e) => saveModelField("revenue", e.target.value, model, setModel)} /></label>
                  <label>Expenses<input value={model.expenses} onChange={(e) => saveModelField("expenses", e.target.value, model, setModel)} /></label>
                  <label>Cash<input value={model.cash} onChange={(e) => saveModelField("cash", e.target.value, model, setModel)} /></label>
                  <label>Debt<input value={model.debt} onChange={(e) => saveModelField("debt", e.target.value, model, setModel)} /></label>
                  <label>Customers<input type="number" value={model.customers} onChange={(e) => saveModelField("customers", Number(e.target.value), model, setModel)} /></label>
                  <label>Locations<input type="number" value={model.locations} onChange={(e) => saveModelField("locations", Number(e.target.value), model, setModel)} /></label>
                </div>
              </section>
              <section className="panel">
                <h2>Sales & operations</h2>
                <div className="form-grid">
                  <label>Leads<input type="number" value={model.leads} onChange={(e) => saveModelField("leads", Number(e.target.value), model, setModel)} /></label>
                  <label>Conversion %<input type="number" value={model.conversionRate} onChange={(e) => saveModelField("conversionRate", Number(e.target.value), model, setModel)} /></label>
                  <label>Churn %<input type="number" value={model.churn} onChange={(e) => saveModelField("churn", Number(e.target.value), model, setModel)} /></label>
                  <label>Pipeline<input value={model.pipeline} onChange={(e) => saveModelField("pipeline", e.target.value, model, setModel)} /></label>
                  <label>Capacity<input value={model.capacity} onChange={(e) => saveModelField("capacity", e.target.value, model, setModel)} /></label>
                  <label>Employees<input type="number" value={model.employeeCount} onChange={(e) => saveModelField("employeeCount", Number(e.target.value), model, setModel)} /></label>
                </div>
              </section>
            </div>
            <section className="panel">
              <h2>Manual context</h2>
              <textarea
                rows={3}
                value={model.customNotes}
                onChange={(e) => saveModelField("customNotes", e.target.value, model, setModel)}
                placeholder="Competitors, market shifts, planned hires…"
              />
              <p className="muted-line" style={{ marginTop: "0.75rem" }}>
                Health-triggered rules live in <Link href="/app/workflows">Automations</Link> — one system across Atlas.
              </p>
            </section>
          </>
        ) : null}

        {tab === "decision" ? (
          <div className="split">
            <section className="panel">
              <h2>Test decision</h2>
              <form className="form-grid" onSubmit={onTestDecision}>
                <label>
                  Decision
                  <input value={decisionPrompt} onChange={(e) => setDecisionPrompt(e.target.value)} />
                </label>
                <button className="btn btn-dark" type="submit">Test decision</button>
              </form>
              {lastDecision ? (
                <div className="cta-row" style={{ marginTop: "0.75rem" }}>
                  <Link className="btn btn-outline" href="/app/approvals">CEO approve</Link>
                  <Link className="btn btn-outline" href="/app/projects">Create project work</Link>
                  <Link className="btn btn-outline" href="/app/workforce">Assign workforce</Link>
                </div>
              ) : null}
            </section>
            <section className="panel">
              {lastDecision ? (
                <>
                  <h2>Projected 12-month impact</h2>
                  <div className="stat-grid metrics-dense">
                    <div className="stat"><span>Revenue</span><strong>{lastDecision.revenueBefore} → {lastDecision.revenueAfter}</strong></div>
                    <div className="stat"><span>Payroll</span><strong>{lastDecision.payrollBefore} → {lastDecision.payrollAfter}</strong></div>
                    <div className="stat"><span>Runway</span><strong>{lastDecision.runwayBefore} → {lastDecision.runwayAfter}</strong></div>
                    <div className="stat"><span>Confidence</span><strong>{lastDecision.confidence}%</strong></div>
                  </div>
                  <h3 style={{ marginTop: "1rem" }}>Why Atlas thinks this</h3>
                  <p>{lastDecision.why}</p>
                </>
              ) : (
                <p className="panel-lead">Run a decision to see projected impact and explainability.</p>
              )}
            </section>
          </div>
        ) : null}

        {tab === "simulate" ? (
          <div className="split">
            <section className="panel">
              <h2>Simulator</h2>
              <form className="form-grid" onSubmit={onSimulate}>
                <label>
                  Scenario
                  <input value={simulatePrompt} onChange={(e) => setSimulatePrompt(e.target.value)} />
                </label>
                <button className="btn btn-dark" type="submit">Run simulation</button>
              </form>
              <h3 style={{ marginTop: "1rem" }}>Assumptions</h3>
              <div className="form-grid">
                {assumptions.map((a) => (
                  <label key={a.id} className="checkbox-row">
                    <input type="checkbox" checked={a.enabled} onChange={() => toggleAssumption(a.id)} />
                    {a.label}
                  </label>
                ))}
              </div>
              {simResult ? (
                <div className="cta-row" style={{ marginTop: "0.75rem" }}>
                  <Link className="btn btn-outline" href={decisionFlowHref(simulatePrompt, "simulate")}>
                    Test as decision
                  </Link>
                </div>
              ) : null}
            </section>
            <section className="panel">
              {simResult ? (
                <>
                  <h2>{simResult.summary}</h2>
                  <div className="stat-grid metrics-dense">
                    <div className="stat"><span>Best</span><strong>{simResult.best}</strong></div>
                    <div className="stat"><span>Expected</span><strong>{simResult.expected}</strong></div>
                    <div className="stat"><span>Worst</span><strong>{simResult.worst}</strong></div>
                  </div>
                </>
              ) : (
                <p className="panel-lead">Best / expected / worst — not one magical answer.</p>
              )}
            </section>
          </div>
        ) : null}

        {tab === "scenarios" ? (
          <section className="panel">
            <h2>Workforce scenarios</h2>
            <p className="panel-lead">Shared Workforce records — payroll, capacity, workload, revenue.</p>
            <form className="form-grid" onSubmit={onEmployeeScenario}>
              <label>
                Scenario
                <input value={employeePrompt} onChange={(e) => setEmployeePrompt(e.target.value)} />
              </label>
              <button className="btn btn-dark" type="submit">Model scenario</button>
            </form>
            {employeeResult ? <p style={{ marginTop: "0.75rem" }}>{employeeResult}</p> : null}
            <p className="muted-line" style={{ marginTop: "0.5rem" }}>
              <Link href="/app/workforce">Open Workforce</Link>
            </p>
          </section>
        ) : null}

        {tab === "health" ? (
          <>
            <section className="panel employee-hero-card">
              <h2>Business Health: {healthOverall}/100</h2>
            </section>
            <div className="stat-grid metrics-dense">
              {metrics.map((m) => (
                <div key={m.id} className="stat">
                  <span>{m.name}</span>
                  <strong>{m.score}</strong>
                  <small>{m.delta >= 0 ? `↑ +${m.delta}` : `↓ ${m.delta}`}</small>
                </div>
              ))}
            </div>
            <section className="panel">
              <h2>What moved it</h2>
              <ul className="plain-list">
                {healthMovements().map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
            <section className="panel">
              <h2>+ Add health metric</h2>
              <form className="form-grid" onSubmit={onAddMetric}>
                <label>
                  Metric
                  <input value={customMetricName} onChange={(e) => setCustomMetricName(e.target.value)} />
                </label>
                <button className="btn btn-outline" type="submit">Add metric</button>
              </form>
            </section>
          </>
        ) : null}

        {tab === "predictions" ? (
          <section className="panel">
            <h2>Predictions</h2>
            <div className="list">
              {predictions.map((p) => (
                <div key={p.id} className="compliance-row">
                  <div>
                    <p><strong>{p.title}</strong> — {p.value}</p>
                    <p className="muted-line">{p.confidence}% confidence · {p.why}</p>
                  </div>
                  <Link
                    className="btn btn-outline"
                    href={`/app/business-engine?tab=simulate&prompt=${encodeURIComponent(`Scenario: ${p.title}`)}&flow=prediction`}
                  >
                    Run scenario
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "recommendations" ? (
          <section className="panel">
            <h2>Recommendations</h2>
            <p className="panel-lead">Explainable recommendations with alternatives and confidence.</p>
            <div className="list">
              {recommendations.map((rec) => (
                <div key={rec.id} className="compliance-row">
                  <div>
                    <p><strong>{rec.title}</strong></p>
                    <p>{rec.why}</p>
                    <p className="muted-line">Confidence {rec.confidence}%</p>
                    <ul className="plain-list">
                      {rec.alternatives.slice(0, 2).map((alt) => (
                        <li key={alt.name}>{alt.name} — {alt.outcome}</li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    className="btn btn-outline"
                    href={`/app/business-engine?tab=decision&prompt=${encodeURIComponent(rec.title)}&flow=recommendation`}
                  >
                    Test decision
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {decisions.length > 0 && tab === "decision" ? (
          <section className="panel">
            <h2>Recent decisions</h2>
            <ul className="plain-list">
              {decisions.slice(0, 5).map((d) => (
                <li key={d.id}>{d.prompt}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function saveModelField<K extends keyof CompanyModel>(
  key: K,
  value: CompanyModel[K],
  model: CompanyModel,
  setModel: (m: CompanyModel) => void,
) {
  const next = { ...model, [key]: value };
  setModel(next);
  saveCompanyModel(next);
}

export function BusinessEngineStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading Business Engine…</p>}>
      <BusinessEngineStudioInner />
    </Suspense>
  );
}
