"use client";

import { useState } from "react";
import { visionExamples } from "@/lib/atlas-platform";

type Mode = "examples" | "analyze";

const modes: { id: Mode; label: string }[] = [
  { id: "examples", label: "Examples" },
  { id: "analyze", label: "Analyze photo" },
];

export function VisionStudio() {
  const [mode, setMode] = useState<Mode>("examples");
  const [selectedId, setSelectedId] = useState<string>(visionExamples[0].id);
  const [analyzing, setAnalyzing] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; when: string }[]>([]);

  const selected = visionExamples.find((example) => example.id === selectedId) ?? visionExamples[0];
  const result = resultId
    ? visionExamples.find((example) => example.id === resultId) ?? selected
    : null;

  function analyze(id: string) {
    const example = visionExamples.find((item) => item.id === id) ?? visionExamples[0];
    setSelectedId(example.id);
    setMode("analyze");
    setAnalyzing(true);
    setResultId(null);
    window.setTimeout(() => {
      setAnalyzing(false);
      setResultId(example.id);
      setHistory((prev) => [
        { id: example.id, when: "Just now" },
        ...prev.filter((item) => item.id !== example.id),
      ]);
    }, 700);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Industries</span>
          <strong>{visionExamples.length}</strong>
          <small>Vision packs ready</small>
        </div>
        <div className="stat">
          <span>Photos analyzed</span>
          <strong>{history.length}</strong>
          <small>This session</small>
        </div>
        <div className="stat">
          <span>Latest</span>
          <strong>{result ? result.industry : "—"}</strong>
          <small>{result ? "Understood" : "Waiting for upload"}</small>
        </div>
        <div className="stat">
          <span>Linked tools</span>
          <strong>CRM · Quotes</strong>
          <small>Auto notes + parts</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Atlas Vision modes">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "training-tab active" : "training-tab"}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "examples" ? (
        <section className="panel">
          <h2>Employees upload pictures. Atlas understands them.</h2>
          <div className="create-type-grid">
            {visionExamples.map((example) => (
              <button
                key={example.id}
                type="button"
                className={
                  selectedId === example.id ? "quality-pattern-card active" : "quality-pattern-card"
                }
                onClick={() => analyze(example.id)}
              >
                <div className="train-head">
                  <h3 style={{ marginBottom: 0 }}>{example.industry}</h3>
                  <span className="badge ok">Try</span>
                </div>
                <p style={{ marginTop: "0.55rem" }}>“{example.result}”</p>
                <small className="muted-line">{example.title}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "analyze" ? (
        <div className="split">
          <section className="panel">
            <h2>Upload & analyze</h2>
            <p className="panel-lead">Pick an example photo pack — Atlas returns understanding instantly.</p>
            <div className="quality-filter-row">
              {visionExamples.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  className={selectedId === example.id ? "training-tab active" : "training-tab"}
                  onClick={() => setSelectedId(example.id)}
                >
                  {example.industry}
                </button>
              ))}
            </div>
            <div className="vision-stage" style={{ marginTop: "1rem" }}>
              <div className="vision-frame">
                <strong>{selected.industry}</strong>
                <span>{selected.title}</span>
                <button
                  className="btn btn-dark"
                  type="button"
                  disabled={analyzing}
                  onClick={() => analyze(selected.id)}
                >
                  {analyzing ? "Analyzing…" : "Upload photo"}
                </button>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Atlas result</h2>
            {analyzing ? (
              <p className="panel-lead">Reading the image against manuals, plans, and past jobs…</p>
            ) : result ? (
              <div className="chat-mock">
                <div className="bubble bubble-user">[{result.uploadLabel}]</div>
                <div className="bubble bubble-ai">
                  <strong>{result.result}</strong>
                  <span className="muted-line" style={{ display: "block", marginTop: "0.35rem" }}>
                    {result.detail}
                  </span>
                </div>
              </div>
            ) : (
              <p className="panel-lead">Upload a photo to see what Atlas understands.</p>
            )}
            {history.length > 0 ? (
              <>
                <h3 style={{ marginTop: "1rem" }}>Session history</h3>
                <div className="list">
                  {history.map((item) => {
                    const example = visionExamples.find((entry) => entry.id === item.id)!;
                    return (
                      <div className="list-row" key={item.id + item.when}>
                        <span className="badge">{example.industry}</span>
                        <p>
                          {example.result}
                          <span className="muted-line"> · {item.when}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
