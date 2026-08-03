"use client";

import { useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/components/LanguageProvider";
import { WorkflowStudio, type WorkflowStudioHandle } from "@/components/WorkflowStudio";

export default function WorkflowsPage() {
  const studioRef = useRef<WorkflowStudioHandle>(null);
  const { tAction } = useLanguage();

  return (
    <AppShell
      title="Automation Builder"
      subtitle="No-code workflows you build yourself — start empty, add steps, save automations that accumulate."
      action={
        <button
          className="btn btn-dark"
          type="button"
          onClick={() => studioRef.current?.newWorkflow()}
        >
          {tAction("New workflow")}
        </button>
      }
    >
      <WorkflowStudio ref={studioRef} />
    </AppShell>
  );
}
