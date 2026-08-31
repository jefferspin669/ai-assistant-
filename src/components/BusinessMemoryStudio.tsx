"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import {
  addBusinessMemory,
  deleteBusinessMemory,
  loadBusinessMemories,
  loadPendingCorrections,
  MEMORY_TYPE_HINTS,
  MEMORY_TYPE_LABELS,
  memoriesByType,
  resolvePendingCorrection,
  updateBusinessMemory,
  type BusinessMemoryEntry,
  type MemoryPermission,
  type MemoryType,
} from "@/lib/business-memory";
import { isDemoWorkspace } from "@/lib/workspace-mode";

const TYPES: MemoryType[] = ["company", "leadership", "employee", "customer", "operational"];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function BusinessMemoryStudioInner() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as MemoryType | null;
  const activeType: MemoryType = TYPES.includes(typeParam as MemoryType) ? (typeParam as MemoryType) : "company";

  const [entries, setEntries] = useState<BusinessMemoryEntry[]>([]);
  const [content, setContent] = useState("");
  const [source, setSource] = useState("Manual entry");
  const [permission, setPermission] = useState<MemoryPermission>("all_staff");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  function refresh() {
    setEntries(loadBusinessMemories());
  }

  useEffect(() => {
    refresh();
  }, []);

  const pending = loadPendingCorrections();

  function bump() {
    refresh();
  }

  const filtered = memoriesByType(activeType);
  const empty = filtered.length === 0 && !isDemoWorkspace();

  function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    addBusinessMemory({
      type: activeType,
      content,
      source,
      addedBy: "Owner",
      permission,
    });
    setContent("");
    bump();
  }

  function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    updateBusinessMemory(editingId, { content: editContent });
    setEditingId(null);
    bump();
  }

  return (
    <div className="training-studio">
      <div className="memory-card">
        <div className="label">One memory engine</div>
        <p>
          Company, leadership, employee, customer, and operational memory — permission-aware, with source tracking.
          Phone & Reception and Atlas Assistant read from the same system.
        </p>
      </div>

      {pending.length ? (
        <section className="panel">
          <h2>Pending corrections</h2>
          {pending.map((p) => (
            <div key={p.id} className="memory-card" style={{ marginBottom: "0.75rem" }}>
              <p><strong>Save to Business Memory?</strong></p>
              <p>{p.content}</p>
              <div className="cta-row">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => { resolvePendingCorrection(p.id, true); bump(); }}
                >
                  Save
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => { resolvePendingCorrection(p.id, false); bump(); }}
                >
                  Don&apos;t save
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <div className="training-tabs" role="tablist">
        {TYPES.map((t) => (
          <a
            key={t}
            href={`/app/memory?type=${t}`}
            className={activeType === t ? "training-tab active" : "training-tab"}
          >
            {MEMORY_TYPE_LABELS[t]}
          </a>
        ))}
      </div>

      <p className="muted-line">{MEMORY_TYPE_HINTS[activeType]}</p>

      {empty ? (
        <EmptyState
          title="No memories in this category yet"
          description="Add facts Atlas should know, or correct Atlas when it gets something wrong."
          actions={[
            { label: "Add memory below", href: "#add-memory", primary: true },
            { label: "Phone & Reception", href: "/app/phone?tab=control" },
          ]}
        />
      ) : null}

      <section className="panel">
        <h2>{MEMORY_TYPE_LABELS[activeType]}</h2>
        <div className="list">
          {filtered.map((m) => (
            <div key={m.id} className="compliance-row">
              <div style={{ flex: 1 }}>
                {editingId === m.id ? (
                  <form onSubmit={onSaveEdit} className="form-grid">
                    <textarea rows={2} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                    <button className="btn btn-dark" type="submit">Save</button>
                  </form>
                ) : (
                  <>
                    <p><strong>{m.content}</strong></p>
                    <p className="muted-line">
                      Source: {m.source} · Added {formatDate(m.addedAt)} by {m.addedBy} · Confidence {m.confidence}%
                      · {m.permission} · Updated {formatDate(m.lastUpdated)}
                    </p>
                  </>
                )}
              </div>
              {editingId !== m.id ? (
                <div className="cta-row">
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => { setEditingId(m.id); setEditContent(m.content); }}
                  >
                    Edit
                  </button>
                  <button type="button" className="ghost-link" onClick={() => { deleteBusinessMemory(m.id); bump(); }}>
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="panel" id="add-memory">
        <h2>+ Add memory</h2>
        <form className="form-grid" onSubmit={onAdd}>
          <label>Memory<input value={content} onChange={(e) => setContent(e.target.value)} placeholder="We no longer offer Sunday appointments." /></label>
          <label>Source<input value={source} onChange={(e) => setSource(e.target.value)} /></label>
          <label>
            Permission
            <select value={permission} onChange={(e) => setPermission(e.target.value as MemoryPermission)}>
              <option value="owner">Owner only</option>
              <option value="leadership">Leadership</option>
              <option value="managers">Managers</option>
              <option value="all_staff">All staff</option>
              <option value="customer_facing">Customer-facing (receptionist)</option>
            </select>
          </label>
          <button className="btn btn-dark" type="submit">Save memory</button>
        </form>
      </section>
    </div>
  );
}

export function BusinessMemoryStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading memory…</p>}>
      <BusinessMemoryStudioInner />
    </Suspense>
  );
}
