import { customEmployee, owner } from "@/lib/data";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type OAuthProvider = "google" | "apple" | "microsoft";
export type ThemePreference = "system" | "light" | "dark" | "mist";
export type CloudKind =
  | "conversation"
  | "file"
  | "document"
  | "workflow"
  | "template";
export type MemoryKind = "preference" | "prompt" | "person" | "project" | "long-term";

export type ProfitEntry = {
  id: string;
  amount: number;
  note: string;
  date: string;
};

export type PasskeyCredential = {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type TrustedDevice = {
  id: string;
  name: string;
  browser: string;
  os: string;
  location: string;
  trusted: boolean;
  current: boolean;
  lastSeenAt: string;
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  deviceId: string;
  deviceName: string;
  ip: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
};

export type LoginEvent = {
  id: string;
  at: string;
  method: "password" | "oauth" | "passkey" | "reset";
  provider?: OAuthProvider;
  success: boolean;
  ip: string;
  location: string;
  deviceName: string;
  detail: string;
};

export type SecurityAlert = {
  id: string;
  at: string;
  title: string;
  detail: string;
  severity: "info" | "warn" | "critical";
  read: boolean;
};

export type ActivityLogEntry = {
  id: string;
  at: string;
  action: string;
  detail: string;
};

export type CloudVersion = {
  id: string;
  at: string;
  label: string;
  content: string;
};

export type CloudItem = {
  id: string;
  kind: CloudKind;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  versions: CloudVersion[];
  deletedAt: string | null;
  folderId: string | null;
  tagIds: string[];
  favorite: boolean;
  archived: boolean;
  pinned: boolean;
};

export type OrgFolder = {
  id: string;
  name: string;
  createdAt: string;
};

export type OrgTag = {
  id: string;
  name: string;
  color: string;
};

export type NotificationSettings = {
  push: boolean;
  email: boolean;
  sms: boolean;
  desktop: boolean;
  doNotDisturb: boolean;
  dndUntil: string | null;
  categories: {
    security: boolean;
    billing: boolean;
    team: boolean;
    ai: boolean;
    marketing: boolean;
  };
};

export type TeamRole = "owner" | "admin" | "manager" | "employee";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "invited";
  invitedAt: string;
  joinedAt: string | null;
};

export type SharedWorkspace = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export type KnowledgeArticle = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type TeamChatMessage = {
  id: string;
  workspaceId: string;
  authorName: string;
  text: string;
  at: string;
};

export type AuditLogEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

export type ConnectedApp = {
  id: string;
  name: string;
  connected: boolean;
  connectedAt: string | null;
};

export type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  secretHint: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type PlanTier = "free" | "pro" | "business" | "enterprise";

export type BillingInfo = {
  plan: PlanTier;
  status: "active" | "past_due" | "canceled";
  renewsAt: string;
  seats: number;
  referralCode: string;
  referralCredits: number;
  paymentMethods: PaymentMethod[];
  invoices: InvoiceRecord[];
  usage: UsageMeter;
};

export type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

export type InvoiceRecord = {
  id: string;
  at: string;
  amount: number;
  status: "paid" | "open" | "void";
  description: string;
};

export type UsageMeter = {
  aiRequests: number;
  storageMb: number;
  seatsUsed: number;
  periodLabel: string;
};

export type AppSettings = {
  voiceId: string;
  voiceLabel: string;
  privacy: {
    shareUsage: boolean;
    allowTraining: boolean;
    showOnlineStatus: boolean;
  };
  connectedApps: ConnectedApp[];
  billing: BillingInfo;
  apiKeys: ApiKeyRecord[];
};

export type AiChat = {
  id: string;
  title: string;
  preview: string;
  messages: { role: "user" | "ai"; text: string }[];
  projectId: string | null;
  shared: boolean;
  updatedAt: string;
  createdAt: string;
};

export type SavedPrompt = {
  id: string;
  title: string;
  body: string;
  library: boolean;
  createdAt: string;
};

export type GeneratedFile = {
  id: string;
  title: string;
  kind: string;
  content: string;
  createdAt: string;
};

export type ProjectWorkspace = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export type AiWorkspace = {
  chats: AiChat[];
  prompts: SavedPrompt[];
  generatedFiles: GeneratedFile[];
  projects: ProjectWorkspace[];
  draftChatId: string | null;
  draftText: string;
};

export type ReliabilitySettings = {
  autoSave: boolean;
  offlineMode: boolean;
  syncAcrossDevices: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  recoveredAt: string | null;
};

export type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
};

export type PluginRecord = {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
};

export type DeveloperHub = {
  webhooks: WebhookEndpoint[];
  plugins: PluginRecord[];
  sandboxLog: { id: string; at: string; detail: string }[];
  docsVisited: boolean;
};

export type AnalyticsSnapshot = {
  aiRequests: number;
  timeSavedHours: number;
  tasksCompleted: number;
  moneySaved: number;
  accuracyScore: number;
  feedback: { id: string; at: string; rating: number; note: string }[];
  weekly: { label: string; requests: number; tasks: number }[];
};

export type MemoryItem = {
  id: string;
  kind: MemoryKind;
  title: string;
  content: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PersonalProfile = {
  fullName: string;
  phone: string;
  email: string;
  title: string;
  bio: string;
  photoDataUrl: string | null;
  timezone: string;
  language: string;
  theme: ThemePreference;
};

export type BusinessProfile = {
  id: string;
  name: string;
  industry: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logoDataUrl: string | null;
  aiName: string;
  aiPersonality: string;
  aiRole: string;
  createdAt: string;
};

export type SecuritySettings = {
  twoFactorEnabled: boolean;
  /** Demo authenticator code — always six digits. */
  twoFactorCode: string;
  recoveryCodes: string[];
  loginNotifications: boolean;
  inactiveLogoutMinutes: number;
  encryptionAtRest: boolean;
  e2eConversations: boolean;
  permissions: {
    shareAnalytics: boolean;
    allowTeamInvite: boolean;
    allowExport: boolean;
    allowMemoryWrite: boolean;
  };
};

export type UserAccount = {
  id: string;
  email: string;
  /** Demo-only local credential — not production security. */
  password: string;
  oauth: Partial<Record<OAuthProvider, { linkedAt: string; subject: string }>>;
  passkeys: PasskeyCredential[];
  personal: PersonalProfile;
  businesses: BusinessProfile[];
  activeBusinessId: string;
  profits: ProfitEntry[];
  cloudItems: CloudItem[];
  memories: MemoryItem[];
  devices: TrustedDevice[];
  sessions: SessionRecord[];
  loginHistory: LoginEvent[];
  securityAlerts: SecurityAlert[];
  activityLog: ActivityLogEntry[];
  security: SecuritySettings;
  folders: OrgFolder[];
  tags: OrgTag[];
  notifications: NotificationSettings;
  teamMembers: TeamMember[];
  workspaces: SharedWorkspace[];
  knowledgeBase: KnowledgeArticle[];
  teamChat: TeamChatMessage[];
  auditLogs: AuditLogEntry[];
  appSettings: AppSettings;
  aiWorkspace: AiWorkspace;
  reliability: ReliabilitySettings;
  developer: DeveloperHub;
  analytics: AnalyticsSnapshot;
  resetToken: string | null;
  resetExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicAccount = Omit<UserAccount, "password" | "resetToken"> & {
  hasPassword: boolean;
  hasResetPending: boolean;
};

export type SignupInput = {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
  industry: string;
  aiName: string;
  aiPersonality: string;
};

export type ProfileUpdate = {
  ownerName: string;
  businessName: string;
  industry: string;
  aiName: string;
  aiPersonality: string;
  aiRole: string;
};

export type LoginSuccess =
  | { ok: true; account: PublicAccount; requires2fa?: false }
  | { ok: true; requires2fa: true; challengeId: string; email: string };

export type Result = { ok: true; account: PublicAccount } | { ok: false; error: string };

/* ─── Constants / storage ───────────────────────────────────────────────── */

const ACCOUNTS_KEY = "atlas-accounts-v2";
const LEGACY_KEY = "atlas-accounts-v1";
const SESSION_KEY = "atlas-session-v2";
const LEGACY_SESSION_KEY = "atlas-session-v1";
const PENDING_2FA_KEY = "atlas-pending-2fa-v2";
const DEMO_2FA_CODE = "246810";

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "de", label: "German" },
  { id: "pt", label: "Portuguese" },
];

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function nowIso() {
  return new Date().toISOString();
}

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function guessDevice() {
  if (typeof navigator === "undefined") {
    return { browser: "Browser", os: "Device", name: "This device" };
  }
  const ua = navigator.userAgent;
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
      ? "Chrome"
      : ua.includes("Firefox/")
        ? "Firefox"
        : ua.includes("Safari/")
          ? "Safari"
          : "Browser";
  const os = ua.includes("Mac")
    ? "macOS"
    : ua.includes("Windows")
      ? "Windows"
      : ua.includes("Android")
        ? "Android"
        : ua.includes("iPhone") || ua.includes("iPad")
          ? "iOS"
          : ua.includes("Linux")
            ? "Linux"
            : "Device";
  return { browser, os, name: `${browser} on ${os}` };
}

function demoIp() {
  return `203.0.113.${Math.floor(Math.random() * 200) + 10}`;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include letters and numbers.";
  }
  return null;
}

