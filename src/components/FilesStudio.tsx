"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { apiGet, apiSend } from "@/lib/backend/client";
import type { DbDocument } from "@/lib/db/schema";

export function FilesStudio() {
  const [docs, setDocs] = useState<DbDocument[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const result = await apiGet<DbDocument[]>("/api/files");
    if (result.ok) setDocs(result.data);
    else setError(result.error);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    setError("");
    const result = await apiSend<DbDocument>("/api/files/upload", "POST", {
      title: title || "Untitled",
      content: content || "Empty document",
      kind: "file",
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTitle("");
    setContent("");
    setFlash(`Uploaded “${result.data.title}” — saved on the Atlas backend.`);
    await refresh();
  }

  async function onDelete(id: string) {
    const result = await apiSend<{ id: string }>(`/api/files/${id}`, "DELETE");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFlash("Document deleted from backend.");
    await refresh();
  }

  return (
    <AppShell
      title="Files"
      subtitle="Backend API · Files — documents persist in `.data/atlas-db.json` on the server."
    >
      {flash ? <p className="auth-success">{flash}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      <div className="split">
        <section className="panel">
          <h2>Documents</h2>
          <ul className="manage-list">
            {docs.length === 0 ? (
              <li>No documents yet.</li>
            ) : (
              docs.map((doc) => (
                <li key={doc.id}>
                  <div>
                    <strong>
                      {doc.title} · {doc.kind}
                    </strong>
                    <small>Updated {new Date(doc.updatedAt).toLocaleString()}</small>
                  </div>
                  <button type="button" className="ghost-link" onClick={() => void onDelete(doc.id)}>
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="panel">
          <h2>Upload</h2>
          <form className="form-grid" onSubmit={onUpload}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>
              Content
              <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
            </label>
            <button className="btn btn-dark" type="submit">
              Save to backend
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
