import { FeatureView } from "@/components/FeatureView";
import { phoneCapabilities } from "@/lib/atlas-platform";

export default function PhonePage() {
  return (
    <FeatureView
      title="AI Phone System"
      subtitle="Instead of voicemail, Atlas answers — understands callers, routes, books, takes payment, and detects emergencies."
      sections={[
        {
          type: "stats",
          items: [
            { label: "Answered overnight", value: "27", detail: "0 lost to voicemail" },
            { label: "Booked on-call", value: "9", detail: "Auto-scheduled" },
            { label: "Emergencies", value: "1", detail: "Escalated live" },
            { label: "Repeat callers", value: "11", detail: "Recognized instantly" },
          ],
        },
        {
          type: "split",
          left: {
            title: "Capabilities",
            list: phoneCapabilities.map((item) => ({
              badge: "Live",
              badgeTone: "ok" as const,
              text: item,
            })),
          },
          right: {
            title: "Live call",
            children: (
              <div className="chat-mock">
                <div className="bubble bubble-user">My AC quit working.</div>
                <div className="bubble bubble-ai">
                  I’m sorry to hear that. Would you like the earliest technician available?
                </div>
                <div className="bubble bubble-user">Yes — and can I pay the diagnostic now?</div>
                <div className="bubble bubble-ai">
                  Absolutely. I’ve reserved 10–12 with John and sent a secure payment link by text.
                </div>
              </div>
            ),
          },
        },
      ]}
    />
  );
}
