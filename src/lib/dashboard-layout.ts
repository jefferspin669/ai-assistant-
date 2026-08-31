export type DashboardMode = "work" | "personal";

export type WidgetSize = "sm" | "md" | "lg";

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
  | "notes";

export type DashboardWidget = {
  id: DashboardWidgetId;
  label: string;
  visible: boolean;
  size: WidgetSize;
  order: number;
};

export type DashboardLayout = {
  mode: DashboardMode;
  defaultPage: string;
  layouts: Record<DashboardMode, DashboardWidget[]>;
  savedAt: string | null;
};

const STORAGE_KEY = "atlas-dashboard-layout-v1";

export const DEFAULT_PAGE_OPTIONS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/appointments", label: "Calendar" },
  { href: "/app/tasks", label: "Tasks" },
  { href: "/app/ask", label: "Ask Atlas" },
  { href: "/app/tax", label: "Tax Center" },
  { href: "/app/notes", label: "Quick capture" },
  { href: "/app/contacts", label: "Contacts" },
];

function baseWidgets(mode: DashboardMode): DashboardWidget[] {
  const work: DashboardWidget[] = [
    { id: "welcome", label: "Welcome", visible: true, size: "lg", order: 0 },
    { id: "stats", label: "Key stats", visible: true, size: "lg", order: 1 },
    { id: "starter", label: "Starter tiles", visible: true, size: "lg", order: 2 },
    { id: "command", label: "Talk to Atlas", visible: true, size: "lg", order: 3 },
    { id: "tasks", label: "Open tasks", visible: true, size: "md", order: 4 },
    { id: "tax", label: "Tax snapshot", visible: true, size: "md", order: 5 },
    { id: "overnight", label: "Overnight feed", visible: true, size: "md", order: 6 },
    { id: "jump", label: "Jump links", visible: true, size: "md", order: 7 },
    { id: "calendar", label: "Next appointments", visible: false, size: "md", order: 8 },
    { id: "notes", label: "Recent notes", visible: false, size: "sm", order: 9 },
  ];
  const personal: DashboardWidget[] = [
    { id: "welcome", label: "Welcome", visible: true, size: "lg", order: 0 },
    { id: "notes", label: "Recent notes", visible: true, size: "md", order: 1 },
    { id: "calendar", label: "Next appointments", visible: true, size: "md", order: 2 },
    { id: "tasks", label: "Personal tasks", visible: true, size: "md", order: 3 },
    { id: "command", label: "Talk to Atlas", visible: true, size: "lg", order: 4 },
    { id: "stats", label: "Key stats", visible: false, size: "lg", order: 5 },
    { id: "starter", label: "Starter tiles", visible: true, size: "md", order: 6 },
    { id: "tax", label: "Tax snapshot", visible: false, size: "sm", order: 7 },
    { id: "overnight", label: "Overnight feed", visible: false, size: "md", order: 8 },
    { id: "jump", label: "Jump links", visible: true, size: "md", order: 9 },
  ];
  return mode === "work" ? work : personal;
}

export function defaultDashboardLayout(): DashboardLayout {
  return {
    mode: "work",
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
    const raw = localStorage.getItem(STORAGE_KEY);
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
  return defaults
    .map((w) => {
      const prev = byId.get(w.id);
      return prev ? { ...w, ...prev, label: w.label } : w;
    })
    .sort((a, b) => a.order - b.order);
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

export function moveWidget(layout: DashboardLayout, id: DashboardWidgetId, direction: -1 | 1) {
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
    layouts: { ...layout.layouts, [layout.mode]: reordered },
  };
}

export function patchWidget(
  layout: DashboardLayout,
  id: DashboardWidgetId,
  patch: Partial<Pick<DashboardWidget, "visible" | "size">>,
) {
  const list = layout.layouts[layout.mode].map((w) => (w.id === id ? { ...w, ...patch } : w));
  return { ...layout, layouts: { ...layout.layouts, [layout.mode]: list } };
}

export function setDashboardMode(layout: DashboardLayout, mode: DashboardMode) {
  return { ...layout, mode };
}

export function setDefaultPage(layout: DashboardLayout, href: string) {
  return { ...layout, defaultPage: href };
}

export function resetDashboardMode(layout: DashboardLayout) {
  return {
    ...layout,
    layouts: {
      ...layout.layouts,
      [layout.mode]: baseWidgets(layout.mode),
    },
  };
}
