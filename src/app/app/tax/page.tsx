"use client";

import { AppShell } from "@/components/AppShell";
import { TaxCenter } from "@/components/TaxCenter";

export default function TaxCenterPage() {
  return (
    <AppShell
      title="Tax"
      subtitle="One Tax Center — overview, ledger, estimates, documents, and settings. Figures from sample ledgers are labeled DEMO until a tax product is connected."
    >
      <TaxCenter />
    </AppShell>
  );
}
