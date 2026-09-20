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
