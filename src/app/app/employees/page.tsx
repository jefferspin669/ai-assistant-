import { AppShell } from "@/components/AppShell";
import { AgentStudio } from "@/components/AgentStudio";

export default function EmployeesPage() {
  return (
    <AppShell
      title="AI Agents"
      subtitle="Instead of answering questions — Atlas completes goals across the business."
      action={<button className="btn btn-dark">Launch goal</button>}
    >
      <AgentStudio />
    </AppShell>
  );
}
