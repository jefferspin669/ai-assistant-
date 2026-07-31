import { AppShell } from "@/components/AppShell";
import { ExecutiveDashboardStudio } from "@/components/ExecutiveDashboardStudio";

export default function ExecutiveDashboardPage() {
  return (
    <AppShell
      title="Executive Dashboard"
      subtitle="Your morning home screen — schedule, tasks, emails, bills, cash flow, metrics, weather, and AI recommendations."
    >
      <ExecutiveDashboardStudio />
    </AppShell>
  );
}
