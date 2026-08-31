"use client";

import Link from "@/components/SiteLink";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  DEFAULT_ASSUMPTIONS,
  addCustomHealthMetric,
  healthMovements,
  loadCompanyModel,
  loadDecisions,
  loadHealthAutomations,
  loadHealthMetrics,
  loadPredictions,
  overallHealthScore,
  runSimulation,
  saveCompanyModel,
  saveHealthAutomations,
  simulateEmployeeScenario,
  testDecision,
  type CompanyModel,
  type DecisionResult,
  type HealthAutomation,
  type HealthMetric,
  type PredictionCard,
  type SimulationAssumption,
  type SimulationResult,
} from "@/lib/business-engine";

const TABS = [
  { id: "model", label: "Company model" },
  { id: "decision", label: "Test decision" },
  { id: "simulate", label: "Simulate" },
  { id: "health", label: "Business health" },
  { id: "predictions", label: "Predictions" },
  { id: "automations", label: "Automations" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function BusinessEngineStudioInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const promptParam = searchParams.get("prompt");
  const tab: TabId = isTab(tabParam) ? tabParam : "model";

  const [model, setModel] = useState<CompanyModel | null>(null);
  const [decisions, setDecisions] = useState<DecisionResult[]>([]);
  const [decisionPrompt, setDecisionPrompt] = useState("Hire 5 salespeople");
  const [lastDecision, setLastDecision] = useState<DecisionResult | null>(null);
  const [simulatePrompt, setSimulatePrompt] = useState(
    promptParam ?? "What if I increase prices by 10%?",
  );
  const [assumptions, setAssumptions] = useState<SimulationAssumption[]>(DEFAULT_ASSUMPTIONS);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [employeePrompt, setEmployeePrompt] = useState("What happens if Sarah leaves?");
  const [employeeResult, setEmployeeResult] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [automations, setAutomations] = useState<HealthAutomation[]>([]);
  const [predictions, setPredictions] = useState<PredictionCard[]>([]);
  const [customMetricName, setCustomMetricName] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setModel(loadCompanyModel());
    setDecisions(loadDecisions());
    setMetrics(loadHealthMetrics());
    setAutomations(loadHealthAutomations());
    setPredictions(loadPredictions());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  useEffect(() => {
    if (promptParam) setSimulatePrompt(promptParam);
  }, [promptParam]);

  const healthOverall = useMemo(() => overallHealthScore(), [metrics, ready]);

  function setTab(next: TabId) {
    router.replace(`/app/business-engine?tab=${next}`, { scroll: false });
  }

  function saveModelField<K extends keyof CompanyModel>(key: K, value: CompanyModel[K]) {
    if (!model) return;
    const next = { ...model, [key]: value };
    setModel(next);
    saveCompanyModel(next);
  }

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

  function toggleAutomation(id: string) {
    const next = automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    setAutomations(next);
    saveHealthAutomations(next);
  }

  return (
    <AppShell
      title="Atlas Business Engine"
      subtitle="Company model, decisions, simulation, health score, predictions, and health-triggered automations."
      action={
        <div className="biz-switcher" role="tablist" aria-label="Business Engine tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              className={tab === item.id ? "biz-tab active" : "biz-tab"}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="training-studio">
        {note ? (
          <div className="memory-card">
            <div className="label">Atlas</div>
            <p>{note}</p>
          </div>
        ) : null}

        {tab === "model" && model ? (
          <>
            <section className="panel employee-hero-card">
              <div>
                <p className="briefing-kicker">Company model</p>
                <h2>Atlas digital model of your business.</h2>
                <p style={{ color: "rgba(244,248,247,0.8)" }}>
                  Pulled from finance, workforce, sales, and operations — plus anything you add manually.
                </p>
              </div>
            </section>
            <div className="split">
              <section className="panel">
                <h2>Business</h2>
                <div className="form-grid">
                  <label>Revenue<input value={model.revenue} onChange={(e) => saveModelField("revenue", e.target.value)} /></label>
                  <label>Expenses<input value={model.expenses} onChange={(e) => saveModelField("expenses", e.target.value)} /></label>
                  <label>Cash<input value={model.cash} onChange={(e) => saveModelField("cash", e.target.value)} /></label>
                  <label>Debt<input value={model.debt} onChange={(e) => saveModelField("debt", e.target.value)} /></label>
                  <label>Customers<input type="number" value={model.customers} onChange={(e) => saveModelField("customers", Number(e.target.value))} /></label>
                  <label>Locations<input type="number" value={model.locations} onChange={(e) => saveModelField("locations", Number(e.target.value))} /></label>
                </div>
              </section>
              <section className="panel">
                <h2>Sales & operations</h2>
                <div className="form-grid">
                  <label>Leads<input type="number" value={model.leads} onChange={(e) => saveModelField("leads", Number(e.target.value))} /></label>
                  <label>Conversion %<input type="number" value={model.conversionRate} onChange={(e) => saveModelField("conversionRate", Number(e.target.value))} /></label>
                  <label>Churn %<input type="number" value={model.churn} onChange={(e) => saveModelField("churn", Number(e.target.value))} /></label>
                  <label>Pipeline<input value={model.pipeline} onChange={(e) => saveModelField("pipeline", e.target.value)} /></label>
                  <label>Capacity<input value={model.capacity} onChange={(e) => saveModelField("capacity", e.target.value)} /></label>
                  <label>Employees<input type="number" value={model.employeeCount} onChange={(e) => saveModelField("employeeCount", Number(e.target.value))} /></label>
                </div>
              </section>
            </div>
            <section className="panel">
              <h2>What Atlas doesn&apos;t know yet</h2>
              <label>
                Manual notes
                <textarea
                  rows={4}
                  value={model.customNotes}
                  onChange={(e) => saveModelField("customNotes", e.target.value)}
                  placeholder="Competitors, market shifts, planned hires…"
                />
              </label>
            </section>
          </>
        ) : null}

        {tab === "decision" ? (
          <div className="split">
            <section className="panel">
              <h2>+ Test decision</h2>
              <p className="panel-lead">Atlas runs the decision against your business model.</p>
              <form className="form-grid" onSubmit={onTestDecision}>
                <label>
                  Decision
                  <input value={decisionPrompt} onChange={(e) => setDecisionPrompt(e.target.value)} />
                </label>
                <button className="btn btn-dark" type="submit">Test decision</button>
              </form>
              <div className="suggestion-row" style={{ marginTop: "0.75rem" }}>
                {["Hire 5 salespeople", "Open second location", "Cut marketing 15%"].map((s) => (
                  <button key={s} type="button" className="suggestion" onClick={() => setDecisionPrompt(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </section>
            <section className="panel">
              {lastDecision ? (
                <>
                  <h2>Projected 12-month impact</h2>
                  <div className="stat-grid metrics-dense">
                    <div className="stat"><span>Revenue</span><strong>{lastDecision.revenueBefore} → {lastDecision.revenueAfter}</strong></div>
                    <div className="stat"><span>Payroll</span><strong>{lastDecision.payrollBefore} → {lastDecision.payrollAfter}</strong></div>
                    <div className="stat"><span>Cash runway</span><strong>{lastDecision.runwayBefore} → {lastDecision.runwayAfter}</strong></div>
                    <div className="stat"><span>New customers</span><strong>+{lastDecision.newCustomers}</strong></div>
                    <div className="stat"><span>Risk</span><strong>{lastDecision.risk}</strong></div>
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
          <>
            <div className="split">
              <section className="panel">
                <h2>Run simulation</h2>
                <form className="form-grid" onSubmit={onSimulate}>
                  <label>
                    Scenario
                    <input value={simulatePrompt} onChange={(e) => setSimulatePrompt(e.target.value)} />
                  </label>
                  <button className="btn btn-dark" type="submit">Run simulation</button>
                </form>
                <h3 style={{ marginTop: "1rem" }}>Change assumptions</h3>
                <div className="form-grid">
                  {assumptions.map((a) => (
                    <label key={a.id} className="checkbox-row">
                      <input type="checkbox" checked={a.enabled} onChange={() => toggleAssumption(a.id)} />
                      {a.label}
                    </label>
                  ))}
                </div>
              </section>
              <section className="panel">
                {simResult ? (
                  <>
                    <h2>{simResult.summary}</h2>
                    <div className="stat-grid metrics-dense">
                      <div className="stat"><span>Best case</span><strong>{simResult.best}</strong></div>
                      <div className="stat"><span>Expected</span><strong>{simResult.expected}</strong></div>
                      <div className="stat"><span>Worst case</span><strong>{simResult.worst}</strong></div>
                    </div>
                  </>
                ) : (
                  <p className="panel-lead">Best / expected / worst cases — not one magical AI answer.</p>
                )}
              </section>
            </div>
            <section className="panel">
              <h2>Workforce scenarios</h2>
              <p className="panel-lead">Uses shared employee records from Workforce — not a second database.</p>
              <form className="form-grid" onSubmit={onEmployeeScenario}>
                <label>
                  Employee scenario
                  <input value={employeePrompt} onChange={(e) => setEmployeePrompt(e.target.value)} />
                </label>
                <button className="btn btn-outline" type="submit">Model workforce impact</button>
              </form>
              {employeeResult ? <p style={{ marginTop: "0.75rem" }}>{employeeResult}</p> : null}
              <div className="suggestion-row" style={{ marginTop: "0.75rem" }}>
                {[
                  "What happens if Sarah leaves?",
                  "Hire three customer-support employees",
                  "Can we handle 30% more customers?",
                  "What if everyone gets a 5% raise?",
                ].map((s) => (
                  <button key={s} type="button" className="suggestion" onClick={() => setEmployeePrompt(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <p className="muted-line" style={{ marginTop: "0.5rem" }}>
                <Link href="/app/workforce">Open Workforce</Link> to manage the shared employee records.
              </p>
            </section>
          </>
        ) : null}

        {tab === "health" ? (
          <>
            <section className="panel employee-hero-card">
              <div>
                <p className="briefing-kicker">Atlas Business Health</p>
                <h2>Overall: {healthOverall}/100</h2>
              </div>
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
                  Metric name
                  <input value={customMetricName} onChange={(e) => setCustomMetricName(e.target.value)} placeholder="Delivery times, occupancy…" />
                </label>
                <button className="btn btn-outline" type="submit">Add metric</button>
              </form>
            </section>
          </>
        ) : null}

        {tab === "predictions" ? (
          <section className="panel">
            <h2>Predictions</h2>
            <p className="panel-lead">Continuous forecasts from company data — each with Why, data used, and Run scenario.</p>
            <div className="list">
              {predictions.map((p) => (
                <div key={p.id} className="compliance-row">
                  <div>
                    <p><strong>{p.title}</strong></p>
                    <p>{p.value}</p>
                    <p className="muted-line">Confidence: {p.confidence}%</p>
                    <p><em>Why?</em> {p.why}</p>
                    <p className="muted-line">Data: {p.dataUsed.join(" · ")}</p>
                  </div>
                  <Link
                    className="btn btn-outline"
                    href={`/app/business-engine?tab=simulate&prompt=${encodeURIComponent(`Scenario based on ${p.title}: ${p.value}`)}`}
                  >
                    Run scenario
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "automations" ? (
          <section className="panel">
            <h2>Health-triggered automations</h2>
            <p className="panel-lead">Automation responds to what the Business Engine sees — not a disconnected rules list.</p>
            <div className="list">
              {automations.map((a) => (
                <div key={a.id} className="compliance-row">
                  <label className="checkbox-row">
                    <input type="checkbox" checked={a.enabled} onChange={() => toggleAutomation(a.id)} />
                    <span>
                      <strong>When {a.trigger}</strong>
                      <br />
                      <small className="muted-line">→ {a.action}</small>
                    </span>
                  </label>
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
                <li key={d.id}>{d.prompt} — {d.risk}, {d.confidence}% confidence</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export function BusinessEngineStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading Business Engine…</p>}>
      <BusinessEngineStudioInner />
    </Suspense>
  );
}
