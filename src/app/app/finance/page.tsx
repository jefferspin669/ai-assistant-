import { AppShell } from "@/components/AppShell";
import { FinanceCenterStudio } from "@/components/FinanceCenterStudio";

export default function FinancePage() {
  return (
    <AppShell
      title="Financial Command Center"
      subtitle="Budgeting, cash-flow forecasting, profit projections, expense optimization, subscriptions, invoices, payroll, and tax planning."
      action={<button className="btn btn-dark">Open Tax Center</button>}
    >
      <FinanceCenterStudio />
    </AppShell>
  );
}
