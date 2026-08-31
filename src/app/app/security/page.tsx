"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SecurityStudio } from "@/components/SecurityStudio";

export default function SecurityPage() {
  const [lockSignal, setLockSignal] = useState(0);

  return (
    <AppShell
      title="Security"
      subtitle="Threat detection, login monitoring, device management, password health, 2FA checks, audit logs, and backup monitoring."
      action={
        <button className="btn btn-dark" type="button" onClick={() => setLockSignal((n) => n + 1)}>
          Lock sensitive actions
        </button>
      }
    >
      <SecurityStudio lockSignal={lockSignal} />
    </AppShell>
  );
}
