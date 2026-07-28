import { AppShell } from "@/components/AppShell";
import { TaxCenterStudio } from "@/components/TaxCenterStudio";

export default function TaxCenterPage() {
  return (
    <AppShell
      title="Atlas Tax Center"
      subtitle="Estimates, quarterly payments, mileage, Tax-Time Mode, income sync, and receipt deductions — with Needs Review for anything uncertain."
    >
      <TaxCenterStudio />
    </AppShell>
  );
}
