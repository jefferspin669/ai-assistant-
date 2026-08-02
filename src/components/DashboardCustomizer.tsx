"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_PAGE_OPTIONS,
  loadDashboardLayout,
  moveWidget,
  patchWidget,
  resetDashboardMode,
  saveDashboardLayout,
  setDashboardMode,
  setDefaultPage,
  type DashboardLayout,
  type WidgetSize,
} from "@/lib/dashboard-layout";

export function DashboardCustomizer({
  layout,
  onChange,
}: {
  layout: DashboardLayout;
  onChange: (next: DashboardLayout) => void;
}) {
  const [open, setOpen] = useState(false);
  const widgets = [...layout.layouts[layout.mode]].sort((a, b) => a.order - b.order);

  function commit(next: DashboardLayout, persist = true) {
    onChange(persist ? saveDashboardLayout(next) || next : next);
  }

  return (
    <section className="panel dash-customizer">
      <div className="dash-customizer-head">
        <div>
          <p className="briefing-kicker">Dashboard customization</p>
          <h2>{layout.mode === "work" ? "Work" : "Personal"} layout</h2>
          <p className="panel-lead">
            Move widgets, resize cards, hide sections, and save separate work / personal dashboards.
          </p>
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
          <button type="button" className="btn btn-outline" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide editor" : "Customize"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="dash-editor">
          <label className="form-grid" style={{ maxWidth: 360 }}>
            Default page after login
            <select
              value={layout.defaultPage}
              onChange={(e) => commit(setDefaultPage(layout, e.target.value))}
            >
              {DEFAULT_PAGE_OPTIONS.map((opt) => (
                <option key={opt.href} value={opt.href}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <ul className="manage-list" style={{ marginTop: "1rem" }}>
            {widgets.map((widget) => (
              <li key={widget.id}>
                <div>
                  <strong>{widget.label}</strong>
                  <span>
                    {widget.visible ? "Visible" : "Hidden"} · size {widget.size}
                  </span>
                </div>
                <div className="cta-row">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => commit(moveWidget(layout, widget.id, -1))}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => commit(moveWidget(layout, widget.id, 1))}
                  >
                    Down
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
                    onClick={() => commit(patchWidget(layout, widget.id, { visible: !widget.visible }))}
                  >
                    {widget.visible ? "Hide" : "Show"}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="cta-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn btn-dark" onClick={() => commit(layout)}>
              Save layout
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => commit(resetDashboardMode(layout))}
            >
              Reset {layout.mode} layout
            </button>
          </div>
          {layout.savedAt ? (
            <p className="muted" style={{ marginTop: "0.65rem" }}>
              Saved {new Date(layout.savedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  useEffect(() => {
    setLayout(loadDashboardLayout());
  }, []);
  return {
    layout,
    setLayout: (next: DashboardLayout) => setLayout(next),
  };
}
