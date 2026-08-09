import { AppShell } from "@/components/AppShell";
import { TalentMapStudio } from "@/components/TalentMapStudio";

export default function TalentMapPage() {
  return (
    <AppShell
      title="Executive Talent Map"
      subtitle="See which leaders are strongest, who is overloaded, where succession is thin, key-person dependencies, and where the company lacks leadership depth."
    >
      <TalentMapStudio />
    </AppShell>
  );
}
