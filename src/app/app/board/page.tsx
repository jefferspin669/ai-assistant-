"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BoardAdvisorStudio } from "@/components/BoardAdvisorStudio";

export default function BoardPage() {
  const [newSignal, setNewSignal] = useState(0);

  return (
    <AppShell
      title="Board Advisor"
      subtitle="Strategic AI advisor — add decisions, debate them, and delete when you’re done. Not the daily dashboard."
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
