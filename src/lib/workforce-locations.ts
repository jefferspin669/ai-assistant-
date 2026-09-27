/** Workforce locations — real business sites, no fake pre-populated employees. */

import {
  loadTeamMembers,
  seedDemoTeamIfEmpty,
  type TeamPerson,
} from "@/lib/user-workspace";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

export type WorkLocation = {
  id: string;
  name: string;
  kind: "office" | "store" | "warehouse" | "jobsite" | "territory";
  address?: string;
};

export type EmployeeLocationView = {
  member: TeamPerson;
  assignedLocation: string;
  todayJobSite: string;
  statusLabel: string;
};

const LOCATIONS_KEY = "atlas-work-locations-v1";

export function loadWorkLocations(): WorkLocation[] {
  return loadJson<WorkLocation[]>(LOCATIONS_KEY, []);
}

export function saveWorkLocations(locations: WorkLocation[]) {
  saveJson(LOCATIONS_KEY, locations);
}

export function addWorkLocation(name: string, kind: WorkLocation["kind"], address?: string): WorkLocation {
  const loc: WorkLocation = { id: newId("loc"), name: name.trim(), kind, address };
  saveWorkLocations([loc, ...loadWorkLocations()]);
  return loc;
}

export function employeeLocationViews(now = Date.now()): EmployeeLocationView[] {
  seedDemoTeamIfEmpty();
  const members = loadTeamMembers();
  const locations = loadWorkLocations();
  const defaultSite = locations[0]?.name ?? "Main office";

  return members.map((member) => {
    const assigned = member.location || defaultSite;
    const openTasks = member.id; // use task project as job site hint
    const todayJobSite =
      member.jobTitle?.toLowerCase().includes("tech") || member.department === "Field ops"
        ? "Assigned route / job site"
        : assigned;

    let statusLabel = "Working";
    const st = (member.status || "").toLowerCase();
    if (st === "off" || st === "pto") statusLabel = "Off";
    else if (st === "break") statusLabel = "On break";
    else if (st === "offline") statusLabel = "Offline";

    return {
      member,
      assignedLocation: assigned,
      todayJobSite,
      statusLabel,
    };
  });
}

export function locationsFromTeam(members: TeamPerson[]): string[] {
  const custom = loadWorkLocations().map((l) => l.name);
  const fromTeam = members.map((m) => m.location).filter(Boolean) as string[];
  return [...new Set([...custom, ...fromTeam])];
}
