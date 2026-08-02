"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  A11Y_OPTIONS,
  CATEGORY_ICONS,
  applyAccessibility,
  loadAccessibility,
  saveAccessibility,
  type AccessibilitySettings,
} from "@/lib/accessibility";
import { DEFAULT_CATEGORIES } from "@/lib/smart-calendar";

export function AccessibilityStudio() {
  const [settings, setSettings] = useState<AccessibilitySettings | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loaded = loadAccessibility();
    setSettings(loaded);
    applyAccessibility(loaded);
  }, []);

  if (!settings) return null;

  function patch(key: keyof AccessibilitySettings, value: boolean) {
    const next = saveAccessibility({ ...settings!, [key]: value });
    setSettings(next);
    setMessage(`${A11Y_OPTIONS.find((o) => o.key === key)?.title || "Setting"} updated.`);
  }

  return (
    <AppShell
      title="Accessibility"
      subtitle="Keyboard, screen readers, large text, contrast, reduced motion, captions, voice hints, and a calendar that never relies on color alone."
    >
      <section className="panel">
        <h2>Accessibility controls</h2>
        <div className="toggle-grid">
          {A11Y_OPTIONS.map((item) => (
            <label key={item.key} className="check-row privacy-row">
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={(e) => patch(item.key, e.target.checked)}
              />
              <span>
                <strong>{item.title}</strong>
                <small>{item.plain}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Color-blind-friendly calendar preview</h2>
        <p className="panel-lead">
          Every category uses a label and icon in addition to color — so meaning never depends on hue alone.
        </p>
        <ul className="a11y-cal-preview">
          {DEFAULT_CATEGORIES.slice(0, 8).map((category) => (
            <li key={category.id} style={{ ["--sc-color" as string]: category.color }}>
              <span className="a11y-cal-icon" aria-hidden>
                {CATEGORY_ICONS[category.id] || "•"}
              </span>
              <strong>{category.label}</strong>
              <span className="a11y-cal-swatch" aria-hidden />
            </li>
          ))}
        </ul>
        {settings.captions ? (
          <p className="caption-bar" role="note">
            Captions on — voice and media demos will show text alternatives.
          </p>
        ) : null}
      </section>

      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
