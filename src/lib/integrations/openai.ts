/**
 * Official OpenAI SDK wrapper for Atlas Brain.
 */

import OpenAI from "openai";

export function openaiConfigured(): boolean {
  return Boolean(process.env.ATLAS_LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim());
}

export function createOpenAIClient(): OpenAI {
  const apiKey = process.env.ATLAS_LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ATLAS_LLM_API_KEY / OPENAI_API_KEY is not set");
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.ATLAS_LLM_BASE_URL?.trim() || undefined,
  });
}
