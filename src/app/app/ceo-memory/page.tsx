import { AppShell } from "@/components/AppShell";
import { CeoMemoryStudio } from "@/components/CeoMemoryStudio";

export default function CeoMemoryPage() {
  return (
    <AppShell
      title="Executive Memory"
      subtitle="Atlas remembers years of decisions — ask why, and get context, supporting data, and meeting notes."
      action={<button className="btn btn-dark">Log decision</button>}
    >
      <CeoMemoryStudio />
    </AppShell>
  );
}
