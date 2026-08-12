import { AppShell } from "@/components/AppShell";
import { ControlCenterStudio } from "@/components/ControlCenterStudio";

export default function ControlCenterPage() {
  return (
    <AppShell
      title="Control Center"
      subtitle="Settings → Employees → Permissions. Set leveled access per category, pre-approved rules, and approval chains."
    >
      <ControlCenterStudio />
    </AppShell>
  );
}
