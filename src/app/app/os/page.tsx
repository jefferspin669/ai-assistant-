import { AppShell } from "@/components/AppShell";
import { OperatingSystemStudio } from "@/components/OperatingSystemStudio";

export default function OperatingSystemPage() {
  return (
    <AppShell
      title="AI Operating System"
      subtitle="One workspace. One memory. One AI — for email, phone, calendar, CRM, money, marketing, and more."
    >
      <OperatingSystemStudio />
    </AppShell>
  );
}