function defaultSecurity(): SecuritySettings {
  return {
    twoFactorEnabled: false,
    twoFactorCode: DEMO_2FA_CODE,
    recoveryCodes: [],
    loginNotifications: true,
    inactiveLogoutMinutes: 60,
    encryptionAtRest: true,
    e2eConversations: false,
    permissions: {
      shareAnalytics: false,
      allowTeamInvite: true,
      allowExport: true,
      allowMemoryWrite: true,
    },
  };
}

function defaultNotifications(): NotificationSettings {
  return {
    push: true,
    email: true,
    sms: false,
    desktop: true,
    doNotDisturb: false,
    dndUntil: null,
    categories: {
      security: true,
      billing: true,
      team: true,
      ai: true,
      marketing: false,
    },
  };
}

function migratePlan(plan: string | undefined): PlanTier {
  if (plan === "pro" || plan === "business" || plan === "enterprise" || plan === "free") return plan;
  if (plan === "growth" || plan === "scale") return plan === "scale" ? "enterprise" : "business";
  if (plan === "starter") return "pro";
  return "pro";
}

function defaultBilling(): BillingInfo {
  const renews = new Date();
  renews.setMonth(renews.getMonth() + 1);
  const stamp = nowIso();
  return {
    plan: "pro",
    status: "active",
    renewsAt: renews.toISOString(),
    seats: 3,
    referralCode: `ATLAS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    referralCredits: 0,
    paymentMethods: [
      {
        id: newId(),
        brand: "Visa",
        last4: "4242",
        expMonth: 12,
        expYear: new Date().getFullYear() + 2,
        isDefault: true,
      },
    ],
    invoices: [
      {
        id: newId(),
        at: stamp,
        amount: 49,
        status: "paid",
        description: "Pro plan · monthly",
      },
    ],
    usage: {
      aiRequests: 1280,
      storageMb: 420,
      seatsUsed: 1,
      periodLabel: "This billing period",
    },
  };
}

function defaultAppSettings(): AppSettings {
  return {
    voiceId: "atlas-warm",
    voiceLabel: "Atlas Warm",
    privacy: {
      shareUsage: false,
      allowTraining: false,
      showOnlineStatus: true,
    },
    connectedApps: [
      { id: "google-calendar", name: "Google Calendar", connected: false, connectedAt: null },
      { id: "quickbooks", name: "QuickBooks", connected: false, connectedAt: null },
      { id: "slack", name: "Slack", connected: false, connectedAt: null },
      { id: "stripe", name: "Stripe", connected: false, connectedAt: null },
    ],
    billing: defaultBilling(),
    apiKeys: [],
  };
}

function defaultAiWorkspace(ownerName: string): AiWorkspace {
  const stamp = nowIso();
  const projectId = newId();
  const chatId = newId();
  return {
    projects: [
      {
        id: projectId,
        name: "Customer follow-ups",
        description: "Prompts and chats for retention work.",
        createdAt: stamp,
      },
    ],
    chats: [
      {
        id: chatId,
        title: "How is business?",
        preview: "Revenue is up 9% vs average…",
        messages: [
          { role: "user", text: "How is business?" },
          { role: "ai", text: `Looking good, ${ownerName}. Revenue is up 9% vs average.` },
        ],
        projectId,
        shared: false,
        updatedAt: stamp,
        createdAt: stamp,
      },
    ],
    prompts: [
      {
        id: newId(),
        title: "Weekly revenue check",
        body: "How did we do on revenue this week vs last?",
        library: true,
        createdAt: stamp,
      },
      {
        id: newId(),
        title: "Draft estimate follow-up",
        body: "Write a friendly text asking if they want to book from the estimate.",
        library: true,
        createdAt: stamp,
      },
    ],
    generatedFiles: [
      {
        id: newId(),
        title: "Follow-up email draft",
        kind: "document",
        content: "Hi {{name}}, just checking in on your estimate…",
        createdAt: stamp,
      },
    ],
    draftChatId: chatId,
    draftText: "",
  };
}

function defaultReliability(): ReliabilitySettings {
  return {
    autoSave: true,
    offlineMode: true,
    syncAcrossDevices: true,
    lastSyncedAt: nowIso(),
    lastError: null,
    recoveredAt: null,
  };
}

function defaultDeveloper(): DeveloperHub {
  return {
    webhooks: [],
    plugins: [
      {
        id: "chrome-sidepanel",
        name: "Browser side panel",
        enabled: false,
        description: "Open Atlas beside any tab.",
      },
      {
        id: "zapier",
        name: "Zapier connector",
        enabled: false,
        description: "Trigger workflows from Atlas events.",
      },
    ],
    sandboxLog: [],
    docsVisited: false,
  };
}

function defaultAnalytics(): AnalyticsSnapshot {
  return {
    aiRequests: 1280,
    timeSavedHours: 36.5,
    tasksCompleted: 214,
    moneySaved: 4820,
    accuracyScore: 92,
    feedback: [],
    weekly: [
      { label: "Mon", requests: 140, tasks: 28 },
      { label: "Tue", requests: 180, tasks: 34 },
      { label: "Wed", requests: 210, tasks: 41 },
      { label: "Thu", requests: 190, tasks: 37 },
      { label: "Fri", requests: 230, tasks: 44 },
      { label: "Sat", requests: 90, tasks: 16 },
      { label: "Sun", requests: 70, tasks: 14 },
    ],
  };
}

function defaultOrgMeta(ownerName: string, email: string) {
  const stamp = nowIso();
  const inboxId = newId();
  const opsId = newId();
  return {
    folders: [
      { id: inboxId, name: "Inbox", createdAt: stamp },
      { id: opsId, name: "Operations", createdAt: stamp },
    ] as OrgFolder[],
    tags: [
      { id: newId(), name: "urgent", color: "#b42318" },
      { id: newId(), name: "customer", color: "#2f8f8a" },
      { id: newId(), name: "finance", color: "#b88420" },
    ] as OrgTag[],
    teamMembers: [
      {
        id: newId(),
        name: ownerName,
        email,
        role: "owner" as TeamRole,
        status: "active" as const,
        invitedAt: stamp,
        joinedAt: stamp,
      },
    ] as TeamMember[],
    workspaces: [
      {
        id: newId(),
        name: "Company HQ",
        description: "Shared workspace for the whole team.",
        createdAt: stamp,
      },
    ] as SharedWorkspace[],
  };
}

function normalizeCloudItem(item: CloudItem): CloudItem {
  return {
    ...item,
    folderId: item.folderId ?? null,
    tagIds: Array.isArray(item.tagIds) ? item.tagIds : [],
    favorite: Boolean(item.favorite),
    archived: Boolean(item.archived),
    pinned: Boolean(item.pinned),
  };
}

function ensureAccountShape(account: UserAccount): UserAccount {
  const org = defaultOrgMeta(account.personal?.fullName || owner.name, account.email);
  const defaults = defaultAppSettings();
  const billingIn = account.appSettings?.billing || defaults.billing;
  return {
    ...account,
    cloudItems: (account.cloudItems || []).map(normalizeCloudItem),
    folders: account.folders?.length ? account.folders : org.folders,
    tags: account.tags?.length ? account.tags : org.tags,
    notifications: {
      ...defaultNotifications(),
      ...(account.notifications || {}),
      categories: {
        ...defaultNotifications().categories,
        ...(account.notifications?.categories || {}),
      },
    },
    teamMembers: account.teamMembers?.length ? account.teamMembers : org.teamMembers,
    workspaces: account.workspaces?.length ? account.workspaces : org.workspaces,
    knowledgeBase: account.knowledgeBase || [],
    teamChat: account.teamChat || [],
    auditLogs: account.auditLogs || [],
    appSettings: {
      ...defaults,
      ...(account.appSettings || {}),
      privacy: {
        ...defaults.privacy,
        ...(account.appSettings?.privacy || {}),
      },
      connectedApps: account.appSettings?.connectedApps?.length
        ? account.appSettings.connectedApps
        : defaults.connectedApps,
      billing: {
        ...defaults.billing,
        ...billingIn,
        plan: migratePlan(billingIn.plan),
        paymentMethods: billingIn.paymentMethods?.length
          ? billingIn.paymentMethods
          : defaults.billing.paymentMethods,
        invoices: billingIn.invoices?.length ? billingIn.invoices : defaults.billing.invoices,
        usage: { ...defaults.billing.usage, ...(billingIn.usage || {}) },
        referralCode: billingIn.referralCode || defaults.billing.referralCode,
        referralCredits: billingIn.referralCredits ?? defaults.billing.referralCredits,
      },
      apiKeys: account.appSettings?.apiKeys || [],
    },
    aiWorkspace: account.aiWorkspace?.chats
      ? account.aiWorkspace
      : defaultAiWorkspace(account.personal?.fullName || owner.name),
    reliability: { ...defaultReliability(), ...(account.reliability || {}) },
    developer: {
      ...defaultDeveloper(),
      ...(account.developer || {}),
      plugins: account.developer?.plugins?.length
        ? account.developer.plugins
        : defaultDeveloper().plugins,
      webhooks: account.developer?.webhooks || [],
      sandboxLog: account.developer?.sandboxLog || [],
    },
    analytics: {
      ...defaultAnalytics(),
      ...(account.analytics || {}),
      weekly: account.analytics?.weekly?.length ? account.analytics.weekly : defaultAnalytics().weekly,
      feedback: account.analytics?.feedback || [],
    },
  };
}

function defaultPersonal(name: string, email: string): PersonalProfile {
  return {
    fullName: name,
    phone: "",
    email,
    title: "Owner",
    bio: "",
    photoDataUrl: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    language: "en",
    theme: "system",
  };
}

function defaultBusiness(input: {
  name: string;
  industry: string;
  aiName: string;
  aiPersonality: string;
  email: string;
}): BusinessProfile {
  return {
    id: newId(),
    name: input.name,
    industry: input.industry || "HVAC",
    phone: "",
    email: input.email,
    website: "",
    address: "",
    logoDataUrl: null,
    aiName: input.aiName || customEmployee.name,
    aiPersonality: input.aiPersonality || "Friendly",
    aiRole: customEmployee.role,
    createdAt: nowIso(),
  };
}

function seedCloud(): CloudItem[] {
  const stamp = nowIso();
  return [
    {
      id: newId(),
      kind: "conversation",
      title: "Morning briefing chat",
      content: "How is business?\nShow overdue invoices.",
      createdAt: stamp,
      updatedAt: stamp,
      versions: [{ id: newId(), at: stamp, label: "v1", content: "How is business?" }],
      deletedAt: null,
      folderId: null,
      tagIds: [],
      favorite: true,
      archived: false,
      pinned: true,
    },
    {
      id: newId(),
      kind: "template",
      title: "Estimate follow-up",
      content: "Hi {{name}}, your estimate is ready…",
      createdAt: stamp,
      updatedAt: stamp,
      versions: [],
      deletedAt: null,
      folderId: null,
      tagIds: [],
      favorite: false,
      archived: false,
      pinned: false,
    },
  ];
}

function seedMemories(ownerName: string): MemoryItem[] {
  const stamp = nowIso();
  return [
    {
      id: newId(),
      kind: "preference",
      title: "Prefer concise briefings",
      content: `${ownerName} likes short morning summaries with dollars first.`,
      approved: true,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: newId(),
      kind: "prompt",
      title: "Weekly revenue check",
      content: "How did we do on revenue this week vs last?",
      approved: true,
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
}

function toPublic(account: UserAccount): PublicAccount {
  const { password: _p, resetToken, ...rest } = account;
  return {
    ...rest,
    hasPassword: Boolean(_p),
    hasResetPending: Boolean(resetToken && account.resetExpiresAt && account.resetExpiresAt > nowIso()),
  };
}

function activeBusiness(account: UserAccount): BusinessProfile {
  return (
    account.businesses.find((b) => b.id === account.activeBusinessId) ||
    account.businesses[0]
  );
}

/* ─── Compatibility getters used across the app ─────────────────────────── */

export function accountOwnerName(account: PublicAccount | UserAccount | null | undefined) {
  if (!account) return owner.name;
  return "personal" in account ? account.personal.fullName : owner.name;
}

export function accountBusinessName(account: PublicAccount | UserAccount | null | undefined) {
  if (!account || !("businesses" in account)) return owner.business;
  const biz =
    account.businesses.find((b) => b.id === account.activeBusinessId) || account.businesses[0];
  return biz?.name || owner.business;
}

export function accountAiName(account: PublicAccount | UserAccount | null | undefined) {
  if (!account || !("businesses" in account)) return customEmployee.name;
  const biz =
    account.businesses.find((b) => b.id === account.activeBusinessId) || account.businesses[0];
  return biz?.aiName || customEmployee.name;
}

export function accountAiRole(account: PublicAccount | UserAccount | null | undefined) {
  if (!account || !("businesses" in account)) return customEmployee.role;
  const biz =
    account.businesses.find((b) => b.id === account.activeBusinessId) || account.businesses[0];
  return biz?.aiRole || customEmployee.role;
}

export function accountAiPersonality(account: PublicAccount | UserAccount | null | undefined) {
  if (!account || !("businesses" in account)) return "Friendly";
  const biz =
    account.businesses.find((b) => b.id === account.activeBusinessId) || account.businesses[0];
  return biz?.aiPersonality || "Friendly";
}

/* ─── Persistence ───────────────────────────────────────────────────────── */

function migrateLegacy(raw: unknown): UserAccount | null {
  if (!raw || typeof raw !== "object") return null;
  const legacy = raw as Record<string, unknown>;
  if (!legacy.email || !legacy.id) return null;
  if ("personal" in legacy && "businesses" in legacy) {
    return ensureAccountShape(legacy as unknown as UserAccount);
  }

  const email = String(legacy.email);
  const ownerName = String(legacy.ownerName || owner.name);
  const business = defaultBusiness({
    name: String(legacy.businessName || owner.business),
    industry: String(legacy.industry || "HVAC"),
    aiName: String(legacy.aiName || customEmployee.name),
    aiPersonality: String(legacy.aiPersonality || "Friendly"),
    email,
  });
  if (legacy.aiRole) business.aiRole = String(legacy.aiRole);

  return ensureAccountShape({
    id: String(legacy.id),
    email,
    password: String(legacy.password || ""),
    oauth: {},
    passkeys: [],
    personal: defaultPersonal(ownerName, email),
    businesses: [business],
    activeBusinessId: business.id,
    profits: Array.isArray(legacy.profits) ? (legacy.profits as ProfitEntry[]) : [],
    cloudItems: seedCloud(),
    memories: seedMemories(ownerName),
    devices: [],
    sessions: [],
    loginHistory: [],
    securityAlerts: [],
    activityLog: [],
    security: defaultSecurity(),
    folders: [],
    tags: [],
    notifications: defaultNotifications(),
    teamMembers: [],
    workspaces: [],
    knowledgeBase: [],
    teamChat: [],
    auditLogs: [],
    appSettings: defaultAppSettings(),
    aiWorkspace: defaultAiWorkspace(ownerName),
    reliability: defaultReliability(),
    developer: defaultDeveloper(),
    analytics: defaultAnalytics(),
    resetToken: null,
    resetExpiresAt: null,
    createdAt: String(legacy.createdAt || nowIso()),
    updatedAt: String(legacy.updatedAt || nowIso()),
  });
}

function readAccounts(): UserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown[];
      return Array.isArray(parsed)
        ? (parsed.map((item) => migrateLegacy(item)).filter(Boolean) as UserAccount[]).map(ensureAccountShape)
        : [];
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return [];
    const parsed = JSON.parse(legacy) as unknown[];
    const migrated = Array.isArray(parsed)
      ? parsed.map((item) => migrateLegacy(item)).filter(Boolean) as UserAccount[]
      : [];
    if (migrated.length) {
      writeAccounts(migrated);
      const oldSession = localStorage.getItem(LEGACY_SESSION_KEY);
      if (oldSession) localStorage.setItem(SESSION_KEY, oldSession);
    }
    return migrated;
  } catch {
    return [];
  }
}

function writeAccounts(accounts: UserAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
}

export function setSessionUserId(id: string | null) {
  if (id) {
    localStorage.setItem(SESSION_KEY, id);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }
}

function getAccountById(id: string) {
  return readAccounts().find((a) => a.id === id) || null;
}

function saveAccount(account: UserAccount): PublicAccount {
  const accounts = readAccounts();
  const index = accounts.findIndex((a) => a.id === account.id);
  const next = { ...account, updatedAt: nowIso() };
  if (index >= 0) accounts[index] = next;
  else accounts.push(next);
  writeAccounts(accounts);
  return toPublic(next);
}

function mutate(mutator: (account: UserAccount) => UserAccount | string): Result {
  const id = getSessionUserId();
  if (!id) return { ok: false, error: "You’re not signed in." };
  const account = getAccountById(id);
  if (!account) return { ok: false, error: "Account not found." };
  const result = mutator(account);
  if (typeof result === "string") return { ok: false, error: result };
  return { ok: true, account: saveAccount(result) };
}

function pushActivity(account: UserAccount, action: string, detail: string): UserAccount {
  const entry: ActivityLogEntry = { id: newId(), at: nowIso(), action, detail };
  return { ...account, activityLog: [entry, ...account.activityLog].slice(0, 100) };
}

function pushAlert(
  account: UserAccount,
  title: string,
  detail: string,
  severity: SecurityAlert["severity"] = "info",
): UserAccount {
  const alert: SecurityAlert = { id: newId(), at: nowIso(), title, detail, severity, read: false };
  return { ...account, securityAlerts: [alert, ...account.securityAlerts].slice(0, 50) };
}

function attachSession(account: UserAccount, method: LoginEvent["method"], provider?: OAuthProvider): UserAccount {
  const deviceInfo = guessDevice();
  const stamp = nowIso();
  const ip = demoIp();
  const location = "Local demo region";

  let devices = account.devices.map((d) => ({ ...d, current: false }));
  let device = devices.find((d) => d.name === deviceInfo.name && d.browser === deviceInfo.browser);
  if (!device) {
    device = {
      id: newId(),
      name: deviceInfo.name,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      location,
      trusted: false,
      current: true,
      lastSeenAt: stamp,
      createdAt: stamp,
    };
    devices = [device, ...devices];
  } else {
    devices = devices.map((d) =>
      d.id === device!.id ? { ...d, current: true, lastSeenAt: stamp, location } : d,
    );
  }

  const sessions = account.sessions.map((s) => ({ ...s, current: false }));
  const session: SessionRecord = {
    id: newId(),
    deviceId: device.id,
    deviceName: device.name,
    ip,
    location,
    createdAt: stamp,
    lastActiveAt: stamp,
    current: true,
  };

  const login: LoginEvent = {
    id: newId(),
    at: stamp,
    method,
    provider,
    success: true,
    ip,
    location,
    deviceName: device.name,
    detail: provider ? `Signed in with ${provider}` : `Signed in with ${method}`,
  };

  let next: UserAccount = {
    ...account,
    devices,
    sessions: [session, ...sessions].slice(0, 20),
    loginHistory: [login, ...account.loginHistory].slice(0, 50),
  };

  if (next.security.loginNotifications) {
    next = pushAlert(next, "New login", `${login.detail} from ${device.name}`, "info");
  }
  next = pushActivity(next, "Login", login.detail);
  return next;
}

export function getCurrentAccount(): PublicAccount | null {
  const id = getSessionUserId();
  if (!id) return null;
  const account = getAccountById(id);
  return account ? toPublic(account) : null;
}

function createBaseAccount(input: {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
  industry: string;
  aiName: string;
  aiPersonality: string;
}): UserAccount {
  const stamp = nowIso();
  const email = normalizeEmail(input.email);
  const business = defaultBusiness({
    name: input.businessName,
    industry: input.industry,
    aiName: input.aiName,
    aiPersonality: input.aiPersonality,
    email,
  });
  const org = defaultOrgMeta(input.ownerName, email);
  const hq = org.workspaces[0];
  return ensureAccountShape({
    id: newId(),
    email,
    password: input.password,
    oauth: {},
    passkeys: [],
    personal: defaultPersonal(input.ownerName, email),
    businesses: [business],
    activeBusinessId: business.id,
    profits: [],
    cloudItems: seedCloud().map((item, index) =>
      index === 0 ? { ...item, folderId: org.folders[0]?.id || null, tagIds: [org.tags[0]?.id].filter(Boolean) as string[] } : item,
    ),
    memories: seedMemories(input.ownerName),
    devices: [],
    sessions: [],
    loginHistory: [],
    securityAlerts: [
      {
        id: newId(),
        at: stamp,
        title: "Account created",
        detail: "Encryption at rest is on. Enable 2FA for stronger protection.",
        severity: "info",
        read: false,
      },
    ],
    activityLog: [
      { id: newId(), at: stamp, action: "Account created", detail: "Secure sign-up completed." },
    ],
    security: defaultSecurity(),
    folders: org.folders,
    tags: org.tags,
    notifications: defaultNotifications(),
    teamMembers: org.teamMembers,
    workspaces: org.workspaces,
    knowledgeBase: [
      {
        id: newId(),
        workspaceId: hq.id,
        title: "How we answer the phone",
        content: "Greet warmly, capture address and photos, book a window.",
        createdAt: stamp,
        updatedAt: stamp,
      },
    ],
    teamChat: [
      {
        id: newId(),
        workspaceId: hq.id,
        authorName: input.ownerName,
        text: "Welcome to the shared workspace — drop notes for the team here.",
        at: stamp,
      },
    ],
    auditLogs: [
      {
        id: newId(),
        at: stamp,
        actor: input.ownerName,
        action: "Workspace created",
        detail: "Company HQ shared workspace is ready.",
      },
    ],
    appSettings: defaultAppSettings(),
    aiWorkspace: defaultAiWorkspace(input.ownerName),
    reliability: defaultReliability(),
    developer: defaultDeveloper(),
    analytics: defaultAnalytics(),
    resetToken: null,
    resetExpiresAt: null,
    createdAt: stamp,
    updatedAt: stamp,
  });
}

/* ─── Auth ──────────────────────────────────────────────────────────────── */

export function signupAccount(input: SignupInput): Result {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const ownerName = input.ownerName.trim();
  const businessName = input.businessName.trim();
  const aiName = input.aiName.trim() || customEmployee.name;

  if (!email || !email.includes("@")) return { ok: false, error: "Enter a valid email address." };
  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false, error: passwordError };
  if (!ownerName) return { ok: false, error: "Enter your name." };
  if (!businessName) return { ok: false, error: "Enter your business name." };

  const accounts = readAccounts();
  if (accounts.some((a) => a.email === email)) {
    return { ok: false, error: "An account with that email already exists. Try signing in." };
  }

  let account = createBaseAccount({
    email,
    password,
    ownerName,
    businessName,
    industry: input.industry || "HVAC",
    aiName,
    aiPersonality: input.aiPersonality || "Friendly",
  });
  account = attachSession(account, "password");
  writeAccounts([...accounts, account]);
  setSessionUserId(account.id);
  return { ok: true, account: toPublic(account) };
}

export function loginAccount(emailRaw: string, passwordRaw: string): LoginSuccess | { ok: false; error: string } {
  const email = normalizeEmail(emailRaw);
  const password = passwordRaw.trim();
  const account = readAccounts().find((a) => a.email === email);
  if (!account || account.password !== password) {
    return { ok: false, error: "Email or password doesn’t match." };
  }

  if (account.security.twoFactorEnabled) {
    const challengeId = newId();
    sessionStorage.setItem(
      PENDING_2FA_KEY,
      JSON.stringify({ challengeId, accountId: account.id, at: nowIso() }),
    );
    return { ok: true, requires2fa: true, challengeId, email: account.email };
  }

  const next = attachSession(account, "password");
  saveAccount(next);
  setSessionUserId(next.id);
  return { ok: true, account: toPublic(next) };
}

export function verifyTwoFactor(challengeId: string, code: string): Result {
  const raw = sessionStorage.getItem(PENDING_2FA_KEY);
  if (!raw) return { ok: false, error: "2FA challenge expired. Sign in again." };
  const pending = JSON.parse(raw) as { challengeId: string; accountId: string };
  if (pending.challengeId !== challengeId) {
    return { ok: false, error: "Invalid 2FA challenge." };
  }
  const account = getAccountById(pending.accountId);
  if (!account) return { ok: false, error: "Account not found." };

  const trimmed = code.trim();
  const ok =
    trimmed === account.security.twoFactorCode ||
    account.security.recoveryCodes.includes(trimmed);
  if (!ok) return { ok: false, error: "Incorrect authenticator or recovery code." };

  sessionStorage.removeItem(PENDING_2FA_KEY);
  const next = attachSession(account, "password");
  const saved = saveAccount(next);
  setSessionUserId(next.id);
  return { ok: true, account: saved };
}

export function loginWithOAuth(provider: OAuthProvider, nameHint?: string): Result {
  const subject = `${provider}-${guessDevice().name.replace(/\s+/g, "-").toLowerCase()}`;
  const accounts = readAccounts();
  let account = accounts.find((a) => a.oauth[provider]?.subject === subject);

  if (!account) {
    const email = `${provider}.user.${Date.now().toString(36)}@atlas.demo`;
    const ownerName = nameHint?.trim() || `${provider[0].toUpperCase()}${provider.slice(1)} User`;
    account = createBaseAccount({
      email,
      password: "",
      ownerName,
      businessName: `${ownerName.split(" ")[0]}'s Business`,
      industry: "HVAC",
      aiName: customEmployee.name,
      aiPersonality: "Friendly",
    });
    account.oauth[provider] = { linkedAt: nowIso(), subject };
    account = pushActivity(account, "OAuth linked", `Connected ${provider}`);
  }

  account = attachSession(account, "oauth", provider);
  saveAccount(account);
  setSessionUserId(account.id);
  return { ok: true, account: toPublic(account) };
}

