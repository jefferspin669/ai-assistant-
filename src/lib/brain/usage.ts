/**
 * Brain LLM usage metering — tokens, latency, rough cost.
 * In-memory ring (per process); also mirrored onto orchestrator traces when a run is active.
 */

export type BrainUsageSample = {
  id: string;
  organizationId: string | null;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  costUsd: number;
  mode: "live" | "simulation";
  ok: boolean;
  at: string;
};

const MAX = 200;
const samples: BrainUsageSample[] = [];

/** Rough USD per 1M tokens — override with ATLAS_LLM_INPUT_COST / ATLAS_LLM_OUTPUT_COST. */
export function estimateLlmCostUsd(model: string, promptTokens: number, completionTokens: number) {
  const inputPerM = Number(process.env.ATLAS_LLM_INPUT_COST || "") || defaultInputCost(model);
  const outputPerM = Number(process.env.ATLAS_LLM_OUTPUT_COST || "") || defaultOutputCost(model);
  return (promptTokens / 1_000_000) * inputPerM + (completionTokens / 1_000_000) * outputPerM;
}

function defaultInputCost(model: string) {
  if (/gpt-4o(?!-mini)|o1|claude-3-5|claude-opus/i.test(model)) return 2.5;
  if (/gpt-4o-mini|mini|haiku/i.test(model)) return 0.15;
  return 0.5;
}

function defaultOutputCost(model: string) {
  if (/gpt-4o(?!-mini)|o1|claude-3-5|claude-opus/i.test(model)) return 10;
  if (/gpt-4o-mini|mini|haiku/i.test(model)) return 0.6;
  return 1.5;
}

export function recordBrainUsage(sample: Omit<BrainUsageSample, "id" | "at"> & { id?: string }) {
  const row: BrainUsageSample = {
    id: sample.id || `bru_${Date.now().toString(36)}`,
    at: new Date().toISOString(),
    organizationId: sample.organizationId,
    model: sample.model,
    promptTokens: sample.promptTokens,
    completionTokens: sample.completionTokens,
    totalTokens: sample.totalTokens,
    latencyMs: sample.latencyMs,
    costUsd: sample.costUsd,
    mode: sample.mode,
    ok: sample.ok,
  };
  samples.unshift(row);
  if (samples.length > MAX) samples.length = MAX;
  return row;
}

export function brainUsageStats(organizationId?: string) {
  const rows = organizationId
    ? samples.filter((s) => s.organizationId === organizationId)
    : samples;
  const last24h = Date.now() - 24 * 3600_000;
  const recent = rows.filter((s) => new Date(s.at).getTime() >= last24h);
  const sum = (pick: (s: BrainUsageSample) => number) => recent.reduce((n, s) => n + pick(s), 0);
  return {
    samples: rows.length,
    last24h: recent.length,
    tokens24h: sum((s) => s.totalTokens),
    costUsd24h: Number(sum((s) => s.costUsd).toFixed(6)),
    avgLatencyMs24h: recent.length
      ? Math.round(sum((s) => s.latencyMs) / recent.length)
      : 0,
    latest: rows[0] || null,
  };
}

export function resetBrainUsageForTests() {
  samples.length = 0;
}
