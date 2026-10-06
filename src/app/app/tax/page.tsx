"use client";

import { AppShell } from "@/components/AppShell";
import { MoneyWorkspace } from "@/components/MoneyWorkspace";

export default function TaxCenterPage() {
  return (
    <AppShell
      title="Tax"
      subtitle="Live ledger totals for review. Atlas cannot calculate your tax liability without a verified tax profile."
    >
      <MoneyWorkspace view="tax" />
    </AppShell>
  );
}
