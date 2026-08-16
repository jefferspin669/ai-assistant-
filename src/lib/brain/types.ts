/** Atlas Brain — real LLM path with deterministic keyword fallback. */

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
};

export type BrainChatInput = {
  message: string;
  businessName?: string;
  ownerName?: string;
  dnaRules?: string[];
  history?: { role: "user" | "assistant"; content: string }[];
};

export function brainMode(): BrainMode {
  return process.env.ATLAS_LLM_API_KEY?.trim() ? "live" : "simulation";
}

export function brainConfig() {
  return {
    apiKey: process.env.ATLAS_LLM_API_KEY?.trim() || "",
    baseUrl: (process.env.ATLAS_LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.ATLAS_LLM_MODEL || "gpt-4o-mini",
  };
}
