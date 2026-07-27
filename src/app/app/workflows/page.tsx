import { FeatureView } from "@/components/FeatureView";
import { workflowSteps } from "@/lib/atlas-platform";

export default function WorkflowsPage() {
  return (
    <FeatureView
      title="AI Workflow Builder"
      subtitle="Visual drag-and-drop automation — no coding required."
      action={<button className="btn btn-dark">New workflow</button>}
      sections={[
        {
          type: "custom",
          node: (
            <section className="panel">
              <h2>Missed-call recovery</h2>
              <div className="workflow-track">
                {workflowSteps.map((step, index) => (
                  <div key={step.label} style={{ display: "contents" }}>
                    <div className="workflow-step">
                      <span>{step.kind}</span>
                      <strong>{step.label}</strong>
                    </div>
                    {index < workflowSteps.length - 1 ? (
                      <div className="workflow-arrow" aria-hidden>
                        →
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ),
        },
        {
          type: "panel",
          title: "Popular automations",
          list: [
            { badge: "Install", text: "Review request after payment" },
            { badge: "Install", text: "Overdue invoice chase sequence" },
            { badge: "Install", text: "Weather delay customer texts" },
            { badge: "Install", text: "New lead → CRM → owner ping" },
          ],
        },
      ]}
    />
  );
}
