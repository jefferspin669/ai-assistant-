"use client";

import { AppShell } from "@/components/AppShell";
import { OperatingSystemStudio } from "@/components/OperatingSystemStudio";

export default function OperatingSystemPage() {
  return (
    <AppShell
      title="AI Operating System"
      subtitle="One workspace. One memory. One AI — add the apps you need alongside email, phone, calendar, CRM, and more."
    >
      <OperatingSystemStudio />
    </AppShell>
  );
}
