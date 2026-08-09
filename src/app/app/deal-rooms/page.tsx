import { AppShell } from "@/components/AppShell";
import { DealRoomsStudio } from "@/components/DealRoomsStudio";

export default function DealRoomsPage() {
  return (
    <AppShell
      title="Confidential Deal Rooms"
      subtitle="Separate secure AI workspaces for acquisitions, lawsuits, financing rounds, restructurings, and other highly sensitive projects."
    >
      <DealRoomsStudio />
    </AppShell>
  );
}
