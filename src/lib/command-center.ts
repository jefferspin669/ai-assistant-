/** Command center context — attention, activity, alerts, and data sources for Talk to Atlas. */

import { loadDashboardSnapshot } from "@/lib/dashboard";
import { loadConfirmations, pendingCount } from "@/lib/confirmations";
import {
  isOpenTask,
  loadTeamMembers,
  loadTeamTasks,
  loadTimeOff,
  seedDemoTeamIfEmpty,
  todayISO,
} from "@/lib/user-workspace";
import { loadCompanyModel } from "@/lib/business-engine";
import { isDemoWorkspace } from "@/lib/workspace-mode";

export type CommandAlert = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  href: string;
};

export type CommandActivity = {
  id: string;
  timeLabel: string;
  title: string;
  href?: string;
};

export type DataSource = {
  id: string;
  label: string;
  status: "live" | "workspace" | "demo";
  detail: string;
};

export type SuggestedAction = {
  id: string;
  label: string;
  href: string;
};

export type AttentionSnapshot = {
  summary: string;
  bullets: string[];
  alerts: CommandAlert[];
};

export function loadTodayAttention(): AttentionSnapshot {
  if (!isDemoWorkspace()) {
    const today = todayISO();
    const tasks = loadTeamTasks();
    const members = loadTeamMembers();
    const timeOff = loadTimeOff();
    const overdue = tasks.filter((t) => isOpenTask(t.status) && t.dueDate && t.dueDate.slice(0, 10) < today);
    const pending = pendingCount(loadConfirmations());
    const bullets: string[] = [];
    if (overdue.length) bullets.push(`${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}`);
    if (pending) bullets.push(`${pending} approval${pending === 1 ? "" : "s"} waiting`);
    if (members.length === 0) bullets.push("No employees added — invite your team");
    const alerts: CommandAlert[] = [];
    if (overdue.length) {
      alerts.push({
        id: "overdue-tasks",
        severity: "high",
        title: `${overdue.length} overdue tasks`,
        detail: "Project and assign work before SLAs slip.",
        href: "/app/workforce?tab=tasks",
      });
    }
    if (pending) {
      alerts.push({
        id: "approvals",
        severity: "medium",
        title: `${pending} items need your approval`,
        detail: "Risky actions wait for owner sign-off.",
        href: "/app/approvals",
      });
    }
    const summary =
      bullets.length > 0
        ? bullets.join(" · ")
        : "Connect data or add your first records — no synthetic alerts in production mode.";
    return { summary, bullets, alerts };
  }

  seedDemoTeamIfEmpty();
  const today = todayISO();
  const tasks = loadTeamTasks();
  const members = loadTeamMembers();
  const timeOff = loadTimeOff();
  const overdue = tasks.filter((t) => isOpenTask(t.status) && t.dueDate && t.dueDate.slice(0, 10) < today);
  const offToday = timeOff.filter(
    (r) =>
      r.status === "approved" &&
      r.startDate <= today &&
      r.endDate >= today,
  );
  const offNames = offToday
    .map((r) => members.find((m) => m.id === r.memberId)?.name)
    .filter(Boolean);

  const model = loadCompanyModel();
  const snap = loadDashboardSnapshot();
  const pending = pendingCount(loadConfirmations());

  const bullets: string[] = [];
  if (overdue.length) bullets.push(`${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}`);
  if (offNames.length) bullets.push(`${offNames.length} employee${offNames.length === 1 ? "" : "s"} off today`);
  if (model.churn >= 4 && isDemoWorkspace()) bullets.push(`Customer churn at ${model.churn}% — watch retention`);
  if (pending) bullets.push(`${pending} approval${pending === 1 ? "" : "s"} waiting`);
  const meeting = snap.activity.find((a) => /meeting|sync|call/i.test(a.title));
  if (meeting) bullets.push(meeting.title.replace(/^Atlas /i, ""));

  const alerts: CommandAlert[] = [];
  if (overdue.length) {
    alerts.push({
      id: "overdue-tasks",
      severity: "high",
      title: `${overdue.length} overdue tasks`,
      detail: "Project and assign work before SLAs slip.",
      href: "/app/workforce?tab=tasks",
    });
  }
  if (offNames.length >= 2) {
    alerts.push({
      id: "coverage",
      severity: "medium",
      title: "Coverage may be thin today",
      detail: `${offNames.slice(0, 3).join(", ")}${offNames.length > 3 ? "…" : ""} off.`,
      href: "/app/time-off?tab=coverage",
    });
  }
  if (pending) {
    alerts.push({
      id: "approvals",
      severity: "medium",
      title: `${pending} items need your approval`,
      detail: "Risky actions wait for owner sign-off.",
      href: "/app/approvals",
    });
  }

  const summary =
    bullets.length > 0
      ? bullets.slice(0, 4).join(" · ")
      : "Operations look steady — nothing urgent on the radar.";

  return { summary, bullets, alerts };
}

export function loadCommandActivity(): CommandActivity[] {
  const snap = loadDashboardSnapshot();
  return snap.activity.slice(0, 8).map((a) => ({
    id: a.id,
    timeLabel: a.timeLabel,
    title: a.title,
  }));
}

export function loadCommandDataSources(): DataSource[] {
  const demo = isDemoWorkspace();
  return [
    { id: "workforce", label: "Workforce", status: demo ? "demo" : "workspace", detail: demo ? "Demo team" : "Your employees and tasks" },
    { id: "finance", label: "Finance", status: demo ? "demo" : "workspace", detail: demo ? "Demo model" : "Connect Stripe or banking" },
    { id: "calendar", label: "Calendar", status: "workspace", detail: "Meetings and shifts" },
    { id: "approvals", label: "Approvals", status: "live", detail: "Pending owner decisions" },
    { id: "brain", label: "Atlas Brain", status: "live", detail: "LLM or keyword fallback" },
  ];
}

export function loadSuggestedActions(): SuggestedAction[] {
  return [
    { id: "task", label: "Create task", href: "/app/workforce?tab=tasks" },
    { id: "meeting", label: "Schedule meeting", href: "/app/appointments" },
    { id: "message", label: "Message employee", href: "/app/messages" },
    { id: "simulate", label: "Run simulation", href: "/app/business-engine?tab=simulate" },
    { id: "approve", label: "Review approvals", href: "/app/approvals" },
    { id: "expense", label: "Scan receipt", href: "/app/purchasing?tab=scan" },
  ];
}
