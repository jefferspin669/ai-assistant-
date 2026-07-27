import { AppShell } from "@/components/AppShell";
import { BusinessBuilderStudio } from "@/components/BusinessBuilderStudio";

export default function BuilderPage() {
  return (
    <AppShell
      title="AI Business Builder"
      subtitle="Someone starts a company — Atlas helps choose a name, brand, website, pricing, domains, contracts, workflows, marketing, and first customers."
    >
      <BusinessBuilderStudio />
    </AppShell>
  );
}
