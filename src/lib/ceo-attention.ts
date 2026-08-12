/**
 * CEO "what needs my attention today" — one aggregator that safely pulls across
 * employees, customers, projects, finances, messages, and calendars.
 */
import { crmPredictions } from "./atlas-platform";
import { loadApprovalRequests } from "./surface-workspace";
import {
  announcementIsLive,
  announcementStats,
  bottleneckOf,
  computeManagerAlerts,
  isOpenTask,
  loadAnnouncements,
  loadCalEvents,
  loadTeamMembers,
  loadTeamTasks,
  pendingExpenses,
  todayISO,
} from "./user-workspace";

export type AttentionSeverity = "high" | "medium" | "low";
export type AttentionItem = { text: string; severity: AttentionSeverity; action?: string };
export type AttentionGroup = { category: string; emoji: string; items: AttentionItem[] };

function nameOf(members: { id: string; name: string }[], id: string): string {
  return members.find((m) => m.id === id)?.name ?? "An employee";
}

export function ceoAttention(now: number = Date.now()): AttentionGroup[] {
  const members = loadTeamMembers();
  const tasks = loadTeamTasks();
  const today = todayISO(new Date(now));
  const groups: AttentionGroup[] = [];

  // ── Employees ──────────────────────────────────────────────────────────
  const alerts = computeManagerAlerts(members, tasks, now);
  if (alerts.length) {
    groups.push({
      category: "Employees",
      emoji: "👥",
      items: alerts.slice(0, 4).map((a) => ({ text: a.detail, severity: a.severity, action: a.kind === "approval" ? "Open Approval Inbox" : undefined })),
    });
  }

  // ── Finances & approvals ───────────────────────────────────────────────
  const fin: AttentionItem[] = [];
  for (const r of loadApprovalRequests().filter((x) => x.status === "pending")) {
    fin.push({ text: `${r.title} — requested by ${r.requestedBy}${r.reason ? ` (${r.reason})` : ""}`, severity: r.priority === "urgent" ? "high" : "medium", action: "Review in Approval Inbox" });
  }
  for (const e of pendingExpenses()) {
    fin.push({ text: `Expense $${e.amount.toFixed(2)} from ${nameOf(members, e.memberId)} awaiting approval`, severity: "medium", action: "Approve / Reject" });
  }
  fin.push({ text: "Dallas Expansion is projected $41,000 over budget", severity: "high", action: "See the simulation" });
  groups.push({ category: "Finances & approvals", emoji: "💰", items: fin.slice(0, 5) });

  // ── Projects ───────────────────────────────────────────────────────────
  const proj: AttentionItem[] = [];
  const open = tasks.filter((t) => isOpenTask(t.status));
  const overdue = open.filter((t) => t.dueDate && t.dueDate < today);
  if (overdue.length) proj.push({ text: `${overdue.length} task${overdue.length === 1 ? "" : "s"} overdue across the team`, severity: "high" });
  for (const t of open.filter((t) => (t.dependsOn ?? []).length > 0)) {
    const bn = bottleneckOf(t, tasks);
    if (bn) proj.push({ text: `“${t.title}” is blocked by “${bn.title}” (${nameOf(members, bn.memberId)})`, severity: "medium" });
  }
  if (proj.length) groups.push({ category: "Projects", emoji: "🗂️", items: proj.slice(0, 4) });

  // ── Customers ──────────────────────────────────────────────────────────
  if (crmPredictions.length) {
    groups.push({ category: "Customers", emoji: "🏢", items: crmPredictions.slice(0, 3).map((c) => ({ text: `${c.customer} — ${c.signal}`, severity: "medium" as AttentionSeverity, action: "Draft outreach" })) });
  }

  // ── Messages & announcements ───────────────────────────────────────────
  const msg: AttentionItem[] = [];
  for (const a of loadAnnouncements().filter((x) => announcementIsLive(x, now))) {
    const s = announcementStats(a);
    if (s.audience > 0 && s.unread > 0) msg.push({ text: `“${a.title}”: ${s.unread} of ${s.audience} haven't read it`, severity: a.priority === "critical" ? "high" : "medium", action: "Remind unread" });
  }
  if (msg.length) groups.push({ category: "Messages", emoji: "💬", items: msg.slice(0, 3) });

  // ── Calendar ───────────────────────────────────────────────────────────
  const tomorrow = todayISO(new Date(now + 864e5));
  const events = loadCalEvents().filter((e) => e.date === today || e.date === tomorrow);
  if (events.length) {
    groups.push({ category: "Calendar", emoji: "📅", items: events.slice(0, 4).map((e) => ({ text: `${e.date === today ? "Today" : "Tomorrow"}${e.time ? ` ${e.time}` : ""} — ${e.title}`, severity: "low" as AttentionSeverity })) });
  }

  return groups.filter((g) => g.items.length > 0);
}

/** A one-line spoken summary of the attention briefing. */
export function attentionSummary(groups: AttentionGroup[]): string {
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) return "Good news — nothing needs your attention right now.";
  const highs = groups.flatMap((g) => g.items).filter((i) => i.severity === "high");
  const parts = groups.map((g) => `${g.items.length} in ${g.category.toLowerCase()}`);
  const lead = `Here's what needs your attention today: ${parts.join(", ")}.`;
  const top = highs[0] ? ` Most urgent: ${highs[0].text}.` : "";
  return lead + top;
}
