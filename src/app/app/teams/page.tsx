import { AppShell } from "@/components/AppShell";
import { TeamsStudio } from "@/components/TeamsStudio";

export default function TeamsPage() {
  return (
    <AppShell
      title="Teams"
      subtitle="Employees organized by department — who's working, today's tasks, goals, blockers, meetings, workload, and alerts."
    >
      <TeamsStudio />
    </AppShell>
  );
}
