import { AppShell } from "@/components/AppShell";
import { CommunicationsStudio } from "@/components/CommunicationsStudio";

export default function CommunicationsPage() {
  return (
    <AppShell
      title="Atlas Communications"
      subtitle="Message anyone from one employee to the whole company — with audience targeting, priority, scheduling, read/acknowledge tracking, AI drafting, and anonymous feedback."
    >
      <CommunicationsStudio />
    </AppShell>
  );
}
