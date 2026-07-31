import { AppShell } from "@/components/AppShell";
import { ScoreStudio } from "@/components/ScoreStudio";

export default function ScorePage() {
  return (
    <AppShell
      title="Business Health Score"
      subtitle="Score the business from 0–100 on revenue growth, customer satisfaction, response time, cash flow, marketing, productivity, and security — then improve it."
    >
      <ScoreStudio />
    </AppShell>
  );
}
