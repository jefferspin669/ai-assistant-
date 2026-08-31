import { describe, expect, it } from "vitest";
import {
  applyDashboardPreset,
  applyIndustryRecommendation,
  DASHBOARD_PRESETS,
  recommendedWidgetIdsForIndustry,
  WIDGET_CATALOG,
} from "../src/lib/dashboard-layout";
import {
  AUTO_PERMISSION_DEFS,
  controlModeToLevel,
  kindAllowedByPermissions,
  levelToControlMode,
} from "../src/lib/autonomy/permissions";
import { defaultPolicy } from "../src/lib/autonomy/defaults";

describe("autonomy control modes", () => {
  it("maps control modes to policy levels", () => {
    expect(controlModeToLevel("manual")).toBe(1);
    expect(controlModeToLevel("assisted")).toBe(2);
    expect(controlModeToLevel("autonomous")).toBe(3);
    expect(levelToControlMode(4)).toBe("autonomous");
  });

  it("lists customer-facing auto permission categories", () => {
    expect(AUTO_PERMISSION_DEFS.map((d) => d.key)).toEqual([
      "scheduling",
      "follow_ups",
      "task_creation",
      "reminders",
      "customer_replies",
      "inventory_reorders",
      "marketing_actions",
    ]);
  });

  it("blocks kinds when permission toggle is off", () => {
    const policy = {
      ...defaultPolicy("org"),
      autoPermissions: { ...defaultPolicy("org").autoPermissions, marketing_actions: false },
    };
    expect(kindAllowedByPermissions("marketing_spend", policy)).toBe(false);
    expect(kindAllowedByPermissions("schedule_appointment", policy)).toBe(true);
  });
});

describe("dashboard customization", () => {
  it("exposes expanded widget catalog", () => {
    expect(Object.keys(WIDGET_CATALOG)).toContain("revenue");
    expect(Object.keys(WIDGET_CATALOG)).toContain("route_status");
    expect(Object.keys(WIDGET_CATALOG).length).toBeGreaterThan(15);
  });

  it("builds CEO preset with revenue and health widgets", () => {
    const layout = applyDashboardPreset(
      {
        mode: "work",
        preset: "custom",
        defaultPage: "/app",
        layouts: { work: [], personal: [] },
        savedAt: null,
      },
      "ceo",
    );
    const visible = layout.layouts.work.filter((w) => w.visible).map((w) => w.id);
    expect(visible).toContain("revenue");
    expect(visible).toContain("business_health");
    expect(layout.preset).toBe("ceo");
  });

  it("recommends field-service widgets for HVAC industry", () => {
    const ids = recommendedWidgetIdsForIndustry("HVAC field service");
    expect(ids).toContain("route_status");
    expect(ids).toContain("inventory_alerts");
  });

  it("defines sales and operations presets", () => {
    expect(DASHBOARD_PRESETS.sales.widgetIds).toContain("sales_pipeline");
    expect(DASHBOARD_PRESETS.operations.widgetIds).toContain("purchases");
  });

  it("applies industry recommendation as hidden-by-default extras", () => {
    const widgets = applyIndustryRecommendation("retail store");
    const visible = widgets.filter((w) => w.visible).map((w) => w.id);
    expect(visible).toContain("inventory_alerts");
  });
});
