"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { AppShell } from "@/components/AppShell";
import {
  ensureDailyBackup,
  listBackups,
  listTrash,
  listUndoActions,
  listVersions,
  purgeTrashItem,
  recordBackup,
  restoreBackup,
  restoreTrashItem,
  restoreVersion,
  simulateBulkCalendarChange,
  softDeleteEvent,
  undoRecent,
} from "@/lib/recovery";
import { loadCalendarState } from "@/lib/smart-calendar";

export function RecoveryStudio() {
  const { account, refresh, restoreCloud } = useAccount();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    ensureDailyBackup();
  }, []);

  const trash = listTrash();
  const fileTrash = account?.cloudItems.filter((item) => item.deletedAt) || [];
  const undos = listUndoActions();
  const backups = listBackups();
  const versions = listVersions();
  const codes = account?.security.recoveryCodes || [];

  function flash(ok: boolean, text: string) {
    setMessage(ok ? text : "");
    setError(ok ? "" : text);
    setTick((n) => n + 1);
    refresh();
  }

  function run(result: { ok: true; message: string } | { ok: false; error: string }) {
    flash(result.ok, result.ok ? result.message : result.error);
  }

  return (
    <AppShell
      title="Undo & recovery"
      subtitle="Undo recent actions, restore trash, browse version history, and keep automatic backups."
      action={
        <button
          type="button"
          className="btn btn-dark"
          onClick={() => run(undoRecent())}
        >
          Undo last action
        </button>
      }
    >
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Undo stack</span>
          <strong>{undos.length}</strong>
          <small>Recent reversible actions</small>
        </div>
        <div className="stat">
          <span>Trash</span>
          <strong>{trash.length}</strong>
          <small>Restorable deletes</small>
        </div>
        <div className="stat">
          <span>Backups</span>
          <strong>{backups.length}</strong>
          <small>Automatic + manual</small>
        </div>
        <div className="stat">
          <span>Versions</span>
          <strong>{versions.length}</strong>
          <small>Calendar / tasks / tax</small>
        </div>
      </div>

      <section className="panel">
        <h2>Protection demo</h2>
        <p className="panel-lead">
          Example: “Atlas accidentally changed 20 events. Restore yesterday’s version.”
        </p>
        <div className="cta-row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => run(simulateBulkCalendarChange())}
          >
            Simulate bulk calendar change
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => {
              const yesterday = versions.find((v) => /yesterday/i.test(v.label)) || versions[0];
              if (!yesterday) {
                flash(false, "No version history yet — run the bulk change demo first.");
                return;
              }
              run(restoreVersion(yesterday.id));
            }}
          >
            Restore yesterday’s version
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              const event = loadCalendarState().events[0];
              if (!event) {
                flash(false, "No calendar events to trash.");
                return;
              }
              run(softDeleteEvent(event.id));
            }}
          >
            Move one event to trash
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              recordBackup("full", "Manual backup");
              flash(true, "Manual backup saved.");
            }}
          >
            Backup now
          </button>
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Undo recent actions</h2>
          <ul className="manage-list">
            {undos.length ? (
              undos.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{new Date(item.at).toLocaleString()}</span>
                  </div>
                  <button type="button" className="btn btn-outline" onClick={() => run(undoRecent(item.id))}>
                    Undo
                  </button>
                </li>
              ))
            ) : (
              <li className="muted">No undo history yet.</li>
            )}
          </ul>
        </section>

        <section className="panel">
          <h2>Trash folder</h2>
          <ul className="manage-list">
            {trash.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>
                    [{item.kind}] {item.title}
                  </strong>
                  <span>Deleted {new Date(item.deletedAt).toLocaleString()}</span>
                </div>
                <div className="cta-row">
                  <button type="button" className="btn btn-outline" onClick={() => run(restoreTrashItem(item.id))}>
                    Restore
                  </button>
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => {
                      purgeTrashItem(item.id);
                      flash(true, "Permanently removed from trash.");
                    }}
                  >
                    Purge
                  </button>
                </div>
              </li>
            ))}
            {fileTrash.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>[file] {item.title}</strong>
                  <span>Deleted {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : ""}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const result = restoreCloud(item.id);
                    flash(result.ok, result.ok ? `Restored “${item.title}”.` : result.error);
                  }}
                >
                  Restore file
                </button>
              </li>
            ))}
            {!trash.length && !fileTrash.length ? <li className="muted">Trash is empty.</li> : null}
          </ul>
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Version history</h2>
          <ul className="manage-list">
            {versions.length ? (
              versions.map((ver) => (
                <li key={ver.id}>
                  <div>
                    <strong>{ver.label}</strong>
                    <span>
                      {ver.scope} · {new Date(ver.at).toLocaleString()}
                    </span>
                  </div>
                  <button type="button" className="btn btn-outline" onClick={() => run(restoreVersion(ver.id))}>
                    Restore
                  </button>
                </li>
              ))
            ) : (
              <li className="muted">Versions appear after protected edits.</li>
            )}
          </ul>
        </section>

        <section className="panel">
          <h2>Automatic backups</h2>
          <ul className="manage-list">
            {backups.length ? (
              backups.map((bak) => (
                <li key={bak.id}>
                  <div>
                    <strong>{bak.label}</strong>
                    <span>
                      {bak.scope} · {new Date(bak.at).toLocaleString()}
                    </span>
                  </div>
                  <button type="button" className="btn btn-outline" onClick={() => run(restoreBackup(bak.id))}>
                    Restore
                  </button>
                </li>
              ))
            ) : (
              <li className="muted">Backups will appear automatically.</li>
            )}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2>Recovery codes</h2>
        <p className="panel-lead">
          Generated during first-time setup (and 2FA). Store these offline — they unlock account recovery in this demo vault.
        </p>
        {codes.length ? (
          <div className="setup-codes">
            {codes.map((code) => (
              <code key={code}>{code}</code>
            ))}
          </div>
        ) : (
          <p className="muted">Complete setup or enable 2FA to generate recovery codes.</p>
        )}
      </section>

      {message ? <p className="auth-success" key={`m-${tick}`}>{message}</p> : null}
      {error ? <p className="auth-error" key={`e-${tick}`}>{error}</p> : null}
    </AppShell>
  );
}
