import { AppShell } from "@/components/AppShell";
import { TaxCenterStudio } from "@/components/TaxCenterStudio";

export default function TaxCenterPage() {
  return (
    <AppShell
      title="Atlas Tax Center"
      subtitle="Estimates, documents, interview, accountant portal, payroll taxes, alerts, quarterly payments, mileage, and Tax-Time — Atlas never files without your authorization."
    >
      <TaxCenterStudio />
    </AppShell>
  );
}
