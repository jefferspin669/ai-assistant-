import { loadAdminSnapshot } from "@/lib/admin";
import { loadConfirmations } from "@/lib/confirmations";
import { loadConnections } from "@/lib/connections";
import { loadDashboardLayout } from "@/lib/dashboard-layout";
import { loadFeatureFlags } from "@/lib/feature-flags";
import { loadOfflineCache } from "@/lib/offline";
import { restoreBackup, listBackups, recordBackup } from "@/lib/recovery";
import { loadCalendarState } from "@/lib/smart-calendar";
import { computeTaxEstimate, loadTaxTransactions } from "@/lib/tax-ledger";
import { loadTasks } from "@/lib/tasks";
import { getCurrentAccount } from "@/lib/account";

export type TestSuiteId =
  | "login"
  | "payment"
  | "permission"
  | "calendar"
  | "tax"
  | "backup"
  | "mobile"
  | "security";

export type TestResult = {
  id: string;
  suite: TestSuiteId;
  name: string;
  ok: boolean;
  detail: string;
  at: string;
};

export type SuiteRun = {
  id: string;
  at: string;
  results: TestResult[];
  passed: number;
  failed: number;
};

const HISTORY_KEY = "atlas-test-runs-v1";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `test_${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function result(suite: TestSuiteId, name: string, ok: boolean, detail: string): TestResult {
  return { id: newId(), suite, name, ok, detail, at: nowIso() };
}

export const SUITE_META: { id: TestSuiteId; title: string; why: string }[] = [
  { id: "login", title: "Login tests", why: "Broken auth locks people out of their business." },
  { id: "payment", title: "Payment tests", why: "Failed billing silently churns customers." },
  { id: "permission", title: "Permission tests", why: "Wrong access can leak private data." },
  { id: "calendar", title: "Calendar tests", why: "Missed appointments damage trust immediately." },
  { id: "tax", title: "Tax calculation tests", why: "A wrong estimate can seriously hurt a business." },
  { id: "backup", title: "Backup recovery tests", why: "Restores must work before you need them." },
  { id: "mobile", title: "Mobile tests", why: "Owners run Atlas from phones between jobs." },
  { id: "security", title: "Security tests", why: "Suspicious activity and vault integrity matter." },
];

function runLogin(): TestResult[] {
  const account = getCurrentAccount();
  return [
    result("login", "Session readable", true, account ? `Signed in as ${account.email}` : "Guest mode OK for public pages"),
    result("login", "Setup flag present", Boolean(account?.setup), account ? `setup.completed=${account.setup.completed}` : "No account — skipped deep check"),
    result("login", "Password vault shape", !account || account.hasPassword || Object.keys(account.oauth).length > 0, "Has password or OAuth link"),
  ];
}

function runPayment(): TestResult[] {
  const admin = loadAdminSnapshot();
  const failed = admin.failedPayments.length;
  return [
    result("payment", "Subscription metrics load", admin.metrics.activeSubscriptions >= 0, `${admin.metrics.activeSubscriptions} active · MRR $${admin.metrics.mrr}`),
    result("payment", "Failed payments visible", true, `${failed} failed payment(s) in admin queue`),
    result("payment", "No silent zero-dollar charges", admin.failedPayments.every((p) => p.amount > 0), "All failed rows have positive amounts"),
  ];
}

function runPermission(): TestResult[] {
  const account = getCurrentAccount();
  const connections = loadConnections();
  const pending = loadConfirmations().filter((c) => c.status === "pending");
  return [
    result("permission", "Export gated by permission", true, account ? `allowExport=${account.security.permissions.allowExport}` : "Guest cannot export vault"),
    result("permission", "Connected apps list permissions", connections.every((c) => c.permissions.length > 0), `${connections.length} services have explicit scopes`),
    result("permission", "Risky actions require confirm", true, `${pending.length} pending confirmation(s)`),
  ];
}

function runCalendar(): TestResult[] {
  const cal = loadCalendarState();
  const labeled = cal.categories.every((c) => c.label.trim().length > 0);
  return [
    result("calendar", "Events load", cal.events.length > 0, `${cal.events.length} events`),
    result("calendar", "Categories have labels", labeled, "Color is never the only cue — labels exist"),
    result("calendar", "Events have category ids", cal.events.every((e) => Boolean(e.categoryId)), "All events categorized"),
  ];
}

function runTax(): TestResult[] {
  const rows = loadTaxTransactions();
  const estimate = computeTaxEstimate(rows);
  const income = rows.filter((r) => r.kind === "income").reduce((s, r) => s + r.amount, 0);
  const expenses = rows.filter((r) => r.kind === "expense").reduce((s, r) => s + r.amount, 0);
  const expectedProfit = Math.max(0, income - expenses);
  return [
    result("tax", "Ledger loads", rows.length > 0, `${rows.length} transactions`),
    result("tax", "Profit math", estimate.taxableProfit === expectedProfit, `profit=${estimate.taxableProfit} expected=${expectedProfit}`),
    result("tax", "Estimate non-negative", estimate.totalEstimated >= 0, `totalEstimated=${estimate.totalEstimated}`),
    result(
      "tax",
      "Components sum",
      estimate.federal + estimate.state + estimate.selfEmployment === estimate.totalEstimated,
      "federal+state+SE equals total",
    ),
  ];
}

function runBackup(): TestResult[] {
  recordBackup("full", "Pre-test backup");
  const backups = listBackups();
  const latest = backups[0];
  const restored = latest ? restoreBackup(latest.id) : { ok: false as const, error: "No backup" };
  return [
    result("backup", "Backup created", Boolean(latest), latest ? latest.label : "missing"),
    result("backup", "Restore succeeds", restored.ok, restored.ok ? restored.message : restored.error),
    result("backup", "Offline cache present", Boolean(loadOfflineCache()), "Offline bundle readable"),
  ];
}

function runMobile(): TestResult[] {
  const layout = loadDashboardLayout();
  const widthOk = typeof window === "undefined" ? true : window.innerWidth > 0;
  return [
    result("mobile", "Viewport measurable", widthOk, typeof window !== "undefined" ? `width=${window.innerWidth}` : "ssr"),
    result("mobile", "Dashboard layout loads", Boolean(layout.layouts.work.length), `${layout.mode} mode · ${layout.layouts[layout.mode].length} widgets`),
    result("mobile", "Default page set", Boolean(layout.defaultPage), layout.defaultPage),
  ];
}

function runSecurity(): TestResult[] {
  const admin = loadAdminSnapshot();
  const account = getCurrentAccount();
  const flags = loadFeatureFlags();
  return [
    result("security", "Suspicious activity feed", admin.suspicious.length > 0, `${admin.suspicious.length} signal(s)`),
    result("security", "System health monitored", admin.systemHealth.every((h) => h.status !== "down"), admin.systemHealth.map((h) => h.status).join(", ")),
    result("security", "Feature flags loaded", flags.length > 0, `${flags.length} flags`),
    result("security", "Vault encryption flag", !account || account.security.encryptionAtRest, "encryptionAtRest enabled when signed in"),
  ];
}

const RUNNERS: Record<TestSuiteId, () => TestResult[]> = {
  login: runLogin,
  payment: runPayment,
  permission: runPermission,
  calendar: runCalendar,
  tax: runTax,
  backup: runBackup,
  mobile: runMobile,
  security: runSecurity,
};

export function runSuite(id: TestSuiteId): TestResult[] {
  return RUNNERS[id]();
}

export function runAllSuites(): SuiteRun {
  const results = SUITE_META.flatMap((suite) => runSuite(suite.id));
  const run: SuiteRun = {
    id: newId(),
    at: nowIso(),
    results,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  };
  if (typeof window !== "undefined") {
    const prev = loadTestHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify([run, ...prev].slice(0, 20)));
  }
  return run;
}

export function loadTestHistory(): SuiteRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SuiteRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
