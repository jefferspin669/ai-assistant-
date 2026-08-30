"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  certState,
  loadCertifications,
  loadTeamMembers,
  loadTraining,
  seedDemoTeamIfEmpty,
  trainingState,
  type Certification,
  type TeamPerson,
  type TrainingModule,
} from "@/lib/user-workspace";

export function TeamTrainingStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [training, setTraining] = useState<TrainingModule[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setTraining(loadTraining());
    setCerts(loadCertifications());
    setNow(Date.now());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    const interval = window.setInterval(refresh, 8000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Employee";
  const incomplete = useMemo(
    () => training.filter((m) => trainingState(m, now) !== "complete"),
    [training, now],
  );
  const expiringCerts = useMemo(
    () => certs.filter((c) => certState(c, now) !== "valid").sort((a, b) => (a.expires < b.expires ? -1 : 1)),
    [certs, now],
  );

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Modules assigned</span>
          <strong>{training.length}</strong>
          <small>Across the team</small>
        </div>
        <div className="stat">
          <span>Incomplete</span>
          <strong>{incomplete.length}</strong>
          <small>Need attention</small>
        </div>
        <div className="stat">
          <span>Certifications</span>
          <strong>{certs.length}</strong>
          <small>Tracked</small>
        </div>
        <div className="stat">
          <span>Expiring/expired</span>
          <strong>{expiringCerts.length}</strong>
          <small>Within 30 days</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Who needs training</h2>
          {incomplete.length === 0 ? (
            <p className="muted-line">Everyone is up to date.</p>
          ) : (
            <div className="list">
              {incomplete.map((m) => {
                const state = trainingState(m, now);
                return (
                  <div className="list-row" key={m.id}>
                    <span className={state === "overdue" ? "badge warn" : "badge"}>
                      {state === "overdue" ? "Overdue" : `${m.progress}%`}
                    </span>
                    <p>
                      <strong>{m.name}</strong>
                      <span className="muted-line">
                        {nameOf(m.memberId)}
                        {m.dueDate ? ` · due ${m.dueDate}` : ""}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Certifications expiring</h2>
          {expiringCerts.length === 0 ? (
            <p className="muted-line">No certifications expiring soon.</p>
          ) : (
            <div className="list">
              {expiringCerts.map((c) => {
                const state = certState(c, now);
                return (
                  <div className="list-row" key={c.id}>
                    <span className="badge warn">{state === "expired" ? "Expired" : "Expiring"}</span>
                    <p>
                      <strong>{c.name}</strong>
                      <span className="muted-line">
                        {nameOf(c.memberId)} · expires {c.expires}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          <p className="muted-line" style={{ marginTop: "0.8rem" }}>
            Atlas alerts the employee and manager before a certification lapses.
          </p>
        </section>
      </div>
    </div>
  );
}
