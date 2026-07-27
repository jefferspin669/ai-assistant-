import { AppShell } from "@/components/AppShell";
import { BoardAdvisorStudio } from "@/components/BoardAdvisorStudio";

export default function BoardPage() {
  return (
    <AppShell
      title="AI Board Advisor"
      subtitle="Imagine having your own board of advisors — different AI experts discuss decisions and present balanced viewpoints."
      action={<button className="btn btn-dark">New decision</button>}
    >
      <BoardAdvisorStudio />
    </AppShell>
  );
}
