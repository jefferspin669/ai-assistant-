import { ConflictError, NotFoundError, ValidationError } from "@/lib/domain/errors";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/services/audit";
import { toCalendarEvent, toCustomer, toDbTaskStatus, toTask, toTransaction } from "@/lib/domain/mappers";
import type {
  CalendarEvent,
  Customer,
  CustomerStatus,
  Project,
  ProjectStatus,
  SessionContext,
  Task,
  TaskPriority,
  TaskStatus,
  Transaction,
} from "@/lib/domain/types";
import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { DbCustomer, DbProject, DbTask } from "@/lib/db/schema";
import { emitEvent } from "@/lib/events/bus";
import { database, requireCustomer, requireEvent, requireOrgMember, requireTask } from "@/lib/services/access";
import {
  assertWorkerCanUpdateTask,
  canManageProjectTasks,
  workerCanReadTask,
} from "@/lib/rules/engine";
import { createApproval } from "@/lib/services/approvals";

function toProject(row: DbProject): Project {
  return {
    id: row.id,
    organizationId: row.orgId,
    name: row.name,
    description: row.description,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function listCustomers(ctx: SessionContext): Customer[] {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "customers.read");
  return db.customers
    .filter((row) => row.organization_id === ctx.organizationId)
    .map(toCustomer);
}

export function createCustomer(
  ctx: SessionContext,
  input: { name: string; email?: string; phone?: string; status?: CustomerStatus },
): Customer {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "customers.write");
  const email = input.email?.trim().toLowerCase();
  if (email && db.customers.some((row) => row.organization_id === ctx.organizationId && row.email === email)) {
    throw new ConflictError("A customer with that email already exists.");
  }
  const row: DbCustomer = {
    id: newId("cust"),
    organization_id: ctx.organizationId,
    name: input.name.trim(),
    email: email || null,
    phone: input.phone?.trim() || null,
    status: input.status || "lead",
    created_at: nowIso(),
    provenance: "LIVE",
  };
  saveDatabase({ ...db, customers: [row, ...db.customers] });
  writeAudit(ctx, { action: "created customer", entityType: "customer", entityId: row.id });
  emitEvent({
    type: "customer.created",
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    payload: { id: row.id, name: row.name, email: row.email, phone: row.phone, status: row.status },
  });
  return toCustomer(row);
}

export function deleteCustomer(ctx: SessionContext, customerId: string): { id: string } {
  const db = database();
  requireCustomer(db, ctx, customerId);
  requirePermission(ctx, "customers.write");
  saveDatabase({
    ...db,
    customers: db.customers.filter((row) => row.id !== customerId),
  });
  writeAudit(ctx, { action: "deleted customer", entityType: "customer", entityId: customerId });
  return { id: customerId };
}

export function listOrgProjects(ctx: SessionContext): Project[] {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "tasks.read");
  return db.projects.filter((row) => row.orgId === ctx.organizationId).map(toProject);
}

export function createOrgProject(
  ctx: SessionContext,
  input: { name: string; description?: string; status?: ProjectStatus },
): Project {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "tasks.write");
  if (!canManageProjectTasks(ctx.role)) {
    throw new ValidationError("Only owners, admins, or managers can create projects.");
  }
  const stamp = nowIso();
  const row: DbProject = {
    id: newId("proj"),
    orgId: ctx.organizationId,
    name: input.name.trim(),
    description: input.description?.trim() || "",
    status: input.status || "active",
    createdBy: ctx.userId,
    createdAt: stamp,
    updatedAt: stamp,
  };
  saveDatabase({ ...db, projects: [row, ...db.projects] });
  writeAudit(ctx, { action: "created project", entityType: "project", entityId: row.id });
  return toProject(row);
}

export function listOrgTasks(ctx: SessionContext): Task[] {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "tasks.read");
  return db.tasks
    .filter((row) => row.orgId === ctx.organizationId && workerCanReadTask(ctx, row))
    .map(toTask);
}

