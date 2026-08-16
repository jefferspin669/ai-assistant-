import { runOwnerCommand } from "@/lib/commands";
import { BRAIN_TOOLS, buildSystemPrompt, executeBrainTool } from "@/lib/brain/tools";
import {
  brainConfig,
  brainMode,
  type BrainChatInput,
  type BrainResult,
  type BrainToolCall,
} from "@/lib/brain/types";

type OpenAiToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type OpenAiMessage = {
  role: string;
  content?: string | null;
  tool_calls?: OpenAiToolCall[];
};

function simulationBrain(input: BrainChatInput): BrainResult {
  const result = runOwnerCommand(input.message);
  const lower = input.message.toLowerCase();

  // Standing-order phrasing should feel real even in simulation.
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
  const { apiKey, baseUrl, model } = brainConfig();
  const messages: OpenAiMessage[] = [
    { role: "system", content: buildSystemPrompt(input) },
    ...(input.history || []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: input.message },
  ];

  let proposedAction: BrainResult["proposedAction"];
  const toolCallsMade: BrainToolCall[] = [];

  for (let step = 0; step < 4; step += 1) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        tools: BRAIN_TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`LLM error ${response.status}: ${detail.slice(0, 280)}`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: OpenAiMessage }[];
    };
    const message = payload.choices?.[0]?.message;
    if (!message) throw new Error("LLM returned no message.");

    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: message.content || null,
        tool_calls: message.tool_calls,
      });

      for (const call of message.tool_calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
        } catch {
          args = {};
        }
        toolCallsMade.push({ id: call.id, name: call.function.name, arguments: args });
        const executed = executeBrainTool(call.function.name, args);
        if (executed.proposedAction) proposedAction = executed.proposedAction;
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: executed.content,
        } as OpenAiMessage);
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
    return simulationBrain({ ...input, message: trimmed });
  }

  try {
    return await liveBrain({ ...input, message: trimmed });
  } catch (error) {
    const fallback = simulationBrain({ ...input, message: trimmed });
    return {
      ...fallback,
      reply: `${fallback.reply}\n\n(Live Brain unavailable: ${error instanceof Error ? error.message : "unknown error"} — using simulation fallback.)`,
    };
  }
}

export { brainMode, brainConfig };
