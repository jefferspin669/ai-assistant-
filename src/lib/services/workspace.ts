import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from "@/lib/domain/errors";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/services/audit";
import { toCalendarEvent, toCustomer, toDbTaskStatus, toTask, toTransaction } from "@/lib/domain/mappers";
import type {
  CalendarEvent,
  Customer,
  CustomerStatus,
  SessionContext,
  Task,
  TaskPriority,
  TaskStatus,
  Transaction,
} from "@/lib/domain/types";
import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { DbCustomer, DbTask } from "@/lib/db/schema";
import { emitEvent } from "@/lib/events/bus";
import { database, requireCustomer, requireEvent, requireOrgMember, requireTask } from "@/lib/services/access";
import { listEmployees } from "@/lib/services/employees";

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

function employeeIdForSession(ctx: SessionContext): string | null {
  const match = listEmployees(ctx.organizationId).find(
    (e) => e.userId === ctx.userId || e.email === database().users.find((u) => u.id === ctx.userId)?.email,
  );
  return match?.id ?? null;
}

export function listOrgTasks(ctx: SessionContext): Task[] {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "tasks.read");
  let rows = db.tasks.filter((row) => row.orgId === ctx.organizationId);
  // Field workers only see work assigned to them.
  if (ctx.role === "employee" || ctx.role === "viewer") {
    const empId = employeeIdForSession(ctx);
    rows = rows.filter(
      (row) =>
        (empId && row.assigneeEmployeeId === empId) ||
        row.assigneeUserId === ctx.userId ||
        row.userId === ctx.userId,
    );
  }
  return rows.map(toTask);
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
    projectLabel?: string;
    assigneeEmployeeId?: string;
  },
): Task {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "tasks.write");

  let assigneeEmployeeId: string | null = input.assigneeEmployeeId?.trim() || null;
  let assigneeUserId: string | null = null;
  if (assigneeEmployeeId) {
    if (!hasPermission(ctx, "employees.manage") && ctx.role !== "manager" && ctx.role !== "owner" && ctx.role !== "admin") {
      throw new AuthorizationError("Only owners/managers can assign work to employees.");
    }
    const worker = listEmployees(ctx.organizationId).find((e) => e.id === assigneeEmployeeId);
    if (!worker) throw new ValidationError("assigneeEmployeeId is not a worker in this organization.");
    assigneeUserId = worker.userId;
  }

  const stamp = nowIso();
  const projectLabel = input.projectLabel?.trim() || null;
  const row: DbTask = {
    id: newId("task"),
    orgId: ctx.organizationId,
    userId: ctx.userId,
    title: input.title.trim(),
    notes: input.notes?.trim() || "",
    status: toDbTaskStatus(input.status || "todo"),
    priority: input.priority || "normal",
    dueDate: input.dueDate ?? null,
    category: input.category?.trim() || (projectLabel ? "Project" : "General"),
    projectLabel,
    assigneeEmployeeId,
    assigneeUserId,
    createdAt: stamp,
    updatedAt: stamp,
  };
  saveDatabase({ ...db, tasks: [row, ...db.tasks] });
  writeAudit(ctx, {
    action: assigneeEmployeeId
      ? `created project task assigned to ${assigneeEmployeeId}`
      : "created task",
    entityType: "task",
    entityId: row.id,
  });
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
      | "projectLabel"
      | "assigneeEmployeeId"
      | "assigneeUserId"
    >
  >,
): Task {
  const db = database();
  const existing = requireTask(db, ctx, taskId);
  requirePermission(ctx, "tasks.write");

  const empId = employeeIdForSession(ctx);
  const isAssignee =
    (empId && existing.assigneeEmployeeId === empId) || existing.assigneeUserId === ctx.userId;
  const canManage = hasPermission(ctx, "employees.manage") || ctx.role === "manager" || ctx.role === "owner" || ctx.role === "admin";
  if (ctx.role === "employee" && !isAssignee) {
    throw new AuthorizationError("You can only update tasks assigned to you.");
  }
  if (ctx.role === "employee" && patch.assigneeEmployeeId !== undefined) {
    throw new AuthorizationError("Workers cannot reassign tasks.");
  }

  let assigneeEmployeeId =
    patch.assigneeEmployeeId === undefined ? existing.assigneeEmployeeId ?? null : patch.assigneeEmployeeId;
  let assigneeUserId = existing.assigneeUserId ?? null;
  if (patch.assigneeEmployeeId !== undefined) {
    if (!canManage) throw new AuthorizationError("Only owners/managers can assign work.");
    if (assigneeEmployeeId) {
      const worker = listEmployees(ctx.organizationId).find((e) => e.id === assigneeEmployeeId);
      if (!worker) throw new ValidationError("assigneeEmployeeId is not a worker in this organization.");
      assigneeUserId = worker.userId;
    } else {
      assigneeUserId = null;
    }
  } else if (isAssignee && empId && !assigneeUserId) {
    // Bind the worker's user id on first update after login.
    assigneeUserId = ctx.userId;
  }

  const prevStatus = toTask(existing).status;
  const nextStatus = patch.status ? toDbTaskStatus(patch.status) : existing.status;
  const next: DbTask = {
    ...existing,
    title: patch.title?.trim() || existing.title,
    notes: patch.notes ?? existing.notes,
    status: nextStatus,
    priority: patch.priority || existing.priority,
    dueDate: patch.dueDate === undefined ? existing.dueDate : patch.dueDate,
    category: patch.category ?? existing.category,
    projectLabel:
      patch.projectLabel === undefined ? existing.projectLabel ?? null : patch.projectLabel,
    assigneeEmployeeId,
    assigneeUserId,
    updatedAt: nowIso(),
  };
  saveDatabase({
    ...db,
    tasks: db.tasks.map((row) => (row.id === taskId ? next : row)),
  });

  const mapped = toTask(next);
  if (mapped.status !== prevStatus) {
    writeAudit(ctx, {
      action:
        mapped.status === "completed"
          ? `completed project task${next.projectLabel ? ` (${next.projectLabel})` : ""}`
          : `updated task status to ${mapped.status}`,
      entityType: "task",
      entityId: next.id,
    });
  }
  if (patch.assigneeEmployeeId !== undefined && canManage) {
    writeAudit(ctx, {
      action: `assigned task to ${assigneeEmployeeId || "unassigned"}`,
      entityType: "task",
      entityId: next.id,
    });
  }
  return mapped;
}

export function deleteOrgTask(ctx: SessionContext, taskId: string): { id: string } {
  const db = database();
  requireTask(db, ctx, taskId);
  requirePermission(ctx, "tasks.write");
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
