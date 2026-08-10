import { AppShell } from "@/components/AppShell";
import { LegacyStudio } from "@/components/LegacyStudio";

export default function LegacyPage() {
  return (
    <AppShell
      title="Legacy & Long-Term Planning"
      subtitle="Track foundations, philanthropy, the long-term company mission, ownership structure, and generational goals."
    >
      <LegacyStudio />
    </AppShell>
  );
}
