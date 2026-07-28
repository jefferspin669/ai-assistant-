import { AppShell } from "@/components/AppShell";
import { TaxCenterStudio } from "@/components/TaxCenterStudio";

export default function TaxCenterPage() {
  return (
    <AppShell
      title="Atlas Tax Center"
      subtitle="Automatic income tracking across banks, payroll, processors, and invoices — plus receipt-based expense deductions with Needs Review for anything uncertain."
    >
      <TaxCenterStudio />
    </AppShell>
  );
}
