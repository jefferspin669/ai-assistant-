import { AppShell } from "@/components/AppShell";
import { ApiStudio } from "@/components/ApiStudio";

export default function DevelopersPage() {
  return (
    <AppShell
      title="Atlas API"
      subtitle="Connect accounting software, payment processors, calendar apps, email providers, SMS providers, shipping carriers, e-commerce platforms, and custom software."
      action={<button className="btn btn-dark">View API keys</button>}
    >
      <ApiStudio />
    </AppShell>
  );
}
