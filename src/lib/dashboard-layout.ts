export type DashboardMode = "work" | "personal";

export type WidgetSize = "sm" | "md" | "lg";

export type DashboardPresetId = "ceo" | "sales" | "operations" | "custom";

export type DashboardWidgetId =
  | "welcome"
  | "stats"
  | "starter"
  | "command"
  | "overnight"
  | "jump"
  | "tasks"
  | "tax"
  | "calendar"
  | "notes"
  | "revenue"
  | "business_health"
  | "ask_atlas"
  | "sales_pipeline"
  | "employees"
  | "inventory_alerts"
  | "customer_activity"
  | "reputation"
  | "security_alerts"
  | "purchases"
  | "marketing"
  | "route_status";

export type DashboardWidget = {
  id: DashboardWidgetId;
  label: string;
  visible: boolean;
  size: WidgetSize;
  order: number;
};

export type DashboardLayout = {
  mode: DashboardMode;
  preset: DashboardPresetId;
  defaultPage: string;
  layouts: Record<DashboardMode, DashboardWidget[]>;
  savedAt: string | null;
};

const STORAGE_KEY = "atlas-dashboard-layout-v2";

export const WIDGET_CATALOG: Record<DashboardWidgetId, { label: string; defaultSize: WidgetSize }> = {
  welcome: { label: "Welcome", defaultSize: "lg" },
  stats: { label: "Key stats", defaultSize: "lg" },
  starter: { label: "Starter tiles", defaultSize: "md" },
  command: { label: "Talk to Atlas", defaultSize: "lg" },
  overnight: { label: "Overnight feed", defaultSize: "md" },
  jump: { label: "Jump links", defaultSize: "md" },
  tasks: { label: "Tasks", defaultSize: "md" },
  tax: { label: "Tax snapshot", defaultSize: "md" },
  calendar: { label: "Calendar", defaultSize: "md" },
  notes: { label: "Quick capture", defaultSize: "sm" },
  revenue: { label: "Revenue", defaultSize: "md" },
  business_health: { label: "Business Health", defaultSize: "md" },
  ask_atlas: { label: "Ask Atlas", defaultSize: "lg" },
  sales_pipeline: { label: "Sales Pipeline", defaultSize: "md" },
  employees: { label: "Employees", defaultSize: "md" },
  inventory_alerts: { label: "Inventory Alerts", defaultSize: "sm" },
  customer_activity: { label: "Customer Activity", defaultSize: "md" },
  reputation: { label: "Reputation", defaultSize: "sm" },
  security_alerts: { label: "Security Alerts", defaultSize: "sm" },
  purchases: { label: "Purchases", defaultSize: "sm" },
  marketing: { label: "Marketing", defaultSize: "md" },
  route_status: { label: "Route Status", defaultSize: "md" },
};

export const DEFAULT_PAGE_OPTIONS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/appointments", label: "Calendar" },
  { href: "/app/tasks", label: "Tasks" },
  { href: "/app/ask", label: "Ask Atlas" },
  { href: "/app/tax", label: "Tax Center" },
  { href: "/app/notes", label: "Quick capture" },
  { href: "/app/contacts", label: "Contacts" },
];

export const DASHBOARD_PRESETS: Record<
  DashboardPresetId,
  { label: string; description: string; widgetIds: DashboardWidgetId[] }
> = {
  ceo: {
    label: "CEO Dashboard",
    description: "Revenue, health, approvals, and strategic signals.",
    widgetIds: ["welcome", "revenue", "business_health", "stats", "ask_atlas", "tasks", "security_alerts", "jump"],
  },
  sales: {
    label: "Sales Dashboard",
    description: "Pipeline, customers, and reputation.",
    widgetIds: ["sales_pipeline", "customer_activity", "reputation", "tasks", "calendar", "ask_atlas", "marketing"],
  },
  operations: {
    label: "Operations Dashboard",
    description: "Routes, inventory, purchases, and team workload.",
    widgetIds: ["route_status", "inventory_alerts", "purchases", "employees", "tasks", "calendar", "command"],
  },
  custom: {
    label: "Custom",
    description: "Your saved layout.",
    widgetIds: [],
  },
};

function widget(
  id: DashboardWidgetId,
  visible: boolean,
  size?: WidgetSize,
  order = 0,
): DashboardWidget {
  const meta = WIDGET_CATALOG[id];
  return { id, label: meta.label, visible, size: size ?? meta.defaultSize, order };
}

function layoutFromIds(ids: DashboardWidgetId[], visibleIds: DashboardWidgetId[]): DashboardWidget[] {
  const allIds = Object.keys(WIDGET_CATALOG) as DashboardWidgetId[];
  const ordered = [...visibleIds, ...allIds.filter((id) => !visibleIds.includes(id))];
  return ordered.map((id, order) => widget(id, visibleIds.includes(id), undefined, order));
}

function baseWidgets(mode: DashboardMode): DashboardWidget[] {
  if (mode === "personal") {
    return layoutFromIds(
      Object.keys(WIDGET_CATALOG) as DashboardWidgetId[],
      ["welcome", "notes", "calendar", "tasks", "command", "starter", "jump"],
    );
  }
  return layoutFromIds(
    Object.keys(WIDGET_CATALOG) as DashboardWidgetId[],
    ["welcome", "stats", "business_health", "ask_atlas", "tasks", "calendar", "starter", "jump"],
  );
}

