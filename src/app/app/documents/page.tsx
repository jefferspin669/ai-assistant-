import { AppShell } from "@/components/AppShell";
import { DocumentStudio } from "@/components/DocumentStudio";

export default function DocumentsPage() {
  return (
    <AppShell
      title="AI Document Builder"
      subtitle="Describe what you need — Atlas drafts from your customer and business data, then edit and export."
      action={<button className="btn btn-dark">New document</button>}
    >
      <DocumentStudio />
    </AppShell>
  );
}
