import { moneyHub } from "@/lib/section-hubs";
import { SectionHub } from "@/components/SectionHub";
import { MoneyWorkspace } from "@/components/MoneyWorkspace";

export default function MoneyPage() {
  return (
    <SectionHub
      title="Money"
      subtitle="Connect your bank, record real income and expenses, and review taxes in one place."
      items={moneyHub}
    >
      <MoneyWorkspace view="money" />
    </SectionHub>
  );
}
