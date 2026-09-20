/**
 * Live business context for the Atlas Brain — authenticated DB facts only.
 * Every claim is tagged verified | estimate | missing.
 */

import { hasPermission } from "@/lib/auth/permissions";
import type { SessionContext } from "@/lib/domain/types";
import { listAudit } from "@/lib/services/audit";
import { workspaceDashboard } from "@/lib/services/dashboard";
import { listCustomers, listOrgEvents, listOrgProjects, listOrgTasks, listOrgTransactions } from "@/lib/services/workspace";
import { searchUnifiedMemories } from "@/lib/memory/unified";
import { database } from "@/lib/services/access";

export type EvidenceLevel = "verified" | "estimate" | "missing";

export type ContextFact = {
  id: string;
  label: string;
  value: string;
  evidence: EvidenceLevel;
  citation?: { entityType: string; entityId: string; href?: string };
};

export type BusinessContextPack = {
  organizationId: string;
  generatedAt: string;
  facts: ContextFact[];
  memories: { id: string; content: string; confidence: number; accessLevel: string }[];
  missing: string[];
  summaryForPrompt: string;
};

export function buildBusinessContext(
  ctx: SessionContext,
  question?: string,
): BusinessContextPack {
  const dash = workspaceDashboard(ctx);
  const projects = listOrgProjects(ctx);
  const tasks = listOrgTasks(ctx);
  const customers = listCustomers(ctx);
  const events = listOrgEvents(ctx);
  const transactions = hasPermission(ctx, "payments.read") ? listOrgTransactions(ctx) : [];
  const audit = hasPermission(ctx, "audit.read") ? listAudit(ctx.organizationId).slice(0, 12) : [];
  const memories = searchUnifiedMemories(ctx, { query: question, minConfidence: 50 }).slice(0, 8);
  const jobs = database().jobs.filter((j) => j.organization_id === ctx.organizationId).slice(0, 5);

  const facts: ContextFact[] = [
    {
      id: "customers",
      label: "Customers",
      value: String(customers.length),
      evidence: "verified",
      citation: { entityType: "customers", entityId: ctx.organizationId, href: "/app/customers" },
    },
    {
      id: "projects",
      label: "Projects",
      value: String(projects.length),
      evidence: "verified",
      citation: { entityType: "projects", entityId: ctx.organizationId, href: "/app/projects" },
    },
    {
      id: "open_tasks",
      label: "Open tasks",
      value: String(tasks.filter((t) => t.status !== "completed").length),
      evidence: "verified",
      citation: { entityType: "tasks", entityId: ctx.organizationId, href: "/app/tasks" },
    },
    {
      id: "events_upcoming",
      label: "Calendar events on file",
      value: String(events.length),
      evidence: "verified",
      citation: { entityType: "calendar", entityId: ctx.organizationId, href: "/app/appointments" },
    },
    {
      id: "ledger_income",
      label: "Ledger income total",
      value: hasPermission(ctx, "payments.read")
        ? `$${transactions.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0).toLocaleString()}`
        : "hidden",
      evidence: hasPermission(ctx, "payments.read") ? "verified" : "missing",
    },
    {
      id: "kpi_provenance",
      label: "Dashboard provenance",
      value: dash.provenance,
      evidence: dash.provenance === "LIVE" ? "verified" : "estimate",
    },
    {
      id: "audit_tail",
      label: "Recent audit events",
      value: String(audit.length),
      evidence: hasPermission(ctx, "audit.read") ? "verified" : "missing",
    },
    {
      id: "jobs_queued",
      label: "Queued jobs",
      value: String(jobs.filter((j) => j.status === "queued").length),
      evidence: "verified",
    },
  ];

  const missing: string[] = [];
  if (!hasPermission(ctx, "payments.read")) missing.push("Financial ledger (role cannot read payments)");
  if (!customers.length) missing.push("No customers in the authenticated database yet");
  if (!projects.length) missing.push("No projects created yet");
  if (!memories.length && question) missing.push("No matching business memories for this question");

  // Inventory / communications remain client-local — honest missing signal.
  missing.push("Inventory counts are not on the server database yet");
  missing.push("Internal team chat threads are not on the server database yet");

  const lines = [
    `Org ${ctx.organizationId} context (${new Date().toISOString()}):`,
    ...facts.map((f) => `- [${f.evidence}] ${f.label}: ${f.value}${f.citation ? ` {${f.citation.entityType}}` : ""}`),
    memories.length
      ? `Memories:\n${memories.map((m) => `- (${m.confidence}%) ${m.content}`).join("\n")}`
      : "Memories: (none visible for this role)",
    missing.length ? `Missing:\n${missing.map((m) => `- ${m}`).join("\n")}` : "Missing: none flagged",
  ];

  return {
    organizationId: ctx.organizationId,
    generatedAt: new Date().toISOString(),
    facts,
    memories: memories.map((m) => ({
      id: m.id,
      content: m.content,
      confidence: m.confidence,
      accessLevel: m.accessLevel,
    })),
    missing,
    summaryForPrompt: lines.join("\n"),
  };
}

