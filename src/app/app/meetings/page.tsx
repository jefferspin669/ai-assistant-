"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MeetingStudio } from "@/components/MeetingStudio";

export default function MeetingsPage() {
  const [newSignal, setNewSignal] = useState(0);

  return (
    <AppShell
      title="Meeting Intelligence"
      subtitle="Add meetings, start them on their own page, capture notes, decisions, tasks, and email recaps."
      action={
        <button className="btn btn-dark" type="button" onClick={() => setNewSignal((n) => n + 1)}>
          New meeting
        </button>
      }
    >
      <MeetingStudio newSignal={newSignal} />
    </AppShell>
  );
}
