"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  getPresence,
  loadTeamMembers,
  seedDemoTeamIfEmpty,
  workforceAssistantReply,
  workforceByLocation,
  type EmployeePresence,
  type TeamPerson,
  type WorkforceAnswer,
} from "@/lib/user-workspace";

type ChatMsg = { role: "user" | "ai"; text: string; items?: string[] };

const PROMPTS = [
  "Who's working right now?",
  "Who has too much work?",
  "Which tasks are late?",
  "Who can take another customer?",
  "Which employees need training?",
  "Who is available Saturday?",
];

export function WorkforceMapStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [presence, setPresence] = useState<Record<string, EmployeePresence>>({});
  const [now, setNow] = useState(() => Date.now());
  const [chat, setChat] = useState<ChatMsg[]>([
    { role: "ai", text: "Ask me anything about your workforce — I use the live employee and task system." },
  ]);
  const [ask, setAsk] = useState("");

  const refresh = useCallback(() => {
    const people = loadTeamMembers();
    const map: Record<string, EmployeePresence> = {};
    for (const m of people) map[m.id] = getPresence(m.id);
    setMembers(people);
    setPresence(map);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    const interval = window.setInterval(refresh, 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const locations = useMemo(() => workforceByLocation(members, presence, now), [members, presence, now]);
  const totals = useMemo(
    () =>
      locations.reduce(
        (acc, l) => ({ working: acc.working + l.working, onBreak: acc.onBreak + l.onBreak, offline: acc.offline + l.offline }),
        { working: 0, onBreak: 0, offline: 0 },
      ),
    [locations],
  );

  function run(q: string) {
    const reply: WorkforceAnswer = workforceAssistantReply(q, Date.now());
    setChat((prev) => [...prev, { role: "user", text: q }, { role: "ai", text: reply.text, items: reply.items }]);
  }
  function onAsk(e: FormEvent) {
    e.preventDefault();
    if (!ask.trim()) return;
    run(ask.trim());
    setAsk("");
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>🟢 Working</span>
          <strong>{totals.working}</strong>
          <small>Company-wide</small>
        </div>
        <div className="stat">
          <span>🟡 On break</span>
          <strong>{totals.onBreak}</strong>
          <small>Company-wide</small>
        </div>
        <div className="stat">
          <span>🔴 Offline</span>
          <strong>{totals.offline}</strong>
          <small>Company-wide</small>
        </div>
        <div className="stat">
          <span>Locations</span>
          <strong>{locations.length}</strong>
          <small>Sites</small>
        </div>
      </div>

      <section className="panel">
        <h2>By location</h2>
        <div className="pack-grid dense" style={{ marginTop: "1rem" }}>
          {locations.map((l) => (
            <div className="domain-card" key={l.location}>
              <strong>{l.location}</strong>
              <span>🟢 {l.working} working</span>
              <span>🟡 {l.onBreak} break</span>
              <span>🔴 {l.offline} offline</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel command-panel">
        <h2>Ask Atlas about your workforce</h2>
        <div className="cta-row" style={{ marginBottom: "0.6rem" }}>
          {PROMPTS.map((p) => (
            <button key={p} type="button" className="btn btn-outline" onClick={() => run(p)}>
              {p}
            </button>
          ))}
        </div>
        <div className="command-thread">
          {chat.map((m, i) => (
            <div key={i} className={`bubble ${m.role === "ai" ? "bubble-ai" : "bubble-user"}`}>
              {m.text}
              {m.items && m.items.length ? (
                <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
                  {m.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
        <form className="command-form" onSubmit={onAsk}>
          <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="e.g. Who has too much work?" />
          <button className="btn btn-dark" type="submit">Ask</button>
        </form>
      </section>
    </div>
  );
}
