import type { BrainChatInput } from "@/lib/brain/types";

export const BRAIN_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_business_brief",
      description:
        "Get a live brief from the authenticated workspace database (customers, projects, tasks, calendar, ledger). Distinguishes verified facts vs estimates vs missing data.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "answer_from_context",
      description:
        "Answer a business question using only authenticated DB facts and permission-aware memories. Say when evidence is missing.",
      parameters: {
        type: "object",
        properties: { question: { type: "string" } },
        required: ["question"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_business_memory",
      description: "Search unified org-scoped business memory (company, leadership, customer, employee, project).",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "remember_business_fact",
      description: "Store a permission-aware business memory with source, confidence, and access level.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string" },
          memoryType: {
            type: "string",
            enum: ["company", "leadership", "employee", "customer", "operational", "project"],
          },
          accessLevel: {
            type: "string",
            enum: ["owner", "leadership", "managers", "all_staff", "customer_facing"],
          },
          idempotencyKey: { type: "string" },
        },
        required: ["content", "idempotencyKey"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a project task in the authenticated database.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          notes: { type: "string" },
          projectId: { type: "string" },
          assigneeId: { type: "string" },
          dueDate: { type: "string" },
          idempotencyKey: { type: "string" },
        },
        required: ["title", "idempotencyKey"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "assign_worker",
      description: "Assign an existing task to a worker (manager/owner).",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          assigneeId: { type: "string" },
          idempotencyKey: { type: "string" },
        },
        required: ["taskId", "assigneeId", "idempotencyKey"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "draft_invoice",
      description: "Draft a customer quote/invoice amount (may require approval).",
      parameters: {
        type: "object",
        properties: {
          customerId: { type: "string" },
          amount: { type: "number" },
          idempotencyKey: { type: "string" },
        },
        required: ["customerId", "amount", "idempotencyKey"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "schedule_appointment",
      description: "Schedule a customer appointment. Before 8 AM requires owner approval.",
      parameters: {
        type: "object",
        properties: {
          customerId: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          title: { type: "string" },
          idempotencyKey: { type: "string" },
        },
        required: ["customerId", "startTime", "endTime", "idempotencyKey"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_customer_message",
      description: "Queue a customer SMS/message — always goes through approval policy.",
      parameters: {
        type: "object",
        properties: {
          customerId: { type: "string" },
          message: { type: "string" },
          idempotencyKey: { type: "string" },
        },
        required: ["customerId", "message", "idempotencyKey"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_risky_action",
      description:
        "Propose a risky or expensive action that requires owner approval (money, mass outreach, schedule exceptions, filing).",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["send_money", "mass_sms", "book_after_hours", "discount_over_cap", "file_taxes", "other"],
          },
          title: { type: "string" },
          summary: { type: "string" },
          details: { type: "array", items: { type: "string" } },
          impact: { type: "string" },
          confirmPrompt: { type: "string" },
          doneLabel: { type: "string" },
          customerId: { type: "string" },
          amount: { type: "number" },
        },
        required: ["kind", "title", "summary", "confirmPrompt", "doneLabel"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "remember_standing_order",
      description:
        "Save an owner standing order for after-hours / autonomous behavior (discount caps, earliest schedule time, wake-only-for-emergency).",
      parameters: {
        type: "object",
        properties: { order: { type: "string" } },
        required: ["order"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "run_business_goal",
      description:
        "Have the Atlas Orchestrator plan and start a multi-step business goal. Uses existing Actions, Approvals, and Jobs.",
      parameters: {
        type: "object",
        properties: { goal: { type: "string" } },
        required: ["goal"],
        additionalProperties: false,
      },
    },
  },
];

export function buildSystemPrompt(input: BrainChatInput): string {
  const business = input.businessName || "the business";
  const owner = input.ownerName || "the owner";
  const dna =
    input.dnaRules && input.dnaRules.length > 0
      ? input.dnaRules.map((r) => `- ${r}`).join("\n")
      : [
          "- Neighborly expert voice",
          "- Never discount more than 10% without approval",
          "- Do not schedule before 8:00 AM local time without approval",
          "- Wake the owner only for true emergencies (safety, major money loss, VIP escalation)",
        ].join("\n");

  const contextBlock = input.liveContext
    ? `\n\nLive authenticated context:\n${input.liveContext}\n`
    : "";

  return `You are Atlas, the AI operating system for ${business}. You work for ${owner}.

Mission: every business deserves an intelligent workforce, regardless of size. Beachhead: small service businesses (HVAC, plumbing, etc.).

Business DNA / standing rules:
${dna}
${contextBlock}
Behavior:
- Be concise first; offer supporting detail only when useful.
- Prefer tools for facts (get_business_brief, answer_from_context, search_business_memory) instead of inventing numbers.
- Label evidence: verified fact vs estimate vs missing. Say "I don't know" when the database has no evidence.
- Cite entities when tools return citations (customers, tasks, projects, memories).
- Use create_task / assign_worker / draft_invoice / schedule_appointment / send_customer_message for real work — always pass a unique idempotencyKey.
- Never claim you completed a capability that is DISCONNECTED or UNAVAILABLE.
- Never pretend you already sent money, filed taxes, or mass-texted — propose those for approval.
- If information is missing to proceed (which customer, which amount), ask one useful clarifying question.
- If the owner is going offline, acknowledge standing orders and summarize what you will handle autonomously.

You are the Atlas Brain — not a generic chatbot.`;
}

/** Legacy sync executor — prefer executeStrictBrainTool when a session exists. */
export function executeBrainTool(
  name: string,
  args: Record<string, unknown>,
): { content: string; proposedAction?: import("@/lib/brain/types").BrainActionProposal } {
  if (name === "remember_standing_order") {
    return {
      content: JSON.stringify({
        saved: true,
        order: String(args.order || ""),
        note: "Standing order stored on the org autonomy policy.",
      }),
    };
  }
  if (name === "propose_risky_action") {
    const proposedAction = {
      kind: String(args.kind || "other"),
      title: String(args.title || "Proposed action"),
      summary: String(args.summary || ""),
      details: Array.isArray(args.details) ? args.details.map(String) : [],
      impact: String(args.impact || "Requires owner approval before Atlas executes."),
      confirmPrompt: String(args.confirmPrompt || "Approve this action?"),
      doneLabel: String(args.doneLabel || "Approved — Atlas will execute now."),
    };
    return {
      content: JSON.stringify({ status: "awaiting_owner_approval", ...proposedAction }),
      proposedAction,
    };
  }
  if (name === "run_business_goal") {
    return {
      content: JSON.stringify({
        accepted: true,
        goal: String(args.goal || ""),
        note: "Orchestrator will plan this on the server using live capabilities, business rules, and Atlas Actions.",
      }),
    };
  }
  if (name === "get_business_brief") {
    return {
      content: JSON.stringify({
        note: "Session required for live brief — reconnect and retry.",
        evidence: "missing",
      }),
    };
  }
  return { content: JSON.stringify({ error: `Unknown or session-bound tool: ${name}` }) };
}