export function linkOAuthProvider(provider: OAuthProvider): Result {
  return mutate((account) => {
    if (account.oauth[provider]) return `${provider} is already linked.`;
    const subject = `${provider}-${account.id}`;
    let next: UserAccount = {
      ...account,
      oauth: { ...account.oauth, [provider]: { linkedAt: nowIso(), subject } },
    };
    next = pushActivity(next, "OAuth linked", `Connected ${provider}`);
    next = pushAlert(next, "Provider linked", `${provider} login is now available.`, "info");
    return next;
  });
}

export function unlinkOAuthProvider(provider: OAuthProvider): Result {
  return mutate((account) => {
    if (!account.oauth[provider]) return `${provider} is not linked.`;
    if (!account.password && account.passkeys.length === 0 && Object.keys(account.oauth).length <= 1) {
      return "Keep at least one sign-in method.";
    }
    const oauth = { ...account.oauth };
    delete oauth[provider];
    let next: UserAccount = { ...account, oauth };
    next = pushActivity(next, "OAuth unlinked", `Disconnected ${provider}`);
    return next;
  });
}

export function loginWithPasskey(emailRaw: string): Result {
  const email = normalizeEmail(emailRaw);
  const account = readAccounts().find((a) => a.email === email);
  if (!account) return { ok: false, error: "No account found for that email." };
  if (!account.passkeys.length) return { ok: false, error: "No passkeys on this account yet." };

  const stamp = nowIso();
  const passkeys = account.passkeys.map((p, i) =>
    i === 0 ? { ...p, lastUsedAt: stamp } : p,
  );
  let next: UserAccount = { ...account, passkeys };
  next = attachSession(next, "passkey");
  saveAccount(next);
  setSessionUserId(next.id);
  return { ok: true, account: toPublic(next) };
}

