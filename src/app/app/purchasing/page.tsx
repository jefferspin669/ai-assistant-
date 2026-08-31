import { AppShell } from "@/components/AppShell";
import { ExpensesStudio } from "@/components/ExpensesStudio";
import Link from "@/components/SiteLink";

export default function PurchasingPage() {
  return (
    <AppShell
      title="Expenses & Purchases"
      subtitle="Scan receipts, match company-card transactions, assign projects, and route approvals."
      action={
        <div className="cta-row">
          <Link className="btn btn-outline" href="/app/purchasing?tab=scan">Scan receipt</Link>
          <Link className="btn btn-outline" href="/app/purchasing?tab=rules">Approval rules</Link>
        </div>
      }
    >
      <ExpensesStudio />
    </AppShell>
  );
}
