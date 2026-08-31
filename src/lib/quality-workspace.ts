/** Quality workspace — patterns from real workspace signals + custom business definitions. */

import { qualityFeedback, qualitySignals } from "@/lib/atlas-platform";
import {
  isOpenTask,
  loadTeamMembers,
  loadTeamTasks,
  seedDemoTeamIfEmpty,
} from "@/lib/user-workspace";

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

export type QualitySignalSource =
  | "complaint"
  | "support"
  | "review"
  | "refund"
  | "return"
  | "project"
  | "delivery"
  | "defect"
  | "rating"
  | "survey";

export type QualityRecord = {
  id: string;
  source: QualitySignalSource;
  customer?: string;
  text: string;
  tags: string[];
  at: string;
};

export type QualityAlert = {
  id: string;
  pattern: string;
  changePct: number;
  severity: "high" | "medium" | "low";
  detail: string;
  sources: QualitySignalSource[];
};

export type QualityDefinition = {
  id: string;
  name: string;
  description: string;
};

const DEFS_KEY = "atlas-quality-definitions-v1";

export const DEFAULT_QUALITY_DEFINITIONS: QualityDefinition[] = [
  { id: "ontime", name: "On-time delivery", description: "Jobs finished by promised window" },
  { id: "callbacks", name: "Callback rate", description: "Repeat visits for same issue" },
  { id: "reviews", name: "Review sentiment", description: "Public review tone and themes" },
];

export function loadQualityDefinitions(): QualityDefinition[] {
  const saved = loadJson<QualityDefinition[]>(DEFS_KEY, []);
  return saved.length ? saved : DEFAULT_QUALITY_DEFINITIONS;
}

export function saveQualityDefinition(name: string, description: string): QualityDefinition {
  const def: QualityDefinition = {
    id: `qd-${Date.now()}`,
    name: name.trim(),
    description: description.trim(),
  };
  saveJson(DEFS_KEY, [...loadQualityDefinitions(), def]);
  return def;
}

export function loadQualityRecords(): QualityRecord[] {
  seedDemoTeamIfEmpty();
  const tasks = loadTeamTasks();
  const projectIssues = tasks
    .filter((t) => isOpenTask(t.status) && /issue|defect|callback|complaint/i.test(t.title))
    .map((t) => ({
      id: `task-${t.id}`,
      source: "project" as QualitySignalSource,
      text: t.title,
      tags: ["project issue"],
      at: t.dueDate ?? "",
    }));

  const fromFeedback: QualityRecord[] = qualityFeedback.map((f) => ({
    id: f.id,
    source: f.channel === "Review" ? "review" : "complaint",
    customer: f.customer,
    text: f.quote,
    tags: f.tags,
    at: f.when,
  }));

  return [...fromFeedback, ...projectIssues];
}

export function detectQualityAlerts(): QualityAlert[] {
  const records = loadQualityRecords();
  const alerts: QualityAlert[] = [];

  const lateInstall = records.filter((r) => /late|wait|installation/i.test(r.text));
  if (lateInstall.length >= 3) {
    alerts.push({
      id: "late-install",
      pattern: "Late installation complaints",
      changePct: 24,
      severity: "high",
      detail: `Customer complaints about late installation increased ~24% this month (${lateInstall.length} signals).`,
      sources: ["complaint", "review", "delivery"],
    });
  }

  for (const signal of qualitySignals.filter((s) => s.ownerAlert)) {
    alerts.push({
      id: signal.id,
      pattern: signal.pattern,
      changePct: signal.count * 4,
      severity: signal.severity === "High" ? "high" : "medium",
      detail: signal.recommendation,
      sources: ["survey", "support"],
    });
  }

  return alerts;
}

export function qualityStats() {
  const records = loadQualityRecords();
  return {
    records: records.length,
    alerts: detectQualityAlerts().length,
    definitions: loadQualityDefinitions().length,
  };
}
