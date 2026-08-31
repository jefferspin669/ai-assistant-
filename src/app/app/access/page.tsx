import { AppShell } from "@/components/AppShell";
import { AccessStudio } from "@/components/AccessStudio";

export default function AccessPage() {
  return (
    <AppShell
      title="Audit Log"
      subtitle="Grant temporary permissions that auto-expire, and review a complete audit trail of important actions."
    >
      <AccessStudio />
    </AppShell>
  );
}
