import { AppShell } from "@/components/AppShell";
import { WorkflowStudio } from "@/components/WorkflowStudio";

export default function WorkflowsPage() {
  return (
    <AppShell
      title="AI Workflow Builder"
      subtitle="Visual drag-and-drop automation — no coding required."
      action={<button className="btn btn-dark">New workflow</button>}
    >
      <WorkflowStudio />
    </AppShell>
  );
}
