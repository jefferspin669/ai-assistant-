import { AppShell } from "@/components/AppShell";
import { MarketingStudio } from "@/components/MarketingStudio";

export default function MarketingPage() {
  return (
    <AppShell
      title="Marketing"
      subtitle="Campaign center — social, email, SMS, audiences, coupons, scheduling, and revenue attribution."
    >
      <MarketingStudio />
    </AppShell>
  );
}
