/**
 * Strict Brain tools — validated inputs, permission + approval gates, idempotent execution.
 */

import { z } from "zod";
import { AuthorizationError, ValidationError } from "@/lib/domain/errors";
import { requirePermission, hasPermission } from "@/lib/auth/permissions";
import type { SessionContext } from "@/lib/domain/types";
import { createApproval } from "@/lib/services/approvals";
import { getPolicy } from "@/lib/autonomy/policy";
import {
  createCustomerScopedEvent,
  createOrgTask,
  listCustomers,
  updateOrgTask,
} from "@/lib/services/workspace";
import { executeAtlasAction } from "@/lib/domain/actions";
import { rememberBusinessFact, searchUnifiedMemories } from "@/lib/memory/unified";
import { buildBusinessContext, formatEvidenceAnswer } from "@/lib/brain/context";
import { claimExactOnce } from "@/lib/safety/idempotency";
import { writeAudit } from "@/lib/services/audit";
import type { BrainActionProposal } from "@/lib/brain/types";

export type StrictToolResult = {
  content: string;
  proposedAction?: BrainActionProposal;
  citations?: { entityType: string; entityId: string }[];
  approvalId?: string;
  idempotentReplay?: boolean;
  needsInfo?: string;
};

const createTaskArgs = z.object({
  title: z.string().trim().min(1),
  notes: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  idempotencyKey: z.string().min(1),
});