export function createOrgTask(
  ctx: SessionContext,
  input: {
    title: string;
    notes?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
    category?: string;
    projectId?: string | null;
    assigneeId?: string | null;
    customerId?: string | null;
    notifyOnComplete?: boolean;
  },
): Task {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "tasks.write");
  if (!canManageProjectTasks(ctx.role)) {
    throw new ValidationError("Workers cannot create tasks — ask an owner or manager to assign work.");
  }
  if (input.projectId) {
    const project = db.projects.find(
      (row) => row.id === input.projectId && row.orgId === ctx.organizationId,
    );
    if (!project) throw new NotFoundError("Project not found.");
  }
  if (input.assigneeId) {
    const member = db.organization_members.find(
      (row) =>
        row.user_id === input.assigneeId &&
        row.organization_id === ctx.organizationId &&
        row.status === "active",
    );
    if (!member) throw new ValidationError("Assignee must be an active organization member.");
  }
  if (input.customerId) requireCustomer(db, ctx, input.customerId);
  const stamp = nowIso();
  const row: DbTask = {
    id: newId("task"),
    orgId: ctx.organizationId,
    userId: ctx.userId,
    projectId: input.projectId ?? null,
    assigneeId: input.assigneeId ?? null,
    title: input.title.trim(),
    notes: input.notes?.trim() || "",
    status: toDbTaskStatus(input.status || "todo"),
    priority: input.priority || "normal",
    dueDate: input.dueDate ?? null,
    category: input.category?.trim() || "General",
    customerId: input.customerId ?? null,
    notifyOnComplete: Boolean(input.notifyOnComplete),
    createdAt: stamp,
    updatedAt: stamp,
  };
  saveDatabase({ ...db, tasks: [row, ...db.tasks] });
  writeAudit(ctx, { action: "created task", entityType: "task", entityId: row.id });
  return toTask(row);
}

export function updateOrgTask(
  ctx: SessionContext,
  taskId: string,
  patch: Partial<
    Pick<
      Task,
      | "title"
      | "notes"
      | "status"
      | "priority"
      | "dueDate"
      | "category"
      | "projectId"
      | "assigneeId"
      | "customerId"
      | "notifyOnComplete"
    >
  >,
): Task {
  const db = database();
  const existing = requireTask(db, ctx, taskId);
  requirePermission(ctx, "tasks.write");
  assertWorkerCanUpdateTask(ctx, existing);

  // Workers may only change status/notes — not reassign or move projects.
  if (!canManageProjectTasks(ctx.role)) {
    const forbidden =
      patch.assigneeId !== undefined ||
      patch.projectId !== undefined ||
      patch.customerId !== undefined ||
      patch.notifyOnComplete !== undefined ||
      patch.title !== undefined;
    if (forbidden) {
      throw new ValidationError("Workers can only update status and notes on assigned tasks.");
    }
  }

  if (patch.assigneeId) {
    const member = db.organization_members.find(
      (row) =>
        row.user_id === patch.assigneeId &&
        row.organization_id === ctx.organizationId &&
        row.status === "active",
    );
    if (!member) throw new ValidationError("Assignee must be an active organization member.");
  }
  if (patch.customerId) requireCustomer(db, ctx, patch.customerId);

  const next: DbTask = {
    ...existing,
    title: patch.title?.trim() || existing.title,
    notes: patch.notes ?? existing.notes,
    status: patch.status ? toDbTaskStatus(patch.status) : existing.status,
    priority: patch.priority || existing.priority,
    dueDate: patch.dueDate === undefined ? existing.dueDate : patch.dueDate,
    category: patch.category ?? existing.category,
    projectId: patch.projectId === undefined ? existing.projectId : patch.projectId,
    assigneeId: patch.assigneeId === undefined ? existing.assigneeId : patch.assigneeId,
    customerId: patch.customerId === undefined ? existing.customerId : patch.customerId,
    notifyOnComplete:
      patch.notifyOnComplete === undefined ? existing.notifyOnComplete : patch.notifyOnComplete,
    updatedAt: nowIso(),
  };
  saveDatabase({
    ...db,
    tasks: db.tasks.map((row) => (row.id === taskId ? next : row)),
  });
  writeAudit(ctx, { action: "updated task", entityType: "task", entityId: taskId });

  const completed =
    toTask(next).status === "completed" && toTask(existing).status !== "completed";
  if (completed && next.notifyOnComplete && next.customerId) {
    createApproval(ctx, {
      type: "SEND_MESSAGE",
      payload: {
        customerId: next.customerId,
        message: `Atlas: work on “${next.title}” is complete. Reply if you need anything else.`,
        taskId: next.id,
      },
    });
    writeAudit(ctx, {
      action: "requested customer notification approval",
      entityType: "task",
      entityId: next.id,
    });
  }

  return toTask(next);
}

export function deleteOrgTask(ctx: SessionContext, taskId: string): { id: string } {
  const db = database();
  const existing = requireTask(db, ctx, taskId);
  requirePermission(ctx, "tasks.write");
  if (!canManageProjectTasks(ctx.role)) {
    throw new ValidationError("Workers cannot delete tasks.");
  }
  void existing;
  saveDatabase({
    ...db,
    tasks: db.tasks.filter((row) => row.id !== taskId),
  });
  writeAudit(ctx, { action: "deleted task", entityType: "task", entityId: taskId });
  return { id: taskId };
}

export function listOrgEvents(ctx: SessionContext): CalendarEvent[] {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "calendar.read");
  return db.calendar_events
    .filter((row) => row.organization_id === ctx.organizationId)
    .map(toCalendarEvent);
}

