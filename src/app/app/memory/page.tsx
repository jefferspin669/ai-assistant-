import Link from "@/components/SiteLink";
import { AppShell } from "@/components/AppShell";
import { memoryHub } from "@/lib/section-hubs";
import { memoryFacts } from "@/lib/data";
import { memoryReplay } from "@/lib/atlas-platform";

export default function MemoryPage() {
  return (
    <AppShell
      title="Atlas Memory"
      subtitle="One memory system — business, CEO, customers, knowledge, timeline, and settings. Atlas remembers across months, not just chats."
    >
      <div className="hub-grid">
        {memoryHub
          .filter((item) => item.href !== "/app/memory")
          .map((item) => (
            <Link className="hub-card" href={item.href} key={item.href}>
              <h3>{item.label}</h3>
              <p>{item.blurb}</p>
            </Link>
          ))}
      </div>

      <div className="split" style={{ marginTop: "1.1rem" }}>
        <section className="panel">
          <h2>Replay · {memoryReplay.customer}</h2>
          <div className="chat-mock">
            <div className="bubble bubble-user">{memoryReplay.past}</div>
            <div className="bubble bubble-ai">Got it — I’ll use text reminders for John going forward.</div>
            <div className="bubble bubble-user">{memoryReplay.now}</div>
            <div className="bubble bubble-ai">{memoryReplay.atlas}</div>
          </div>
        </section>
        <section className="panel">
          <h2>What sticks</h2>
          <div className="list">
            {[
              "Preferred channel (text, call, email)",
              "Best appointment windows",
              "Favorite technician",
              "Pets, gates, access notes",
              "Payment habits and tone",
            ].map((text) => (
              <div className="list-row" key={text}>
                <span className="badge">Memory</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: "1rem" }}>Elena Brooks facts</h3>
          <div className="list">
            {memoryFacts.map((fact) => (
              <div className="list-row" key={fact}>
                <span className="badge ok">Stored</span>
                <p>{fact}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
