"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { callSummaries as seedCalls } from "@/lib/atlas-platform";
import {
  loadCallSummaries,
  saveCallSummaries,
  summarizeCall,
  type CallSummaryItem,
} from "@/lib/ops-workspace";

function seedAsItems(): CallSummaryItem[] {
  return seedCalls.map((call, index) => ({
    id: `seed-${index}`,
    caller: call.caller,
    when: call.when,
    notes: call.notes,
    summary: call.summary,
    needs: call.actions[0]
      ? `They need: ${call.actions.join("; ").toLowerCase()}.`
      : "They need a clear next step.",
    actions: [...call.actions],
    sentiment: call.sentiment,
    mood: call.mood,
    createdAt: "",
  }));
}

export default function CallSummariesPage() {
  const [items, setItems] = useState<CallSummaryItem[]>([]);
  const [caller, setCaller] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadCallSummaries();
    const next = loaded.length ? loaded : seedAsItems();
    if (!loaded.length) saveCallSummaries(next);
    setItems(next);
    setSelectedId(next[0]?.id ?? null);
    setReady(true);
  }, []);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  function persist(next: CallSummaryItem[]) {
    setItems(next);
    saveCallSummaries(next);
  }

  function onSummarize(e: FormEvent) {
    e.preventDefault();
    const item = summarizeCall({ caller, notes });
    const next = [item, ...items];
    persist(next);
    setSelectedId(item.id);
    setCaller("");
    setNotes("");
  }

  function removeItem(id: string) {
    const next = items.filter((item) => item.id !== id);
    persist(next);
    setSelectedId(next[0]?.id ?? null);
  }

  return (
    <AppShell
      title="AI Call Summary"
      subtitle="Paste call notes — Atlas summarizes the call and explains what the caller needs."
    >
      <div className="split">
        <section className="panel">
          <h2>Summarize a call</h2>
          <form className="form-grid" onSubmit={onSummarize}>
            <label>
              Caller
              <input
                value={caller}
                onChange={(e) => setCaller(e.target.value)}
                placeholder="Elena Brooks"
                required
              />
            </label>
            <label>
              What was said / needed
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="AC blowing warm air, wants morning window, has three dogs…"
                required
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Summarize call
            </button>
          </form>

          <h3 style={{ marginTop: "1rem" }}>Recent summaries</h3>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          <div className="list">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={selectedId === item.id ? "compliance-row active" : "compliance-row"}
                onClick={() => setSelectedId(item.id)}
              >
                <span className="badge">{item.when}</span>
                <div>
                  <p>
                    <strong>{item.caller}</strong>
                  </p>
                  <small className="muted-line">{item.summary}</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          {selected ? (
            <>
              <div className="train-head">
                <div>
                  <h2>
                    {selected.caller}{" "}
                    <span className="muted-line">{selected.when}</span>
                  </h2>
                </div>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => removeItem(selected.id)}
                >
                  Delete
                </button>
              </div>
              <p className="panel-lead">{selected.summary}</p>
              <div className="memory-card" style={{ marginTop: "0.85rem" }}>
                <div className="label">What they need</div>
                <p>{selected.needs}</p>
              </div>
              <div className="list" style={{ marginTop: "1rem" }}>
                <div className="list-row">
                  <span className="badge">Sentiment</span>
                  <p>{selected.sentiment}</p>
                </div>
                <div className="list-row">
                  <span className="badge">Mood</span>
                  <p>{selected.mood}</p>
                </div>
                <div className="list-row">
                  <span className="badge ok">Notes</span>
                  <p>{selected.notes}</p>
                </div>
              </div>
              <h3 style={{ marginTop: "1rem" }}>Action items</h3>
              <ul className="plain-list">
                {selected.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted-line">Summarize a call to see details here.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
