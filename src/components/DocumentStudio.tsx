"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  DOCUMENT_KINDS,
  createDocumentFromPrompt,
  loadUserDocuments,
  rewriteDocumentBody,
  updateUserDocument,
  type DocumentKind,
  type UserDocument,
} from "@/lib/documents-workspace";

export function DocumentStudio() {
  const [docs, setDocs] = useState<UserDocument[]>(loadUserDocuments());
  const [kind, setKind] = useState<DocumentKind>("Proposal");
  const [description, setDescription] = useState(
    "Create a proposal for a website redesign for ABC Plumbing for $7,500.",
  );
  const [selectedId, setSelectedId] = useState<string | null>(docs[0]?.id ?? null);
  const [note, setNote] = useState<string | null>(null);

  const selected = docs.find((d) => d.id === selectedId) ?? docs[0] ?? null;

  function refresh() {
    const loaded = loadUserDocuments();
    setDocs(loaded);
    if (!selectedId && loaded[0]) setSelectedId(loaded[0].id);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const doc = createDocumentFromPrompt(kind, description);
    refresh();
    setSelectedId(doc.id);
    setNote(`Generated ${doc.kind} — edit, save, or export below.`);
  }

  function onEdit(mode: "professional" | "shorten" | "rewrite") {
    if (!selected) return;
    const body = rewriteDocumentBody(selected.body, mode);
    updateUserDocument(selected.id, { body, status: "draft" });
    refresh();
    setNote(`Atlas ${mode === "shorten" ? "shortened" : mode === "professional" ? "made it professional" : "rewrote"} the document.`);
  }

  function onSaveReady() {
    if (!selected) return;
    updateUserDocument(selected.id, { status: "ready" });
    refresh();
    setNote("Document saved and ready to share.");
  }

  const kinds = useMemo(() => DOCUMENT_KINDS, []);

  return (
    <div className="training-studio">
      <section className="panel">
        <h2>What do you want to create?</h2>
        <div className="pack-grid">
          {kinds.map((item) => (
            <button
              key={item}
              type="button"
              className={kind === item ? "pack-chip active" : "pack-chip"}
              onClick={() => setKind(item)}
            >
              <strong>{item}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Describe your document</h2>
        <p className="panel-lead">
          Atlas uses customer memory, quotes, and project details when you mention a client — e.g. “Johnson Construction.”
        </p>
        <form className="command-form" onSubmit={onCreate}>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Create a proposal for…" />
          <button className="btn btn-dark" type="submit">Generate</button>
        </form>
      </section>

      {note ? (
        <div className="memory-card">
          <div className="label">Atlas</div>
          <p>{note}</p>
        </div>
      ) : null}

      {selected ? (
        <div className="split">
          <section className="panel">
            <h2>{selected.title}</h2>
            <p className="muted-line">{selected.kind} · {selected.status}{selected.customerName ? ` · ${selected.customerName}` : ""}</p>
            <textarea
              className="doc-editor"
              rows={14}
              value={selected.body}
              onChange={(e) => updateUserDocument(selected.id, { body: e.target.value })}
              onBlur={() => refresh()}
            />
            <div className="cta-row" style={{ marginTop: "0.75rem" }}>
              <button className="btn btn-outline" type="button" onClick={() => onEdit("rewrite")}>Rewrite</button>
              <button className="btn btn-outline" type="button" onClick={() => onEdit("shorten")}>Shorten</button>
              <button className="btn btn-outline" type="button" onClick={() => onEdit("professional")}>Make professional</button>
              <button className="btn btn-dark" type="button" onClick={onSaveReady}>Save</button>
              <button className="btn btn-outline" type="button" onClick={() => setNote("PDF export queued (demo).")}>Download PDF</button>
              <button className="btn btn-outline" type="button" onClick={() => setNote("Word export queued (demo).")}>Download Word</button>
              <button className="btn btn-outline" type="button" onClick={() => setNote("Share link copied (demo).")}>Share</button>
            </div>
          </section>
          <section className="panel">
            <h2>Your documents</h2>
            <div className="list">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className={selected.id === doc.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => setSelectedId(doc.id)}
                >
                  <span className="badge">{doc.kind}</span>
                  <div>
                    <p><strong>{doc.title}</strong></p>
                    <small className="muted-line">{doc.status}</small>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