export function addPasskey(label: string): Result {
  return mutate((account) => {
    const name = label.trim() || `${guessDevice().name} passkey`;
    const passkey: PasskeyCredential = {
      id: newId(),
      label: name,
      createdAt: nowIso(),
      lastUsedAt: null,
    };
    let next: UserAccount = { ...account, passkeys: [passkey, ...account.passkeys] };
    next = pushActivity(next, "Passkey added", name);
    next = pushAlert(next, "Passkey registered", `${name} can now sign you in.`, "info");
    return next;
  });
}

export function removePasskey(passkeyId: string): Result {
  return mutate((account) => {
    if (!account.passkeys.some((p) => p.id === passkeyId)) return "Passkey not found.";
    let next: UserAccount = {
      ...account,
      passkeys: account.passkeys.filter((p) => p.id !== passkeyId),
    };
    next = pushActivity(next, "Passkey removed", passkeyId);
    return next;
  });
}

export function requestPasswordReset(emailRaw: string): { ok: true; token?: string; message: string } | { ok: false; error: string } {
  const email = normalizeEmail(emailRaw);
  if (!email.includes("@")) return { ok: false, error: "Enter a valid email address." };
  const account = readAccounts().find((a) => a.email === email);
  // Always return success-shaped message to avoid email enumeration in the UI copy,
  // but for the prototype we surface the token when the account exists.
  if (!account) {
    return {
      ok: true,
      message: "If that email is registered, a reset link is ready. (Demo: no account matched.)",
    };
  }
  const token = newId().replace(/-/g, "").slice(0, 16);
  const next: UserAccount = {
    ...account,
    resetToken: token,
    resetExpiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
  };
  saveAccount(pushActivity(next, "Password reset requested", "Reset token issued for 30 minutes."));
  return {
    ok: true,
    token,
    message: "Reset token created for this demo (normally emailed).",
  };
}

