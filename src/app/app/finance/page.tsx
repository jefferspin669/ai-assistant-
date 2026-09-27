import { AppShell } from "@/components/AppShell";
import { MoneyWorkspace } from "@/components/MoneyWorkspace";

export default function FinancePage() {
  return (
    <AppShell
      title="Banking"
      subtitle="Connected accounts and recorded transactions, without sample balances."
    >
      <MoneyWorkspace view="banking" />
    </AppShell>
  );
}
