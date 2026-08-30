"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "@/components/SiteLink";
import { AppShell } from "@/components/AppShell";
import { knowledgeQa, knowledgeUploads } from "@/lib/atlas-platform";
import {
  createKnowledgeDoc,
  loadKnowledgeDocs,
  saveKnowledgeDocs,
  type KnowledgeDoc,
} from "@/lib/ops-workspace";
import { knowledgeHub } from "@/lib/section-hubs";

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [query, setQuery] = useState("What’s our return policy?");
  const [answer, setAnswer] = useState(knowledgeQa[0]);
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadKnowledgeDocs();
    if (loaded.length) {
      setDocs(loaded);
    } else {
      const seeded = knowledgeUploads.map((item, index) => ({
        id: `seed-${index}`,
        name: item.name,
        type: item.type,
        status: item.status,
        pages: item.pages,
        createdAt: "",
      }));
      setDocs(seeded);
      saveKnowledgeDocs(seeded);
    }
    setReady(true);
  }, []);

  function persist(next: KnowledgeDoc[]) {
    setDocs(next);
    saveKnowledgeDocs(next);
  }

  function ask(q: string) {
    setQuery(q);
    const match =
      knowledgeQa.find((item) => item.q.toLowerCase() === q.toLowerCase()) ??
      knowledgeQa.find((item) => q.toLowerCase().includes("return")) ??
      knowledgeQa.find((item) => q.toLowerCase().includes("refund")) ??
      knowledgeQa.find((item) => q.toLowerCase().includes("rate") || q.toLowerCase().includes("after")) ??
      knowledgeQa[0];
    setAnswer(match);
  }

  function onAsk(e: FormEvent) {
    e.preventDefault();
    ask(query);
  }

  function onUploadClick() {
    fileRef.current?.click();
  }

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const added = files.map((file) => createKnowledgeDoc(file.name));
    const next = [...added, ...docs];
    persist(next);
    setNote(
      added.length === 1
        ? `Uploaded “${added[0].name}”. Atlas is learning it.`
        : `Uploaded ${added.length} documents. Atlas is learning them.`,
    );
    window.setTimeout(() => {
      persist(
        loadKnowledgeDocs().map((doc) =>
          added.some((a) => a.id === doc.id) ? { ...doc, status: "Learned" } : doc,
        ),
      );
      setDocs(loadKnowledgeDocs());
    }, 900);
  }

  function removeDoc(id: string) {
    persist(docs.filter((doc) => doc.id !== id));
    setNote("Document removed from the library.");
  }

  return (
    <AppShell
      title="Knowledge Brain"
      subtitle="Upload PDFs, manuals, policies, and more — Atlas learns them and answers from your documentation."
      action={
        <button className="btn btn-dark" type="button" onClick={onUploadClick}>
          Upload documents
        </button>
      }
    >
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.zip,.txt,.md,.mp4"
        hidden
        onChange={onFiles}
      />
      {note ? <p className="muted-line">{note}</p> : null}

      <div className="split">
        <section className="panel">
          <h2>Library</h2>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          <div className="list">
            {docs.map((item) => (
              <div className="list-row" key={item.id}>
                <span className={`badge${item.status === "Learned" ? " ok" : ""}`}>
                  {item.status}
                </span>
                <div style={{ flex: 1 }}>
                  <p>
                    <strong>{item.name}</strong>
                    <span className="muted-line">
                      {item.type} · {item.pages === 1 ? "1 item" : `${item.pages} pages`}
                    </span>
                  </p>
                </div>
                <button type="button" className="ghost-link" onClick={() => removeDoc(item.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="train-actions">
            <button className="btn btn-outline" type="button" onClick={onUploadClick}>
              Upload more
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Ask the business</h2>
          <p className="panel-lead">Employees ask in plain English. Atlas cites your docs.</p>
          <div className="quality-filter-row">
            {knowledgeQa.map((item) => (
              <button
                key={item.q}
                type="button"
                className={query === item.q ? "training-tab active" : "training-tab"}
                onClick={() => ask(item.q)}
              >
                {item.q}
              </button>
            ))}
          </div>
          <div className="chat-mock" style={{ marginTop: "1rem" }}>
            <div className="bubble bubble-user">
              <div className="agent-tag">Employee</div>
              {query}
            </div>
            <div className="bubble bubble-ai">
              <div className="agent-tag">Atlas</div>
              {answer.a}
              <span className="muted-line" style={{ display: "block", marginTop: "0.5rem" }}>
                Source · {answer.source}
              </span>
            </div>
          </div>
          <form className="command-form" style={{ marginTop: "1rem" }} onSubmit={onAsk}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask from your docs…"
            />
            <button className="btn btn-dark" type="submit">
              Ask
            </button>
          </form>
        </section>
      </div>

      <h2 className="hub-heading">Also in Knowledge</h2>
      <div className="hub-grid">
        {knowledgeHub
          .filter((item) => item.href !== "/app/knowledge")
          .map((item) => (
            <Link className="hub-card" href={item.href} key={item.href}>
              <h3>{item.label}</h3>
              <p>{item.blurb}</p>
            </Link>
          ))}
      </div>
    </AppShell>
  );
}
