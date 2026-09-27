import { moneyHub } from "@/lib/section-hubs";
import { SectionHub } from "@/components/SectionHub";

export default function MoneyPage() {
  return (
    <SectionHub
      title="Money"
      subtitle="Banking, invoices, payments, tax, and accountant — one system. Figures from sample ledgers are labeled DEMO until a bank is connected."
      items={moneyHub}
    />
  );
}
