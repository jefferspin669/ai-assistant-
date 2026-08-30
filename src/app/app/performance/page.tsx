import { AppShell } from "@/components/AppShell";
import { PerformanceStudio } from "@/components/PerformanceStudio";

export default function PerformancePage() {
  return (
    <AppShell
      title="Employee Performance"
      subtitle="Useful work metrics with context — not a single creepy productivity score."
    >
      <PerformanceStudio />
    </AppShell>
  );
}
