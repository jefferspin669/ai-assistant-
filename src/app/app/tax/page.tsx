"use client";

import { AppShell } from "@/components/AppShell";
import { TaxCenterStudio } from "@/components/TaxCenterStudio";
import { TaxLedgerPanel } from "@/components/TaxLedgerPanel";

export default function TaxCenterPage() {
  return (
    <AppShell
      title="Atlas Tax Center"
      subtitle="Track income and expenses, get a basic estimate, then use the full Tax Center for reviews and filing states."
    >
      <TaxLedgerPanel />
      <TaxCenterStudio />
    </AppShell>
  );
}
