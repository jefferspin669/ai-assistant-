import { runOwnerCommand } from "@/lib/commands";
import { BRAIN_TOOLS, buildSystemPrompt, executeBrainTool } from "@/lib/brain/tools";
import { executeStrictBrainTool } from "@/lib/brain/tools-strict";
import { buildBusinessContext, formatEvidenceAnswer } from "@/lib/brain/context";
import {
  brainConfig,
  brainMode,
  type BrainChatInput,
  type BrainCitation,
  type BrainResult,
  type BrainToolCall,
} from "@/lib/brain/types";
import { createOpenAIClient } from "@/lib/integrations/openai";
import { estimateLlmCostUsd, recordBrainUsage } from "@/lib/brain/usage";
import { isProduction } from "@/lib/ops/environment";
import type OpenAI from "openai";

function simulationBrain(input: BrainChatInput): BrainResult {
  const lower = input.message.toLowerCase();

  // KPI / memory brief — keep authenticated buildBusinessContext path.
  if (
    input.session &&
    (/how is business|brief|status|today/.test(lower) ||
      /what do we know|memory|inventory|don't know|missing/.test(lower) ||
      /compressor|stock|comms|chat thread/.test(lower))
  ) {
    const pack = buildBusinessContext(input.session, input.message);
    return {
      mode: "simulation",
      agentLabel: "Atlas",
      reply: formatEvidenceAnswer({
        headline: "Live workspace brief (simulation Brain — authenticated DB):",
        facts: pack.facts,
        missing: pack.missing,
      }),
      needsConfirm: false,
      model: "keyword-fallback+context",
      citations: pack.facts.filter((f) => f.citation).map((f) => f.citation!),
    };
  }

  // Evidence search for named operational questions (no action execution).
  if (
    input.session &&
    /project|task|customer|policy|document|schedule|appointment|invoice|blocked|behind|risk|remember/i.test(
      lower,
    )
  ) {
    const searched = executeBrainTool(
      "search_business_context",
      { query: input.message },
      input.session,
    );
    const parsed = JSON.parse(searched.content) as {
      evidence?: Array<{ source: string; id: string; label: string; snippet: string }>;
      gaps?: string[];
    };
    const evidence = parsed.evidence || [];
    if (evidence.length) {
      const facts = evidence
        .slice(0, 5)
        .map((item) => `• ${item.label}: ${item.snippet} [${item.source}:${item.id}]`)
        .join("\n");
      return {
        mode: "simulation",
        agentLabel: "Atlas",
        reply: `I found these permission-filtered business records:\n${facts}\n\nI have not executed any action. Set ATLAS_LLM_API_KEY for deeper reasoning and tool selection.`,
        needsConfirm: false,
        model: "evidence-fallback",
        toolCalls: [
          { id: "sim_context", name: "search_business_context", arguments: { query: input.message } },
        ],
        evidence: searched.evidence,
        gaps: searched.gaps,
        citations: evidence.map((item) => ({ entityType: item.source, entityId: item.id })),
      };
    }
    return {
      mode: "simulation",
      agentLabel: "Atlas",
      reply: `I couldn't find verified records matching that request. ${parsed.gaps?.[0] || "Tell me the customer, project, or task name."}`,
      needsConfirm: false,
      model: "evidence-fallback",
      toolCalls: [
        { id: "sim_context", name: "search_business_context", arguments: { query: input.message } },
      ],
      evidence: [],
      gaps: parsed.gaps,
    };
  }

  const result = runOwnerCommand(input.message);

  if (
    (lower.includes("going home") ||
      lower.includes("handle anything routine") ||
      lower.includes("i'm going home")) &&
    (lower.includes("discount") || lower.includes("8") || lower.includes("emergency"))
  ) {
    return {
      mode: "simulation",
      agentLabel: "Atlas",
      reply:
        "Understood. Tonight I’ll handle routine calls and texts, keep discounts ≤10%, never book before 8 AM, and wake you only for emergencies. I’ll leave a morning summary. (Simulation Brain — set ATLAS_LLM_API_KEY for live model + tools.)",
      needsConfirm: false,
      model: "keyword-fallback",
    };
  }

  return {
    mode: "simulation",
    agentLabel: result.agentLabel,
    reply: result.reply,
    needsConfirm: result.needsConfirm,
    confirmPrompt: result.confirmPrompt,
    doneLabel: result.doneLabel,
    model: "keyword-fallback",
  };
}

async function runTool(
  input: BrainChatInput,
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: string;
  proposedAction?: BrainResult["proposedAction"];
  citations?: BrainCitation[];
  clarifyingQuestion?: string;
  approvalId?: string;
  evidence?: BrainResult["evidence"];
  gaps?: string[];
}> {
  if (input.session) {
    const executed = await executeStrictBrainTool(input.session, name, args);
    return {
      content: executed.content,
      proposedAction: executed.proposedAction,
      citations: executed.citations,
      clarifyingQuestion: executed.needsInfo,
      approvalId: executed.approvalId,
      evidence: executed.evidence,
      gaps: executed.gaps,
    };
  }
  return executeBrainTool(name, args);
}

