import { AppShell } from "@/components/AppShell";
import { DocumentStudio } from "@/components/DocumentStudio";

export default function DocumentsPage() {
  return (
    <AppShell
      title="AI Document Builder"
      subtitle="Describe what you need — Atlas drafts from your customer and business data. Export and share stay disabled until a real file or link exists."
      action={<button className="btn btn-dark">New document</button>}
    >
      <DocumentStudio />
    </AppShell>
  );
}
