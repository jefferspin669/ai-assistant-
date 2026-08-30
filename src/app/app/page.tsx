"use client";

import { AppShell } from "@/components/AppShell";
import { CommandDashboard } from "@/components/CommandDashboard";

export default function DashboardPage() {
  return (
    <AppShell
      title="Home"
      subtitle="How the business is doing, what needs you, and what Atlas already handled."
    >
      <CommandDashboard />
    </AppShell>
  );
}
