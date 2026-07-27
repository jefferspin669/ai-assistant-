import { AppShell } from "@/components/AppShell";
import { ScoreStudio } from "@/components/ScoreStudio";

export default function ScorePage() {
  return (
    <AppShell
      title="Atlas Intelligence Score"
      subtitle="A business health score from 0–100 — Atlas explains why it changed and recommends the highest-impact improvements."
    >
      <ScoreStudio />
    </AppShell>
  );
}
