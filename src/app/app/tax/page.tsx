import { AppShell } from "@/components/AppShell";
import { TaxCenterStudio } from "@/components/TaxCenterStudio";

export default function TaxCenterPage() {
  return (
    <AppShell
      title="Atlas Tax Center"
      subtitle="Personal, Freelancer, Business, and Tax Pro — with Estimated, AI suggestion, Accountant-reviewed, and Officially filed kept separate. Estimates are planning tools until reviewed or filed."
    >
      <TaxCenterStudio />
    </AppShell>
  );
}
