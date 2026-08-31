import Link from "@/components/SiteLink";
import { AppShell } from "@/components/AppShell";
import { FinanceCenterStudio } from "@/components/FinanceCenterStudio";

export default function FinancePage() {
  return (
    <AppShell
      title="Banking"
      subtitle="Cash, forecasts, expenses, invoices, and payroll — part of Money, not a separate product."
      action={
        <Link className="btn btn-dark" href="/app/tax">
          Open Tax
        </Link>
      }
    >
      <FinanceCenterStudio />
    </AppShell>
  );
}
