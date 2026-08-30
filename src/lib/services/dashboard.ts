import { hasPermission } from "@/lib/auth/permissions";
import { listApprovals } from "@/lib/services/approvals";
import { listAudit } from "@/lib/services/audit";
import { database } from "@/lib/services/access";
import {
  listCustomers,
  listOrgEvents,
  listOrgTasks,
  listOrgTransactions,
} from "@/lib/services/workspace";
import type { SessionContext } from "@/lib/domain/types";

export function workspaceDashboard(ctx: SessionContext) {
  const customers = listCustomers(ctx);
  const tasks = listOrgTasks(ctx);
  const events = listOrgEvents(ctx);
  const transactions = hasPermission(ctx, "payments.read") ? listOrgTransactions(ctx) : [];
  const approvals = listApprovals(ctx).filter((row) => row.status === "pending");
  const notes = database().notifications.filter(
    (row) => row.userId === ctx.userId || row.organizationId === ctx.organizationId,
  );
  const today = new Date().toISOString().slice(0, 10);
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate.slice(0, 10) < today);
  const eventsToday = events.filter((event) => event.startTime.slice(0, 10) === today);
  const income = transactions.filter((row) => row.kind === "income").reduce((sum, row) => sum + row.amount, 0);
  const liveCustomers = customers.filter((row) => row.provenance === "LIVE").length;
  const provenance = liveCustomers > 0 ? ("LIVE" as const) : ("DEMO" as const);
  const findings = [
    overdue.length
      ? {
          id: "overdue-tasks",
          title: `${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}`,
          detail: overdue[0]?.title || "Open the board.",
          href: "/app/tasks",
          actionLabel: "Open tasks",
          stance: "SUGGEST" as const,
          source: provenance,
        }
      : null,
    eventsToday.length
      ? {
          id: "today-events",
          title: `${eventsToday.length} appointment${eventsToday.length === 1 ? "" : "s"} today`,
          detail: eventsToday[0]?.title || "Calendar",
          href: "/app/appointments",
          actionLabel: "Open calendar",
          stance: "OBSERVE" as const,
          source: provenance,
        }
      : null,
    approvals.length
      ? {
          id: "approvals",
          title: `${approvals.length} action${approvals.length === 1 ? "" : "s"} waiting`,
          detail: approvals[0]?.action_type || "Needs an owner.",
          href: "/app/approvals",
          actionLabel: "Review",
          stance: "APPROVE" as const,
          source: "LIVE" as const,
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => Boolean(row));

  return {
    provenance,
    kpis: [
      {
        id: "customers",
        label: "Customers",
        value: String(customers.length),
        detail: "From the workspace database",
        href: "/app/customers",
        source: provenance,
      },
      {
        id: "tasks",
        label: "Open tasks",
        value: String(openTasks.length),
        detail: `${overdue.length} overdue`,
        href: "/app/tasks",
        source: provenance,
      },
      {
        id: "calendar",
        label: "Today",
        value: String(eventsToday.length),
        detail: "Appointments on the org calendar",
        href: "/app/appointments",
        source: provenance,
      },
      {
        id: "revenue",
        label: "Recorded income",
        value: income.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
        detail: `${transactions.length} ledger rows`,
        href: "/app/money",
        source: provenance,
      },
    ],
    findings,
    approvals: approvals.map((row) => ({
      id: row.id,
      title: row.action_type,
      summary: `Requested ${row.created_at.slice(0, 10)}`,
      status: row.status,
    })),
    pendingApprovals: approvals.length,
    activity: listAudit(ctx.organizationId).slice(0, 12).map((row) => ({
      id: row.id,
      at: row.created_at,
      timeLabel: row.created_at.slice(11, 16),
      title: `${row.actor_label}: ${row.action}`,
      source: provenance,
    })),
    notifications: notes.slice(0, 12).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      read: row.read,
      createdAt: row.createdAt,
    })),
    counts: {
      customers: customers.length,
      openTasks: openTasks.length,
      eventsToday: eventsToday.length,
      income,
    },
  };
}
