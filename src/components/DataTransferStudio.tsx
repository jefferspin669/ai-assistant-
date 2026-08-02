"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  exportFullAccountJson,
  exportPayload,
  importPayload,
  sampleImport,
  triggerDownload,
  type ExportKind,
  type ImportKind,
} from "@/lib/import-export";

const IMPORT_KINDS: { id: ImportKind; label: string; blurb: string }[] = [
  { id: "calendar", label: "Calendar files", blurb: "ICS / VEVENT" },
  { id: "contacts", label: "Contacts", blurb: "CSV name, email, phone" },
  { id: "bank", label: "Bank transactions", blurb: "CSV feed" },
  { id: "csv", label: "CSV spreadsheets", blurb: "Generic rows" },
  { id: "customers", label: "Customer lists", blurb: "CRM import + follow-ups" },
  { id: "tax", label: "Tax documents", blurb: "Labels or CSV" },
  { id: "accounting", label: "Accounting records", blurb: "Income / expense CSV" },
];

const EXPORT_KINDS: { id: ExportKind; label: string; blurb: string }[] = [
  { id: "pdf", label: "PDF / printable", blurb: "Text report stand-in" },
  { id: "csv", label: "CSV", blurb: "Tax, tasks, customers" },
  { id: "excel", label: "Excel", blurb: "Tab-separated .xls" },
  { id: "ics", label: "Calendar files", blurb: "ICS export" },
  { id: "accountant", label: "Accountant-ready", blurb: "JSON pack + summary" },
];

export function DataTransferStudio() {
  const [importKind, setImportKind] = useState<ImportKind>("bank");
  const [payload, setPayload] = useState(() => sampleImport("bank"));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function loadSample(kind: ImportKind) {
    setImportKind(kind);
    setPayload(sampleImport(kind));
    setMessage("");
    setError("");
  }

  function onImport() {
    setMessage("");
    setError("");
    const result = importPayload(importKind, payload);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(result.message);
  }

  function onExport(kind: ExportKind) {
    setMessage("");
    setError("");
    const result = exportPayload(kind);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.content && result.filename && result.mime) {
      triggerDownload(result.content, result.filename, result.mime);
    }
    setMessage(result.message);
  }

  function onFullExport() {
    setMessage("");
    setError("");
    const result = exportFullAccountJson();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.content && result.filename && result.mime) {
      triggerDownload(result.content, result.filename, result.mime);
    }
    setMessage(result.message);
  }

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPayload(String(reader.result || ""));
      setMessage(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  }

  return (
    <AppShell
      title="Import & export"
      subtitle="Bring existing calendars, contacts, bank feeds, and tax records into Atlas — then export accountant-ready packs."
    >
      <div className="split">
        <section className="panel">
          <h2>Import</h2>
          <p className="panel-lead">People should not rebuild everything by hand.</p>
          <div className="cta-row" style={{ flexWrap: "wrap" }}>
            {IMPORT_KINDS.map((kind) => (
              <button
                key={kind.id}
                type="button"
                className={`biz-chip ${importKind === kind.id ? "active" : ""}`}
                onClick={() => loadSample(kind.id)}
              >
                {kind.label}
              </button>
            ))}
          </div>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            {IMPORT_KINDS.find((k) => k.id === importKind)?.blurb}
          </p>
          <label className="form-grid" style={{ marginTop: "1rem" }}>
            Paste file contents or upload
            <textarea rows={12} value={payload} onChange={(e) => setPayload(e.target.value)} />
            <input
              type="file"
              accept=".csv,.ics,.txt,.json,.vcf"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="cta-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn btn-dark" onClick={onImport}>
              Import into Atlas
            </button>
            <button type="button" className="btn btn-outline" onClick={() => loadSample(importKind)}>
              Load sample
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Export</h2>
          <p className="panel-lead">Download CSV, Excel, calendar files, printable reports, or an accountant pack.</p>
          <ul className="manage-list">
            {EXPORT_KINDS.map((kind) => (
              <li key={kind.id}>
                <div>
                  <strong>{kind.label}</strong>
                  <span>{kind.blurb}</span>
                </div>
                <button type="button" className="btn btn-outline" onClick={() => onExport(kind.id)}>
                  Export
                </button>
              </li>
            ))}
            <li>
              <div>
                <strong>Full account JSON</strong>
                <span>Complete vault export (if permissions allow)</span>
              </div>
              <button type="button" className="btn btn-outline" onClick={onFullExport}>
                Export
              </button>
            </li>
          </ul>
        </section>
      </div>

      {message ? <p className="auth-success">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </AppShell>
  );
}
