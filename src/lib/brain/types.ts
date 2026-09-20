/** Atlas Brain — real LLM path with deterministic keyword fallback. */

import type { SessionContext } from "@/lib/domain/types";
import { resolveAllowedModel } from "@/lib/integrations/openai";

export type BrainMode = "live" | "simulation";

export type BrainMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
};

export type BrainToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type BrainActionProposal = {
  kind: string;
  title: string;
  summary: string;
  details: string[];
  impact: string;
  confirmPrompt: string;
  doneLabel: string;
  /** Server-side approval id when staged into Approvals. */
  approvalId?: string;
};

export type BrainCitation = {
  entityType: string;
  entityId: string;
  href?: string;
};

export type BrainUsageMetrics = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  costUsd: number;
  steps: number;
};

export type BrainResult = {
  mode: BrainMode;
  agentLabel: string;
  reply: string;
  needsConfirm: boolean;
  confirmPrompt?: string;
  doneLabel?: string;
  toolCalls?: BrainToolCall[];
  proposedAction?: BrainActionProposal;
  model?: string;
  citations?: BrainCitation[];
  clarifyingQuestion?: string;
  approvalId?: string;
  evidence?: import("@/lib/brain/context").BrainEvidence[];
  gaps?: string[];
  usage?: BrainUsageMetrics;
};

export type BrainChatInput = {
  message: string;
  businessName?: string;
  ownerName?: string;
  dnaRules?: string[];
  history?: { role: "user" | "assistant"; content: string }[];
  /** Injected live context pack for the system prompt. */
  liveContext?: string;
  /** Authenticated workspace session — enables strict tools. */
  session?: SessionContext;
};

export function brainMode(): BrainMode {
  return process.env.ATLAS_LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()
    ? "live"
    : "simulation";
}

export function brainConfig() {
  return {
    apiKey: process.env.ATLAS_LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "",
    baseUrl: (process.env.ATLAS_LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: resolveAllowedModel(),
  };
}