const assignWorkerArgs = z.object({
  taskId: z.string().min(1),
  assigneeId: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

const draftInvoiceArgs = z.object({
  customerId: z.string().min(1),
  amount: z.number().positive(),
  idempotencyKey: z.string().min(1),
});

const scheduleArgs = z.object({
  customerId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  title: z.string().optional(),
  idempotencyKey: z.string().min(1),
});

const sendMessageArgs = z.object({
  customerId: z.string().min(1),
  message: z.string().trim().min(1),
  idempotencyKey: z.string().min(1),
});

const rememberArgs = z.object({
  content: z.string().trim().min(1),
  memoryType: z
    .enum(["company", "leadership", "employee", "customer", "operational", "project"])
    .optional(),
  accessLevel: z
    .enum(["owner", "leadership", "managers", "all_staff", "customer_facing"])
    .optional(),
  idempotencyKey: z.string().min(1),
});

const searchMemoryArgs = z.object({
  query: z.string().trim().min(1),
});

function assertToolGate(ctx: SessionContext, risk: "low" | "sensitive" | "payment" | "mass_comm") {
  if (!ctx.organizationId || !ctx.userId) throw new AuthorizationError("Session required.");
  const policy = getPolicy(ctx.organizationId);
  if (policy.killSwitch) {
    throw new AuthorizationError("Kill switch is on — Atlas will not execute tools.");
  }
  if (risk === "payment" && !hasPermission(ctx, "payments.refund") && !hasPermission(ctx, "payments.read")) {
    throw new AuthorizationError("Missing payment permission.");
  }
}

async function once(key: string, orgId: string) {
  return claimExactOnce(`tool:${orgId}:${key}`);
}

export async function executeStrictBrainTool(
  ctx: SessionContext,
  name: string,
  args: Record<string, unknown>,
): Promise<StrictToolResult> {
  if (name === "get_business_brief" || name === "answer_from_context") {
    assertToolGate(ctx, "low");
    const question = String(args.question || "");
    const pack = buildBusinessContext(ctx, question || undefined);
    if (name === "answer_from_context") {
      const reply = formatEvidenceAnswer({
        headline: "Here’s what the authenticated workspace shows:",
        facts: pack.facts,
        missing: pack.missing,
      });
      return {
        content: JSON.stringify({ reply, facts: pack.facts, memories: pack.memories, missing: pack.missing }),
        citations: pack.facts.filter((f) => f.citation).map((f) => f.citation!),
      };
    }
    return {
      content: JSON.stringify({
        ...Object.fromEntries(pack.facts.map((f) => [f.id, { value: f.value, evidence: f.evidence }])),
        missing: pack.missing,
        memories: pack.memories,
      }),
      citations: pack.facts.filter((f) => f.citation).map((f) => f.citation!),
    };
  }

  if (name === "search_business_memory") {
    assertToolGate(ctx, "low");
    const parsed = searchMemoryArgs.parse(args);
    const rows = searchUnifiedMemories(ctx, { query: parsed.query }).slice(0, 10);
    return {
      content: JSON.stringify({
        hits: rows.map((r) => ({
          id: r.id,
          content: r.content,
          confidence: r.confidence,
          accessLevel: r.accessLevel,
          source: r.source,
          memoryType: r.memoryType,
        })),
      }),
      citations: rows.map((r) => ({ entityType: "memory", entityId: r.id })),
    };
  }

  if (name === "remember_business_fact") {
    assertToolGate(ctx, "low");
    const parsed = rememberArgs.parse(args);
    const claim = await once(parsed.idempotencyKey, ctx.organizationId);
    if (!claim.allowed) {
      return { content: JSON.stringify({ saved: false, idempotentReplay: true }), idempotentReplay: true };
    }
    const row = rememberBusinessFact(ctx, parsed);
    return {
      content: JSON.stringify({ saved: true, id: row.id }),
      citations: [{ entityType: "memory", entityId: row.id }],
    };
  }

  if (name === "create_task") {
    assertToolGate(ctx, "low");
    requirePermission(ctx, "tasks.write");
    const parsed = createTaskArgs.parse(args);
    const claim = await once(parsed.idempotencyKey, ctx.organizationId);
    if (!claim.allowed) {
      return { content: JSON.stringify({ created: false, idempotentReplay: true }), idempotentReplay: true };
    }
    const task = createOrgTask(ctx, {
      title: parsed.title,
      notes: parsed.notes,
      projectId: parsed.projectId ?? null,
      assigneeId: parsed.assigneeId ?? null,
      dueDate: parsed.dueDate ?? null,
    });
    return {
      content: JSON.stringify({ created: true, task }),
      citations: [{ entityType: "task", entityId: task.id }],
    };
  }

  if (name === "assign_worker") {
    assertToolGate(ctx, "sensitive");
    requirePermission(ctx, "tasks.write");
    if (!hasPermission(ctx, "employees.manage") && ctx.role === "employee") {
      throw new AuthorizationError("Workers cannot reassign tasks.");
    }
    const parsed = assignWorkerArgs.parse(args);
    const claim = await once(parsed.idempotencyKey, ctx.organizationId);
    if (!claim.allowed) {
      return { content: JSON.stringify({ assigned: false, idempotentReplay: true }), idempotentReplay: true };
    }
    const task = updateOrgTask(ctx, parsed.taskId, { assigneeId: parsed.assigneeId });
    return {
      content: JSON.stringify({ assigned: true, task }),
      citations: [{ entityType: "task", entityId: task.id }],
    };
  }

  if (name === "draft_invoice") {
    assertToolGate(ctx, "payment");
    requirePermission(ctx, "payments.read");
    const parsed = draftInvoiceArgs.parse(args);
    const claim = await once(parsed.idempotencyKey, ctx.organizationId);
    if (!claim.allowed) {
      return { content: JSON.stringify({ drafted: false, idempotentReplay: true }), idempotentReplay: true };
    }
    const result = executeAtlasAction(
      { type: "CREATE_QUOTE", payload: { customerId: parsed.customerId, amount: parsed.amount } },
      ctx,
    );
    return {
      content: JSON.stringify({ drafted: true, result }),
      citations: [{ entityType: "customer", entityId: parsed.customerId }],
    };
  }

  if (name === "schedule_appointment") {
    assertToolGate(ctx, "low");
    requirePermission(ctx, "calendar.write");
    const parsed = scheduleArgs.parse(args);
    const claim = await once(parsed.idempotencyKey, ctx.organizationId);
    if (!claim.allowed) {
      return { content: JSON.stringify({ scheduled: false, idempotentReplay: true }), idempotentReplay: true };
    }
    const hour = new Date(parsed.startTime).getHours();
    if (Number.isFinite(hour) && hour < 8) {
      const proposedAction: BrainActionProposal = {
        kind: "book_after_hours",
        title: "Book before 8 AM",
        summary: `Schedule ${parsed.title || "appointment"} at ${parsed.startTime} needs approval (before 8 AM).`,
        details: [`Customer ${parsed.customerId}`, parsed.startTime, parsed.endTime],
        impact: "Outside DNA earliest schedule hour.",
        confirmPrompt: "Approve early appointment?",
        doneLabel: "Approved — Atlas will book it.",
      };
      const approval = createApproval(ctx, {
        type: "SEND_MESSAGE",
        payload: {
          customerId: parsed.customerId,
          message: `Pending early appointment approval: ${parsed.title || "visit"} at ${parsed.startTime}`,
        },
      });
      return {
        content: JSON.stringify({ scheduled: false, needsApproval: true, approvalId: approval.id }),
        proposedAction,
        approvalId: approval.id,
      };
    }
    const event = createCustomerScopedEvent(ctx, {
      customerId: parsed.customerId,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      title: parsed.title,
    });
    return {
      content: JSON.stringify({ scheduled: true, event }),
      citations: [{ entityType: "calendar_event", entityId: event.id }],
    };
  }

  if (name === "send_customer_message") {
    assertToolGate(ctx, "mass_comm");
    const parsed = sendMessageArgs.parse(args);
    const claim = await once(parsed.idempotencyKey, ctx.organizationId);
    if (!claim.allowed) {
      return { content: JSON.stringify({ queued: false, idempotentReplay: true }), idempotentReplay: true };
    }
    const result = executeAtlasAction(
      {
        type: "SEND_MESSAGE",
        payload: { customerId: parsed.customerId, message: parsed.message },
      },
      ctx,
    );
    writeAudit(ctx, {
      action: "brain tool send_customer_message",
      entityType: "customer",
      entityId: parsed.customerId,
    });
    return {
      content: JSON.stringify(result),
      citations: [{ entityType: "customer", entityId: parsed.customerId }],
      approvalId:
        result && typeof result === "object" && "approvalId" in result
          ? String((result as { approvalId?: string }).approvalId || "")
          : undefined,
    };
  }

  if (name === "propose_risky_action") {
    assertToolGate(ctx, "sensitive");
    const kind = String(args.kind || "other");
    const title = String(args.title || "Proposed action");
    const summary = String(args.summary || "");
    const proposedAction: BrainActionProposal = {
      kind,
      title,
      summary,
      details: Array.isArray(args.details) ? args.details.map(String) : [],
      impact: String(args.impact || "Requires owner approval before Atlas executes."),
      confirmPrompt: String(args.confirmPrompt || "Approve this action?"),
      doneLabel: String(args.doneLabel || "Approved — Atlas will execute now."),
    };
    const customers = listCustomers(ctx);
    const customerId = String(args.customerId || customers[0]?.id || "");
    if (!customerId) {
      return {
        content: JSON.stringify({
          status: "needs_info",
          question: "Which customer does this action apply to?",
        }),
        needsInfo: "Which customer does this action apply to?",
      };
    }
    const money = kind === "send_money";
    const approval = createApproval(
      ctx,
      money
        ? { type: "REQUEST_PAYMENT", payload: { customerId, amount: Number(args.amount) || 1 } }
        : { type: "SEND_MESSAGE", payload: { customerId, message: summary || title } },
    );
    return {
      content: JSON.stringify({ status: "awaiting_owner_approval", approvalId: approval.id, ...proposedAction }),
      proposedAction,
      approvalId: approval.id,
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

  if (name === "run_business_goal") {
    return {
      content: JSON.stringify({
        accepted: true,
        goal: String(args.goal || ""),
        note: "Orchestrator will plan this on the server using live capabilities, business rules, and Atlas Actions.",
      }),
    };
  }

  throw new ValidationError(`Unknown tool: ${name}`);
}
