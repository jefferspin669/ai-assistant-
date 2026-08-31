import { AppShell } from "@/components/AppShell";
import { ExecutiveDashboardStudio } from "@/components/ExecutiveDashboardStudio";

export default function ExecutiveDashboardPage() {
  return (
    <AppShell
      title="Executive"
      subtitle="Strategic reports and forecasting — not the live operations board. For today’s status use Dashboard; for live Atlas work use Mission Control."
    >
      <ExecutiveDashboardStudio />
    </AppShell>
  );
}
