import { FeatureView } from "@/components/FeatureView";
import { memoryFacts } from "@/lib/data";
import { memoryReplay } from "@/lib/atlas-platform";

export default function MemoryPage() {
  return (
    <FeatureView
      title="AI Memory"
      subtitle="One of the biggest missing features in most AI assistants — Atlas remembers across months, not just chats."
      sections={[
        {
          type: "chat",
          title: `Replay · ${memoryReplay.customer}`,
          bubbles: [
            { role: "user", text: memoryReplay.past },
            { role: "ai", text: "Got it — I’ll use text reminders for John going forward." },
            { role: "user", text: memoryReplay.now },
            { role: "ai", text: memoryReplay.atlas },
          ],
        },
        {
          type: "split",
          left: {
            title: "What sticks",
            list: [
              { badge: "Memory", text: "Preferred channel (text, call, email)" },
              { badge: "Memory", text: "Best appointment windows" },
              { badge: "Memory", text: "Favorite technician" },
              { badge: "Memory", text: "Pets, gates, access notes" },
              { badge: "Memory", text: "Payment habits and tone" },
            ],
          },
          right: {
            title: "Elena Brooks facts",
            list: memoryFacts.map((fact) => ({ badge: "Stored", badgeTone: "ok" as const, text: fact })),
          },
        },
      ]}
    />
  );
}
