import {
  clearConversationHistory as clearAccountChats,
  deleteAccountData,
  exportAccountData,
  getCurrentAccount,
  updateAppSettings,
  updateSecuritySettings,
  type Result,
} from "@/lib/account";

export type PrivacyControls = {
  rememberPreferences: boolean;
  rememberPeople: boolean;
  rememberProjects: boolean;
  trainPersonalization: boolean;
  shareUsageAnalytics: boolean;
  shareWithConnectedApps: boolean;
  keepConversationHistory: boolean;
  allowDataExport: boolean;
  showOnlineStatus: boolean;
};

const STORAGE_KEY = "atlas-privacy-v1";

export const PRIVACY_COPY: {
  key: keyof PrivacyControls;
  title: string;
  plain: string;
}[] = [
  {
    key: "rememberPreferences",
    title: "What Atlas remembers · preferences",
    plain: "Keep things like timezone, tone, and how you like replies.",
  },
  {
    key: "rememberPeople",
    title: "What Atlas remembers · people",
    plain: "Remember names and notes about customers, family, and teammates.",
  },
  {
    key: "rememberProjects",
    title: "What Atlas remembers · projects",
    plain: "Keep ongoing project context so you don’t repeat yourself.",
  },
  {
    key: "trainPersonalization",
    title: "Personalization training",
    plain: "Use your activity on this device to make Atlas more helpful for you — not to train a public model.",
  },
  {
    key: "shareUsageAnalytics",
    title: "Data sharing · usage",
    plain: "Share anonymous product usage to improve Atlas. Never includes passwords or private files.",
  },
  {
    key: "shareWithConnectedApps",
    title: "Connected app permissions",
    plain: "Allow connected apps (Calendar, Stripe, etc.) to exchange only the data you approved.",
  },
  {
    key: "keepConversationHistory",
    title: "Conversation history",
    plain: "Save chat history in your account so you can revisit past answers.",
  },
  {
    key: "allowDataExport",
    title: "Account exports",
    plain: "Let you download your data anytime from Import & export or Privacy center.",
  },
  {
    key: "showOnlineStatus",
    title: "Online status",
    plain: "Show teammates when you’re active in shared workspaces.",
  },
];

export function defaultPrivacyControls(): PrivacyControls {
  return {
    rememberPreferences: true,
    rememberPeople: true,
    rememberProjects: true,
    trainPersonalization: false,
    shareUsageAnalytics: false,
    shareWithConnectedApps: true,
    keepConversationHistory: true,
    allowDataExport: true,
    showOnlineStatus: true,
  };
}

export function loadPrivacyControls(): PrivacyControls {
  const defaults = defaultPrivacyControls();
  const account = getCurrentAccount();
  if (account) {
    return {
      ...defaults,
      trainPersonalization: account.appSettings.privacy.allowTraining,
      shareUsageAnalytics: account.appSettings.privacy.shareUsage,
      showOnlineStatus: account.appSettings.privacy.showOnlineStatus,
      allowDataExport: account.security.permissions.allowExport,
      keepConversationHistory: Boolean(account.aiWorkspace.chats.length >= 0),
    };
  }
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Partial<PrivacyControls>) };
  } catch {
    return defaults;
  }
}

export function savePrivacyControls(controls: PrivacyControls): Result | { ok: true } {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(controls));
  }
  const account = getCurrentAccount();
  if (!account) return { ok: true };
  const appResult = updateAppSettings({
    privacy: {
      ...account.appSettings.privacy,
      allowTraining: controls.trainPersonalization,
      shareUsage: controls.shareUsageAnalytics,
      showOnlineStatus: controls.showOnlineStatus,
    },
  });
  if (!appResult.ok) return appResult;
  return updateSecuritySettings({
    permissions: {
      ...account.security.permissions,
      allowExport: controls.allowDataExport,
    },
  });
}

export function clearConversationHistory(): Result {
  return clearAccountChats();
}

export function exportPrivacyPack() {
  const result = exportAccountData();
  if (!result.ok) return result;
  return {
    ok: true as const,
    json: result.json,
    filename: `atlas-privacy-export-${new Date().toISOString().slice(0, 10)}.json`,
  };
}

export function permanentDeleteVault(): Result {
  return deleteAccountData();
}
