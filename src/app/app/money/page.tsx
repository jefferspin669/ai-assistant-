import { moneyHub } from "@/lib/section-hubs";
import { SectionHub } from "@/components/SectionHub";

export default function MoneyPage() {
  return (
    <SectionHub
      title="Money"
      subtitle="Invoices, cash, and tax. Figures from sample ledgers are labeled DEMO until a bank is connected."
      items={moneyHub}
    />
  );
}
