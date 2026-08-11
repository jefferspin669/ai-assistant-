"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  groupSuggestions,
  loadSuggestions,
  loadTeamMembers,
  seedDemoTeamIfEmpty,
  type Suggestion,
  type TeamPerson,
} from "@/lib/user-workspace";

export function SuggestionsStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setSuggestions(loadSuggestions());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    const interval = window.setInterval(refresh, 6000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const groups = useMemo(() => groupSuggestions(suggestions), [suggestions]);
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Employee";

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Suggestions</span>
          <strong>{suggestions.length}</strong>
          <small>Submitted</small>
        </div>
        <div className="stat">
          <span>Themes</span>
          <strong>{groups.length}</strong>
          <small>Grouped by topic</small>
        </div>
        <div className="stat">
          <span>Top theme</span>
          <strong style={{ fontSize: "1rem" }}>{groups[0]?.topic ?? "—"}</strong>
          <small>{groups[0] ? `${groups[0].count} mentions` : "None yet"}</small>
        </div>
        <div className="stat">
          <span>Contributors</span>
          <strong>{new Set(suggestions.map((s) => s.memberId)).size}</strong>
          <small>Employees</small>
        </div>
      </div>

      {groups[0] && groups[0].count >= 2 ? (
        <div className="memory-card">
          <div className="label">Atlas insight</div>
          <p>
            <strong>{groups[0].count} employees</strong> mentioned problems with{" "}
            <strong>{groups[0].topic.toLowerCase()}</strong> — worth a closer look.
          </p>
        </div>
      ) : null}

      <section className="panel">
        <h2>Grouped suggestions</h2>
        {groups.length === 0 ? (
          <p className="muted-line">No suggestions yet.</p>
        ) : (
          <div className="list">
            {groups.map((g) => (
              <div key={g.topic}>
                <button
                  type="button"
                  className={openTopic === g.topic ? "compliance-row active" : "compliance-row"}
                  onClick={() => setOpenTopic(openTopic === g.topic ? null : g.topic)}
                >
                  <span className={g.count >= 3 ? "badge warn" : "badge"}>{g.count}</span>
                  <p>
                    <strong>{g.topic}</strong>
                    <span className="muted-line">{g.count} mention{g.count === 1 ? "" : "s"} · click to expand</span>
                  </p>
                </button>
                {openTopic === g.topic ? (
                  <div className="list" style={{ margin: "0.4rem 0 0.6rem 1rem" }}>
                    {g.items.map((s) => (
                      <div className="list-row" key={s.id}>
                        <span className="badge">{nameOf(s.memberId).split(" ")[0]}</span>
                        <p>{s.text}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
