import { AppShell } from "@/components/AppShell";
import { industryPacks } from "@/lib/data";

export default function IndustriesPage() {
  return (
    <AppShell
      title="Industry Packs"
      subtitle="Specialized knowledge instead of one generic AI for everyone."
    >
      <div className="pack-grid dense">
        {industryPacks.map((pack) => (
          <article className="panel pack-card" key={pack.name}>
            <span className="employee-emoji" aria-hidden="true">
              {pack.emoji}
            </span>
            <h2>{pack.name}</h2>
            <p style={{ color: "var(--ink-soft)" }}>
              Pricing language, FAQs, booking rules, compliance cues, and templates tuned for{" "}
              {pack.name.toLowerCase()}.
            </p>
            <button className="btn btn-outline" type="button">
              Add pack
            </button>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