export function resetPasswordWithToken(token: string, newPassword: string): Result {
  const passwordError = validatePassword(newPassword.trim());
  if (passwordError) return { ok: false, error: passwordError };
  const account = readAccounts().find((a) => a.resetToken === token.trim());
  if (!account || !account.resetExpiresAt || account.resetExpiresAt < nowIso()) {
    return { ok: false, error: "Reset token is invalid or expired." };
  }
  let next: UserAccount = {
    ...account,
    password: newPassword.trim(),
    resetToken: null,
    resetExpiresAt: null,
  };
  next = attachSession(next, "reset");
  next = pushAlert(next, "Password changed", "Your password was reset successfully.", "warn");
  const saved = saveAccount(next);
  setSessionUserId(next.id);
  return { ok: true, account: saved };
}

export function logoutAccount() {
  const id = getSessionUserId();
  if (id) {
    const account = getAccountById(id);
    if (account) {
      const next = {
        ...account,
        sessions: account.sessions.map((s) => ({ ...s, current: false })),
        devices: account.devices.map((d) => ({ ...d, current: false })),
      };
      saveAccount(pushActivity(next, "Logout", "Signed out of this device."));
    }
  }
  setSessionUserId(null);
  sessionStorage.removeItem(PENDING_2FA_KEY);
}

/* ─── Profiles ──────────────────────────────────────────────────────────── */

export function updateAccountProfile(updates: ProfileUpdate): Result {
  return mutate((account) => {
    const ownerName = updates.ownerName.trim();
    const businessName = updates.businessName.trim();
    const aiName = updates.aiName.trim();
    if (!ownerName || !businessName || !aiName) {
      return "Name, business, and AI name are required.";
    }
    const biz = activeBusiness(account);
    const businesses = account.businesses.map((b) =>
      b.id === biz.id
        ? {
            ...b,
            name: businessName,
            industry: updates.industry.trim() || b.industry,
            aiName,
            aiPersonality: updates.aiPersonality.trim() || b.aiPersonality,
            aiRole: updates.aiRole.trim() || b.aiRole,
          }
        : b,
    );
    let next: UserAccount = {
      ...account,
      personal: { ...account.personal, fullName: ownerName },
      businesses,
    };
    next = pushActivity(next, "Profile updated", "Personal + business basics saved.");
    return next;
  });
}

export function updatePersonalProfile(patch: Partial<PersonalProfile>): Result {
  return mutate((account) => {
    let next: UserAccount = {
      ...account,
      personal: { ...account.personal, ...patch, email: account.email },
    };
    next = pushActivity(next, "Personal profile updated", "Contact & preferences saved.");
    return next;
  });
}

export function updateBusinessProfile(businessId: string, patch: Partial<BusinessProfile>): Result {
  return mutate((account) => {
    if (!account.businesses.some((b) => b.id === businessId)) return "Business not found.";
    const businesses = account.businesses.map((b) =>
      b.id === businessId ? { ...b, ...patch, id: b.id, createdAt: b.createdAt } : b,
    );
    let next: UserAccount = { ...account, businesses };
    next = pushActivity(next, "Business profile updated", businessId);
    return next;
  });
}

export function addBusiness(name: string, industry: string): Result {
  return mutate((account) => {
    const trimmed = name.trim();
    if (!trimmed) return "Enter a business name.";
    const business = defaultBusiness({
      name: trimmed,
      industry: industry || "HVAC",
      aiName: customEmployee.name,
      aiPersonality: "Friendly",
      email: account.email,
    });
    let next: UserAccount = {
      ...account,
      businesses: [...account.businesses, business],
      activeBusinessId: business.id,
    };
    next = pushActivity(next, "Business added", trimmed);
    return next;
  });
}

export function setActiveBusiness(businessId: string): Result {
  return mutate((account) => {
    if (!account.businesses.some((b) => b.id === businessId)) return "Business not found.";
    let next: UserAccount = { ...account, activeBusinessId: businessId };
    next = pushActivity(next, "Active business switched", businessId);
    return next;
  });
}

export function removeBusiness(businessId: string): Result {
  return mutate((account) => {
    if (account.businesses.length <= 1) return "Keep at least one business on the account.";
    const businesses = account.businesses.filter((b) => b.id !== businessId);
    let next: UserAccount = {
      ...account,
      businesses,
      activeBusinessId:
        account.activeBusinessId === businessId ? businesses[0].id : account.activeBusinessId,
    };
    next = pushActivity(next, "Business removed", businessId);
    return next;
  });
}

/* ─── Profits ───────────────────────────────────────────────────────────── */

export function addProfitEntry(amount: number, note: string): Result {
  return mutate((account) => {
    if (!Number.isFinite(amount) || amount === 0) return "Enter a non-zero profit amount.";
    const entry: ProfitEntry = {
      id: newId(),
      amount,
      note: note.trim() || (amount >= 0 ? "Profit added" : "Adjustment"),
      date: nowIso(),
    };
    return {
      ...account,
      profits: [entry, ...account.profits],
    };
  });
}

export function removeProfitEntry(entryId: string): Result {
  return mutate((account) => ({
    ...account,
    profits: account.profits.filter((p) => p.id !== entryId),
  }));
}

export function totalProfits(account: PublicAccount | null | undefined) {
  if (!account) return 0;
  return account.profits.reduce((sum, entry) => sum + entry.amount, 0);
}

/* ─── Cloud storage ─────────────────────────────────────────────────────── */

export function saveCloudItem(input: {
  kind: CloudKind;
  title: string;
  content: string;
  id?: string;
}): Result {
  return mutate((account) => {
    const title = input.title.trim();
    const content = input.content;
    if (!title) return "Title is required.";
    const stamp = nowIso();

    if (input.id) {
      const existing = account.cloudItems.find((c) => c.id === input.id && !c.deletedAt);
      if (!existing) return "Item not found.";
      const version: CloudVersion = {
        id: newId(),
        at: stamp,
        label: `v${existing.versions.length + 1}`,
        content: existing.content,
      };
      const cloudItems = account.cloudItems.map((c) =>
        c.id === input.id
          ? {
              ...c,
              title,
              content,
              updatedAt: stamp,
              versions: [version, ...c.versions].slice(0, 20),
            }
          : c,
      );
      return pushActivity({ ...account, cloudItems }, "Cloud item updated", title);
    }

    const item: CloudItem = {
      id: newId(),
      kind: input.kind,
      title,
      content,
      createdAt: stamp,
      updatedAt: stamp,
      versions: [{ id: newId(), at: stamp, label: "v1", content }],
      deletedAt: null,
      folderId: null,
      tagIds: [],
      favorite: false,
      archived: false,
      pinned: false,
    };
    return pushActivity(
      { ...account, cloudItems: [item, ...account.cloudItems] },
      "Cloud item saved",
      title,
    );
  });
}

export function deleteCloudItem(id: string): Result {
  return mutate((account) => {
    const cloudItems = account.cloudItems.map((c) =>
      c.id === id ? { ...c, deletedAt: nowIso() } : c,
    );
    return pushActivity({ ...account, cloudItems }, "Moved to trash", id);
  });
}

export function restoreCloudItem(id: string): Result {
  return mutate((account) => {
    const cloudItems = account.cloudItems.map((c) =>
      c.id === id ? { ...c, deletedAt: null, updatedAt: nowIso() } : c,
    );
    return pushActivity({ ...account, cloudItems }, "Restored from trash", id);
  });
}

export function restoreCloudVersion(itemId: string, versionId: string): Result {
  return mutate((account) => {
    const item = account.cloudItems.find((c) => c.id === itemId);
    if (!item) return "Item not found.";
    const version = item.versions.find((v) => v.id === versionId);
    if (!version) return "Version not found.";
    const stamp = nowIso();
    const cloudItems = account.cloudItems.map((c) =>
      c.id === itemId
        ? {
            ...c,
            content: version.content,
            updatedAt: stamp,
            versions: [
              {
                id: newId(),
                at: stamp,
                label: `restore-${version.label}`,
                content: c.content,
              },
              ...c.versions,
            ].slice(0, 20),
          }
        : c,
    );
    return pushActivity({ ...account, cloudItems }, "Version restored", version.label);
  });
}

