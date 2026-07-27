import { AppShell } from "@/components/AppShell";
import { ProjectStudio } from "@/components/ProjectStudio";

export default function ProjectsPage() {
  return (
    <AppShell
      title="AI Project Manager"
      subtitle="Knows projects, deadlines, teams, budgets, progress, risks, and dependencies — and keeps everyone updated."
      action={<button className="btn btn-dark">New project</button>}
    >
      <ProjectStudio />
    </AppShell>
  );
}
