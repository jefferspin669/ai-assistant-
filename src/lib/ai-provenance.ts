/** AI response provenance — sources, reasoning, freshness. */

import { isDemoWorkspace } from "@/lib/workspace-mode";

export type AiProvenance = {
  sources: string[];
  why: string;
  lastUpdated: string;
  mode: "preview" | "production";
};

export function buildAiProvenance(topic: string, sources: string[]): AiProvenance {
  const demo = isDemoWorkspace();
  return {
    sources: demo ? ["Demo workspace sample data"] : sources,
    why: demo
      ? `Preview only — ${topic} uses labeled demo data, not your company records.`
      : `Atlas analyzed ${sources.join(", ")} from your connected workspace.`,
    lastUpdated: new Date().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    mode: demo ? "preview" : "production",
  };
}

export function formatProvenanceLine(p: AiProvenance): string {
  return `Sources: ${p.sources.join(" + ")} · Why? ${p.why} · Last updated ${p.lastUpdated}`;
}
