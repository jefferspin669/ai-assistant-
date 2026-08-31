/** Route optimization — stops, traffic-aware ordering, vehicle capacity, employee availability. */

import { isDemoWorkspace } from "@/lib/workspace-mode";
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

export type RouteStop = {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  priority: number;
  windowStart: string;
  windowEnd: string;
  units: number;
  customerId?: string;
  jobId?: string;
  employeeId?: string;
  driveMinutes?: number;
  eta?: string;
  order?: number;
};

export type RoutePlan = {
  id: string;
  vehicleCapacity: number;
  employeeId: string;
  employeeName: string;
  stops: RouteStop[];
  totalDriveMinutes: number;
  milesSaved: number;
  trafficNote: string;
  optimizedAt: string;
};

const STOPS_KEY = "atlas-route-stops-v1";
const PLAN_KEY = "atlas-route-plan-v1";

const SEED_STOPS: RouteStop[] = [
  {
    id: "stop-depot",
    label: "Depot",
    address: "1200 Industrial Blvd, Summit",
    lat: 40.7128,
    lng: -74.006,
    priority: 0,
    windowStart: "07:00",
    windowEnd: "18:00",
    units: 0,
  },
  {
    id: "stop-1",
    label: "Johnson HVAC install",
    address: "48 Oak Lane, Summit",
    lat: 40.718,
    lng: -74.012,
    priority: 3,
    windowStart: "09:00",
    windowEnd: "12:00",
    units: 2,
    customerId: "cust-johnson",
    jobId: "job-101",
  },
  {
    id: "stop-2",
    label: "Brookdale filter delivery",
    address: "220 Brookdale Ave, Summit",
    lat: 40.715,
    lng: -74.02,
    priority: 2,
    windowStart: "10:00",
    windowEnd: "14:00",
    units: 1,
    customerId: "cust-brookdale",
  },
  {
    id: "stop-3",
    label: "Martinez service call",
    address: "15 River Rd, Summit",
    lat: 40.722,
    lng: -74.008,
    priority: 4,
    windowStart: "11:00",
    windowEnd: "15:00",
    units: 1,
    jobId: "job-203",
  },
  {
    id: "stop-4",
    label: "Warehouse parts pickup",
    address: "900 Commerce St, Summit",
    lat: 40.708,
    lng: -74.015,
    priority: 1,
    windowStart: "08:00",
    windowEnd: "17:00",
    units: 3,
  },
];

export function loadRouteStops(): RouteStop[] {
  const saved = loadJson<RouteStop[]>(STOPS_KEY, []);
  if (saved.length) return saved;
  return isDemoWorkspace() ? SEED_STOPS : [];
}

export function saveRouteStops(stops: RouteStop[]) {
  saveJson(STOPS_KEY, stops);
}

export function addRouteStop(input: Omit<RouteStop, "id">): RouteStop {
  const stop: RouteStop = { ...input, id: newId("stop") };
  saveRouteStops([...loadRouteStops(), stop]);
  return stop;
}

export function removeRouteStop(id: string) {
  saveRouteStops(loadRouteStops().filter((s) => s.id !== id));
}

function distance(a: RouteStop, b: RouteStop): number {
  const dlat = a.lat - b.lat;
  const dlng = a.lng - b.lng;
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

/** Simulated traffic multiplier — production uses live traffic API when connected. */
export function trafficMultiplier(): number {
  const hour = new Date().getHours();
  if (hour >= 7 && hour <= 9) return 1.35;
  if (hour >= 16 && hour <= 18) return 1.28;
  return 1.05;
}

export function employeeAvailable(employeeId: string): boolean {
  seedDemoTeamIfEmpty();
  return loadTeamMembers().some((m) => m.id === employeeId);
}

export function optimizeRoute(
  employeeId: string,
  vehicleCapacity: number,
): RoutePlan {
  seedDemoTeamIfEmpty();
  const member = loadTeamMembers().find((m) => m.id === employeeId);
  const stops = loadRouteStops();
  const depot = stops.find((s) => s.priority === 0) ?? stops[0];
  const jobStops = stops.filter((s) => s.id !== depot?.id);
  const traffic = trafficMultiplier();

  const sorted = [...jobStops].sort((a, b) => b.priority - a.priority);
  const ordered: RouteStop[] = [depot];
  let current = depot;
  const remaining = [...sorted];
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distance(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = next;
  }

  let totalUnits = 0;
  let totalDrive = 0;
  const withEta: RouteStop[] = [];
  let clockMinutes = 8 * 60;

  for (let i = 0; i < ordered.length; i++) {
    const stop = ordered[i];
    if (i > 0) {
      const drive = Math.round(distance(ordered[i - 1], stop) * 120 * traffic);
      totalDrive += drive;
      clockMinutes += drive;
    }
    totalUnits += stop.units;
    const h = Math.floor(clockMinutes / 60);
    const m = clockMinutes % 60;
    const eta = `${h}:${m.toString().padStart(2, "0")}`;
    clockMinutes += 25;
    withEta.push({
      ...stop,
      order: i,
      driveMinutes: i > 0 ? Math.round(distance(ordered[i - 1], stop) * 120 * traffic) : 0,
      eta,
      employeeId,
    });
  }

  const naiveDrive = jobStops.reduce((s, stop, i) => {
    const prev = i === 0 ? depot : jobStops[i - 1];
    return s + distance(prev, stop) * 120 * traffic;
  }, 0);

  const plan: RoutePlan = {
    id: newId("route"),
    vehicleCapacity,
    employeeId,
    employeeName: member?.name ?? "Unassigned",
    stops: withEta,
    totalDriveMinutes: totalDrive,
    milesSaved: Math.max(0, Math.round((naiveDrive - totalDrive) / 8)),
    trafficNote:
      traffic > 1.2
        ? "Moderate traffic on main corridors — Atlas adjusted ETAs."
        : "Light traffic — standard drive times.",
    optimizedAt: nowIso(),
  };
  saveJson(PLAN_KEY, plan);
  return plan;
}

export function loadRoutePlan(): RoutePlan | null {
  return loadJson<RoutePlan | null>(PLAN_KEY, null);
}

/** Map pin position (0–100) from lat/lng within seed bounds. */
export function mapPosition(stop: RouteStop): { x: number; y: number } {
  const minLat = 40.705;
  const maxLat = 40.725;
  const minLng = -74.022;
  const maxLng = -74.004;
  const x = ((stop.lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - stop.lat) / (maxLat - minLat)) * 100;
  return { x: Math.min(95, Math.max(5, x)), y: Math.min(90, Math.max(10, y)) };
}

export function capacityOk(plan: RoutePlan): boolean {
  const units = plan.stops.reduce((s, stop) => s + stop.units, 0);
  return units <= plan.vehicleCapacity;
}
