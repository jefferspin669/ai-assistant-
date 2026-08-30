"use client";

import { useCallback, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { EmployeeHubStudio } from "@/components/EmployeeHubStudio";
import { useLanguage } from "@/components/LanguageProvider";

export default function TeamPage() {
  const inviteRef = useRef<(() => void) | null>(null);
  const { tAction } = useLanguage();

  const onReadyInvite = useCallback((open: () => void) => {
    inviteRef.current = open;
  }, []);

  return (
    <AppShell
      title="Employee Hub"
      subtitle="Add team members with their own pages. As host, assign tasks to each person."
      action={
        <button
          className="btn btn-dark"
          type="button"
          onClick={() => inviteRef.current?.()}
        >
          {tAction("Invite employee")}
        </button>
      }
    >
      <EmployeeHubStudio onReadyInvite={onReadyInvite} />
    </AppShell>
  );
}
