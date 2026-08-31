"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  createProjectChannel,
  dmChannelId,
  loadAnnouncements,
  loadMessages,
  loadProjectChannels,
  loadTeamMembers,
  messagesFor,
  postAnnouncement,
  sendMessage,
  teamChannelId,
  type Announcement,
  type ChatMessage,
  type ProjectChannel,
  type TeamPerson,
} from "@/lib/user-workspace";

type Tab = "direct" | "teams" | "projects" | "announcements" | "summaries";
type ChannelRef = { id: string; label: string; kind: "dm" | "team" | "project" };

function MessagesStudioInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const toParam = searchParams.get("to");
  const tab: Tab =
    tabParam === "teams" || tabParam === "projects" || tabParam === "announcements" || tabParam === "summaries"
      ? tabParam
      : "direct";
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [projects, setProjects] = useState<ProjectChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [channelId, setChannelId] = useState("");
  const [draft, setDraft] = useState("");
  const [newProject, setNewProject] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setProjects(loadProjectChannels());
    setMessages(loadMessages());
    setAnnouncements(loadAnnouncements());
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const channels = useMemo<ChannelRef[]>(() => {
    const dms = members.map((m) => ({ id: dmChannelId(m.id), label: m.name, kind: "dm" as const }));
    const depts = [...new Set(members.map((m) => m.department || "General"))];
    const teams = depts.map((d) => ({ id: teamChannelId(d), label: `Team · ${d}`, kind: "team" as const }));
    const projs = projects.map((p) => ({ id: p.id, label: `# ${p.name}`, kind: "project" as const }));
    return [...dms, ...teams, ...projs];
  }, [members, projects]);

  const filteredChannels = useMemo(() => {
    if (tab === "direct") return channels.filter((c) => c.kind === "dm");
    if (tab === "teams") return channels.filter((c) => c.kind === "team");
    if (tab === "projects") return channels.filter((c) => c.kind === "project");
    return channels;
  }, [channels, tab]);

  useEffect(() => {
    if (toParam) setChannelId(dmChannelId(toParam));
    else if (!channelId && filteredChannels.length) setChannelId(filteredChannels[0].id);
  }, [filteredChannels, channelId, toParam]);

  const thread = useMemo(() => messagesFor(channelId, messages), [channelId, messages]);
  const activeLabel = filteredChannels.find((c) => c.id === channelId)?.label ?? channels.find((c) => c.id === channelId)?.label ?? "";
  const summaryText =
    thread.length > 0
      ? `Atlas summary: ${thread.length} messages in ${activeLabel}. Latest: “${thread[thread.length - 1]?.text.slice(0, 80)}…”`
      : "No messages to summarize yet.";

  function onSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !channelId) return;
    sendMessage(channelId, "owner", "Owner", draft);
    setDraft("");
    refresh();
  }
  function onCreateProject(e: FormEvent) {
    e.preventDefault();
    if (!newProject.trim()) return;
    const ch = createProjectChannel(newProject);
    setNewProject("");
    refresh();
    setChannelId(ch.id);
  }
  function onPost(e: FormEvent) {
    e.preventDefault();
    if (!annTitle.trim()) return;
    postAnnouncement(annTitle, annBody);
    setAnnTitle("");
    setAnnBody("");
    refresh();
  }

  return (
    <div className="training-studio">
      <div className="training-tabs" role="tablist" aria-label="Messages">
        {(["direct", "teams", "projects", "announcements", "summaries"] as Tab[]).map((t) => (
          <a
            key={t}
            href={`/app/messages?tab=${t}`}
            className={tab === t ? "training-tab active" : "training-tab"}
            role="tab"
          >
            {t === "direct" ? "Direct" : t === "teams" ? "Teams" : t === "projects" ? "Projects" : t === "announcements" ? "Announcements" : "AI summaries"}
          </a>
        ))}
      </div>

      {tab === "summaries" ? (
        <section className="panel">
          <h2>AI-generated summaries</h2>
          <p className="panel-lead">{summaryText}</p>
          <div className="list">
            {channels.slice(0, 6).map((c) => {
              const msgs = messagesFor(c.id, messages);
              return (
                <div key={c.id} className="list-row">
                  <span className="badge ok">{c.kind}</span>
                  <p>
                    <strong>{c.label}</strong>
                    <span className="muted-line">
                      {msgs.length ? `${msgs.length} messages · last: ${msgs[msgs.length - 1]?.text.slice(0, 60)}` : "Quiet"}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "announcements" ? (
        <div className="split">
          <section className="panel">
            <h2>Post announcement</h2>
            <form className="form-grid" onSubmit={onPost}>
              <label>Title<input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required /></label>
              <label>Details<textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={3} /></label>
              <button className="btn btn-dark" type="submit">Post</button>
            </form>
          </section>
          <section className="panel">
            <h2>Announcements</h2>
            <div className="list">
              {announcements.map((a) => (
                <div className="list-row" key={a.id}>
                  <span className="badge ok">{a.acks.length}/{members.length}</span>
                  <p><strong>{a.title}</strong>{a.body ? <span className="muted-line">{a.body}</span> : null}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : tab !== "summaries" ? (
        <div className="split">
          <section className="panel">
            <h2>Channels</h2>
            <div className="list">
              {filteredChannels.map((c) => (
                <button key={c.id} type="button" className={channelId === c.id ? "compliance-row active" : "compliance-row"} onClick={() => setChannelId(c.id)}>
                  <span className="badge">{c.kind}</span>
                  <p><strong>{c.label}</strong></p>
                </button>
              ))}
            </div>
            {tab === "projects" ? (
              <form className="train-form" onSubmit={onCreateProject} style={{ marginTop: "0.8rem" }}>
                <input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="New project channel…" />
                <button className="btn btn-outline" type="submit">Create</button>
              </form>
            ) : null}
          </section>

          <section className="panel command-panel">
            <h2>{activeLabel || "Select a channel"}</h2>
            <div className="command-thread">
              {thread.length === 0 ? (
                <p className="muted-line">No messages yet.</p>
              ) : (
                thread.map((m) => (
                  <div key={m.id} className={`bubble ${m.authorId === "owner" ? "bubble-user" : "bubble-ai"}`}>
                    <span className="agent-tag">{m.authorName}</span>
                    {m.text}
                  </div>
                ))
              )}
            </div>
            <form className="command-form" onSubmit={onSend}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message… use @name to mention" />
              <button className="btn btn-dark" type="submit">Send</button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function MessagesStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading messages…</p>}>
      <MessagesStudioInner />
    </Suspense>
  );
}
