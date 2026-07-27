import { AppShell } from "@/components/AppShell";
import { businessDna, dnaSamples, owner } from "@/lib/data";

export default function DnaPage() {
  return (
    <AppShell
      title="AI Business DNA"
      subtitle="Every company has a personality. Atlas learns it — then behaves like that company."
    >
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">Business DNA · {owner.business}</p>
          <h2>Atlas doesn’t just answer.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            It writes, discounts, escalates, and serves customers the way your business would —
            because it learned your voice, rules, and philosophy.
          </p>
        </div>
        <ul className="plain-list">
          <li>Writing style + brand voice</li>
          <li>Discount + pricing strategy</li>
          <li>Service philosophy + escalation rules</li>
        </ul>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Learned traits</h2>
          <div className="list">
            {businessDna.map((trait) => (
              <div className="list-row" key={trait.trait}>
                <span className="badge">{trait.trait}</span>
                <p>{trait.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Same question. Your DNA.</h2>
          <div className="list">
            {dnaSamples.map((sample) => (
              <div key={sample.prompt} className="dna-compare">
                <strong>{sample.prompt}</strong>
                <div className="bubble bubble-ai" style={{ marginTop: "0.55rem" }}>
                  <div className="agent-tag">Generic AI</div>
                  {sample.generic}
                </div>
                <div className="bubble bubble-ai" style={{ marginTop: "0.55rem", background: "#e8f3f2" }}>
                  <div className="agent-tag">Atlas + your DNA</div>
                  {sample.dna}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
