"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createApprovalRequest,
  evaluateAction,
  seedApprovalsIfEmpty,
} from "@/lib/surface-workspace";
import {
  createTeamTask,
  loadTeamMembers,
  loadTeamTasks,
  logAudit,
  saveTeamTasks,
  seedDemoTeamIfEmpty,
  todayISO,
  type TeamPerson,
} from "@/lib/user-workspace";

type ScreenItem = { title: string; sub?: string };
type Screen = { kind: "list" | "stat"; heading: string; items: ScreenItem[] } | null;
type Turn = { who: "you" | "atlas"; text: string; screen?: Screen };
type PendingAction =
  | { type: "refund"; amount: number; label: string }
  | { type: "delete"; label: string }
  | null;

// Mock leadership data for the demo.
const OVERDUE_PROJECTS = [
  { name: "Phoenix", days: 4, risk: 2, reason: "A vendor slipped their delivery date.", owner: "Casey Nolan" },
  { name: "Dallas Expansion", days: 2, risk: 3, reason: "Two tasks are blocked waiting on permits, and the site survey came back late.", owner: "Mike Ross" },
  { name: "Website Redesign", days: 1, risk: 1, reason: "Copywriting is still in review.", owner: "Ashley Kim" },
];

// Minimal typing for the optional Web Speech API.
type SpeechRec = {
  start: () => void;
  stop: () => void;
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

const INPUT_MODES = [
  { id: "text", label: "Keyboard / text only" },
  { id: "ptt", label: "Push to talk" },
  { id: "wake", label: "Wake word (“Hey Atlas”)" },
];

export function TalkToAtlasStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [personaId, setPersonaId] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("text");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [subject, setSubject] = useState<string | null>(null); // last project discussed
  const recRef = useRef<SpeechRec | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    seedApprovalsIfEmpty();
    const list = loadTeamMembers();
    setMembers(list);
    const sarah = list.find((m) => m.name === "Sarah Williams");
    setPersonaId((prev) => prev || sarah?.id || list[0]?.id || "");
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [turns]);

  const persona = useMemo(() => members.find((m) => m.id === personaId) ?? null, [members, personaId]);

  function speak(text: string) {
    try {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(u);
      // Safety: clear the indicator even if onend doesn't fire.
      window.setTimeout(() => setSpeaking(false), Math.min(9000, 1500 + text.length * 45));
    } catch {
      setSpeaking(false);
    }
  }

  function say(text: string, screen?: Screen) {
    setTurns((t) => [...t, { who: "atlas", text, screen }]);
    speak(text);
  }

  function firstName(name: string) {
    return name.split(" ")[0];
  }

  function personaTasksToday() {
    if (!persona) return [];
    const today = todayISO();
    return loadTeamTasks().filter((t) => t.memberId === persona.id && t.status !== "completed" && (!t.dueDate || t.dueDate <= today));
  }

  function runIntent(raw: string) {
    let q = raw.trim();
    if (!q) return;
    // Optional wake word.
    q = q.replace(/^\s*hey,?\s+atlas[,!.]?\s*/i, "").trim();
    const ql = q.toLowerCase();
    setTurns((t) => [...t, { who: "you", text: raw.trim() }]);

    // Confirm a pending action ("yes"/"submit"/"confirm").
    if (pending && /^(yes|yep|confirm|submit|do it|go ahead|please do)\b/.test(ql)) {
      if (pending.type === "refund") {
        createApprovalRequest({ kind: "Refund", title: pending.label, amount: pending.amount, requestedBy: persona ? firstName(persona.name) : "Employee", reason: "Requested via Atlas voice", priority: pending.amount >= 500 ? "urgent" : "normal" });
        logAudit(persona?.name ?? "Employee", "submitted approval request (voice)", pending.label);
        setPending(null);
        say("Submitted for manager approval. It's now in the Approval Inbox.");
      }
      return;
    }
    if (pending && /^(no|cancel|stop|nevermind|never mind)\b/.test(ql)) {
      setPending(null);
      say("Okay, cancelled.");
      return;
    }

    // ── Actions ──────────────────────────────────────────────────────────
    const createTask = q.match(/create (?:a )?task for (\w+) to (.+)/i);
    if (createTask) {
      const who = members.find((m) => firstName(m.name).toLowerCase() === createTask[1].toLowerCase());
      let body = createTask[2].trim();
      const dueTomorrow = /tomorrow/i.test(body);
      body = body.replace(/\b(by\s+)?(tomorrow|today)( morning| afternoon| evening)?.*$/i, "").trim();
      const title = body.charAt(0).toUpperCase() + body.slice(1);
      if (who) {
        const task = createTeamTask({ memberId: who.id, title, assignedBy: "Atlas (voice)", dueDate: dueTomorrow ? todayISO(new Date(Date.now() + 864e5)) : "" });
        saveTeamTasks([task, ...loadTeamTasks()]);
        logAudit(persona?.name ?? "User", "created task (voice)", `${title} → ${who.name}`);
        say(`I created “${title}” for ${firstName(who.name)}${dueTomorrow ? ", due tomorrow morning" : ""}.`, { kind: "list", heading: "New task", items: [{ title, sub: `Assigned to ${who.name}${dueTomorrow ? " · due tomorrow" : ""}` }] });
      } else {
        say(`I couldn't find "${createTask[1]}" on the team. Try another name.`);
      }
      return;
    }
    const meeting = ql.match(/schedule (?:a )?meeting with (.+?)(?: on)? (monday|tuesday|wednesday|thursday|friday|saturday|sunday)?\s*at (\d{1,2})/);
    if (meeting) {
      const team = meeting[1].trim();
      const day = meeting[2] ? meeting[2][0].toUpperCase() + meeting[2].slice(1) : "";
      const time = `${meeting[3]}:00`;
      say(`I checked everyone's calendars — you're clear. I scheduled a meeting with the ${team} ${day ? day + " " : ""}at ${time}.`, { kind: "list", heading: "Meeting scheduled", items: [{ title: `${team} meeting`, sub: `${day || "This week"} at ${time} · invites sent` }] });
      return;
    }
    const message = q.match(/message (\w+)[,: ]*(?:and )?(?:tell (?:her|him|them) )?(.+)/i);
    if (message) {
      say(`Done — I messaged ${message[1]}: “${message[2].trim()}”.`, { kind: "list", heading: "Message sent", items: [{ title: `To ${message[1]}`, sub: message[2].trim() }] });
      return;
    }
    if (/mark (?:this |my )?task (?:as )?complete|complete (?:this|my) task/.test(ql)) {
      say("Done — I marked your current task complete.");
      return;
    }
    const refund = ql.match(/refund.*?\$?\s*([\d,]+)/);
    if (refund) {
      const amount = Number(refund[1].replace(/,/g, "")) || 0;
      const label = `Refund — $${amount.toLocaleString()}`;
      const decision = persona ? evaluateAction(persona, "refund_customers", amount) : { outcome: "needs_approval" as const, message: "" };
      if (decision.outcome === "auto" || decision.outcome === "allowed") {
        logAudit(persona?.name ?? "User", "issued refund (voice)", label);
        say(`Done — I refunded the customer $${amount.toLocaleString()} (within your approval limit).`);
      } else {
        setPending({ type: "refund", amount, label });
        say(`This refund of $${amount.toLocaleString()} requires manager approval. Would you like me to submit the request?`);
      }
      return;
    }
    if (/delete (?:this )?customer(?: account)?/.test(ql)) {
      setPending({ type: "delete", label: "Delete customer account" });
      say("This permanently removes the account. Please confirm on screen.");
      return;
    }

    // ── Follow-ups (use remembered subject) ──────────────────────────────
    if (/^\s*why\b/.test(ql) && subject) {
      const p = OVERDUE_PROJECTS.find((x) => x.name === subject);
      if (p) { say(`${p.name} is behind because ${p.reason}`); return; }
    }
    if (/\bwho\b.*(responsible|owns|handling|on it)|who is responsible/.test(ql) && subject) {
      const p = OVERDUE_PROJECTS.find((x) => x.name === subject);
      if (p) { say(`${p.owner} owns the delayed tasks on ${p.name}. Want me to message them?`, { kind: "list", heading: `${p.name} — owner`, items: [{ title: p.owner, sub: "Responsible for the delayed tasks" }] }); return; }
    }

    // ── Queries ──────────────────────────────────────────────────────────
    if (/most behind|furthest behind|worst project|which project/.test(ql)) {
      const worst = [...OVERDUE_PROJECTS].sort((a, b) => b.risk - a.risk)[0];
      setSubject(worst.name);
      say(`${worst.name}.`, { kind: "list", heading: "Most behind", items: [{ title: worst.name, sub: `${worst.days} days overdue` }] });
      return;
    }
    if (/overdue|behind schedule|late projects/.test(ql)) {
      setSubject(null);
      say(`You currently have three overdue projects.`, { kind: "list", heading: "Overdue projects", items: OVERDUE_PROJECTS.map((p) => ({ title: p.name, sub: `${p.days} day${p.days === 1 ? "" : "s"} overdue` })) });
      return;
    }
    if (/tasks?.*(left|remaining|today|do i have)|what.*do i.*(finish|today)/.test(ql)) {
      const open = personaTasksToday();
      const high = open.filter((t) => t.priority === "High" || t.priority === "Urgent").length;
      const timed = open.filter((t) => t.dueTime).sort((a, b) => (a.dueTime < b.dueTime ? -1 : 1))[0];
      const next = timed ? ` Your next deadline is ${timed.title}${timed.dueTime ? ` at ${timed.dueTime}` : ""}.` : "";
      say(`You have ${open.length} task${open.length === 1 ? "" : "s"} remaining.${high ? ` ${high === 1 ? "One is" : `${high} are`} high priority.` : ""}${next}`, { kind: "list", heading: "Tasks remaining today", items: open.slice(0, 6).map((t) => ({ title: t.title, sub: `${t.priority}${t.dueTime ? ` · ${t.dueTime}` : ""}` })) });
      return;
    }
    if (/sales|revenue|how are we doing|numbers today/.test(ql)) {
      say(`Sales are currently $184,200, up 8.4% from the same time yesterday. The Midwest region is performing best.`, {
        kind: "list",
        heading: "Sales today · $184,200 (▲ 8.4%)",
        items: [
          { title: "Midwest", sub: "$71,400 · best performing" },
          { title: "Northeast", sub: "$52,900" },
          { title: "West", sub: "$41,300" },
          { title: "South", sub: "$18,600" },
        ],
      });
      return;
    }
    if (/schedule|calendar|what.?s on my/.test(ql)) {
      const timed = personaTasksToday().filter((t) => t.dueTime).sort((a, b) => (a.dueTime < b.dueTime ? -1 : 1));
      say(timed.length ? `Here's your schedule for today.` : `You have no timed items left today.`, { kind: "list", heading: "Today's schedule", items: timed.map((t) => ({ title: t.title, sub: t.dueTime })) });
      return;
    }

    say(`I can help with tasks, sales, projects, scheduling, messages, refunds, and more. Try “what tasks do I have left today?” or “show me overdue projects.”`);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    runIntent(text);
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition;
    if (!Ctor) {
      setMicNote("Voice input isn't available in this browser — type your request below (that's one of the supported modes).");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (ev) => {
      const transcript = ev.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) runIntent(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setMicNote("I couldn't capture audio — please type instead."); };
    recRef.current = rec;
    setMicNote(null);
    setListening(true);
    rec.start();
  }

  function confirmPending() {
    if (!pending) return;
    if (pending.type === "delete") {
      logAudit(persona?.name ?? "User", "deleted customer account (voice, confirmed)", pending.label);
      setPending(null);
      say("The customer account has been permanently deleted and recorded in the audit log.");
    } else if (pending.type === "refund") {
      createApprovalRequest({ kind: "Refund", title: pending.label, amount: pending.amount, requestedBy: persona ? firstName(persona.name) : "Employee", reason: "Requested via Atlas voice", priority: pending.amount >= 500 ? "urgent" : "normal" });
      logAudit(persona?.name ?? "Employee", "submitted approval request (voice)", pending.label);
      setPending(null);
      say("Submitted for manager approval. It's now in the Approval Inbox.");
    }
  }

  const SAMPLES = ["What tasks do I have left today?", "How are sales doing today?", "Show me overdue projects.", "Which project is most behind?", "Why?", "Who is responsible for the delayed tasks?", "Create a task for Mike to call Johnson tomorrow morning", "Refund the customer $2,400", "Delete this customer account"];

  return (
    <div className="training-studio">
      <section className="panel">
        <div className="train-head">
          <div>
            <h2>🎤 Talk to Atlas</h2>
            <p className="panel-lead">Atlas answers out loud and on screen, keeps the conversation&apos;s context, and can take permitted actions.</p>
          </div>
          <div className="field-row" style={{ alignItems: "flex-end" }}>
            <label>Speaking as<select value={personaId} onChange={(e) => setPersonaId(e.target.value)}>{members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}</select></label>
            <label>Input mode<select value={mode} onChange={(e) => setMode(e.target.value)}>{INPUT_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
          </div>
        </div>

        <div className="train-actions" style={{ alignItems: "center" }}>
          <button className={listening ? "btn btn-dark" : "btn btn-outline"} type="button" onClick={toggleMic}>
            {listening ? "● Listening… (stop)" : "🎤 Talk to Atlas"}
          </button>
          {speaking ? <span className="badge ok">🔊 Atlas is speaking…</span> : null}
          {mode === "wake" ? <span className="muted-line">Wake word on — say “Hey Atlas …” (optional & private).</span> : null}
        </div>
        {micNote ? <p className="muted-line" style={{ marginTop: "0.4rem" }}>{micNote}</p> : null}

        <form className="command-form" style={{ marginTop: "0.6rem" }} onSubmit={submit}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "wake" ? "Hey Atlas, what's on my schedule?" : "Ask Atlas…"} aria-label="Ask Atlas" />
          <button className="btn btn-dark" type="submit">Send</button>
        </form>

        <div className="status-picker" style={{ marginTop: "0.5rem" }}>
          {SAMPLES.map((s) => (
            <button key={s} type="button" className="status-chip" onClick={() => runIntent(s)}>{s}</button>
          ))}
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Conversation</h2>
          <div className="command-thread" ref={threadRef} style={{ maxHeight: "26rem", overflowY: "auto" }}>
            {turns.length === 0 ? (
              <p className="muted-line">Tap a suggestion or ask something to begin.</p>
            ) : (
              turns.map((t, i) => (
                <div key={i} className={`bubble ${t.who === "you" ? "bubble-user" : "bubble-ai"}`}>
                  <span className="agent-tag">{t.who === "you" ? (persona ? persona.name : "You") : "Atlas"}</span>
                  {t.text}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <h2>On screen</h2>
          {pending ? (
            <div className="confirm-card" style={{ marginBottom: "0.6rem" }}>
              <div className="confirm-prompt">{pending.type === "delete" ? "⛔ Confirm permanent deletion" : "⚠️ Approval required"}</div>
              <p>{pending.type === "delete" ? "This permanently removes the customer account. This can't be undone." : `Submit “${pending.label}” to your manager for approval?`}</p>
              <div className="train-actions" style={{ marginTop: "0.4rem" }}>
                <button className="btn btn-dark" type="button" onClick={confirmPending}>{pending.type === "delete" ? "Yes, permanently delete" : "Submit request"}</button>
                <button className="btn btn-outline" type="button" onClick={() => { setPending(null); say("Okay, cancelled."); }}>Cancel</button>
              </div>
            </div>
          ) : null}
          {(() => {
            const lastScreen = [...turns].reverse().find((t) => t.who === "atlas" && t.screen)?.screen;
            if (!lastScreen) return <p className="muted-line">Atlas shows details here while it speaks.</p>;
            return (
              <>
                <div className="label">{lastScreen.heading}</div>
                <div className="list">
                  {lastScreen.items.map((it, i) => (
                    <div className="list-row" key={i}>
                      <span className="badge">•</span>
                      <p><strong>{it.title}</strong>{it.sub ? <span className="muted-line">{it.sub}</span> : null}</p>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </section>
      </div>
    </div>
  );
}