export function runCloudBackup(): Result {
  return mutate((account) => {
    let next = pushActivity(account, "Cloud backup", `Backed up ${account.cloudItems.length} items.`);
    next = pushAlert(next, "Backup complete", "Automatic cloud backup finished for this device vault.", "info");
    return next;
  });
}

/* ─── Memory ────────────────────────────────────────────────────────────── */

export function addMemory(input: {
  kind: MemoryKind;
  title: string;
  content: string;
  approved?: boolean;
}): Result {
  return mutate((account) => {
    if (!account.security.permissions.allowMemoryWrite) {
      return "Memory writes are disabled in permissions.";
    }
    const title = input.title.trim();
    const content = input.content.trim();
    if (!title || !content) return "Title and content are required.";
    const stamp = nowIso();
    const memory: MemoryItem = {
      id: newId(),
      kind: input.kind,
      title,
      content,
      approved: input.kind === "long-term" ? Boolean(input.approved) : input.approved !== false,
      createdAt: stamp,
      updatedAt: stamp,
    };
    return pushActivity(
      { ...account, memories: [memory, ...account.memories] },
      "Memory saved",
      title,
    );
  });
}

export function updateMemory(
  id: string,
  patch: Partial<Pick<MemoryItem, "title" | "content" | "approved" | "kind">>,
): Result {
  return mutate((account) => {
    if (!account.memories.some((m) => m.id === id)) return "Memory not found.";
    const memories = account.memories.map((m) =>
      m.id === id ? { ...m, ...patch, updatedAt: nowIso() } : m,
    );
    return pushActivity({ ...account, memories }, "Memory updated", id);
  });
}

export function deleteMemory(id: string): Result {
  return mutate((account) => {
    const memories = account.memories.filter((m) => m.id !== id);
    return pushActivity({ ...account, memories }, "Memory deleted", id);
  });
}

/* ─── Security / devices / sessions ─────────────────────────────────────── */

export function updateSecuritySettings(patch: Partial<SecuritySettings>): Result {
  return mutate((account) => {
    let security = { ...account.security, ...patch };
    if (patch.twoFactorEnabled === true && !account.security.twoFactorEnabled) {
      security = {
        ...security,
        twoFactorEnabled: true,
        twoFactorCode: DEMO_2FA_CODE,
        recoveryCodes: [newId().slice(0, 8), newId().slice(0, 8), newId().slice(0, 8)],
      };
    }
    if (patch.permissions) {
      security.permissions = { ...account.security.permissions, ...patch.permissions };
    }
    let next: UserAccount = { ...account, security };
    next = pushActivity(next, "Security settings updated", Object.keys(patch).join(", "));
    if (patch.twoFactorEnabled === true) {
      next = pushAlert(next, "2FA enabled", `Authenticator code for demo: ${DEMO_2FA_CODE}`, "warn");
    }
    return next;
  });
}

export function revokeSession(sessionId: string): Result {
  return mutate((account) => {
    const session = account.sessions.find((s) => s.id === sessionId);
    if (!session) return "Session not found.";
    if (session.current) return "Use Sign out to end the current session.";
    const sessions = account.sessions.filter((s) => s.id !== sessionId);
    return pushActivity({ ...account, sessions }, "Session revoked", session.deviceName);
  });
}

export function revokeOtherSessions(): Result {
  return mutate((account) => {
    const sessions = account.sessions.filter((s) => s.current);
    return pushActivity({ ...account, sessions }, "Sessions revoked", "Signed out other devices.");
  });
}

export function setDeviceTrusted(deviceId: string, trusted: boolean): Result {
  return mutate((account) => {
    const devices = account.devices.map((d) => (d.id === deviceId ? { ...d, trusted } : d));
    return pushActivity(
      { ...account, devices },
      trusted ? "Device trusted" : "Device untrusted",
      deviceId,
    );
  });
}

export function removeDevice(deviceId: string): Result {
  return mutate((account) => {
    const device = account.devices.find((d) => d.id === deviceId);
    if (!device) return "Device not found.";
    if (device.current) return "Can’t remove the device you’re using. Sign out instead.";
    const devices = account.devices.filter((d) => d.id !== deviceId);
    const sessions = account.sessions.filter((s) => s.deviceId !== deviceId);
    return pushActivity({ ...account, devices, sessions }, "Device removed", device.name);
  });
}

export function markAlertsRead(): Result {
  return mutate((account) => ({
    ...account,
    securityAlerts: account.securityAlerts.map((a) => ({ ...a, read: true })),
  }));
}

export function touchSessionActivity(): void {
  const id = getSessionUserId();
  if (!id) return;
  const account = getAccountById(id);
  if (!account) return;
  const stamp = nowIso();
  const sessions = account.sessions.map((s) =>
    s.current ? { ...s, lastActiveAt: stamp } : s,
  );
  const devices = account.devices.map((d) =>
    d.current ? { ...d, lastSeenAt: stamp } : d,
  );
  saveAccount({ ...account, sessions, devices });
}

export function demoDefaults() {
  return {
    ownerName: owner.name,
    businessName: owner.business,
    aiName: customEmployee.name,
    aiRole: customEmployee.role,
    aiPersonality: "Friendly",
  };
}

export function formatMoney(amount: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return amount < 0 ? `−${formatted}` : formatted;
}

export function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function pushAudit(account: UserAccount, action: string, detail: string): UserAccount {
  const entry: AuditLogEntry = {
    id: newId(),
    at: nowIso(),
    actor: account.personal.fullName || account.email,
    action,
    detail,
  };
  return { ...account, auditLogs: [entry, ...account.auditLogs].slice(0, 100) };
}

/* ─── Organization ──────────────────────────────────────────────────────── */

export function createFolder(name: string): Result {
  return mutate((account) => {
    const trimmed = name.trim();
    if (!trimmed) return "Folder name is required.";
    if (account.folders.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      return "A folder with that name already exists.";
    }
    const folder: OrgFolder = { id: newId(), name: trimmed, createdAt: nowIso() };
    let next: UserAccount = { ...account, folders: [...account.folders, folder] };
    next = pushActivity(next, "Folder created", trimmed);
    return next;
  });
}

export function deleteFolder(folderId: string): Result {
  return mutate((account) => {
    if (!account.folders.some((f) => f.id === folderId)) return "Folder not found.";
    const cloudItems = account.cloudItems.map((c) =>
      c.folderId === folderId ? { ...c, folderId: null } : c,
    );
    let next: UserAccount = {
      ...account,
      folders: account.folders.filter((f) => f.id !== folderId),
      cloudItems,
    };
    next = pushActivity(next, "Folder deleted", folderId);
    return next;
  });
}

export function createTag(name: string, color = "#2f8f8a"): Result {
  return mutate((account) => {
    const trimmed = name.trim();
    if (!trimmed) return "Tag name is required.";
    const tag: OrgTag = { id: newId(), name: trimmed, color };
    let next: UserAccount = { ...account, tags: [...account.tags, tag] };
    next = pushActivity(next, "Tag created", trimmed);
    return next;
  });
}

export function deleteTag(tagId: string): Result {
  return mutate((account) => {
    if (!account.tags.some((t) => t.id === tagId)) return "Tag not found.";
    const cloudItems = account.cloudItems.map((c) => ({
      ...c,
      tagIds: c.tagIds.filter((id) => id !== tagId),
    }));
    let next: UserAccount = {
      ...account,
      tags: account.tags.filter((t) => t.id !== tagId),
      cloudItems,
    };
    next = pushActivity(next, "Tag deleted", tagId);
    return next;
  });
}

export function updateCloudOrganization(
  itemId: string,
  patch: Partial<Pick<CloudItem, "folderId" | "tagIds" | "favorite" | "archived" | "pinned">>,
): Result {
  return mutate((account) => {
    if (!account.cloudItems.some((c) => c.id === itemId)) return "Item not found.";
    const cloudItems = account.cloudItems.map((c) =>
      c.id === itemId ? { ...c, ...patch, updatedAt: nowIso() } : c,
    );
    return pushActivity({ ...account, cloudItems }, "Item organization updated", itemId);
  });
}

export type SearchHit = {
  id: string;
  source: "cloud" | "memory" | "knowledge" | "chat";
  title: string;
  snippet: string;
};

export function searchEverything(query: string): SearchHit[] {
  const account = getCurrentAccount();
  if (!account) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];

  for (const item of account.cloudItems) {
    if (`${item.title} ${item.content} ${item.kind}`.toLowerCase().includes(q)) {
      hits.push({
        id: item.id,
        source: "cloud",
        title: item.title,
        snippet: item.deletedAt
          ? "In trash"
          : item.archived
            ? "Archived"
            : item.content.slice(0, 120),
      });
    }
  }
  for (const memory of account.memories) {
    if (`${memory.title} ${memory.content}`.toLowerCase().includes(q)) {
      hits.push({
        id: memory.id,
        source: "memory",
        title: memory.title,
        snippet: memory.content.slice(0, 120),
      });
    }
  }
  for (const article of account.knowledgeBase) {
    if (`${article.title} ${article.content}`.toLowerCase().includes(q)) {
      hits.push({
        id: article.id,
        source: "knowledge",
        title: article.title,
        snippet: article.content.slice(0, 120),
      });
    }
  }
  for (const message of account.teamChat) {
    if (message.text.toLowerCase().includes(q)) {
      hits.push({
        id: message.id,
        source: "chat",
        title: `${message.authorName} in chat`,
        snippet: message.text.slice(0, 120),
      });
    }
  }
  return hits.slice(0, 40);
}

