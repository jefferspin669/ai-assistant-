import { FeatureView } from "@/components/FeatureView";
import { businessDnaSamples, businessDnaTraits } from "@/lib/atlas-platform";
import { owner } from "@/lib/data";

export default function DnaPage() {
  return (
    <FeatureView
      title="AI Business DNA"
      subtitle="Every company has a personality. Atlas learns it — then behaves like that company."
      sections={[
        {
          type: "panel",
          title: `Learned traits · ${owner.business}`,
          body: "Atlas doesn’t just answer. It writes, discounts, escalates, and serves customers the way your business would.",
          list: businessDnaTraits.map((trait) => ({
            badge: trait.trait,
            text: trait.value,
          })),
        },
        {
          type: "split",
          left: {
            title: "Generic AI",
            list: businessDnaSamples.map((sample) => ({
              badge: "Generic",
              text: sample.generic,
              sub: sample.prompt,
            })),
          },
          right: {
            title: "Atlas + your DNA",
            list: businessDnaSamples.map((sample) => ({
              badge: "Your company",
              badgeTone: "ok" as const,
              text: sample.dna,
              sub: sample.prompt,
            })),
          },
        },
        {
          type: "chat",
          title: "DNA in conversation",
          bubbles: [
            { role: "user", text: "Can you do better on price?" },
            {
              role: "ai",
              text: "I can honor 10% for returning customers on maintenance visits — emergency calls stay at the listed rate so we can keep crews ready.",
            },
          ],
        },
      ]}
    />
  );
}
