import { AppShell } from "@/components/AppShell";
import { AppStoreStudio } from "@/components/AppStoreStudio";

export default function AppStorePage() {
  return (
    <AppShell
      title="Atlas App Store"
      subtitle="Third-party developers publish modules — businesses install only what they need."
    >
      <AppStoreStudio />
    </AppShell>
  );
}
