"use client";

import { AppShell } from "@/components/AppShell";
import { SetupWizard } from "@/components/SetupWizard";

export default function SetupPage() {
  return (
    <AppShell
      title="First-time setup"
      subtitle="Personalize Atlas — then get a starter dashboard built for your goals."
    >
      <SetupWizard />
    </AppShell>
  );
}
