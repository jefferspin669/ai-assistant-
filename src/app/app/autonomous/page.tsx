import { AppShell } from "@/components/AppShell";
import { AutonomousStudio } from "@/components/AutonomousStudio";

export default function AutonomousPage() {
  return (
    <AppShell
      title="AI Autonomous Mode"
      subtitle="Instead of waiting for commands — Atlas works continuously and confirms with you when it matters."
    >
      <AutonomousStudio />
    </AppShell>
  );
}