export function recommendedWidgetIdsForIndustry(industry: string): DashboardWidgetId[] {
  const q = industry.toLowerCase();
  if (q.includes("field") || q.includes("hvac") || q.includes("plumb") || q.includes("service")) {
    return ["route_status", "inventory_alerts", "tasks", "calendar", "employees", "ask_atlas"];
  }
  if (q.includes("retail") || q.includes("store") || q.includes("shop")) {
    return ["revenue", "inventory_alerts", "customer_activity", "tasks", "marketing"];
  }
  if (q.includes("software") || q.includes("saas") || q.includes("tech")) {
    return ["sales_pipeline", "customer_activity", "tasks", "business_health", "ask_atlas"];
  }
  return ["welcome", "revenue", "business_health", "tasks", "ask_atlas", "calendar"];
}

export function applyIndustryRecommendation(industry: string): DashboardWidget[] {
  const ids = recommendedWidgetIdsForIndustry(industry);
  return layoutFromIds(Object.keys(WIDGET_CATALOG) as DashboardWidgetId[], ids);
}

export function defaultDashboardLayout(): DashboardLayout {
  return {
    mode: "work",
    preset: "custom",
    defaultPage: "/app",
    layouts: {
      work: baseWidgets("work"),
      personal: baseWidgets("personal"),
    },
    savedAt: null,
  };
}

export function loadDashboardLayout(): DashboardLayout {
  if (typeof window === "undefined") return defaultDashboardLayout();
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("atlas-dashboard-layout-v1");
    if (!raw) {
      const fresh = defaultDashboardLayout();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as DashboardLayout;
    const fresh = defaultDashboardLayout();
    return {
      ...fresh,
      ...parsed,
      preset: parsed.preset || "custom",
      layouts: {
        work: mergeWidgets(fresh.layouts.work, parsed.layouts?.work),
        personal: mergeWidgets(fresh.layouts.personal, parsed.layouts?.personal),
      },
    };
  } catch {
    return defaultDashboardLayout();
  }
}

function mergeWidgets(defaults: DashboardWidget[], saved?: DashboardWidget[]) {
  if (!saved?.length) return defaults;
  const byId = new Map(saved.map((w) => [w.id, w]));
  const merged = defaults.map((w) => {
    const prev = byId.get(w.id);
    return prev ? { ...w, ...prev, label: w.label } : w;
  });
  return merged.sort((a, b) => a.order - b.order);
}

export function saveDashboardLayout(layout: DashboardLayout): DashboardLayout {
  const next = { ...layout, savedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function activeWidgets(layout: DashboardLayout) {
  return [...layout.layouts[layout.mode]]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);
}

export function hiddenWidgets(layout: DashboardLayout) {
  return [...layout.layouts[layout.mode]]
    .filter((w) => !w.visible)
    .sort((a, b) => a.order - b.order);
}

export function moveWidget(layout: DashboardLayout, id: DashboardWidgetId, direction: -1 | 1): DashboardLayout {
  const list = [...layout.layouts[layout.mode]].sort((a, b) => a.order - b.order);
  const index = list.findIndex((w) => w.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return layout;
  const swapped = [...list];
  const tmp = swapped[index];
  swapped[index] = swapped[target];
  swapped[target] = tmp;
  const reordered = swapped.map((w, order) => ({ ...w, order }));
  return {
    ...layout,
    preset: "custom",
    layouts: { ...layout.layouts, [layout.mode]: reordered },
  };
}

export function reorderWidget(layout: DashboardLayout, fromIndex: number, toIndex: number): DashboardLayout {
  const list = [...layout.layouts[layout.mode]].sort((a, b) => a.order - b.order);
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) return layout;
  const swapped = [...list];
  const [item] = swapped.splice(fromIndex, 1);
  swapped.splice(toIndex, 0, item);
  const reordered = swapped.map((w, order) => ({ ...w, order }));
  return {
    ...layout,
    preset: "custom",
    layouts: { ...layout.layouts, [layout.mode]: reordered },
  };
}

export function patchWidget(
  layout: DashboardLayout,
  id: DashboardWidgetId,
  patch: Partial<Pick<DashboardWidget, "visible" | "size">>,
): DashboardLayout {
  const list = layout.layouts[layout.mode].map((w) => (w.id === id ? { ...w, ...patch } : w));
  return { ...layout, preset: "custom", layouts: { ...layout.layouts, [layout.mode]: list } };
}

export function setDashboardMode(layout: DashboardLayout, mode: DashboardMode): DashboardLayout {
  return { ...layout, mode };
}

export function setDefaultPage(layout: DashboardLayout, href: string): DashboardLayout {
  return { ...layout, defaultPage: href };
}

export function resetDashboardMode(layout: DashboardLayout): DashboardLayout {
  return {
    ...layout,
    preset: "custom",
    layouts: {
      ...layout.layouts,
      [layout.mode]: baseWidgets(layout.mode),
    },
  };
}

export function applyDashboardPreset(layout: DashboardLayout, preset: DashboardPresetId): DashboardLayout {
  if (preset === "custom") return layout;
  const def = DASHBOARD_PRESETS[preset];
  const widgets = layoutFromIds(Object.keys(WIDGET_CATALOG) as DashboardWidgetId[], def.widgetIds);
  return {
    ...layout,
    preset,
    layouts: { ...layout.layouts, [layout.mode]: widgets },
  };
}

export function addWidgetToLayout(layout: DashboardLayout, id: DashboardWidgetId): DashboardLayout {
  return patchWidget(layout, id, { visible: true });
}

export function availableWidgetsToAdd(layout: DashboardLayout) {
  return hiddenWidgets(layout);
}
