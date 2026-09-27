"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import {
  MEMORY_TYPE_HINTS,
  MEMORY_TYPE_LABELS,
  type MemoryPermission,
  type MemoryType,
} from "@/lib/business-memory";
import { isDemoWorkspace } from "@/lib/workspace-mode";

const TYPES: MemoryType[] = ["company", "leadership", "employee", "customer", "operational"];

type ServerMemory = {
  id: string;
  content: string;
  title?: string;
  source: string;
  authorLabel?: string;
  confidence: number;
  accessLevel: MemoryPermission;
  memoryType: MemoryType;
  createdAt: string;
  updatedAt: string;
};

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

  const [entries, setEntries] = useState<ServerMemory[]>([]);
  const [content, setContent] = useState("");
  const [source, setSource] = useState("Manual entry");
  const [permission, setPermission] = useState<MemoryPermission>("all_staff");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<{ id: string; reason: string; content: string }[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/memory", { credentials: "include" });
      const json = await res.json();
      const rows = (json?.data || json || []) as ServerMemory[];
      setEntries(Array.isArray(rows) ? rows : []);
      setError("");
    } catch {
      setError("Could not load server memory — sign in and retry.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = entries.filter((m) => m.memoryType === activeType);
  const empty = filtered.length === 0 && !isDemoWorkspace();

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setConflicts([]);
    const res = await fetch("/api/memory", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "remember",
        content,
        source,
        memoryType: activeType,
        accessLevel: permission,
      }),
    });
    const json = await res.json();
    const data = json?.data || json;
    if (data?.saved === false && data?.conflicts?.length) {
      setConflicts(data.conflicts);
      setStatus("Conflicts found — review below, then force-save or correct the old memory.");
      return;
    }
    if (!res.ok || data?.saved === false) {
      setError(json?.error || "Could not save memory.");
      return;
    }
    setContent("");
    setStatus("Memory saved to the server.");
    await refresh();
  }

  async function forceSave() {
    const res = await fetch("/api/memory", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "remember",
        content,
        source,
        memoryType: activeType,
        accessLevel: permission,
        force: true,
      }),
    });
    if (!res.ok) {
      setError("Force save failed.");
      return;
    }
    setConflicts([]);
    setContent("");
    setStatus("Memory saved (owner override).");
    await refresh();
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const res = await fetch("/api/memory", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "correct",
        id: editingId,
        content: editContent,
        note: "Owner correction from Memory studio",
      }),
    });
    if (!res.ok) {
      setError("Correction failed.");
      return;
    }
    setEditingId(null);
    setStatus("Memory corrected.");
    await refresh();
  }

  async function onDelete(id: string) {
    const res = await fetch("/api/memory", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (!res.ok) {
      setError("Delete failed (owners/admins only).");
      return;
    }
    setStatus("Memory deleted.");
    await refresh();
  }

  return (
    <div className="training-studio">
      <div className="memory-card">
        <div className="label">One memory engine</div>
        <p>
          Server-backed, permission-aware memory — company, leadership, employees, customers, and operations.
          Conflicts are detected before write; owners can correct or delete.
        </p>
        {status ? <p className="auth-success">{status}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
      </div>

      {conflicts.length ? (
        <section className="panel">
          <h2>Memory conflicts</h2>
          {conflicts.map((c) => (
            <div key={c.id} className="memory-card" style={{ marginBottom: "0.75rem" }}>
              <p><strong>{c.reason}</strong></p>
              <p>{c.content}</p>
            </div>
          ))}
          <div className="cta-row">
            <button className="btn btn-dark" type="button" onClick={() => void forceSave()}>
              Save anyway
            </button>
            <button className="btn btn-outline" type="button" onClick={() => setConflicts([])}>
              Cancel
            </button>
          </div>
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
                  <form onSubmit={(e) => void onSaveEdit(e)} className="form-grid">
                    <textarea rows={2} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                    <button className="btn btn-dark" type="submit">Save correction</button>
                  </form>
                ) : (
                  <>
                    <p><strong>{m.content}</strong></p>
                    <p className="muted-line">
                      Source: {m.source} · Added {formatDate(m.createdAt)} by {m.authorLabel || "—"} · Confidence {m.confidence}%
                      · {m.accessLevel} · Updated {formatDate(m.updatedAt)}
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
                    Correct
                  </button>
                  <button type="button" className="ghost-link" onClick={() => void onDelete(m.id)}>
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
        <form className="form-grid" onSubmit={(e) => void onAdd(e)}>
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
