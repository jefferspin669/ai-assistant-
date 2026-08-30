import type { BrainChatInput } from "@/lib/brain/types";

export const BRAIN_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_business_brief",
      description: "Get a short live brief of today’s revenue, schedule pressure, and open risks.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_risky_action",
      description:
        "Propose a risky or expensive action that requires owner approval before execution (money, mass outreach, schedule exceptions, filing).",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: [
              "send_money",
              "mass_sms",
              "book_after_hours",
              "discount_over_cap",
              "file_taxes",
              "other",
            ],
          },
          title: { type: "string" },
          summary: { type: "string" },
          details: { type: "array", items: { type: "string" } },
          impact: { type: "string" },
          confirmPrompt: { type: "string" },
          doneLabel: { type: "string" },
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
        properties: {
          order: { type: "string" },
        },
        required: ["order"],
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

  return `You are Atlas, the AI operating system for ${business}. You work for ${owner}.

Mission: every business deserves an intelligent workforce, regardless of size. Beachhead: small service businesses (HVAC, plumbing, etc.).

Business DNA / standing rules:
${dna}

Behavior:
- Be concise, operational, and concrete.
- Use tools when you need a brief or must propose a risky action.
- Never pretend you already sent money, filed taxes, or mass-texted — propose those for approval.
- If the owner is going offline, acknowledge standing orders and summarize what you will handle autonomously.
- Separate facts you know from estimates/suggestions.

You are the Atlas Brain — not a generic chatbot.`;
}

/** Deterministic tool executors used by both live and simulation paths. */
export function executeBrainTool(
  name: string,
  args: Record<string, unknown>,
): { content: string; proposedAction?: import("@/lib/brain/types").BrainActionProposal } {
  if (name === "get_business_brief") {
    return {
      content: JSON.stringify({
        yesterdayRevenue: 4280,
        openBookings: 9,
        cancellations: 2,
        overdueInvoices: 2310,
        nextSixDays: "fully scheduled",
        risks: ["license renewal in 9 days", "Alex overtime climbing"],
      }),
    };
  }

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

  return { content: JSON.stringify({ error: `Unknown tool: ${name}` }) };
}
