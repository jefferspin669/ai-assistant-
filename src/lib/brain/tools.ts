import type { BrainChatInput } from "@/lib/brain/types";
import type { SessionContext } from "@/lib/domain/types";
import { loadDatabase } from "@/lib/db/store";
import {
  ACTION_SMS,
  stageActionApproval,
  stageBrainActionApproval,
} from "@/lib/services/action-confirmations";

export const BRAIN_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_business_brief",
      description: "Get a short live brief of today’s revenue, schedule pressure, and open risks from this organization's real data.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_risky_action",
      description:
        "Propose a risky or expensive action that requires owner approval before execution (money, mass outreach, schedule exceptions, filing). Stages a server-side approval card.",
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
          to: {
            type: "string",
            description: "Phone number for SMS proposals (E.164). Required for mass_sms when known.",
          },
          body: {
            type: "string",
            description: "SMS body for mass_sms proposals.",
          },
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
  {
    type: "function" as const,
    function: {
      name: "run_business_goal",
      description:
        "Have the Atlas Orchestrator plan and start a multi-step business goal (collect an overdue invoice, recover a missed call, etc.). Uses existing Actions, Approvals, and Jobs. Does not invent capabilities Atlas cannot perform.",
      parameters: {
        type: "object",
        properties: {
          goal: { type: "string", description: "The owner's goal in plain language." },
        },
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

  return `You are Atlas, the AI operating system for ${business}. You work for ${owner}.

Mission: every business deserves an intelligent workforce, regardless of size. Beachhead: small service businesses (HVAC, plumbing, etc.).

Business DNA / standing rules:
${dna}

Behavior:
- Be concise, operational, and concrete.
- Use tools when you need a brief, must propose a risky action, or should run a multi-step business goal through the Orchestrator.
- Never claim you completed a capability that is DISCONNECTED or UNAVAILABLE.
- Never pretend you already sent money, filed taxes, or mass-texted — propose those for approval.
- If the owner is going offline, acknowledge standing orders and summarize what you will handle autonomously.
- Separate facts you know from estimates/suggestions.
- Prefer get_business_brief over inventing numbers.

You are the Atlas Brain — not a generic chatbot.`;
}

function buildLiveBusinessBrief(organizationId: string) {
  const db = loadDatabase();
  const customers = db.customers.filter((c) => c.organization_id === organizationId);
  const tasks = db.tasks.filter((t) => t.orgId === organizationId);
  const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "completed");
  const events = db.calendar_events.filter((e) => e.organization_id === organizationId);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const upcoming = events.filter((e) => {
    const start = new Date(e.start_time).getTime();
    return start >= now && start <= now + 7 * dayMs;
  });
  const today = events.filter((e) => {
    const start = new Date(e.start_time);
    const d = new Date();
    return start.toDateString() === d.toDateString();
  });
  const txns = db.transactions.filter((t) => t.orgId === organizationId);
  const income30 = txns
    .filter((t) => t.kind === "income")
    .filter((t) => {
      const age = now - new Date(t.date).getTime();
      return age >= 0 && age <= 30 * dayMs;
    })
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const overdueInvoices = txns.filter(
    (t) => t.kind === "income" && /overdue/i.test(t.label || ""),
  );
  const overdueTotal = overdueInvoices.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const pendingApprovals = db.approvals.filter(
    (a) => a.organization_id === organizationId && a.status === "pending",
  ).length;
  const activeCustomers = customers.filter((c) => c.status === "active" || c.status === "lead").length;

  return {
    source: "organization_database",
    organizationId,
    revenueLast30Days: Math.round(income30),
    overdueInvoiceTotal: Math.round(overdueTotal),
    overdueInvoiceCount: overdueInvoices.length,
    openTasks: openTasks.length,
    bookingsToday: today.length,
    bookingsNext7Days: upcoming.length,
    customers: activeCustomers,
    pendingApprovals,
    risks: [
      overdueTotal > 0 ? `$${Math.round(overdueTotal).toLocaleString()} in overdue invoices` : null,
      openTasks.filter((t) => t.priority === "high").length
        ? `${openTasks.filter((t) => t.priority === "high").length} high-priority open tasks`
        : null,
      pendingApprovals ? `${pendingApprovals} approvals waiting` : null,
    ].filter(Boolean),
  };
}

/** Deterministic tool executors used by both live and simulation paths. */
export function executeBrainTool(
  name: string,
  args: Record<string, unknown>,
  ctx?: SessionContext | null,
): { content: string; proposedAction?: import("@/lib/brain/types").BrainActionProposal } {
  if (name === "get_business_brief") {
    if (!ctx?.organizationId) {
      return {
        content: JSON.stringify({
          error: "organizationId required — sign in to load a live business brief.",
        }),
      };
    }
    return { content: JSON.stringify(buildLiveBusinessBrief(ctx.organizationId)) };
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
    const kind = String(args.kind || "other");
    const proposedAction = {
      kind,
      title: String(args.title || "Proposed action"),
      summary: String(args.summary || ""),
      details: Array.isArray(args.details) ? args.details.map(String) : [],
      impact: String(args.impact || "Requires owner approval before Atlas executes."),
      confirmPrompt: String(args.confirmPrompt || "Approve this action?"),
      doneLabel: String(args.doneLabel || "Approved — Atlas will execute now."),
    };
    let approvalId: string | undefined;
    if (ctx?.organizationId && ctx.userId) {
      // SMS proposals stage the executable SEND_SMS rail so approval runs Twilio.
      if (kind === "mass_sms") {
        const db = loadDatabase();
        const to =
          String(args.to || "").trim() ||
          db.customers.find((c) => c.organization_id === ctx.organizationId && c.phone)?.phone ||
          "";
        const body =
          String(args.body || "").trim() ||
          proposedAction.summary ||
          "Quick update from Atlas — reply if you need anything.";
        if (to) {
          const approval = stageActionApproval(ctx, ACTION_SMS, {
            to,
            body,
            title: proposedAction.title,
            source: "atlas_brain",
            kind,
          });
          approvalId = approval.id;
          return {
            content: JSON.stringify({
              status: "awaiting_owner_approval",
              approvalId,
              actionType: ACTION_SMS,
              to,
              ...proposedAction,
            }),
            proposedAction: { ...proposedAction, approvalId },
          };
        }
      }
      const approval = stageBrainActionApproval(ctx, proposedAction);
      approvalId = approval.id;
    }
    return {
      content: JSON.stringify({
        status: "awaiting_owner_approval",
        approvalId,
        ...proposedAction,
      }),
      proposedAction: { ...proposedAction, approvalId },
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

  return { content: JSON.stringify({ error: `Unknown tool: ${name}` }) };
}
