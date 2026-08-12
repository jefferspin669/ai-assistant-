import { AppShell } from "@/components/AppShell";
import { SuggestionsStudio } from "@/components/SuggestionsStudio";

export default function SuggestionsPage() {
  return (
    <AppShell
      title="Employee Suggestions"
      subtitle="Atlas groups similar suggestions so leadership can spot patterns — turning employees into a source of business intelligence."
    >
      <SuggestionsStudio />
    </AppShell>
  );
}
