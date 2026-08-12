import { AppShell } from "@/components/AppShell";
import { PlatformStudio } from "@/components/PlatformStudio";

export default function PlatformPage() {
  return (
    <AppShell
      title="Atlas Platform"
      subtitle="Integrations, enterprise security, industry templates, quick-start onboarding, AI guardrails, and clear pricing."
    >
      <PlatformStudio />
    </AppShell>
  );
}