/* ─── Notifications ─────────────────────────────────────────────────────── */

export function updateNotificationSettings(patch: Partial<NotificationSettings>): Result {
  return mutate((account) => {
    const notifications: NotificationSettings = {
      ...account.notifications,
      ...patch,
      categories: {
        ...account.notifications.categories,
        ...(patch.categories || {}),
      },
    };
    let next: UserAccount = { ...account, notifications };
    next = pushActivity(next, "Notification settings updated", Object.keys(patch).join(", "));
    return next;
  });
}

export function setDoNotDisturb(enabled: boolean, hours = 2): Result {
  return mutate((account) => {
    const until = enabled ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;
    let next: UserAccount = {
      ...account,
      notifications: {
        ...account.notifications,
        doNotDisturb: enabled,
        dndUntil: until,
      },
    };
    next = pushActivity(
      next,
      enabled ? "Do Not Disturb on" : "Do Not Disturb off",
      enabled ? `Until ${until}` : "Notifications resumed",
    );
    return next;
  });
}

/* ─── Team ──────────────────────────────────────────────────────────────── */

export function inviteTeamMember(name: string, emailRaw: string, role: TeamRole): Result {
  return mutate((account) => {
    if (!account.security.permissions.allowTeamInvite) {
      return "Team invites are disabled in permissions.";
    }
    const email = normalizeEmail(emailRaw);
    const trimmed = name.trim();
    if (!trimmed || !email.includes("@")) return "Name and valid email are required.";
    if (role === "owner") return "Owner role can’t be assigned by invite.";
    if (account.teamMembers.some((m) => m.email === email)) {
      return "That person is already on the team.";
    }
    const member: TeamMember = {
      id: newId(),
      name: trimmed,
      email,
      role,
      status: "invited",
      invitedAt: nowIso(),
      joinedAt: null,
    };
    let next: UserAccount = { ...account, teamMembers: [...account.teamMembers, member] };
    next = pushActivity(next, "Team invite sent", `${trimmed} as ${role}`);
    next = pushAudit(next, "Member invited", `${trimmed} (${email}) → ${role}`);
    if (next.notifications.categories.team) {
      next = pushAlert(next, "Team invite sent", `${trimmed} was invited as ${role}.`, "info");
    }
    return next;
  });
}

export function updateTeamMemberRole(memberId: string, role: TeamRole): Result {
  return mutate((account) => {
    const member = account.teamMembers.find((m) => m.id === memberId);
    if (!member) return "Team member not found.";
    if (member.role === "owner") return "Can’t change the owner’s role.";
    if (role === "owner") return "Transfer ownership isn’t available in this demo.";
    const teamMembers = account.teamMembers.map((m) =>
      m.id === memberId ? { ...m, role, status: "active" as const, joinedAt: m.joinedAt || nowIso() } : m,
    );
    let next: UserAccount = { ...account, teamMembers };
    next = pushAudit(next, "Role updated", `${member.name} → ${role}`);
    return next;
  });
}

export function removeTeamMember(memberId: string): Result {
  return mutate((account) => {
    const member = account.teamMembers.find((m) => m.id === memberId);
    if (!member) return "Team member not found.";
    if (member.role === "owner") return "Can’t remove the account owner.";
    let next: UserAccount = {
      ...account,
      teamMembers: account.teamMembers.filter((m) => m.id !== memberId),
    };
    next = pushAudit(next, "Member removed", member.email);
    return next;
  });
}

export function createWorkspace(name: string, description: string): Result {
  return mutate((account) => {
    const trimmed = name.trim();
    if (!trimmed) return "Workspace name is required.";
    const workspace: SharedWorkspace = {
      id: newId(),
      name: trimmed,
      description: description.trim(),
      createdAt: nowIso(),
    };
    let next: UserAccount = { ...account, workspaces: [...account.workspaces, workspace] };
    next = pushAudit(next, "Workspace created", trimmed);
    return next;
  });
}

export function addKnowledgeArticle(workspaceId: string, title: string, content: string): Result {
  return mutate((account) => {
    if (!account.workspaces.some((w) => w.id === workspaceId)) return "Workspace not found.";
    const trimmed = title.trim();
    if (!trimmed || !content.trim()) return "Title and content are required.";
    const stamp = nowIso();
    const article: KnowledgeArticle = {
      id: newId(),
      workspaceId,
      title: trimmed,
      content: content.trim(),
      createdAt: stamp,
      updatedAt: stamp,
    };
    let next: UserAccount = {
      ...account,
      knowledgeBase: [article, ...account.knowledgeBase],
    };
    next = pushAudit(next, "Knowledge article added", trimmed);
    return next;
  });
}

export function sendTeamChat(workspaceId: string, text: string): Result {
  return mutate((account) => {
    if (!account.workspaces.some((w) => w.id === workspaceId)) return "Workspace not found.";
    const trimmed = text.trim();
    if (!trimmed) return "Message can’t be empty.";
    const message: TeamChatMessage = {
      id: newId(),
      workspaceId,
      authorName: account.personal.fullName || account.email,
      text: trimmed,
      at: nowIso(),
    };
    return {
      ...account,
      teamChat: [...account.teamChat, message].slice(-100),
    };
  });
}

/* ─── App settings / billing / API keys ─────────────────────────────────── */

export function updateAppSettings(patch: Partial<AppSettings>): Result {
  return mutate((account) => {
    const appSettings: AppSettings = {
      ...account.appSettings,
      ...patch,
      privacy: {
        ...account.appSettings.privacy,
        ...(patch.privacy || {}),
      },
      billing: {
        ...account.appSettings.billing,
        ...(patch.billing || {}),
      },
      connectedApps: patch.connectedApps || account.appSettings.connectedApps,
      apiKeys: patch.apiKeys || account.appSettings.apiKeys,
    };
    let next: UserAccount = { ...account, appSettings };
    next = pushActivity(next, "App settings updated", Object.keys(patch).join(", "));
    return next;
  });
}

export function setConnectedApp(appId: string, connected: boolean): Result {
  return mutate((account) => {
    const connectedApps = account.appSettings.connectedApps.map((app) =>
      app.id === appId
        ? { ...app, connected, connectedAt: connected ? nowIso() : null }
        : app,
    );
    let next: UserAccount = {
      ...account,
      appSettings: { ...account.appSettings, connectedApps },
    };
    next = pushAudit(next, connected ? "App connected" : "App disconnected", appId);
    return next;
  });
}

export function updateBilling(patch: Partial<BillingInfo>): Result {
  return mutate((account) => {
    const billing: BillingInfo = {
      ...account.appSettings.billing,
      ...patch,
      plan: migratePlan(patch.plan || account.appSettings.billing.plan),
      usage: { ...account.appSettings.billing.usage, ...(patch.usage || {}) },
      paymentMethods: patch.paymentMethods || account.appSettings.billing.paymentMethods,
      invoices: patch.invoices || account.appSettings.billing.invoices,
    };
    let next: UserAccount = {
      ...account,
      appSettings: { ...account.appSettings, billing },
    };
    next = pushAudit(next, "Billing updated", `${billing.plan} · ${billing.status}`);
    if (account.notifications.categories.billing) {
      next = pushAlert(next, "Subscription updated", `Plan is now ${billing.plan}.`, "info");
    }
    return next;
  });
}

export function createApiKey(name: string): Result {
  return mutate((account) => {
    const trimmed = name.trim();
    if (!trimmed) return "API key name is required.";
    const secret = newId().replace(/-/g, "");
    const key: ApiKeyRecord = {
      id: newId(),
      name: trimmed,
      prefix: `atk_${secret.slice(0, 8)}`,
      secretHint: `${secret.slice(0, 4)}…${secret.slice(-4)}`,
      createdAt: nowIso(),
      lastUsedAt: null,
    };
    let next: UserAccount = {
      ...account,
      appSettings: {
        ...account.appSettings,
        apiKeys: [key, ...account.appSettings.apiKeys],
      },
    };
    next = pushAudit(next, "API key created", key.prefix);
    return next;
  });
}

export function revokeApiKey(keyId: string): Result {
  return mutate((account) => {
    if (!account.appSettings.apiKeys.some((k) => k.id === keyId)) return "API key not found.";
    let next: UserAccount = {
      ...account,
      appSettings: {
        ...account.appSettings,
        apiKeys: account.appSettings.apiKeys.filter((k) => k.id !== keyId),
      },
    };
    next = pushAudit(next, "API key revoked", keyId);
    return next;
  });
}

export function exportAccountData(): { ok: true; json: string } | { ok: false; error: string } {
  const account = getCurrentAccount();
  if (!account) return { ok: false, error: "You’re not signed in." };
  if (!account.security.permissions.allowExport) {
    return { ok: false, error: "Data export is disabled in permissions." };
  }
  return { ok: true, json: JSON.stringify(account, null, 2) };
}

export function deleteAccountData(): Result {
  return mutate((account) => {
    let next: UserAccount = {
      ...account,
      profits: [],
      cloudItems: [],
      memories: [],
      knowledgeBase: [],
      teamChat: [],
      folders: defaultOrgMeta(account.personal.fullName, account.email).folders,
      tags: [],
      appSettings: {
        ...account.appSettings,
        apiKeys: [],
      },
    };
    next = pushAlert(next, "Data deleted", "Vault content was wiped from this device.", "critical");
    next = pushAudit(next, "Data deletion", "User requested local data wipe.");
    return next;
  });
}

