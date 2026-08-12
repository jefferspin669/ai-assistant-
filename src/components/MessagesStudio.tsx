"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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

type Tab = "messages" | "announcements";
type ChannelRef = { id: string; label: string };

export function MessagesStudio() {
  const [tab, setTab] = useState<Tab>("messages");
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
    const dms = members.map((m) => ({ id: dmChannelId(m.id), label: `${m.name}` }));
    const depts = [...new Set(members.map((m) => m.department || "General"))];
    const teams = depts.map((d) => ({ id: teamChannelId(d), label: `Team · ${d}` }));
    const projs = projects.map((p) => ({ id: p.id, label: `# ${p.name}` }));
    return [...dms, ...teams, ...projs];
  }, [members, projects]);

  useEffect(() => {
    if (!channelId && channels.length) setChannelId(channels[0].id);
  }, [channels, channelId]);

  const thread = useMemo(() => messagesFor(channelId, messages), [channelId, messages]);
  const activeLabel = channels.find((c) => c.id === channelId)?.label ?? "";

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
      <div className="training-tabs" role="tablist" aria-label="Messages tabs">
        <button type="button" role="tab" aria-selected={tab === "messages"} className={tab === "messages" ? "training-tab active" : "training-tab"} onClick={() => setTab("messages")}>
          Messages
        </button>
        <button type="button" role="tab" aria-selected={tab === "announcements"} className={tab === "announcements" ? "training-tab active" : "training-tab"} onClick={() => setTab("announcements")}>
          Announcements
        </button>
      </div>

      {tab === "messages" ? (
        <div className="split">
          <section className="panel">
            <h2>Channels</h2>
            <div className="list">
              {channels.map((c) => (
                <button key={c.id} type="button" className={channelId === c.id ? "compliance-row active" : "compliance-row"} onClick={() => setChannelId(c.id)}>
                  <span className="badge">{c.id.startsWith("dm:") ? "DM" : c.id.startsWith("team:") ? "Team" : "Project"}</span>
                  <p><strong>{c.label}</strong></p>
                </button>
              ))}
            </div>
            <form className="train-form" onSubmit={onCreateProject} style={{ marginTop: "0.8rem" }}>
              <input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="New project channel…" />
              <button className="btn btn-outline" type="submit">Create</button>
            </form>
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
      ) : (
        <div className="split">
          <section className="panel">
            <h2>Post an announcement</h2>
            <p className="panel-lead">Everyone sees it on their portal and can acknowledge.</p>
            <form className="form-grid" onSubmit={onPost}>
              <label>
                Title
                <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Office closed Monday for Labor Day" required />
              </label>
              <label>
                Details
                <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={3} placeholder="Optional details" />
              </label>
              <button className="btn btn-dark" type="submit">Post announcement</button>
            </form>
          </section>

          <section className="panel">
            <h2>Announcements</h2>
            {announcements.length === 0 ? (
              <p className="muted-line">No announcements yet.</p>
            ) : (
              <div className="list">
                {announcements.map((a) => (
                  <div className="list-row" key={a.id}>
                    <span className="badge ok">
                      {a.acks.length}/{members.length}
                    </span>
                    <p>
                      <strong>{a.title}</strong>
                      {a.body ? <span className="muted-line">{a.body}</span> : null}
                      <span className="muted-line">
                        {a.acks.length}/{members.length} employees acknowledged
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
