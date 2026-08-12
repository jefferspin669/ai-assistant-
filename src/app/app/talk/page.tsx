import { AppShell } from "@/components/AppShell";
import { TalkToAtlasStudio } from "@/components/TalkToAtlasStudio";

export default function TalkPage() {
  return (
    <AppShell
      title="Talk to Atlas"
      subtitle="Ask by voice or text — Atlas answers out loud and on screen, remembers context, and can take permitted actions."
    >
      <TalkToAtlasStudio />
    </AppShell>
  );
}
