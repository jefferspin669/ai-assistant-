"use client";

import { AppShell } from "@/components/AppShell";
import { SetupWizard } from "@/components/SetupWizard";
import { WorkspaceActivationWizard } from "@/components/WorkspaceActivationWizard";

export default function SetupPage() {
  return (
    <AppShell
      title="Workspace setup"
      subtitle="Preview Atlas, create your company, connect data, add team — then activate production mode."
    >
      <WorkspaceActivationWizard />
      <SetupWizard />
    </AppShell>
  );
}
