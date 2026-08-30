import { parseAtlasAction, type AtlasAction } from "@/lib/domain/schemas";
import { NotFoundError, ValidationError } from "@/lib/domain/errors";
import type { CalendarEvent, Customer, SessionContext, Task } from "@/lib/domain/types";
import {
  createCustomer,
  createCustomerScopedEvent,
  createOrgTask,
  moveOrgEvent,
  updateOrgTask,
} from "@/lib/services/workspace";
import { createApproval, listApprovals, requiresApproval } from "@/lib/services/approvals";
import { enqueueJob } from "@/lib/services/jobs";
import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import { database, requireCustomer } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";
import { requirePermission } from "@/lib/auth/permissions";

export type AtlasActionResult =
  | { type: "CREATE_TASK"; task: Task; requiresApproval?: false }
  | { type: "UPDATE_TASK"; task: Task; requiresApproval?: false }
  | { type: "CREATE_APPOINTMENT"; event: CalendarEvent; requiresApproval?: false }
  | { type: "MOVE_APPOINTMENT"; event: CalendarEvent; requiresApproval?: false }
  | { type: "CREATE_CUSTOMER"; customer: Customer; requiresApproval?: false }
  | {
      type: "SEND_MESSAGE" | "CREATE_QUOTE" | "REQUEST_PAYMENT" | "REFUND_CUSTOMER";
      queued: true;
      requiresApproval: true;
      approvalId: string;
    };

export function decodeAtlasAction(input: unknown): AtlasAction {
  try {
    return parseAtlasAction(input);
  } catch {
    throw new ValidationError("Atlas cannot execute unknown or malformed actions.");
  }
}

export function executeApprovedAction(action: AtlasAction, ctx: SessionContext): AtlasActionResult {
  switch (action.type) {
    case "CREATE_TASK":
      requirePermission(ctx, "tasks.write");
      return {
        type: "CREATE_TASK",
        task: createOrgTask(ctx, {
          title: action.payload.title,
          dueDate: action.payload.dueDate ?? null,
        }),
      };
    case "UPDATE_TASK":
      requirePermission(ctx, "tasks.write");
      return {
        type: "UPDATE_TASK",
        task: updateOrgTask(ctx, action.payload.taskId, {
          title: action.payload.title,
          status: action.payload.status,
          dueDate: action.payload.dueDate,
        }),
      };
    case "CREATE_APPOINTMENT":
      requirePermission(ctx, "calendar.write");
      return {
        type: "CREATE_APPOINTMENT",
        event: createCustomerScopedEvent(ctx, action.payload),
      };
    case "MOVE_APPOINTMENT":
      requirePermission(ctx, "calendar.write");
      return {
        type: "MOVE_APPOINTMENT",
        event: moveOrgEvent(ctx, action.payload),
      };
    case "CREATE_CUSTOMER":
      requirePermission(ctx, "customers.write");
      return { type: "CREATE_CUSTOMER", customer: createCustomer(ctx, action.payload) };
    case "SEND_MESSAGE": {
      requireCustomer(database(), ctx, action.payload.customerId);
      enqueueJob(ctx, "send_message", { ...action.payload, userId: ctx.userId });
      writeAudit(ctx, {
        action: "Atlas sent customer message",
        entityType: "customer",
        entityId: action.payload.customerId,
      });
      return {
        type: "SEND_MESSAGE",
        queued: true,
        requiresApproval: true,
        approvalId: "executed",
      };
    }
    case "CREATE_QUOTE": {
      const db = database();
      requireCustomer(db, ctx, action.payload.customerId);
      const quote = {
        id: newId("quote"),
        organization_id: ctx.organizationId,
        customer_id: action.payload.customerId,
        amount: action.payload.amount,
        status: "draft" as const,
        created_at: nowIso(),
      };
      saveDatabase({ ...db, quotes: [quote, ...db.quotes] });
      writeAudit(ctx, { action: "created quote", entityType: "quote", entityId: quote.id });
      return {
        type: "CREATE_QUOTE",
        queued: true,
        requiresApproval: true,
        approvalId: quote.id,
      };
    }
    case "REQUEST_PAYMENT":
    case "REFUND_CUSTOMER": {
      requirePermission(ctx, "payments.refund");
      requireCustomer(database(), ctx, action.payload.customerId);
      enqueueJob(ctx, action.type.toLowerCase(), { ...action.payload, userId: ctx.userId });
      writeAudit(ctx, {
        action: action.type === "REFUND_CUSTOMER" ? "refunded customer" : "requested payment",
        entityType: "customer",
        entityId: action.payload.customerId,
      });
      return {
        type: action.type,
        queued: true,
        requiresApproval: true,
        approvalId: "executed",
      };
    }
  }
}

export function executeAtlasAction(input: unknown, ctx: SessionContext): AtlasActionResult {
  const action = decodeAtlasAction(input);
  if (requiresApproval(action.type, ctx)) {
    const approval = createApproval(ctx, action);
    return {
      type: action.type as "SEND_MESSAGE" | "CREATE_QUOTE" | "REQUEST_PAYMENT" | "REFUND_CUSTOMER",
      queued: true,
      requiresApproval: true,
      approvalId: approval.id,
    };
  }
  return executeApprovedAction(action, ctx);
}

export function resolveApproval(ctx: SessionContext, approvalId: string, decision: "approved" | "rejected") {
  requirePermission(ctx, "payments.refund");
  const db = database();
  const row = db.approvals.find(
    (item) => item.id === approvalId && item.organization_id === ctx.organizationId,
  );
  if (!row) throw new NotFoundError("Approval not found.");
  if (row.status !== "pending") throw new ValidationError("Approval already resolved.");
  saveDatabase({
    ...db,
    approvals: db.approvals.map((item) =>
      item.id === approvalId ? { ...item, status: decision, resolved_at: nowIso() } : item,
    ),
  });
  writeAudit(ctx, {
    action: `${decision} ${row.action_type}`,
    entityType: "approval",
    entityId: row.id,
  });
  if (decision === "rejected") return { approval: { ...row, status: decision }, result: null };
  const action = decodeAtlasAction({ type: row.action_type, payload: row.payload });
  return { approval: { ...row, status: decision }, result: executeApprovedAction(action, ctx) };
}

export { listApprovals };
