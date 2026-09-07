import { runOwnerCommand } from "@/lib/commands";
import { BRAIN_TOOLS, buildSystemPrompt, executeBrainTool } from "@/lib/brain/tools";
import {
  brainConfig,
  brainMode,
  type BrainChatInput,
  type BrainResult,
  type BrainToolCall,
} from "@/lib/brain/types";
import { createOpenAIClient } from "@/lib/integrations/openai";
import { isProduction } from "@/lib/ops/environment";
import type OpenAI from "openai";

function simulationBrain(input: BrainChatInput): BrainResult {
  const result = runOwnerCommand(input.message);
  const lower = input.message.toLowerCase();

  // Prefer real brief data even on the keyword path when a session exists.
  if (
    lower.includes("how is business") ||
    lower.includes("business brief") ||
    lower.includes("how's business") ||
    lower.includes("status")
  ) {
    if (input.session?.organizationId) {
      const brief = executeBrainTool("get_business_brief", {}, input.session);
      const parsed = JSON.parse(brief.content) as {
        revenueLast30Days?: number;
        overdueInvoiceTotal?: number;
        openTasks?: number;
        bookingsToday?: number;
        pendingApprovals?: number;
        risks?: string[];
      };
      return {
        mode: "simulation",
        agentLabel: "Atlas",
        reply: [
          `From your live books: ~$${Number(parsed.revenueLast30Days || 0).toLocaleString()} income in the last 30 days,`,
          `${parsed.bookingsToday ?? 0} bookings today, ${parsed.openTasks ?? 0} open tasks,`,
          `$${Number(parsed.overdueInvoiceTotal || 0).toLocaleString()} overdue, ${parsed.pendingApprovals ?? 0} approvals waiting.`,
          (parsed.risks || []).length ? `Risks: ${(parsed.risks || []).join("; ")}.` : "No urgent risks flagged.",
          "(Keyword Brain — set ATLAS_LLM_API_KEY for full live model + tools.)",
        ].join(" "),
        needsConfirm: false,
        model: "keyword-fallback",
        toolCalls: [{ id: "sim_brief", name: "get_business_brief", arguments: {} }],
      };
    }
  }

  if (
    (lower.includes("going home") || lower.includes("handle anything routine") || lower.includes("i'm going home")) &&
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

async function liveBrain(input: BrainChatInput): Promise<BrainResult> {
  const { model } = brainConfig();
  const openai = createOpenAIClient();
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(input) },
    ...(input.history || []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: input.message },
  ];

  let proposedAction: BrainResult["proposedAction"];
  const toolCallsMade: BrainToolCall[] = [];

  for (let step = 0; step < 4; step += 1) {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      tools: BRAIN_TOOLS,
      tool_choice: "auto",
      temperature: 0.3,
    });
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
        const executed = executeBrainTool(fn.name, args, input.session);
        if (executed.proposedAction) proposedAction = executed.proposedAction;
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: executed.content,
        });
      }
      continue;
    }

    const reply = (message.content || "").trim();
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
        model,
      };
    }

    return {
      mode: "live",
      agentLabel: "Atlas",
      reply: reply || "I’m here — tell me what to handle.",
      needsConfirm: false,
      toolCalls: toolCallsMade,
      model,
    };
  }

  return {
    mode: "live",
    agentLabel: "Atlas",
    reply: "I hit my tool loop limit — try a shorter instruction.",
    needsConfirm: false,
    toolCalls: toolCallsMade,
    proposedAction,
    model,
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
    return simulationBrain({ ...input, message: trimmed });
  }

  try {
    return await liveBrain({ ...input, message: trimmed });
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
    const fallback = simulationBrain({ ...input, message: trimmed });
    return {
      ...fallback,
      reply: `${fallback.reply}\n\n(Live Brain unavailable: ${error instanceof Error ? error.message : "unknown error"} — using simulation fallback.)`,
    };
  }
}

export { brainMode, brainConfig };
