"use client";

import { AppShell } from "@/components/AppShell";
import { CoachStudio } from "@/components/CoachStudio";

export default function CoachPage() {
  return (
    <AppShell
      title="Live AI Coach"
      subtitle="Employees ask in the moment — Atlas answers from policy, manuals, and past jobs."
    >
      <CoachStudio />
    </AppShell>
  );
}
