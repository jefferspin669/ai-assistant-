/** Sales coach — employee activity, coaching insights, manager goals. */

import { loadTeamMembers, seedDemoTeamIfEmpty } from "@/lib/user-workspace";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export type CoachingInsight = {
  id: string;
  employeeId: string;
  employeeName: string;
  kind: "objection" | "followup" | "close_rate" | "pipeline";
  message: string;
  detail: string;
  severity: "info" | "warn";
};

export type CoachingGoal = {
  id: string;
  employeeId: string;
  employeeName: string;
  goal: string;
  target: string;
  progress: string;
  assignedBy: string;
  createdAt: string;
};

const GOALS_KEY = "atlas-coach-goals-v1";

export function loadCoachingGoals(): CoachingGoal[] {
  return loadJson<CoachingGoal[]>(GOALS_KEY, []);
}

export function saveCoachingGoals(items: CoachingGoal[]) {
  saveJson(GOALS_KEY, items);
}

export function assignCoachingGoal(
  employeeId: string,
  employeeName: string,
  goal: string,
  target: string,
  assignedBy: string,
): CoachingGoal {
  const entry: CoachingGoal = {
    id: newId("goal"),
    employeeId,
    employeeName,
    goal,
    target,
    progress: "0%",
    assignedBy,
    createdAt: nowIso(),
  };
  saveCoachingGoals([entry, ...loadCoachingGoals()]);
  return entry;
}

export function coachingInsightsForEmployee(employeeId: string): CoachingInsight[] {
  seedDemoTeamIfEmpty();
  const member = loadTeamMembers().find((m) => m.id === employeeId);
  if (!member) return [];
  const name = member.name;
  return [
    {
      id: `ins-${employeeId}-1`,
      employeeId,
      employeeName: name,
      kind: "objection",
      message: "You lose the most deals after pricing discussions",
      detail: "3 of 5 lost deals in the last 30 days stalled after price was mentioned.",
      severity: "warn",
    },
    {
      id: `ins-${employeeId}-2`,
      employeeId,
      employeeName: name,
      kind: "followup",
      message: "Your follow-up time is 18 hours slower than the team average",
      detail: "Average first follow-up: 26h vs team 8h. Speed up post-call texts.",
      severity: "warn",
    },
    {
      id: `ins-${employeeId}-3`,
      employeeId,
      employeeName: name,
      kind: "close_rate",
      message: "Close rate improving on qualified leads",
      detail: "Win rate on qualified opps rose from 22% to 31% over 60 days.",
      severity: "info",
    },
  ];
}

export function teamCoachingSummary(): CoachingInsight[] {
  seedDemoTeamIfEmpty();
  return loadTeamMembers().flatMap((m) => coachingInsightsForEmployee(m.id).slice(0, 1));
}