export const VOICE_OPTIONS = [
  { id: "atlas-warm", label: "Atlas Warm" },
  { id: "atlas-clear", label: "Atlas Clear" },
  { id: "atlas-calm", label: "Atlas Calm" },
  { id: "atlas-bright", label: "Atlas Bright" },
];

export const PLAN_TIERS: { id: PlanTier; label: string; price: string; blurb: string }[] = [
  { id: "free", label: "Free", price: "$0", blurb: "Core AI workspace for solo trials." },
  { id: "pro", label: "Pro", price: "$49", blurb: "Saved prompts, sync, and richer memory." },
  { id: "business", label: "Business", price: "$149", blurb: "Team seats, shared chats, audit logs." },
  { id: "enterprise", label: "Enterprise", price: "Custom", blurb: "SSO-ready controls and dedicated support." },
];

/* ─── AI Workspace ──────────────────────────────────────────────────────── */

export function saveDraftText(text: string): Result {
  return mutate((account) => {
    if (!account.reliability.autoSave) return account;
    return {
      ...account,
      aiWorkspace: { ...account.aiWorkspace, draftText: text },
    };
  });
}

export function createAiChat(title: string, firstMessage: string, projectId?: string | null): Result {
  return mutate((account) => {
    const stamp = nowIso();
    const chat: AiChat = {
      id: newId(),
      title: title.trim() || firstMessage.slice(0, 48) || "New chat",
      preview: firstMessage.slice(0, 80),
      messages: [
        { role: "user", text: firstMessage },
        { role: "ai", text: "Got it — I’ll keep this in your AI workspace." },
      ],
      projectId: projectId ?? null,
      shared: false,
      updatedAt: stamp,
      createdAt: stamp,
    };
    let next: UserAccount = {
      ...account,
      aiWorkspace: {
        ...account.aiWorkspace,
        chats: [chat, ...account.aiWorkspace.chats],
        draftChatId: chat.id,
        draftText: "",
      },
      analytics: {
        ...account.analytics,
        aiRequests: account.analytics.aiRequests + 1,
        tasksCompleted: account.analytics.tasksCompleted + 1,
      },
    };
    next = pushActivity(next, "Chat created", chat.title);
    return next;
  });
}

export function toggleChatShared(chatId: string): Result {
  return mutate((account) => {
    const chats = account.aiWorkspace.chats.map((c) =>
      c.id === chatId ? { ...c, shared: !c.shared, updatedAt: nowIso() } : c,
    );
    return {
      ...account,
      aiWorkspace: { ...account.aiWorkspace, chats },
    };
  });
}

export function savePrompt(title: string, body: string, library = false): Result {
  return mutate((account) => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) return "Title and prompt body are required.";
    const prompt: SavedPrompt = {
      id: newId(),
      title: trimmedTitle,
      body: trimmedBody,
      library,
      createdAt: nowIso(),
    };
    return {
      ...account,
      aiWorkspace: {
        ...account.aiWorkspace,
        prompts: [prompt, ...account.aiWorkspace.prompts],
      },
    };
  });
}

export function deletePrompt(promptId: string): Result {
  return mutate((account) => ({
    ...account,
    aiWorkspace: {
      ...account.aiWorkspace,
      prompts: account.aiWorkspace.prompts.filter((p) => p.id !== promptId),
    },
  }));
}

export function addGeneratedFile(title: string, kind: string, content: string): Result {
  return mutate((account) => {
    if (!title.trim() || !content.trim()) return "Title and content are required.";
    const file: GeneratedFile = {
      id: newId(),
      title: title.trim(),
      kind: kind.trim() || "document",
      content: content.trim(),
      createdAt: nowIso(),
    };
    return {
      ...account,
      aiWorkspace: {
        ...account.aiWorkspace,
        generatedFiles: [file, ...account.aiWorkspace.generatedFiles],
      },
    };
  });
}

export function createProjectWorkspace(name: string, description: string): Result {
  return mutate((account) => {
    const trimmed = name.trim();
    if (!trimmed) return "Project name is required.";
    const project: ProjectWorkspace = {
      id: newId(),
      name: trimmed,
      description: description.trim(),
      createdAt: nowIso(),
    };
    return {
      ...account,
      aiWorkspace: {
        ...account.aiWorkspace,
        projects: [...account.aiWorkspace.projects, project],
      },
    };
  });
}

/* ─── Reliability ───────────────────────────────────────────────────────── */

export function updateReliability(patch: Partial<ReliabilitySettings>): Result {
  return mutate((account) => {
    let next: UserAccount = {
      ...account,
      reliability: { ...account.reliability, ...patch },
    };
    next = pushActivity(next, "Reliability settings updated", Object.keys(patch).join(", "));
    return next;
  });
}

export function runDeviceSync(): Result {
  return mutate((account) => {
    let next: UserAccount = {
      ...account,
      reliability: {
        ...account.reliability,
        lastSyncedAt: nowIso(),
        lastError: null,
      },
    };
    next = pushAlert(next, "Devices synced", "Workspace synced across signed-in devices (demo).", "info");
    return next;
  });
}

export function simulateErrorRecovery(): Result {
  return mutate((account) => {
    const stamp = nowIso();
    let next: UserAccount = {
      ...account,
      reliability: {
        ...account.reliability,
        lastError: "Network blip while saving draft",
        recoveredAt: stamp,
        lastSyncedAt: stamp,
      },
      aiWorkspace: {
        ...account.aiWorkspace,
        draftText: account.aiWorkspace.draftText || "Recovered unsaved draft from local cache.",
      },
    };
    next = pushAlert(next, "Error recovered", "Draft restored after a transient failure.", "warn");
    return next;
  });
}

/* ─── Developer hub ─────────────────────────────────────────────────────── */

export function addWebhook(url: string, eventsCsv: string): Result {
  return mutate((account) => {
    const trimmed = url.trim();
    if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
      return "Enter a valid webhook URL.";
    }
    const events = eventsCsv
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const hook: WebhookEndpoint = {
      id: newId(),
      url: trimmed,
      events: events.length ? events : ["chat.completed", "invoice.created"],
      active: true,
      createdAt: nowIso(),
    };
    let next: UserAccount = {
      ...account,
      developer: {
        ...account.developer,
        webhooks: [hook, ...account.developer.webhooks],
      },
    };
    next = pushAudit(next, "Webhook added", trimmed);
    return next;
  });
}

export function removeWebhook(id: string): Result {
  return mutate((account) => ({
    ...account,
    developer: {
      ...account.developer,
      webhooks: account.developer.webhooks.filter((w) => w.id !== id),
    },
  }));
}

export function togglePlugin(pluginId: string): Result {
  return mutate((account) => {
    const plugins = account.developer.plugins.map((p) =>
      p.id === pluginId ? { ...p, enabled: !p.enabled } : p,
    );
    return {
      ...account,
      developer: { ...account.developer, plugins },
    };
  });
}

export function runSandboxTest(detail: string): Result {
  return mutate((account) => {
    const entry = {
      id: newId(),
      at: nowIso(),
      detail: detail.trim() || "Sandbox request OK · 200 · 42ms",
    };
    return {
      ...account,
      developer: {
        ...account.developer,
        sandboxLog: [entry, ...account.developer.sandboxLog].slice(0, 20),
        docsVisited: true,
      },
    };
  });
}

/* ─── Billing extras ────────────────────────────────────────────────────── */

export function addPaymentMethod(brand: string, last4: string): Result {
  return mutate((account) => {
    if (!/^\d{4}$/.test(last4.trim())) return "Enter the last 4 digits.";
    const method: PaymentMethod = {
      id: newId(),
      brand: brand.trim() || "Card",
      last4: last4.trim(),
      expMonth: 1,
      expYear: new Date().getFullYear() + 3,
      isDefault: account.appSettings.billing.paymentMethods.length === 0,
    };
    const billing = {
      ...account.appSettings.billing,
      paymentMethods: [...account.appSettings.billing.paymentMethods, method],
    };
    return {
      ...account,
      appSettings: { ...account.appSettings, billing },
    };
  });
}

export function applyReferralCredit(): Result {
  return mutate((account) => {
    const billing = {
      ...account.appSettings.billing,
      referralCredits: account.appSettings.billing.referralCredits + 25,
    };
    let next: UserAccount = {
      ...account,
      appSettings: { ...account.appSettings, billing },
    };
    next = pushAlert(next, "Referral credit applied", "+$25 demo credit added.", "info");
    return next;
  });
}

/* ─── Analytics ─────────────────────────────────────────────────────────── */

export function submitAccuracyFeedback(rating: number, note: string): Result {
  return mutate((account) => {
    if (rating < 1 || rating > 5) return "Rating must be 1–5.";
    const entry = {
      id: newId(),
      at: nowIso(),
      rating,
      note: note.trim() || "No note",
    };
    const feedback = [entry, ...account.analytics.feedback].slice(0, 50);
    const avg =
      feedback.reduce((sum, item) => sum + item.rating, 0) / Math.max(feedback.length, 1);
    return {
      ...account,
      analytics: {
        ...account.analytics,
        feedback,
        accuracyScore: Math.round((avg / 5) * 100),
      },
    };
  });
}

export { DEMO_2FA_CODE };
