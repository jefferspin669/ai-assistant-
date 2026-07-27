import { AppShell } from "@/components/AppShell";
import { DocumentStudio } from "@/components/DocumentStudio";

export default function DocumentsPage() {
  return (
    <AppShell
      title="AI Document Builder"
      subtitle="Creates contracts, quotes, invoices, letters, reports, policies, forms, and proposals."
      action={<button className="btn btn-dark">New document</button>}
    >
      <DocumentStudio />
    </AppShell>
  );
}
