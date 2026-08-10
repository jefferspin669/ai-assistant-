import { AppShell } from "@/components/AppShell";
import { BoardroomStudio } from "@/components/BoardroomStudio";

export default function BoardroomPage() {
  return (
    <AppShell
      title="Boardroom Mode"
      subtitle="Prepare the board packet, summarize major risks, track commitments from past meetings, and rehearse the hard questions directors and investors will ask."
    >
      <BoardroomStudio />
    </AppShell>
  );
}
