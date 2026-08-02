"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { AppShell } from "@/components/AppShell";
import { triggerDownload } from "@/lib/import-export";
import {
  PRIVACY_COPY,
  clearConversationHistory,
  exportPrivacyPack,
  loadPrivacyControls,
  permanentDeleteVault,
  savePrivacyControls,
  type PrivacyControls,
} from "@/lib/privacy";
import { loadConnections } from "@/lib/connections";

export function PrivacyStudio() {
  const { account, refresh } = useAccount();
  const [controls, setControls] = useState<PrivacyControls | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const connections = loadConnections().filter((c) => c.connected);

  useEffect(() => {
    setControls(loadPrivacyControls());
  }, [account?.id]);

  if (!controls) return null;

  function patch(key: keyof PrivacyControls, value: boolean) {
    const next = { ...controls!, [key]: value };
    setControls(next);
    const result = savePrivacyControls(next);
    if ("ok" in result && !result.ok) {
      setError(result.error);
      return;
    }
    refresh();
    setMessage("Privacy preference saved.");
  }

  return (
    <AppShell
      title="Privacy center"
      subtitle="Plain-language controls for memory, personalization, sharing, history, exports, and deletion — not legal jargon."
    >
      <section className="panel">
        <h2>Your controls</h2>
        <div className="toggle-grid">
          {PRIVACY_COPY.map((item) => (
            <label key={item.key} className="check-row privacy-row">
              <input
                type="checkbox"
                checked={controls[item.key]}
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

      <div className="split">
        <section className="panel">
          <h2>Connected app permissions</h2>
          <p className="panel-lead">Each connection lists what it can access. Disconnect anytime in Connection center.</p>
          <ul className="manage-list">
            {connections.length ? (
              connections.map((conn) => (
                <li key={conn.id}>
                  <div>
                    <strong>{conn.name}</strong>
                    <span>{conn.permissions.join(" · ")}</span>
                  </div>
                </li>
              ))
            ) : (
              <li className="muted">No apps connected right now.</li>
            )}
          </ul>
        </section>

        <section className="panel">
          <h2>History, export, deletion</h2>
          <div className="cta-row" style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                const result = clearConversationHistory();
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                refresh();
                setMessage("Conversation history cleared.");
              }}
            >
              Clear conversation history
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                const result = exportPrivacyPack();
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                triggerDownload(result.json, result.filename, "application/json");
                setMessage("Account export downloaded.");
              }}
            >
              Download account export
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                if (!window.confirm("Permanently delete vault content on this device? This cannot be undone.")) return;
                const result = permanentDeleteVault();
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                refresh();
                setMessage("Vault content permanently deleted on this device.");
              }}
            >
              Permanent deletion
            </button>
          </div>
          <p className="muted" style={{ marginTop: "0.85rem" }}>
            Permanent deletion removes local chats, files, and memories from this browser. Export first if you need a copy.
          </p>
        </section>
      </div>

      {message ? <p className="auth-success">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </AppShell>
  );
}
