import { AppShell } from "@/components/AppShell";
import { SecurityStudio } from "@/components/SecurityStudio";

export default function SecurityPage() {
  return (
    <AppShell
      title="AI Security Center"
      subtitle="Detects suspicious logins, fraud, data leaks, unusual spending, and account changes."
      action={<button className="btn btn-dark">Lock sensitive actions</button>}
    >
      <SecurityStudio />
    </AppShell>
  );
}
