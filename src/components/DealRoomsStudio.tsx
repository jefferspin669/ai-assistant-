"use client";

import { useMemo, useState } from "react";
import { dealRooms } from "@/lib/executive-suite";

function docBadge(state: string) {
  if (state === "Reviewed") return "badge ok";
  if (state === "Flagged") return "badge warn";
  return "badge";
}

export function DealRoomsStudio() {
  const [id, setId] = useState(dealRooms[0].id);
  const active = useMemo(() => dealRooms.find((r) => r.id === id) ?? dealRooms[0], [id]);
  const flagged = active.documents.filter((d) => d.state === "Flagged").length;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Active rooms</span>
          <strong>{dealRooms.length}</strong>
          <small>Compartmentalized</small>
        </div>
        <div className="stat">
          <span>Classification</span>
          <strong style={{ fontSize: "0.95rem" }}>{active.classification}</strong>
          <small>Selected room</small>
        </div>
        <div className="stat">
          <span>Members</span>
          <strong>{active.members.length}</strong>
          <small>Need-to-know only</small>
        </div>
        <div className="stat">
          <span>Flagged docs</span>
          <strong>{flagged}</strong>
          <small>Require attention</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Deal rooms">
        {dealRooms.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={id === r.id}
            className={id === r.id ? "training-tab active" : "training-tab"}
            onClick={() => setId(r.id)}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="memory-card">
        <div className="label">
          {active.type} · {active.classification}
        </div>
        <p>
          <strong>{active.name}</strong> — {active.status}
        </p>
        <p className="muted-line" style={{ marginTop: "0.35rem" }}>
          Access: {active.members.join(", ")}
        </p>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Documents</h2>
          <div className="list">
            {active.documents.map((d) => (
              <div className="list-row" key={d.name}>
                <span className={docBadge(d.state)}>{d.state}</span>
                <p>{d.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>AI activity in this room</h2>
          <div className="list">
            {active.aiActivity.map((a) => (
              <div className="list-row" key={a}>
                <span className="badge">Atlas</span>
                <p>{a}</p>
              </div>
            ))}
          </div>
          <div className="confirm-card" style={{ marginTop: "1rem" }}>
            <div className="label">Next step</div>
            <p>{active.nextStep}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
