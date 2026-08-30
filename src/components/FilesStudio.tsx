"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { apiGet, apiSend } from "@/lib/backend/client";
import { atlasApi } from "@/lib/api/atlas-api";
import type { DbDocument } from "@/lib/db/schema";
import {
  dataUrlMime,
  formatFileSize,
  isDataUrl,
  readFileForVault,
} from "@/lib/file-vault";

type UploadPayload = {
  title: string;
  content: string;
  kind?: DbDocument["kind"];
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

function resolveIds() {
  const users = atlasApi.users.list();
  const orgs = atlasApi.businesses.list();
  const userId = users.ok ? users.data[0]?.id : undefined;
  const orgId = orgs.ok ? orgs.data[0]?.id : undefined;
  if (!userId || !orgId) return null;
  return { userId, orgId };
}

async function loadDocuments() {
  const remote = await apiGet<DbDocument[]>("/api/files");
  if (remote.ok) return { ok: true as const, data: remote.data, source: "backend" as const };
  const local = atlasApi.files.list();
  if (local.ok) return { ok: true as const, data: local.data, source: "local" as const };
  return { ok: false as const, error: remote.error || local.error };
}

async function saveDocument(payload: UploadPayload) {
  const remote = await apiSend<DbDocument>("/api/files/upload", "POST", payload);
  if (remote.ok) return { ok: true as const, data: remote.data, source: "backend" as const };
  const ids = resolveIds();
  if (!ids) return { ok: false as const, error: "Sign in before saving files locally." };
  const local = atlasApi.files.upload({ userId: ids.userId, orgId: ids.orgId, ...payload });
  if (local.ok) return { ok: true as const, data: local.data, source: "local" as const };
  return { ok: false as const, error: remote.error || local.error };
}

async function removeDocument(id: string) {
  const remote = await apiSend<{ id: string }>(`/api/files/${id}`, "DELETE");
  if (remote.ok) return { ok: true as const, source: "backend" as const };
  const local = atlasApi.files.delete(id);
  if (local.ok) return { ok: true as const, source: "local" as const };
  return { ok: false as const, error: remote.error || local.error };
}

function docLabel(doc: DbDocument) {
  return doc.fileName || doc.title;
}

function previewContent(doc: DbDocument): string {
  if (doc.content.startsWith("Notes: ") && doc.content.includes("\n\n---\n\n")) {
    return doc.content.slice(doc.content.indexOf("\n\n---\n\n") + 7);
  }
  return doc.content;
}

function DocumentPreview({ doc }: { doc: DbDocument }) {
  const raw = previewContent(doc);
  const mime = doc.mimeType || (isDataUrl(raw) ? dataUrlMime(raw) : null);

  if (mime?.startsWith("image/") && isDataUrl(raw)) {
    return (
      <img
        src={raw}
        alt={docLabel(doc)}
        className="file-preview-image"
      />
    );
  }

  if (mime === "application/pdf" && isDataUrl(raw)) {
    return (
      <iframe
        title={docLabel(doc)}
        src={raw}
        className="file-preview-pdf"
      />
    );
  }

  if (isDataUrl(raw)) {
    return (
      <a className="btn btn-outline" href={raw} download={doc.fileName || doc.title}>
        Download file
      </a>
    );
  }

  return (
    <pre className="file-preview-text">{raw.slice(0, 4000)}{raw.length > 4000 ? "…" : ""}</pre>
  );
}

export function FilesStudio() {
  const [docs, setDocs] = useState<DbDocument[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [persistMode, setPersistMode] = useState<"backend" | "local" | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const result = await loadDocuments();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDocs(result.data);
    setPersistMode(result.source);
    setError("");
    if (!activeId && result.data[0]) setActiveId(result.data[0].id);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = docs.find((d) => d.id === activeId) || docs[0];

  async function ingestFile(file: File) {
    setError("");
    const read = await readFileForVault(file);
    if (!read.ok) {
      setError(read.error);
      return;
    }
    setTitle((prev) => prev || file.name.replace(/\.[^.]+$/, "") || file.name);
    setFileContent(read.content);
    setPendingFile({
      fileName: read.fileName,
      mimeType: read.mimeType,
      sizeBytes: read.sizeBytes,
    });
    setFlash(`Ready to save “${read.fileName}” (${formatFileSize(read.sizeBytes)}).`);
  }

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    const body = fileContent || notes.trim();
    if (!body) {
      setError("Add a file, scan a document, or enter notes first.");
      return;
    }
    const storedContent =
      fileContent && notes.trim()
        ? `Notes: ${notes.trim()}\n\n---\n\n${fileContent}`
        : body;
    setBusy(true);
    setError("");
    const result = await saveDocument({
      title: title.trim() || pendingFile?.fileName || "Untitled",
      content: storedContent,
      kind: "file",
      fileName: pendingFile?.fileName ?? null,
      mimeType: pendingFile?.mimeType ?? null,
      sizeBytes: pendingFile?.sizeBytes ?? null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPersistMode(result.source);
    setTitle("");
    setNotes("");
    setFileContent(null);
    setPendingFile(null);
    setActiveId(result.data.id);
    setFlash(
      result.source === "backend"
        ? `Saved “${result.data.title}” on the Atlas backend.`
        : `Saved “${result.data.title}” in your browser vault.`,
    );
    await refresh();
  }

  async function onDelete(id: string) {
    setError("");
    const result = await removeDocument(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (activeId === id) setActiveId(null);
    setFlash("Document removed.");
    await refresh();
  }

  return (
    <AppShell
      title="Files"
      subtitle="Backend API · Files — documents persist in `.data/atlas-db.json` on the server, or in your browser vault on static preview."
    >
      {flash ? <p className="auth-success">{flash}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {persistMode === "local" && !error ? (
        <p className="panel-lead">
          Using browser vault — run <code>npm run dev</code> for file-backed storage on the server.
        </p>
      ) : null}

      <div className="split">
        <section className="panel">
          <h2>Documents</h2>
          <p className="panel-lead">Atlas remembers uploaded and scanned files here.</p>
          <ul className="manage-list">
            {docs.length === 0 ? (
              <li>No documents yet.</li>
            ) : (
              docs.map((doc) => (
                <li key={doc.id}>
                  <div>
                    <strong>{docLabel(doc)}</strong>
                    <small>
                      {doc.mimeType || doc.kind}
                      {doc.sizeBytes ? ` · ${formatFileSize(doc.sizeBytes)}` : ""}
                      {" · "}
                      {new Date(doc.updatedAt).toLocaleString()}
                    </small>
                  </div>
                  <div className="cta-row">
                    <button type="button" className="ghost-link" onClick={() => setActiveId(doc.id)}>
                      Open
                    </button>
                    <button type="button" className="ghost-link" onClick={() => void onDelete(doc.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="panel">
          <h2>{active ? docLabel(active) : "Upload"}</h2>
          {active ? (
            <div className="file-preview-wrap">
              <DocumentPreview doc={active} />
            </div>
          ) : (
            <p className="panel-lead">Pick a saved document to preview it.</p>
          )}

          <h3 style={{ marginTop: "1rem" }}>Add a file</h3>
          <div className="file-upload-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose from computer
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => scanInputRef.current?.click()}
            >
              Scan document
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*,.pdf,.txt,.csv,.json,.md,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void ingestFile(file);
              e.target.value = "";
            }}
          />
          <input
            ref={scanInputRef}
            type="file"
            hidden
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void ingestFile(file);
              e.target.value = "";
            }}
          />

          <form className="form-grid" onSubmit={onUpload} style={{ marginTop: "0.85rem" }}>
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Receipt, contract, W-9…"
              />
            </label>
            {pendingFile ? (
              <p className="panel-lead">
                Attached: <strong>{pendingFile.fileName}</strong> ({formatFileSize(pendingFile.sizeBytes)})
              </p>
            ) : null}
            <label>
              Notes (optional)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add notes, or choose a file above to store it in Atlas."
              />
            </label>
            <button className="btn btn-dark" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save to Atlas"}
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
