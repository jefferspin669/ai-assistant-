import { AppShell } from "@/components/AppShell";
import { IntelRoomStudio } from "@/components/IntelRoomStudio";

export default function IntelRoomPage() {
  return (
    <AppShell
      title="Private Intelligence Room"
      subtitle="Combine internal company data with public market information so leadership can ask questions like, “What could hurt us in the next 24 months?”"
    >
      <IntelRoomStudio />
    </AppShell>
  );
}
