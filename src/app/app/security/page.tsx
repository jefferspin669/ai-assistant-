import { AppShell } from "@/components/AppShell";
import { SecurityStudio } from "@/components/SecurityStudio";

export default function SecurityPage() {
  return (
    <AppShell
      title="Security Center"
      subtitle="Threat detection, login monitoring, device management, password health, 2FA checks, audit logs, and backup monitoring."
      action={<button className="btn btn-dark">Lock sensitive actions</button>}
    >
      <SecurityStudio />
    </AppShell>
  );
}
