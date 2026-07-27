import { FeatureView } from "@/components/FeatureView";
import { projects, agentGoals } from "@/lib/atlas-platform";

export default function ProjectsPage() {
  return (
    <FeatureView
      title="AI Project Manager"
      subtitle="Knows projects, deadlines, teams, budgets, progress, risks, and dependencies — and keeps everyone updated."
      sections={[
        {
          type: "custom",
          node: (
            <div className="split">
              {projects.map((project) => (
                <section className="panel" key={project.name}>
                  <h2>{project.name}</h2>
                  <div className="list">
                    <div className="list-row">
                      <span className="badge ok">{project.progress}</span>
                      <p>Budget {project.budget}</p>
                    </div>
                    <div className="list-row">
                      <span className="badge warn">Risk</span>
                      <p>{project.risk}</p>
                    </div>
                    <div className="list-row">
                      <span className="badge">Next</span>
                      <p>{project.next}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          ),
        },
        {
          type: "panel",
          title: "Goal agents",
          list: agentGoals.map((goal) => ({
            badge: "Goal",
            text: goal.goal,
            sub: goal.atlas,
          })),
        },
      ]}
    />
  );
}
