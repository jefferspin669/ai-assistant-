/** Tenant org settings — localStorage is a cache; server is source of truth via /api/settings. */

export type OrgSettingsState = {
  businessName: string;
  businessType: string;
  taxStructure: string;
  state: string;
  logoUrl: string | null;
  timezone: string;
  preferredLanguage: string;
  updatedAt: string;
};

const SETTINGS_KEY = "atlas-org-settings-v1";

function defaultSettings(): OrgSettingsState {
  return {
    businessName: "Atlas Business",
    businessType: "service",
    taxStructure: "LLC",
    state: "TX",
    logoUrl: null,
    timezone: "America/Chicago",
    preferredLanguage: "en",
    updatedAt: new Date().toISOString(),
  };
}

export function loadOrgSettingsCache(): OrgSettingsState {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...(JSON.parse(raw) as Partial<OrgSettingsState>) };
  } catch {
    return defaultSettings();
  }
}

function cacheOrgSettings(settings: OrgSettingsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function hydrateOrgSettings(): Promise<OrgSettingsState> {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const res = await fetch("/api/settings", { cache: "no-store", credentials: "include" });
    const json = (await res.json()) as { ok?: boolean; data?: OrgSettingsState };
    if (res.ok && json.data) {
      cacheOrgSettings(json.data);
      return json.data;
    }
  } catch {
    /* fall through */
  }
  return loadOrgSettingsCache();
}

export async function saveOrgSettings(
  patch: Partial<Omit<OrgSettingsState, "updatedAt">>,
): Promise<{ ok: true; data: OrgSettingsState } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string; data?: OrgSettingsState };
    if (!res.ok || json.ok === false || !json.data) {
      return { ok: false, error: json.error || "Could not save settings." };
    }
    cacheOrgSettings(json.data);
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "Could not reach Atlas settings API." };
  }
}
