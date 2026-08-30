/** Public domain types. Components and API clients use these — not DB column names. */

export type DataProvenance = "LIVE" | "CONNECTED DATA" | "DEMO";

export type User = {
  id: string;
  email: string;
  name: string;
  imageUrl: string | null;
  timezone: string;
  language: string;
  createdAt: string;
  updatedAt: string;
};

export type Organization = {
  id: string;
  ownerId: string;
  name: string;
  logoUrl: string | null;
  businessType: string;
  taxStructure: string;
  state: string;
  createdAt: string;
};

export type CustomerStatus = "lead" | "active" | "inactive";

export type Customer = {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  status: CustomerStatus;
  createdAt: string;
  provenance?: DataProvenance;
};

export type TaskStatus = "todo" | "in_progress" | "blocked" | "completed";
export type TaskPriority = "low" | "normal" | "high";

export type Task = {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
  provenance?: DataProvenance;
};

export type EventPriority = "low" | "normal" | "high";

export type CalendarEvent = {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  categoryId: string;
  location: string;
  assignee?: string;
  priority: EventPriority;
  reminderTime: string | null;
  createdAt: string;
  provenance?: DataProvenance;
};

export type TransactionKind = "income" | "expense";

export type Transaction = {
  id: string;
  organizationId: string;
  userId: string;
  kind: TransactionKind;
  label: string;
  amount: number;
  category?: string;
  date: string;
  createdAt: string;
  provenance?: DataProvenance;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type AgentStatus = "active" | "paused";

export type Agent = {
  id: string;
  organizationId: string;
  name: string;
  role: string;
  status: AgentStatus;
};

export type Automation = {
  id: string;
  organizationId: string;
  name: string;
  enabled: boolean;
  trigger: string;
  createdAt: string;
};

export type MessageRole = "user" | "ai";

export type Message = {
  id: string;
  conversationId: string;
  role: MessageRole;
  text: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  userId: string;
  title: string;
  preview: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export type OrgRole = "owner" | "admin" | "manager" | "employee" | "accountant" | "viewer";

export type Permission =
  | "customers.read"
  | "customers.write"
  | "tasks.read"
  | "tasks.write"
  | "calendar.read"
  | "calendar.write"
  | "payments.read"
  | "payments.refund"
  | "employees.manage"
  | "atlas.autonomous"
  | "audit.read";

export type SessionContext = {
  userId: string;
  organizationId: string;
  role: OrgRole;
  sessionId: string;
};