/** Format a concise owner-facing answer with evidence tags and citations. */
export function formatEvidenceAnswer(input: {
  headline: string;
  facts: ContextFact[];
  missing?: string[];
}): string {
  const body = input.facts
    .slice(0, 6)
    .map((f) => {
      const tag = f.evidence === "verified" ? "fact" : f.evidence === "estimate" ? "estimate" : "unknown";
      const cite = f.citation ? ` [${f.citation.entityType}]` : "";
      return `• (${tag}) ${f.label}: ${f.value}${cite}`;
    })
    .join("\n");
  const gaps =
    input.missing && input.missing.length
      ? `\n\nI don’t know / not on file:\n${input.missing.map((m) => `• ${m}`).join("\n")}`
      : "";
  return `${input.headline}\n\n${body}${gaps}`;
}

export type BrainEvidence = {
  source: "task" | "customer" | "calendar" | "transaction" | "document" | "memory" | "approval";
  id: string;
  label: string;
  snippet: string;
  updatedAt?: string;
  confidence: "verified" | "approved-memory";
};

export type BusinessContextResult = {
  organizationId: string;
  query: string;
  generatedAt: string;
  evidence: BrainEvidence[];
  gaps: string[];
  permissionFiltered: true;
};

function words(value: string) {
  return [...new Set(value.toLowerCase().match(/[a-z0-9$]+/g) || [])].filter((word) => word.length >= 3);
}

function score(query: string[], text: string) {
  if (!query.length) return 1;
  const haystack = text.toLowerCase();
  return query.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0);
}

function clip(value: unknown, max = 240) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Ranked, permission-filtered retrieval for a specific question.
 * Complements buildBusinessContext (KPI pack) — does not replace it.
 */