async function liveBrain(input: BrainChatInput): Promise<BrainResult> {
  const { model } = brainConfig();
  const openai = createOpenAIClient();
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(input) },
    ...(input.history || []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: input.message },
  ];

  let proposedAction: BrainResult["proposedAction"];
  let clarifyingQuestion: string | undefined;
  let approvalId: string | undefined;
  const citations: BrainCitation[] = [];
  const evidence: NonNullable<BrainResult["evidence"]> = [];
  const gaps = new Set<string>();
  const toolCallsMade: BrainToolCall[] = [];
  const toolResults = new Map<string, Awaited<ReturnType<typeof runTool>>>();
  let promptTokens = 0;
  let completionTokens = 0;
  const started = Date.now();
  let steps = 0;

  const usageMetrics = () => {
    const totalTokens = promptTokens + completionTokens;
    const latencyMs = Date.now() - started;
    const costUsd = estimateLlmCostUsd(model, promptTokens, completionTokens);
    recordBrainUsage({
      organizationId: input.session?.organizationId || null,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs,
      costUsd,
      mode: "live",
      ok: true,
    });
    return {
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs,
      costUsd,
      steps,
    };
  };

  for (let step = 0; step < 4; step += 1) {
    steps += 1;
    const completion = await openai.chat.completions.create({
      model,
      messages,
      tools: BRAIN_TOOLS,
      tool_choice: "auto",
      temperature: 0.3,
    });
    promptTokens += completion.usage?.prompt_tokens || 0;
    completionTokens += completion.usage?.completion_tokens || 0;
    const message = completion.choices[0]?.message;
    if (!message) throw new Error("LLM returned no message.");

    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: message.content || null,
        tool_calls: message.tool_calls,
      });

      for (const call of message.tool_calls) {
        const fn = call.type === "function" ? call.function : null;
        if (!fn) continue;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(fn.arguments || "{}") as Record<string, unknown>;
        } catch {
          args = {};
        }
        toolCallsMade.push({ id: call.id, name: fn.name, arguments: args });
        const idempotencyKey = `${fn.name}:${JSON.stringify(args)}`;
        const executed = toolResults.get(idempotencyKey) || (await runTool(input, fn.name, args));
        toolResults.set(idempotencyKey, executed);
        if (executed.proposedAction) proposedAction = executed.proposedAction;
        if (executed.clarifyingQuestion) clarifyingQuestion = executed.clarifyingQuestion;
        if (executed.approvalId) approvalId = executed.approvalId;
        if (executed.citations) citations.push(...executed.citations);
        if (executed.evidence) evidence.push(...executed.evidence);
        for (const gap of executed.gaps || []) gaps.add(gap);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: executed.content,
        });
      }
      continue;
    }

    const reply = (message.content || "").trim();
    const usage = usageMetrics();
    if (clarifyingQuestion) {
      return {
        mode: "live",
        agentLabel: "Atlas",
        reply: reply || clarifyingQuestion,
        needsConfirm: false,
        toolCalls: toolCallsMade,
        citations,
        clarifyingQuestion,
        evidence: evidence.length ? evidence : undefined,
        gaps: gaps.size ? [...gaps] : undefined,
        model,
        usage,
      };
    }
    if (proposedAction) {
      return {
        mode: "live",
        agentLabel: "Atlas",
        reply: reply || proposedAction.summary,
        needsConfirm: true,
        confirmPrompt: proposedAction.confirmPrompt,
        doneLabel: proposedAction.doneLabel,
        toolCalls: toolCallsMade,
        proposedAction,
        citations,
        approvalId,
        evidence: evidence.length ? evidence : undefined,
        gaps: gaps.size ? [...gaps] : undefined,
        model,
        usage,
      };
    }

    return {
      mode: "live",
      agentLabel: "Atlas",
      reply: reply || "I’m here — tell me what to handle.",
      needsConfirm: false,
      toolCalls: toolCallsMade,
      citations,
      evidence: evidence.length ? evidence : undefined,
      gaps: gaps.size ? [...gaps] : undefined,
      model,
      usage,
    };
  }

  return {
    mode: "live",
    agentLabel: "Atlas",
    reply: "I hit my tool loop limit — try a shorter instruction.",
    needsConfirm: false,
    toolCalls: toolCallsMade,
    proposedAction,
    citations,
    approvalId,
    evidence: evidence.length ? evidence : undefined,
    gaps: gaps.size ? [...gaps] : undefined,
    model,
    usage: usageMetrics(),
  };
}

export async function runAtlasBrain(input: BrainChatInput): Promise<BrainResult> {
  const trimmed = input.message.trim();
  if (!trimmed) {
    return {
      mode: brainMode(),
      agentLabel: "Atlas",
      reply: "Say something and I’ll handle it.",
      needsConfirm: false,
    };
  }

  let enriched = { ...input, message: trimmed };
  if (input.session && !input.liveContext) {
    const pack = buildBusinessContext(input.session, trimmed);
    enriched = { ...enriched, liveContext: pack.summaryForPrompt };
  }

  if (brainMode() === "simulation") {
    if (isProduction()) {
      return {
        mode: "simulation",
        agentLabel: "Atlas",
        reply:
          "Atlas Brain is unavailable: ATLAS_LLM_API_KEY is not configured. Production will not invent a simulated answer.",
        needsConfirm: false,
        model: "unavailable",
      };
    }
    return simulationBrain(enriched);
  }

  try {
    return await liveBrain(enriched);
  } catch (error) {
    if (isProduction()) {
      return {
        mode: "live",
        agentLabel: "Atlas",
        reply: `Live Brain failed: ${error instanceof Error ? error.message : "unknown error"}. Production will not fall back to a simulated reply.`,
        needsConfirm: false,
        model: brainConfig().model,
      };
    }
    const fallback = simulationBrain(enriched);
    return {
      ...fallback,
      reply: `${fallback.reply}\n\n(Live Brain unavailable: ${error instanceof Error ? error.message : "unknown error"} — using simulation fallback.)`,
    };
  }
}

export { brainMode, brainConfig };
