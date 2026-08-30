"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/components/LanguageProvider";
import { WorkflowStudio } from "@/components/WorkflowStudio";

export default function WorkflowsPage() {
  const [newSignal, setNewSignal] = useState(0);
  const { tAction } = useLanguage();

  return (
    <AppShell
      title="Automation Builder"
      subtitle="No-code workflows you build yourself — start empty, add steps, save automations that accumulate."
      action={
        <button
          className="btn btn-dark"
          type="button"
          onClick={() => setNewSignal((n) => n + 1)}
        >
          {tAction("New workflow")}
        </button>
      }
    >
      <WorkflowStudio newSignal={newSignal} />
    </AppShell>
  );
}
