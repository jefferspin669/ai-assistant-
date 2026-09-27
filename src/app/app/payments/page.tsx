import { AppShell } from "@/components/AppShell";
import { MoneyWorkspace } from "@/components/MoneyWorkspace";

export default function PaymentsPage() {
  return (
    <AppShell
      title="Invoices & payments"
      subtitle="Invoice and payment records. Verify provider delivery and settlement before counting revenue."
    >
      <MoneyWorkspace view="payments" />
    </AppShell>
  );
}
