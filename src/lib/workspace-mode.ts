/**
 * Workspace mode — Preview (demo onboarding) vs Production (real company data only).
 * Demo data is never mixed with production after activation.
 */

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

export type WorkspaceMode = "preview" | "production";

export type CompanyWorkspaceProfile = {
  companyName: string;
  industry: string;
  locations: number;
  teamSize: string;
  businessHours: string;
  ownerName: string;
  adminEmail?: string;
};

export type WorkspaceActivation = {
  step: number;
  previewCompleted: boolean;
  companyConfigured: boolean;
  connectionsReviewed: boolean;
  teamInvited: boolean;
  activatedAt?: string;
  profile?: CompanyWorkspaceProfile;
};

const MODE_KEY = "atlas-workspace-mode-v1";
const ACTIVATION_KEY = "atlas-workspace-activation-v1";

/** All atlas-* keys cleared on production activation (mode key re-set after wipe). */
export const ATLAS_STORAGE_PREFIX = "atlas-";

export function loadWorkspaceMode(): WorkspaceMode {
  return loadJson<WorkspaceMode>(MODE_KEY, "production");
}

export function saveWorkspaceMode(mode: WorkspaceMode) {
  saveJson(MODE_KEY, mode);
}

export function isDemoWorkspace(): boolean {
  return loadWorkspaceMode() === "preview";
}

export function isProductionWorkspace(): boolean {
  return loadWorkspaceMode() === "production";
}

export function loadWorkspaceActivation(): WorkspaceActivation {
  return loadJson<WorkspaceActivation>(ACTIVATION_KEY, {
    step: 0,
    previewCompleted: false,
    companyConfigured: false,
    connectionsReviewed: false,
    teamInvited: false,
  });
}

export function saveWorkspaceActivation(state: WorkspaceActivation) {
  saveJson(ACTIVATION_KEY, state);
}

export function clearAtlasWorkspaceStorage() {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(ATLAS_STORAGE_PREFIX)) toRemove.push(key);
  }
  for (const key of toRemove) {
    localStorage.removeItem(key);
  }
}

/** Enter labeled demo preview — seeds sample data in isolation. */
export function enterPreviewWorkspace(): void {
  clearAtlasWorkspaceStorage();
  saveWorkspaceMode("preview");
  saveWorkspaceActivation({
    ...loadWorkspaceActivation(),
    previewCompleted: true,
    step: Math.max(loadWorkspaceActivation().step, 1),
  });
  // Team seed runs lazily via seedDemoTeamIfEmpty when features open.
}

/** Wipe all workspace data and lock to production — demo cannot leak back. */
export function activateProductionWorkspace(profile?: CompanyWorkspaceProfile): void {
  clearAtlasWorkspaceStorage();
  saveWorkspaceMode("production");
  saveWorkspaceActivation({
    step: 5,
    previewCompleted: loadWorkspaceActivation().previewCompleted,
    companyConfigured: true,
    connectionsReviewed: true,
    teamInvited: true,
    activatedAt: new Date().toISOString(),
    profile: profile ?? loadWorkspaceActivation().profile,
  });
}

export function updateCompanyProfile(profile: CompanyWorkspaceProfile) {
  const state = loadWorkspaceActivation();
  saveWorkspaceActivation({
    ...state,
    companyConfigured: true,
    profile,
    step: Math.max(state.step, 2),
  });
}

export function markConnectionsReviewed() {
  const state = loadWorkspaceActivation();
  saveWorkspaceActivation({
    ...state,
    connectionsReviewed: true,
    step: Math.max(state.step, 3),
  });
}

export function markTeamInvited() {
  const state = loadWorkspaceActivation();
  saveWorkspaceActivation({
    ...state,
    teamInvited: true,
    step: Math.max(state.step, 4),
  });
}

export function workspaceStatusLabel(): string {
  return isDemoWorkspace() ? "Demo Data" : "Production";
}
