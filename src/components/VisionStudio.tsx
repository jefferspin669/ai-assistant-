"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { visionExamples } from "@/lib/atlas-platform";
import {
  analyzeVisionFile,
  loadVisionUploads,
  saveVisionUploads,
  type VisionUpload,
} from "@/lib/surface-workspace";

type Mode = "examples" | "analyze";

const modes: { id: Mode; label: string }[] = [
  { id: "examples", label: "Examples" },
  { id: "analyze", label: "Upload / capture" },
];

export function VisionStudio({ uploadSignal = 0 }: { uploadSignal?: number }) {
  const [mode, setMode] = useState<Mode>("examples");
  const [uploads, setUploads] = useState<VisionUpload[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadVisionUploads();
    setUploads(loaded);
    setSelectedId(loaded[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (uploadSignal <= 0) return;
    setMode("analyze");
    setPickerOpen(true);
  }, [uploadSignal]);

  const selected = uploads.find((item) => item.id === selectedId) ?? null;

  function persist(next: VisionUpload[], selectId?: string | null) {
    setUploads(next);
    saveVisionUploads(next);
    if (selectId !== undefined) setSelectedId(selectId);
  }

  function ingest(file: File, source: "camera" | "file") {
    setAnalyzing(true);
    setPickerOpen(false);
    setMode("analyze");
    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = String(reader.result || "");
      window.setTimeout(() => {
        const item = analyzeVisionFile(file.name, source, previewUrl);
        const next = [item, ...uploads];
        persist(next, item.id);
        setAnalyzing(false);
        setNote(
          source === "camera"
            ? `Camera photo captured — ${item.result}`
            : `File uploaded — ${item.result}`,
        );
      }, 500);
    };
    reader.readAsDataURL(file);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>, source: "camera" | "file") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    ingest(file, source);
  }

  function tryExample(id: string) {
    const example = visionExamples.find((item) => item.id === id) ?? visionExamples[0];
    setAnalyzing(true);
    setMode("analyze");
    window.setTimeout(() => {
      const item: VisionUpload = {
        id: `ex-${example.id}-${Date.now()}`,
        name: `${example.industry}.jpg`,
        source: "file",
        previewUrl: "",
        industry: example.industry,
        result: example.result,
        detail: example.detail,
        createdAt: new Date().toISOString(),
      };
      const next = [item, ...uploads];
      persist(next, item.id);
      setAnalyzing(false);
      setNote(`Example analyzed — ${example.result}`);
    }, 500);
  }

  return (
    <div className="training-studio">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf,.png,.jpg,.jpeg,.webp,.heic"
        hidden
        onChange={(e) => onFileChange(e, "file")}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => onFileChange(e, "camera")}
      />

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Uploads</span>
          <strong>{uploads.length}</strong>
          <small>Your photos & files</small>
        </div>
        <div className="stat">
          <span>Examples</span>
          <strong>{visionExamples.length}</strong>
          <small>Vision packs</small>
        </div>
        <div className="stat">
          <span>Latest</span>
          <strong>{selected?.industry ?? "—"}</strong>
          <small>{selected ? selected.source : "Waiting"}</small>
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
                className="quality-pattern-card"
                onClick={() => tryExample(example.id)}
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
            <h2>Take a photo or upload a file</h2>
            <p className="panel-lead">
              Use your camera for a live capture, or upload an image / document from your device.
            </p>
            <div className="vision-stage" style={{ marginTop: "1rem" }}>
              <div className="vision-frame">
                {selected?.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.previewUrl}
                    alt={selected.name}
                    style={{
                      width: "100%",
                      maxHeight: 220,
                      objectFit: "cover",
                      borderRadius: 12,
                      marginBottom: "0.75rem",
                    }}
                  />
                ) : (
                  <>
                    <strong>{selected?.industry ?? "Ready"}</strong>
                    <span>{selected?.name ?? "No photo yet"}</span>
                  </>
                )}
                <div className="train-actions">
                  <button
                    className="btn btn-dark"
                    type="button"
                    disabled={analyzing}
                    onClick={() => setPickerOpen((open) => !open)}
                  >
                    {analyzing ? "Analyzing…" : "Upload photo"}
                  </button>
                </div>
                {pickerOpen ? (
                  <div className="train-actions" style={{ marginTop: "0.75rem" }}>
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => cameraRef.current?.click()}
                    >
                      Take picture
                    </button>
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => fileRef.current?.click()}
                    >
                      Upload file
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
          </section>

          <section className="panel">
            <h2>Atlas result</h2>
            {analyzing ? (
              <p className="panel-lead">Reading the image against manuals, plans, and past jobs…</p>
            ) : selected ? (
              <div className="chat-mock">
                <div className="bubble bubble-user">
                  [{selected.source === "camera" ? "Camera capture" : "File upload"} · {selected.name}]
                </div>
                <div className="bubble bubble-ai">
                  <strong>{selected.result}</strong>
                  <span className="muted-line" style={{ display: "block", marginTop: "0.35rem" }}>
                    {selected.detail}
                  </span>
                </div>
              </div>
            ) : (
              <p className="panel-lead">Take a picture or upload a file to see what Atlas understands.</p>
            )}

            <h3 style={{ marginTop: "1rem" }}>Your uploads</h3>
            {uploads.length === 0 ? (
              <p className="muted-line">Nothing uploaded yet.</p>
            ) : (
              <div className="list">
                {uploads.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={selectedId === item.id ? "compliance-row active" : "compliance-row"}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="badge">{item.industry}</span>
                    <div>
                      <p>
                        <strong>{item.result}</strong>
                      </p>
                      <small className="muted-line">
                        {item.source} · {item.name}
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
