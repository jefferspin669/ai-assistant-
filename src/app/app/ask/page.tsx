"use client";

import { AppShell } from "@/components/AppShell";
import { AtlasChatPanel } from "@/components/AtlasChatPanel";

export default function AskAtlasPage() {
  return (
    <AppShell
      title="Ask Atlas"
      subtitle="Tell Atlas the outcome. Specialists run in the background — you never pick an agent first."
    >
      <AtlasChatPanel />
    </AppShell>
  );
}
