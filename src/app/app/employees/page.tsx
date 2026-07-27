import { FeatureView } from "@/components/FeatureView";
import { aiEmployees, teamAi } from "@/lib/data";
import { agentGoals } from "@/lib/atlas-platform";

export default function EmployeesPage() {
  return (
    <FeatureView
      title="AI Agents"
      subtitle="Instead of only answering questions — Atlas agents complete goals across the business."
      sections={[
        {
          type: "panel",
          title: "Goal completion",
          list: agentGoals.map((goal) => ({
            badge: "Agent",
            badgeTone: "ok" as const,
            text: goal.goal,
            sub: goal.atlas,
          })),
        },
        {
          type: "custom",
          node: (
            <div className="employee-grid">
              {teamAi.map((agent) => (
                <section className="panel" key={agent.name}>
                  <h2>{agent.name}</h2>
                  <p className="panel-lead">{agent.role}</p>
                  <p>{agent.focus}</p>
                </section>
              ))}
            </div>
          ),
        },
        {
          type: "panel",
          title: "Full agent roster",
          list: aiEmployees.map((agent) => ({
            badge: agent.status,
            badgeTone: "ok" as const,
            text: agent.name,
            sub: `${agent.role} · ${agent.duties.join(" · ")}`,
          })),
        },
      ]}
    />
  );
}
