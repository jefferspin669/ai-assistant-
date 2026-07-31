"use client";

import { useState } from "react";
import { portalFeatures, portalPreview, portalThemes } from "@/lib/atlas-platform";

export function PortalStudio() {
  const [themeId, setThemeId] = useState(portalThemes[0].id);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(portalFeatures.map((feature) => [feature, true])),
  );
  const [published, setPublished] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const theme = portalThemes.find((item) => item.id === themeId) ?? portalThemes[0];
  const activeCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Portal</span>
          <strong>{published ? "Live" : "Draft"}</strong>
          <small>{portalPreview.business}</small>
        </div>
        <div className="stat">
          <span>Features</span>
          <strong>{activeCount}</strong>
          <small>Enabled</small>
        </div>
        <div className="stat">
          <span>Brand</span>
          <strong>{theme.name}</strong>
          <small>Accent applied</small>
        </div>
        <div className="stat">
          <span>URL</span>
          <strong>portal/</strong>
          <small>atlas-hvac</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Generator</h2>
          <p className="panel-lead">
            Instant branded portal — appointments, payments, AI chat, uploads, orders, tickets.
          </p>

          <h3>Theme</h3>
          <div className="quality-filter-row">
            {portalThemes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={themeId === item.id ? "training-tab active" : "training-tab"}
                onClick={() => setThemeId(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>

          <h3 style={{ marginTop: "1rem" }}>Customer capabilities</h3>
          <div className="list">
            {portalFeatures.map((feature) => (
              <label className="quality-check-row" key={feature}>
                <input
                  type="checkbox"
                  checked={Boolean(enabled[feature])}
                  onChange={(e) =>
                    setEnabled((prev) => ({ ...prev, [feature]: e.target.checked }))
                  }
                />
                <span>{feature}</span>
              </label>
            ))}
          </div>

          <div className="train-actions">
            <button
              className="btn btn-dark"
              type="button"
              onClick={() => {
                setPublished(true);
                setNote("Portal published. Customers can book, pay, chat, and open tickets.");
              }}
            >
              Publish portal
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                setPublished(false);
                setNote("Portal returned to draft.");
              }}
            >
              Unpublish
            </button>
          </div>
          {note ? <p className="muted-line">{note}</p> : null}
        </section>

        <section className="panel">
          <h2>Live preview</h2>
          <div className="portal-preview" style={{ borderColor: theme.accent }}>
            <div className="portal-preview-bar" style={{ background: theme.accent }} />
            <div className="label">{portalPreview.business}</div>
            <h3>{portalPreview.headline}</h3>
            <div className="list" style={{ marginTop: "1rem" }}>
              {enabled["Schedule appointments"] ? (
                <div className="list-row">
                  <span className="badge ok">Book</span>
                  <p>{portalPreview.nextAppointment}</p>
                </div>
              ) : null}
              {enabled["Pay invoices"] ? (
                <div className="list-row">
                  <span className="badge warn">Pay</span>
                  <p>{portalPreview.openInvoice}</p>
                </div>
              ) : null}
              {enabled["Open support tickets"] ? (
                <div className="list-row">
                  <span className="badge">Ticket</span>
                  <p>{portalPreview.ticket}</p>
                </div>
              ) : null}
              {enabled["Chat with AI"] ? (
                <div className="list-row">
                  <span className="badge ok">AI</span>
                  <p>Ask Atlas about your job, invoice, or warranty.</p>
                </div>
              ) : null}
              {enabled["Upload documents"] ? (
                <div className="list-row">
                  <span className="badge">Upload</span>
                  <p>Drop photos, permits, or insurance cards.</p>
                </div>
              ) : null}
              {enabled["Track orders"] ? (
                <div className="list-row">
                  <span className="badge">Order</span>
                  <p>Capacitor kit · ships tomorrow</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
