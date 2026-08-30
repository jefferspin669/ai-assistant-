import { actionPolicies, automationsHub } from "@/lib/section-hubs";
import { SectionHub } from "@/components/SectionHub";

export default function AutomationsPage() {
  return (
    <SectionHub
      title="Automations"
      subtitle="Observe, suggest, approve, or automate — not a single master switch."
      items={automationsHub}
    >
      <section className="panel" style={{ marginBottom: "1rem" }}>
        <h2>What Atlas is allowed to do</h2>
        <p className="panel-lead">Trust is a rule per action, not an Autonomous Mode toggle.</p>
        <div className="list">
          {actionPolicies.map((policy) => (
            <div className="list-row" key={policy.action}>
              <span className={`badge stance-${policy.stance.toLowerCase()}`}>{policy.stance}</span>
              <p>
                <strong>{policy.action}</strong>
                <span className="muted-line">{policy.note}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </SectionHub>
  );
}
