import { AppShell } from "@/components/AppShell";
import { ProjectStudio } from "@/components/ProjectStudio";

export default function ProjectsPage() {
  return (
    <AppShell
      title="AI Project Manager"
      subtitle="Projects, tasks, milestones, workload, and AI plans — connected to Workforce and Calendar."
      action={<button className="btn btn-dark">New project</button>}
    >
      <ProjectStudio />
    </AppShell>
  );
}
