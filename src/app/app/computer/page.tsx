"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ComputerControlStudio } from "@/components/ComputerControlStudio";

export default function ComputerControlPage() {
  const [auditSignal, setAuditSignal] = useState(0);

  return (
    <AppShell
      title="AI Computer Control"
      subtitle="With permission, Atlas opens apps, fills forms, builds spreadsheets, sends email, generates reports, and organizes files."
      action={
        <button className="btn btn-dark" type="button" onClick={() => setAuditSignal((n) => n + 1)}>
          Review audit log
        </button>
      }
    >
      <ComputerControlStudio auditSignal={auditSignal} />
    </AppShell>
  );
}
