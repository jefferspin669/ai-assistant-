"use client";

import { useEffect, useState } from "react";
import {
  applyDashboardPreset,
  applyIndustryRecommendation,
  availableWidgetsToAdd,
  DASHBOARD_PRESETS,
  DEFAULT_PAGE_OPTIONS,
  loadDashboardLayout,
  moveWidget,
  patchWidget,
  resetDashboardMode,
  saveDashboardLayout,
  setDashboardMode,
  setDefaultPage,
  type DashboardLayout,
  type DashboardPresetId,
  type DashboardWidgetId,
  type WidgetSize,
} from "@/lib/dashboard-layout";
import { loadWorkspaceActivation } from "@/lib/workspace-mode";

export function DashboardCustomizer({
  layout,
  onChange,
  editMode,
  onEditModeChange,
}: {
  layout: DashboardLayout;
  onChange: (next: DashboardLayout) => void;
  editMode?: boolean;
  onEditModeChange?: (open: boolean) => void;
}) {
  const [internalEdit, setInternalEdit] = useState(false);
  const editing = editMode ?? internalEdit;
  const setEditing = onEditModeChange ?? setInternalEdit;
  const widgets = [...layout.layouts[layout.mode]].sort((a, b) => a.order - b.order);
  const visible = widgets.filter((w) => w.visible);
  const hidden = availableWidgetsToAdd(layout);

  function commit(next: DashboardLayout, persist = true) {
    onChange(persist ? saveDashboardLayout(next) || next : next);
  }

  function applyPreset(preset: DashboardPresetId) {
    commit(applyDashboardPreset(layout, preset));
  }

  function applyIndustryDefault() {
    const industry = loadWorkspaceActivation().profile?.industry || "";
    const widgets = applyIndustryRecommendation(industry);
    commit({
      ...layout,
      preset: "custom",
      layouts: { ...layout.layouts, [layout.mode]: widgets },
    });
  }

  if (!editing) {
    return (
      <div className="dash-customizer-bar">
        <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>
          Customize Dashboard
        </button>
      </div>
    );
  }

  return (
    <section className="panel dash-customizer dash-customizer-editing">
      <div className="dash-customizer-head">
        <div>
          <p className="briefing-kicker">Customize dashboard</p>
          <h2>{layout.mode === "work" ? "Work" : "Personal"} · visual editor</h2>
          <p className="panel-lead">Add widgets, rearrange, resize, and hide. Save CEO, Sales, or Operations layouts.</p>
        </div>
        <div className="cta-row">
          <button
            type="button"
            className={`biz-chip ${layout.mode === "work" ? "active" : ""}`}
            onClick={() => commit(setDashboardMode(layout, "work"))}
          >
            Work
          </button>
          <button
            type="button"
            className={`biz-chip ${layout.mode === "personal" ? "active" : ""}`}
            onClick={() => commit(setDashboardMode(layout, "personal"))}
          >
            Personal
          </button>
          <button type="button" className="btn btn-dark" onClick={() => commit(layout)}>
            Save layout
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
            Done
          </button>
        </div>
      </div>

      <div className="dash-edit-toolbar">
        <span className="briefing-kicker">Presets</span>
        <div className="biz-switcher">
          {(Object.keys(DASHBOARD_PRESETS) as DashboardPresetId[])
            .filter((id) => id !== "custom")
            .map((id) => (
              <button
                key={id}
                type="button"
                className={layout.preset === id ? "biz-chip active" : "biz-chip"}
                onClick={() => applyPreset(id)}
              >
                {DASHBOARD_PRESETS[id].label}
              </button>
            ))}
          <button type="button" className="biz-chip" onClick={() => applyIndustryDefault()}>
            Industry default
          </button>
        </div>
      </div>

      <div className="dash-widget-grid dash-widget-grid-edit">
        {visible.map((widget, index) => (
          <div
            key={widget.id}
            className={`dash-widget-card size-${widget.size}`}
            data-widget={widget.id}
          >
            <div className="dash-widget-card-head">
              <strong>{widget.label}</strong>
              <span className="muted-line">size {widget.size}</span>
            </div>
            <div className="cta-row">
              <button
                type="button"
                className="btn btn-outline"
                disabled={index === 0}
                onClick={() => commit(moveWidget(layout, widget.id, -1))}
              >
                ←
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={index === visible.length - 1}
                onClick={() => commit(moveWidget(layout, widget.id, 1))}
              >
                →
              </button>
              <select
                value={widget.size}
                onChange={(e) =>
                  commit(patchWidget(layout, widget.id, { size: e.target.value as WidgetSize }))
                }
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => commit(patchWidget(layout, widget.id, { visible: false }))}
              >
                Hide
              </button>
            </div>
          </div>
        ))}
      </div>

      {hidden.length ? (
        <div className="dash-add-widgets" style={{ marginTop: "1rem" }}>
          <span className="briefing-kicker">Add widget</span>
          <div className="biz-switcher">
            {hidden.map((widget) => (
              <button
                key={widget.id}
                type="button"
                className="biz-chip"
                onClick={() => commit(patchWidget(layout, widget.id, { visible: true }))}
              >
                + {widget.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="form-grid" style={{ maxWidth: 360, marginTop: "1rem" }}>
        Default page after login
        <select value={layout.defaultPage} onChange={(e) => commit(setDefaultPage(layout, e.target.value))}>
          {DEFAULT_PAGE_OPTIONS.map((opt) => (
            <option key={opt.href} value={opt.href}>{opt.label}</option>
          ))}
        </select>
      </label>

      <div className="cta-row" style={{ marginTop: "1rem" }}>
        <button type="button" className="btn btn-outline" onClick={() => commit(resetDashboardMode(layout))}>
          Reset {layout.mode} layout
        </button>
      </div>
      {layout.savedAt ? (
        <p className="muted" style={{ marginTop: "0.65rem" }}>
          Saved {new Date(layout.savedAt).toLocaleString()}
        </p>
      ) : null}
    </section>
  );
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [editMode, setEditMode] = useState(false);
  useEffect(() => {
    setLayout(loadDashboardLayout());
  }, []);
  return {
    layout,
    setLayout: (next: DashboardLayout) => setLayout(next),
    editMode,
    setEditMode,
  };
}

export function DashboardWidgetGrid({
  layout,
  editMode,
}: {
  layout: DashboardLayout;
  editMode?: boolean;
}) {
  const widgets = [...layout.layouts[layout.mode]]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);

  if (!widgets.length) return null;

  return (
    <section
      className={`dash-widget-grid ${editMode ? "dash-widget-grid-edit" : ""}`}
      aria-label="Dashboard widgets"
    >
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className={`dash-widget-card panel size-${widget.size}`}
          data-widget={widget.id}
        >
          <p className="briefing-kicker">{widget.label}</p>
          <p className="muted-line">
            {editMode
              ? `Drag order · ${widget.size}`
              : "Widget content follows your connected data and tasks."}
          </p>
        </div>
      ))}
    </section>
  );
}
