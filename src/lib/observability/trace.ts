import { nowIso } from "@/lib/db/store";
import type { AtlasTrace, TraceSpan } from "@/lib/orchestrator/types";
import { saveTrace } from "@/lib/orchestrator/store";

export type TraceBuilder = {
  id: string;
  organizationId: string;
  runId?: string;
  goal?: string;
  start: number;
  spans: TraceSpan[];
  tokens: number;
  costUsd: number;
  actions: number;
  retries: number;
};

export function startTrace(input: {
  id: string;
  organizationId: string;
  runId?: string;
  goal?: string;
}): TraceBuilder {
  return {
    ...input,
    start: Date.now(),
    spans: [],
    tokens: 0,
    costUsd: 0,
    actions: 0,
    retries: 0,
  };
}

export function addSpan(trace: TraceBuilder, name: string, ok: boolean, detail?: string, started = Date.now() - 1) {
  const endedAt = new Date().toISOString();
  const ms = Math.max(0, Date.now() - started);
  trace.spans.push({
    name,
    ok,
    startedAt: new Date(started).toISOString(),
    endedAt,
    ms,
    detail,
  });
}

export function finishTrace(trace: TraceBuilder): AtlasTrace {
  const row: AtlasTrace = {
    id: trace.id,
    organizationId: trace.organizationId,
    runId: trace.runId,
    goal: trace.goal,
    spans: trace.spans,
    totalMs: Date.now() - trace.start,
    costUsd: trace.costUsd,
    tokens: trace.tokens,
    actions: trace.actions,
    retries: trace.retries,
    createdAt: nowIso(),
  };
  saveTrace(row);
  return row;
}
