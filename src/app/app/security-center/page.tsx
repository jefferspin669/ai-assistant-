import { AppShell } from "@/components/AppShell";
import { SecurityCenterStudio } from "@/components/SecurityCenterStudio";

export default function SecurityCenterPage() {
  return (
    <AppShell
      title="Atlas Security Center"
      subtitle="Defensive monitoring connected to the Atlas backend — detection, containment, and incident response."
    >
      <SecurityCenterStudio />
    </AppShell>
  );
}
