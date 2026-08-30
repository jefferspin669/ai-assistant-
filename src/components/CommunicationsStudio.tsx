"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  announcementIsLive,
  announcementStats,
  audienceLabel,
  audienceMembers,
  createAnnouncement,
  createFeedbackPrompt,
  draftBroadcast,
  loadAnnouncements,
  loadFeedbackPrompts,
  loadTeamMembers,
  remindUnread,
  seedDemoTeamIfEmpty,
  summarizeFeedback,
  type Announcement,
  type AnnouncementPriority,
  type Audience,
  type FeedbackPrompt,
  type TeamPerson,
} from "@/lib/user-workspace";

type AudienceKind = Audience["kind"];

const KIND_OPTIONS: { id: AudienceKind; label: string }[] = [
  { id: "all", label: "Company-wide (everyone)" },
  { id: "managers", label: "Managers only" },
  { id: "working", label: "Employees currently working" },
  { id: "night", label: "Night shift" },
  { id: "new", label: "New employees" },
  { id: "department", label: "Department…" },
  { id: "location", label: "Location…" },
  { id: "project", label: "Project…" },
  { id: "members", label: "Specific people…" },
];

export function CommunicationsStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [prompts, setPrompts] = useState<FeedbackPrompt[]>([]);
  const [ready, setReady] = useState(false);

  const [kind, setKind] = useState<AudienceKind>("all");
  const [deptValue, setDeptValue] = useState("");
  const [locValue, setLocValue] = useState("");
  const [projectValue, setProjectValue] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [scheduled, setScheduled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [draftCmd, setDraftCmd] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [fbQuestion, setFbQuestion] = useState("How is the new scheduling system working?");

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setAnnouncements(loadAnnouncements());
    setPrompts(loadFeedbackPrompts());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    setReady(true);
  }, [refresh]);

  const departments = useMemo(() => [...new Set(members.map((m) => m.department).filter(Boolean) as string[])], [members]);
  const locations = useMemo(() => [...new Set(members.map((m) => m.location).filter(Boolean) as string[])], [members]);
  const projects = useMemo(() => ["Johnson Expansion", "Website Launch"], []);

  const audience: Audience = useMemo(() => {
    switch (kind) {
      case "department": return { kind: "department", value: deptValue || departments[0] || "" };
      case "location": return { kind: "location", value: locValue || locations[0] || "" };
      case "project": return { kind: "project", value: projectValue || projects[0] };
      case "members": return { kind: "members", ids: picked };
      default: return { kind } as Audience;
    }
  }, [kind, deptValue, locValue, projectValue, picked, departments, locations, projects]);

  const reach = useMemo(() => audienceMembers(audience).length, [audience]);

  function send(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() && !body.trim()) { setNote("Add a message first."); return; }
    const scheduledFor = scheduled && scheduleAt ? new Date(scheduleAt).toISOString() : "";
    createAnnouncement({ title, body, audience, priority, scheduledFor, from: "CEO" });
    refresh();
    setNote(scheduledFor ? `Scheduled for ${new Date(scheduledFor).toLocaleString()} → ${audienceLabel(audience)} (${reach}).` : `Sent to ${audienceLabel(audience)} (${reach} employees).`);
    setTitle(""); setBody(""); setScheduled(false); setScheduleAt("");
  }

  function draft() {
    if (!draftCmd.trim()) return;
    const d = draftBroadcast(draftCmd);
    setTitle(d.title);
    setBody(d.body);
    setKind(d.audience.kind);
    if (d.audience.kind === "department") setDeptValue(d.audience.value);
    if (d.audience.kind === "location") setLocValue(d.audience.value);
    if (d.audience.kind === "project") setProjectValue(d.audience.value);
    setNote(`Atlas drafted this to ${audienceLabel(d.audience)} — review and send.`);
  }

  function doRemind(a: Announcement) {
    const n = remindUnread(a.id);
    setNote(`Reminded ${n} unread employee${n === 1 ? "" : "s"} about “${a.title}”.`);
  }

  function addPrompt(e: FormEvent) {
    e.preventDefault();
    if (!fbQuestion.trim()) return;
    createFeedbackPrompt(fbQuestion, true);
    refresh();
    setNote("Published an anonymous feedback question to employees.");
  }

  const live = announcements.filter((a) => announcementIsLive(a));
  const upcoming = announcements.filter((a) => !announcementIsLive(a));

  return (
    <div className="training-studio">
      {note ? <div className="memory-card"><div className="label">Atlas</div><p>{note}</p></div> : null}

      <section className="panel">
        <h2>Compose</h2>
        <p className="panel-lead">Because Atlas understands the org, you don&apos;t manually pick hundreds of people.</p>

        <form onSubmit={send}>
          <div className="field-row">
            <label style={{ flex: 1 }}>
              Send to
              <select value={kind} onChange={(e) => setKind(e.target.value as AudienceKind)}>
                {KIND_OPTIONS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </label>
            {kind === "department" ? <label>Department<select value={deptValue} onChange={(e) => setDeptValue(e.target.value)}>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select></label> : null}
            {kind === "location" ? <label>Location<select value={locValue} onChange={(e) => setLocValue(e.target.value)}>{locations.map((l) => <option key={l} value={l}>{l}</option>)}</select></label> : null}
            {kind === "project" ? <label>Project<select value={projectValue} onChange={(e) => setProjectValue(e.target.value)}>{projects.map((p) => <option key={p} value={p}>{p}</option>)}</select></label> : null}
            <label>Priority<select value={priority} onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critical">Critical</option></select></label>
          </div>

          {kind === "members" ? (
            <div className="memory-card" style={{ marginBottom: "0.6rem" }}>
              <div className="label">Pick people (one = direct message)</div>
              <div className="status-picker">
                {members.map((m) => {
                  const on = picked.includes(m.id);
                  return <button key={m.id} type="button" className={on ? "status-chip active" : "status-chip"} onClick={() => setPicked((p) => on ? p.filter((x) => x !== m.id) : [...p, m.id])}>{m.name}</button>;
                })}
              </div>
            </div>
          ) : null}

          <p className="muted-line">📣 Reaches <strong>{reach}</strong> employee{reach === 1 ? "" : "s"} — {audienceLabel(audience)}.</p>

          <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New safety policy begins Monday" /></label>
          <label>Message<textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Details employees will see in Atlas and on mobile." /></label>

          <label className="check-inline"><input type="checkbox" checked={scheduled} onChange={(e) => setScheduled(e.target.checked)} /> Schedule for later</label>
          {scheduled ? <label>Send at<input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} /></label> : null}

          <div className="train-actions" style={{ marginTop: "0.5rem" }}>
            <button className="btn btn-dark" type="submit">{scheduled ? "Schedule" : "Send now"}</button>
          </div>
        </form>

        <div className="memory-card" style={{ marginTop: "0.8rem" }}>
          <div className="label">🤖 Ask Atlas to draft a broadcast</div>
          <form className="command-form" onSubmit={(e) => { e.preventDefault(); draft(); }}>
            <input value={draftCmd} onChange={(e) => setDraftCmd(e.target.value)} placeholder="e.g. Message all managers and tell them tomorrow's leadership meeting moved to 10 AM" />
            <button className="btn btn-outline" type="submit">Draft &amp; preview</button>
          </form>
        </div>
      </section>

      <section className="panel">
        <h2>Read &amp; acknowledgment tracking</h2>
        {!ready ? <p className="muted-line">Loading…</p> : null}
        {ready && live.length === 0 ? <p className="muted-line">No announcements yet.</p> : null}
        <div className="list">
          {live.map((a) => {
            const s = announcementStats(a);
            return (
              <div className="list-row" key={a.id} style={{ alignItems: "flex-start" }}>
                <span className={a.priority === "critical" ? "badge warn" : a.priority === "urgent" ? "badge warn" : "badge"}>{a.priority === "critical" ? "🚨 Critical" : a.priority === "urgent" ? "⚠️ Urgent" : "Normal"}</span>
                <div style={{ flex: 1 }}>
                  <p><strong>{a.title || a.body.slice(0, 40)}</strong><span className="muted-line">{audienceLabel(a.audience ?? { kind: "all" })} · from {a.from}</span></p>
                  <p className="muted-line">
                    {s.read} / {s.audience} read · {s.acked} acknowledged · {s.unread} unread · {s.readNotAcked} read but not acknowledged
                  </p>
                </div>
                {s.unread > 0 ? <button className="btn btn-outline" type="button" onClick={() => doRemind(a)}>Remind unread ({s.unread})</button> : <span className="badge ok">All read</span>}
              </div>
            );
          })}
        </div>
      </section>

      {upcoming.length ? (
        <section className="panel">
          <h2>Scheduled</h2>
          <div className="list">
            {upcoming.map((a) => (
              <div className="list-row" key={a.id}>
                <span className="badge">🕒 {new Date(a.scheduledFor!).toLocaleString()}</span>
                <p><strong>{a.title}</strong><span className="muted-line">{audienceLabel(a.audience ?? { kind: "all" })}</span></p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>Anonymous employee feedback</h2>
        <p className="panel-lead">Publish a question; Atlas summarizes recurring themes so responses stay anonymous.</p>
        <form className="command-form" onSubmit={addPrompt}>
          <input value={fbQuestion} onChange={(e) => setFbQuestion(e.target.value)} placeholder="How is the new scheduling system working?" />
          <button className="btn btn-dark" type="submit">Publish</button>
        </form>
        <div className="list" style={{ marginTop: "0.6rem" }}>
          {prompts.map((p) => {
            const sum = summarizeFeedback(p.id);
            return (
              <div className="list-row" key={p.id} style={{ alignItems: "flex-start" }}>
                <span className="badge">{sum.count} replies</span>
                <div style={{ flex: 1 }}>
                  <p><strong>{p.question}</strong></p>
                  {sum.themes.length ? (
                    <p className="muted-line">Recurring themes: {sum.themes.map((t) => `${t.theme} (${t.count})`).join(", ")}</p>
                  ) : (
                    <p className="muted-line">{sum.count === 0 ? "No responses yet." : "Not enough responses to summarize themes."}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
