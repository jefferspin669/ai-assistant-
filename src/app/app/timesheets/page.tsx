import { AppShell } from "@/components/AppShell";
import { TimesheetsStudio } from "@/components/TimesheetsStudio";

export default function TimesheetsPage() {
  return (
    <AppShell
      title="Timesheets"
      subtitle="Hours, overtime, late clock-ins, missing punches, and leave — from employee time clocks."
    >
      <TimesheetsStudio />
    </AppShell>
  );
}
