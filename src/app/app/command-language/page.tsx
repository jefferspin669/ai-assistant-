import { AppShell } from "@/components/AppShell";
import { CommandLanguageStudio } from "@/components/CommandLanguageStudio";

export default function CommandLanguagePage() {
  return (
    <AppShell
      title="Business Command Language"
      subtitle="Type plain English — Atlas converts it into automations with triggers, conditions, actions, and safeguards."
      action={<button className="btn btn-dark">New command</button>}
    >
      <CommandLanguageStudio />
    </AppShell>
  );
}
