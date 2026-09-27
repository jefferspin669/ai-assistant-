"use client";

import { AppShell } from "@/components/AppShell";
import { CommandDashboard } from "@/components/CommandDashboard";

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Current business status — what happened, what needs you, and what Atlas already handled."
    >
      <CommandDashboard />
    </AppShell>
  );
}
