"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AgentStudio } from "@/components/AgentStudio";
import { useLanguage } from "@/components/LanguageProvider";

export default function EmployeesPage() {
  const [launchSignal, setLaunchSignal] = useState(0);
  const { tAction } = useLanguage();

  return (
    <AppShell
      title="AI Agents"
      subtitle="Instead of answering questions — Atlas completes goals across the business."
      action={
        <button
          className="btn btn-dark"
          type="button"
          onClick={() => setLaunchSignal((n) => n + 1)}
        >
          {tAction("Launch goal")}
        </button>
      }
    >
      <AgentStudio launchSignal={launchSignal} />
    </AppShell>
  );
}
