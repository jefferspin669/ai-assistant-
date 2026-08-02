export type FeatureFlagId =
  | "beta_calendar"
  | "new_tax_calculator"
  | "experimental_ai_agent"
  | "new_dashboard"
  | "voice_captions_v2"
  | "offline_v2";

export type FeatureFlag = {
  id: FeatureFlagId;
  name: string;
  description: string;
  enabled: boolean;
  audience: "everyone" | "beta" | "internal" | "off";
  rolloutPercent: number;
};

const STORAGE_KEY = "atlas-feature-flags-v1";

const CATALOG: Omit<FeatureFlag, "enabled" | "audience" | "rolloutPercent">[] = [
  {
    id: "beta_calendar",
    name: "Beta calendar",
    description: "New Smart Calendar interactions for a small pilot group.",
  },
  {
    id: "new_tax_calculator",
    name: "New tax calculator",
    description: "Experimental estimate engine before it replaces Tax Center.",
  },
  {
    id: "experimental_ai_agent",
    name: "Experimental AI agent",
    description: "Try a new Atlas agent personality and tool routing.",
  },
  {
    id: "new_dashboard",
    name: "New dashboard",
    description: "Alternate widget pack for the customizable home.",
  },
  {
    id: "voice_captions_v2",
    name: "Voice captions v2",
    description: "Richer captions for voice commands.",
  },
  {
    id: "offline_v2",
    name: "Offline pack v2",
    description: "Expanded offline document cache.",
  },
];

function seedFlags(): FeatureFlag[] {
  return CATALOG.map((item, index) => ({
    ...item,
    enabled: index === 0,
    audience: index === 0 ? "beta" : "off",
    rolloutPercent: index === 0 ? 10 : 0,
  }));
}

export function loadFeatureFlags(): FeatureFlag[] {
  if (typeof window === "undefined") return seedFlags();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedFlags();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as FeatureFlag[];
    const byId = new Map(parsed.map((f) => [f.id, f]));
    return CATALOG.map((item) => {
      const prev = byId.get(item.id);
      return prev
        ? { ...item, enabled: prev.enabled, audience: prev.audience, rolloutPercent: prev.rolloutPercent }
        : { ...item, enabled: false, audience: "off", rolloutPercent: 0 };
    });
  } catch {
    return seedFlags();
  }
}

export function saveFeatureFlags(flags: FeatureFlag[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

export function setFeatureFlag(
  id: FeatureFlagId,
  patch: Partial<Pick<FeatureFlag, "enabled" | "audience" | "rolloutPercent">>,
) {
  const next = loadFeatureFlags().map((flag) => (flag.id === id ? { ...flag, ...patch } : flag));
  saveFeatureFlags(next);
  return next;
}

export function isFeatureEnabled(id: FeatureFlagId, userBucket = 7) {
  const flag = loadFeatureFlags().find((f) => f.id === id);
  if (!flag || !flag.enabled || flag.audience === "off") return false;
  if (flag.audience === "everyone") return true;
  if (flag.audience === "internal") return userBucket <= 2;
  if (flag.audience === "beta") return userBucket <= Math.ceil(flag.rolloutPercent / 10);
  return false;
}
