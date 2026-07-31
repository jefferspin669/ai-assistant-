"use client";

import { useState } from "react";
import { salesCoachCalls } from "@/lib/atlas-platform";

export function SalesCoachStudio() {
  const [callId, setCallId] = useState(salesCoachCalls[0].id);
  const call = salesCoachCalls.find((item) => item.id === callId) ?? salesCoachCalls[0];

  return (
    <div className="training-studio">
      <div className="hub-employee-row" role="group" aria-label="Choose sales call">
        {salesCoachCalls.map((item) => (
          <button
            key={item.id}
            type="button"
            className={callId === item.id ? "hub-employee active" : "hub-employee"}
            onClick={() => setCallId(item.id)}
          >
            <strong>{item.title}</strong>
            <span>{item.duration}</span>
          </button>
        ))}
      </div>

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Talk / listen</span>
          <strong>{call.talkListen}</strong>
          <small>Target near 45/55</small>
        </div>
        <div className="stat">
          <span>Closing probability</span>
          <strong>{call.closingProbability}</strong>
          <small>Model score</small>
        </div>
        <div className="stat">
          <span>Objections</span>
          <strong>{call.objections.length}</strong>
          <small>Detected</small>
        </div>
        <div className="stat">
          <span>Missed plays</span>
          <strong>{call.missed.length}</strong>
          <small>To coach</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Call analysis</h2>
          <h3>Objection handling</h3>
          <div className="list">
            {call.objections.map((item) => (
              <div className="list-row" key={item}>
                <span className="badge warn">Objection</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: "1rem" }}>Missed opportunities</h3>
          <div className="list">
            {call.missed.map((item) => (
              <div className="list-row" key={item}>
                <span className="badge">Missed</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Coaching suggestions</h2>
          <div className="list">
            {call.suggestions.map((item) => (
              <div className="list-row" key={item}>
                <span className="badge ok">Coach</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: "1rem" }}>Snippet</h3>
          <div className="chat-mock">
            {call.transcript.map((line, index) => (
              <div
                key={`${line.speaker}-${index}`}
                className={`bubble ${line.speaker === "Rep" ? "bubble-user" : "bubble-ai"}`}
              >
                <div className="agent-tag">{line.speaker}</div>
                {line.text}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
