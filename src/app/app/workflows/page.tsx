import { AppShell } from "@/components/AppShell";
import { WorkflowStudio } from "@/components/WorkflowStudio";

export default function WorkflowsPage() {
  return (
    <AppShell
      title="Automation Builder"
      subtitle="No-code workflows — missed call recovery, overdue invoice reminders every 7 days, low-inventory owner alerts, and more."
      action={<button className="btn btn-dark">New workflow</button>}
    >
      <WorkflowStudio />
    </AppShell>
  );
}