export function createCustomerScopedEvent(
  ctx: SessionContext,
  input: { customerId: string; startTime: string; endTime: string; title?: string; assignee?: string },
): CalendarEvent {
  const db = database();
  const customer = requireCustomer(db, ctx, input.customerId);
  requirePermission(ctx, "calendar.write");
  const event = {
    id: newId("evt"),
    user_id: ctx.userId,
    organization_id: ctx.organizationId,
    title: input.title?.trim() || `${customer.name}`,
    description: "",
    start_time: input.startTime,
    end_time: input.endTime,
    timezone: "America/Chicago",
    category_id: "work",
    location: "",
    assignee: input.assignee ?? null,
    priority: "normal" as const,
    reminder_time: null,
    recurring_rule: null,
    external_calendar_id: null,
    created_at: nowIso(),
  };
  saveDatabase({ ...db, calendar_events: [event, ...db.calendar_events] });
  writeAudit(ctx, { action: "created appointment", entityType: "calendar_event", entityId: event.id });
  emitEvent({
    type: "appointment.created",
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    payload: { id: event.id, title: event.title, startTime: event.start_time, customerId: input.customerId },
  });
  return toCalendarEvent(event);
}

export function createOrgEvent(
  ctx: SessionContext,
  input: {
    title: string;
    startTime: string;
    endTime: string;
    description?: string;
    timezone?: string;
    categoryId?: string;
    location?: string;
    assignee?: string;
    priority?: "low" | "normal" | "high";
    reminderTime?: string | null;
  },
): CalendarEvent {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "calendar.write");
  const event = {
    id: newId("evt"),
    user_id: ctx.userId,
    organization_id: ctx.organizationId,
    title: input.title.trim(),
    description: input.description || "",
    start_time: input.startTime,
    end_time: input.endTime,
    timezone: input.timezone || "America/Chicago",
    category_id: input.categoryId || "work",
    location: input.location || "",
    assignee: input.assignee ?? null,
    priority: input.priority || ("normal" as const),
    reminder_time: input.reminderTime ?? null,
    recurring_rule: null,
    external_calendar_id: null,
    created_at: nowIso(),
  };
  saveDatabase({ ...db, calendar_events: [event, ...db.calendar_events] });
  writeAudit(ctx, { action: "created appointment", entityType: "calendar_event", entityId: event.id });
  emitEvent({
    type: "appointment.created",
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    payload: { id: event.id, title: event.title, startTime: event.start_time },
  });
  return toCalendarEvent(event);
}

export function moveOrgEvent(
  ctx: SessionContext,
  input: { eventId: string; startTime: string; endTime: string },
): CalendarEvent {
  const db = database();
  const existing = requireEvent(db, ctx, input.eventId);
  requirePermission(ctx, "calendar.write");
  const next = {
    ...existing,
    start_time: input.startTime,
    end_time: input.endTime,
  };
  saveDatabase({
    ...db,
    calendar_events: db.calendar_events.map((row) => (row.id === input.eventId ? next : row)),
  });
  return toCalendarEvent(next);
}

export function deleteOrgEvent(ctx: SessionContext, eventId: string): { id: string } {
  const db = database();
  const existing = requireEvent(db, ctx, eventId);
  requirePermission(ctx, "calendar.write");
  saveDatabase({
    ...db,
    calendar_events: db.calendar_events.filter((row) => row.id !== eventId),
  });
  writeAudit(ctx, { action: "deleted appointment", entityType: "calendar_event", entityId: eventId });
  emitEvent({
    type: "appointment.cancelled",
    organizationId: ctx.organizationId,
    actorId: ctx.userId,
    payload: { id: existing.id, title: existing.title, startTime: existing.start_time },
  });
  return { id: eventId };
}

export function createOrgTransaction(
  ctx: SessionContext,
  input: {
    kind: "income" | "expense";
    label: string;
    amount: number;
    category?: string;
    date: string;
  },
): Transaction {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "payments.read");
  const duplicate = db.transactions.find(
    (row) =>
      row.orgId === ctx.organizationId &&
      row.label === input.label.trim() &&
      row.amount === input.amount &&
      row.date === input.date &&
      row.kind === input.kind,
  );
  if (duplicate) throw new ConflictError("Duplicate transaction is not inserted.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new ValidationError("Amount must be a positive number.");
  }
  const row = {
    id: newId("txn"),
    orgId: ctx.organizationId,
    userId: ctx.userId,
    kind: input.kind,
    label: input.label.trim(),
    amount: input.amount,
    category: input.category?.trim() || null,
    date: input.date,
    receiptName: null,
    createdAt: nowIso(),
  };
  saveDatabase({ ...db, transactions: [row, ...db.transactions] });
  return toTransaction(row);
}

export function listOrgTransactions(ctx: SessionContext): Transaction[] {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "payments.read");
  return db.transactions.filter((row) => row.orgId === ctx.organizationId).map(toTransaction);
}
