import { AppShell } from "@/components/AppShell";
import { intelligenceInsights } from "@/lib/data";

export default function NetworkPage() {
  return (
    <AppShell
      title="Atlas Intelligence Network"
      subtitle="Thousands of businesses. Shared trends. Zero exposure of anyone’s private data."
    >
      <div className="stat-grid">
        <div className="stat">
          <span>Network businesses</span>
          <strong>12.4k</strong>
          <small>Opt-in aggregated insights</small>
        </div>
        <div className="stat">
          <span>Private customer data</span>
          <strong>0</strong>
          <small>Never shared across tenants</small>
        </div>
        <div className="stat">
          <span>Industries covered</span>
          <strong>40+</strong>
          <small>Regional trend signals</small>
        </div>
      </div>

      <section className="panel">
        <h2>Privacy-first industry signals</h2>
        <div className="list" style={{ marginTop: "0.75rem" }}>
          {intelligenceInsights.map((item) => (
            <div className="insight network-insight" key={item.insight}>
              <div className="timeline-meta">
                <strong>{item.industry}</strong>
                <span className="badge">{item.signal}</span>
                <span className="badge ok">{item.privacy}</span>
              </div>
              <p style={{ marginTop: "0.35rem" }}>{item.insight}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>How it works</h2>
        <div className="list">
          {[
            "Each business keeps its customers, calls, and documents private.",
            "Atlas aggregates anonymized patterns across the network.",
            "You get actionable industry benchmarks — not someone else’s CRM.",
          ].map((item) => (
            <div className="list-row" key={item}>
              <span className="badge">Network</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
