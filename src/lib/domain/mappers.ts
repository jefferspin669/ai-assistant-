import type {
  CalendarEvent,
  Conversation,
  Customer,
  Message,
  Organization,
  Task,
  TaskStatus,
  Transaction,
  User,
} from "@/lib/domain/types";
import type {
  DbCalendarEvent,
  DbConversation,
  DbCustomer,
  DbOrganization,
  DbTask,
  DbTransaction,
  DbUser,
} from "@/lib/db/schema";

export function toUser(row: DbUser): User {
  return {
    id: row.id,
    email: row.email,
    name: row.full_name,
    imageUrl: row.profile_image,
    timezone: row.timezone,
    language: row.preferred_language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toOrganization(row: DbOrganization): Organization {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.business_name,
    logoUrl: row.logo_url,
    businessType: row.business_type,
    taxStructure: row.tax_structure,
    state: row.state,
    createdAt: row.created_at,
  };
}

export function toCustomer(row: DbCustomer): Customer {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    provenance: row.provenance,
  };
}

export function toTaskStatus(status: DbTask["status"] | string): TaskStatus {
  if (status === "doing" || status === "in_progress") return "in_progress";
  if (status === "done" || status === "completed") return "completed";
  if (status === "blocked") return "blocked";
  return "todo";
}

export function toDbTaskStatus(status: TaskStatus): DbTask["status"] {
  return status;
}

export function toTask(row: DbTask): Task {
  return {
    id: row.id,
    organizationId: row.orgId,
    userId: row.userId,
    title: row.title,
    notes: row.notes,
    status: toTaskStatus(row.status),
    priority: row.priority,
    dueDate: row.dueDate,
    category: row.category,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toCalendarEvent(row: DbCalendarEvent): CalendarEvent {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    timezone: row.timezone,
    categoryId: row.category_id,
    location: row.location,
    assignee: row.assignee ?? undefined,
    priority: row.priority,
    reminderTime: row.reminder_time,
    createdAt: row.created_at,
  };
}

export function toTransaction(row: DbTransaction): Transaction {
  return {
    id: row.id,
    organizationId: row.orgId,
    userId: row.userId,
    kind: row.kind,
    label: row.label,
    amount: row.amount,
    category: row.category ?? undefined,
    date: row.date,
    createdAt: row.createdAt,
  };
}

export function toConversation(row: DbConversation): Conversation {
  const messages: Message[] = row.messages.map((message, index) => ({
    id: `${row.id}_m${index}`,
    conversationId: row.id,
    role: message.role,
    text: message.text,
    createdAt: message.at,
  }));
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    preview: row.preview,
    messages,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