export function searchBusinessContext(ctx: SessionContext, query: string): BusinessContextResult {
  const db = database();
  const queryWords = words(query);
  const ranked: Array<BrainEvidence & { score: number }> = [];
  const projectsById = new Map(
    listOrgProjects(ctx).map((project) => [project.id, project.name] as const),
  );

  if (hasPermission(ctx, "tasks.read")) {
    for (const task of listOrgTasks(ctx)) {
      const projectName = task.projectId ? projectsById.get(task.projectId) || "" : "";
      const text = `${task.title} ${task.notes} ${task.status} ${task.priority} ${projectName} ${task.category}`;
      const rank = score(queryWords, text);
      if (rank) {
        ranked.push({
          source: "task",
          id: task.id,
          label: projectName ? `${projectName}: ${task.title}` : task.title,
          snippet: clip(`Status ${task.status}; priority ${task.priority}; ${task.notes || "No notes"}`),
          updatedAt: task.updatedAt,
          confidence: "verified",
          score: rank + (task.status === "blocked" ? 2 : 0) + (task.priority === "high" ? 1 : 0),
        });
      }
    }
  }

  if (hasPermission(ctx, "customers.read")) {
    for (const customer of listCustomers(ctx)) {
      const rank = score(queryWords, `${customer.name} ${customer.status} ${customer.email || ""}`);
      if (rank) {
        ranked.push({
          source: "customer",
          id: customer.id,
          label: customer.name,
          snippet: clip(`Customer status ${customer.status}${customer.email ? `; email ${customer.email}` : ""}`),
          updatedAt: customer.createdAt,
          confidence: "verified",
          score: rank,
        });
      }
    }
  }

  if (hasPermission(ctx, "calendar.read") && ctx.role !== "employee") {
    for (const event of listOrgEvents(ctx)) {
      const rank = score(queryWords, `${event.title} ${event.description || ""} ${event.location || ""}`);
      if (rank) {
        ranked.push({
          source: "calendar",
          id: event.id,
          label: event.title,
          snippet: clip(`${event.startTime}–${event.endTime}; ${event.location || "no location"}`),
          updatedAt: event.createdAt,
          confidence: "verified",
          score: rank,
        });
      }
    }
  }

  if (hasPermission(ctx, "payments.read")) {
    for (const transaction of listOrgTransactions(ctx)) {
      const rank = score(queryWords, `${transaction.label} ${transaction.category} ${transaction.kind}`);
      if (rank) {
        ranked.push({
          source: "transaction",
          id: transaction.id,
          label: transaction.label,
          snippet: clip(`${transaction.kind} $${Number(transaction.amount).toFixed(2)} on ${transaction.date}`),
          updatedAt: transaction.date,
          confidence: "verified",
          score: rank + (/overdue|past due/i.test(transaction.label) ? 2 : 0),
        });
      }
    }
  }

  if (ctx.role === "owner" || ctx.role === "admin" || ctx.role === "manager") {
    for (const document of db.documents.filter((row) => row.orgId === ctx.organizationId)) {
      const rank = score(queryWords, `${document.title} ${document.kind} ${document.content}`);
      if (rank) {
        ranked.push({
          source: "document",
          id: document.id,
          label: document.title,
          snippet: clip(document.content),
          updatedAt: document.updatedAt,
          confidence: "verified",
          score: rank,
        });
      }
    }
  }

  for (const memory of searchUnifiedMemories(ctx, { query, minConfidence: 40 }).slice(0, 12)) {
    if (!memory.approved) continue;
    ranked.push({
      source: "memory",
      id: memory.id,
      label: memory.title || "Memory",
      snippet: clip(memory.content),
      updatedAt: memory.updatedAt || memory.createdAt,
      confidence: "approved-memory",
      score: Math.max(1, Math.round(memory.confidence / 20)),
    });
  }

  if (ctx.role === "owner" || ctx.role === "admin" || ctx.role === "manager") {
    for (const approval of db.approvals.filter(
      (row) => row.organization_id === ctx.organizationId && row.status === "pending",
    )) {
      const title = String(approval.payload.title || approval.action_type);
      const summary = String(approval.payload.summary || approval.payload.body || "Owner decision required");
      const rank = score(queryWords, `${title} ${summary} ${approval.action_type}`);
      if (rank) {
        ranked.push({
          source: "approval",
          id: approval.id,
          label: title,
          snippet: clip(`Pending approval: ${summary}`),
          updatedAt: approval.created_at,
          confidence: "verified",
          score: rank + 1,
        });
      }
    }
  }

  const evidence = ranked
    .sort((a, b) => b.score - a.score || String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
    .slice(0, 10)
    .map(({ score: _score, ...item }) => item);

  return {
    organizationId: ctx.organizationId,
    query: clip(query, 500),
    generatedAt: new Date().toISOString(),
    evidence,
    gaps: evidence.length
      ? []
      : ["No matching verified records were found in the accessible business data."],
    permissionFiltered: true,
  };
}

