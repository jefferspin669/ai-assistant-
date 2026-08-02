"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { atlasApi } from "@/lib/api/atlas-api";
import type { DbDocument } from "@/lib/db/schema";

async function fileToText(file: File, maxBytes = 900_000): Promise<string | null> {
  if (file.size > maxBytes) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function FilesStudio() {
  const [docs, setDocs] = useState<DbDocument[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [flash, setFlash] = useState("");

  function refresh() {
    const result = atlasApi.files.list();
    if (result.ok) setDocs(result.data);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    const users = atlasApi.users.list();
    const orgs = atlasApi.businesses.list();
    const userId = users.ok && users.data[0] ? users.data[0].id : "user_demo";
    const orgId = orgs.ok && orgs.data[0] ? orgs.data[0].id : "org_demo";
    const result = atlasApi.files.upload({
      userId,
      orgId,
      title: title || "Untitled",
      content: content || "Empty document",
      kind: "file",
    });
    if (!result.ok) {
      setFlash(result.error);
      return;
    }
    setTitle("");
    setContent("");
    setFlash(`Uploaded “${result.data.title}” to Documents.`);
    refresh();
  }

  return (
    <AppShell
      title="Files"
      subtitle="Backend API · Files — documents stored in the Atlas database."
    >
      {flash ? <p className="auth-success">{flash}</p> : null}
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
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              File
              <input
                type="file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const data = await fileToText(file);
                  if (!data) {
                    setFlash("File too large for the demo vault (~900KB max).");
                    return;
                  }
                  setTitle((prev) => prev || file.name);
                  setContent(`File: ${file.name}\n\n${data}`);
                }}
              />
            </label>
            <label>
              Content / notes
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
            </label>
            <button className="btn btn-dark" type="submit">
              Save to database
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
