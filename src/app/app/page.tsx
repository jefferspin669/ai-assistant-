"use client";

import { AppShell } from "@/components/AppShell";
import { CommandDashboard } from "@/components/CommandDashboard";

export default function DashboardPage() {
  return (
    <AppShell
      title="Home"
      subtitle="How are we doing, what changed, what's wrong, what needs you, and what Atlas is doing."
    >
      <CommandDashboard />
    </AppShell>
  );
}
