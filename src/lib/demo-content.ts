/**
 * Remaining demo/sample surfaces. Each entry must be replaced with API data
 * or stay explicitly labeled DEMO in the UI.
 */
export const DEMO_CONTENT = {
  dashboardOverview: "src/lib/data.ts — KPI fallback numbers",
  atlasBriefingItems: "src/lib/data.ts — unused after Home rewrite",
  attentionItems: "src/lib/data.ts — unused after Home rewrite",
  customers: "src/lib/data.ts — static CRM rows; live directory is /api/customers",
  performanceChart: "src/lib/data.ts — chart series, labeled DEMO if shown",
  localStorageKeys: [
    "atlas-database-v5",
    "atlas-tasks-v1",
    "atlas-tax-ledger-v1",
    "atlas-confirmations-v1",
  ],
} as const;
