"use client";

import { AppShell } from "@/components/AppShell";
import { CommandDashboard } from "@/components/CommandDashboard";

export default function DashboardPage() {
  return (
    <AppShell
      title="Atlas"
      subtitle="How your business is doing, what needs your attention, and Atlas handles the rest."
    >
      <CommandDashboard />
    </AppShell>
  );
}
