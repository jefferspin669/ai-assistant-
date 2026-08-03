"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BoardAdvisorStudio } from "@/components/BoardAdvisorStudio";

export default function BoardPage() {
  const [newSignal, setNewSignal] = useState(0);

  return (
    <AppShell
      title="AI Board Advisor"
      subtitle="Imagine having your own board of advisors — add decisions, debate them, and delete when you’re done."
      action={
        <button className="btn btn-dark" type="button" onClick={() => setNewSignal((n) => n + 1)}>
          New decision
        </button>
      }
    >
      <BoardAdvisorStudio newSignal={newSignal} />
    </AppShell>
  );
}
