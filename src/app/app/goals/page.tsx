import { AppShell } from "@/components/AppShell";
import { GoalsStudio } from "@/components/GoalsStudio";

export default function GoalsPage() {
  return (
    <AppShell
      title="Employee Goals"
      subtitle="Assign goals separate from daily tasks and track progress toward them."
    >
      <GoalsStudio />
    </AppShell>
  );
}
