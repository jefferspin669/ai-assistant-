/** Atlas Database schema — mirrors the product architecture tree. */

export type DbUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type DbOrganization = {
  id: string;
  ownerUserId: string;
  name: string;
  industry: string;
  createdAt: string;
};

export type DbEvent = {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  categoryId: string;
  color: string;
  start: string;
  end: string;
  notes: string;
};

export type DbTask = {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "normal" | "high";
  dueDate: string | null;
  category: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type DbTransaction = {
  id: string;
  orgId: string;
  userId: string;
  kind: "income" | "expense";
  label: string;
  amount: number;
  category: string;
  date: string;
  receiptName: string | null;
  createdAt: string;
};

export type DbTaxRecord = {
  id: string;
  orgId: string;
  userId: string;
  year: number;
  grossIncome: number;
  expenses: number;
  estimatedTax: number;
  status: "draft" | "estimated" | "filed";
  updatedAt: string;
};

export type DbConversation = {
  id: string;
  userId: string;
  title: string;
  preview: string;
  messages: { role: "user" | "ai"; text: string; at: string }[];
  updatedAt: string;
  createdAt: string;
};

export type DbMemory = {
  id: string;
  userId: string;
  kind: "preference" | "prompt" | "person" | "project" | "long-term";
  title: string;
  content: string;
  approved: boolean;
  createdAt: string;
};

export type DbDocument = {
  id: string;
  userId: string;
  orgId: string;
  title: string;
  kind: "file" | "document" | "conversation" | "template";
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type DbSubscription = {
  id: string;
  orgId: string;
  plan: "free" | "pro" | "business" | "enterprise";
  status: "active" | "trialing" | "past_due" | "canceled";
  renewsAt: string;
  seats: number;
};

export type DbNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type AtlasDatabase = {
  users: DbUser[];
  organizations: DbOrganization[];
  events: DbEvent[];
  tasks: DbTask[];
  transactions: DbTransaction[];
  taxRecords: DbTaxRecord[];
  conversations: DbConversation[];
  memories: DbMemory[];
  documents: DbDocument[];
  subscriptions: DbSubscription[];
  notifications: DbNotification[];
};

export const DB_TABLES = [
  "Users",
  "Organizations",
  "Events",
  "Tasks",
  "Transactions",
  "Tax Records",
  "Conversations",
  "Memories",
  "Documents",
  "Subscriptions",
] as const;
