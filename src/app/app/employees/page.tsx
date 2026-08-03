"use client";

import { useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { AgentStudio, type AgentStudioHandle } from "@/components/AgentStudio";
import { useLanguage } from "@/components/LanguageProvider";

export default function EmployeesPage() {
  const studioRef = useRef<AgentStudioHandle>(null);
  const { tAction } = useLanguage();

  return (
    <AppShell
      title="AI Agents"
      subtitle="Instead of answering questions — Atlas completes goals across the business."
      action={
        <button
          className="btn btn-dark"
          type="button"
          onClick={() => studioRef.current?.openLaunch()}
        >
          {tAction("Launch goal")}
        </button>
      }
    >
      <AgentStudio ref={studioRef} />
    </AppShell>
  );
}
