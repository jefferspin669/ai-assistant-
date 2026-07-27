import { FeatureView } from "@/components/FeatureView";

export default function ReceptionistPage() {
  return (
    <FeatureView
      title="Voice Receptionist"
      subtitle="Instead of “Press 1…” — customers simply talk."
      sections={[
        {
          type: "chat",
          title: "Live call",
          bubbles: [
            { role: "user", text: "My AC quit working." },
            {
              role: "ai",
              text: "I’m sorry to hear that. Would you like the earliest technician available?",
            },
            { role: "user", text: "Yes, mornings if you can." },
            {
              role: "ai",
              text: "I can do tomorrow 10–12 with John. I’ll text the confirmation and a photo upload link now.",
            },
          ],
        },
        {
          type: "split",
          left: {
            title: "Overnight outcomes",
            list: [
              { badge: "Done", badgeTone: "ok", text: "Booked appointment" },
              { badge: "Done", badgeTone: "ok", text: "Collected photos" },
              { badge: "Done", badgeTone: "ok", text: "Drafted estimate" },
              { badge: "Done", badgeTone: "ok", text: "Scheduled technician" },
              { badge: "Done", badgeTone: "ok", text: "Sent confirmation" },
            ],
          },
          right: {
            title: "Why voice wins",
            list: [
              { badge: "Natural", text: "No phone trees" },
              { badge: "Fast", text: "Books while empathy is happening" },
              { badge: "Memory", text: "Recognizes repeat callers" },
              { badge: "Safe", text: "Emergencies escalate live" },
            ],
          },
        },
      ]}
    />
  );
}
