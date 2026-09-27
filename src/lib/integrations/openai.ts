/**
 * Official OpenAI SDK wrapper for Atlas Brain.
 */

import OpenAI from "openai";

const ALLOWED_MODELS = new Set(
  (process.env.ATLAS_LLM_MODEL_ALLOWLIST || "gpt-4o-mini,gpt-4o,gpt-4.1-mini,gpt-4.1,o4-mini")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

export function openaiConfigured(): boolean {
  return Boolean(process.env.ATLAS_LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim());
}

export function resolveAllowedModel(requested?: string): string {
  const model = (requested || process.env.ATLAS_LLM_MODEL || "gpt-4o-mini").trim();
  if (ALLOWED_MODELS.has(model)) return model;
  // Allow exact env override even if not in default list (operator opted in).
  if (requested && process.env.ATLAS_LLM_MODEL?.trim() === requested) return requested;
  if (process.env.ATLAS_LLM_MODEL?.trim() && !requested) {
    return process.env.ATLAS_LLM_MODEL.trim();
  }
  return "gpt-4o-mini";
}

export function createOpenAIClient(): OpenAI {
  const apiKey = process.env.ATLAS_LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ATLAS_LLM_API_KEY / OPENAI_API_KEY is not set");
  }
  const timeoutMs = Number(process.env.ATLAS_LLM_TIMEOUT_MS || 45_000);
  return new OpenAI({
    apiKey,
    baseURL: process.env.ATLAS_LLM_BASE_URL?.trim() || undefined,
    timeout: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 45_000,
    maxRetries: Number(process.env.ATLAS_LLM_MAX_RETRIES || 1),
  });
}
