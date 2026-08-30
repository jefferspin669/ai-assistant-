import { AppShell } from "@/components/AppShell";
import { TaskAssignmentStudio } from "@/components/TaskAssignmentStudio";

export default function AssignTasksPage() {
  return (
    <AppShell
      title="Assign Tasks"
      subtitle="Create detailed tasks for any employee — they appear instantly on that person's own page."
    >
      <TaskAssignmentStudio />
    </AppShell>
  );
}
