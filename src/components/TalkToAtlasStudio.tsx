"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createApprovalRequest,
  evaluateAction,
  loadVoiceHistory,
  pushVoiceHistory,
  seedApprovalsIfEmpty,
} from "@/lib/surface-workspace";
import {
  blockTask,
  createTeamTask,
  isOpenTask,
  loadTeamMembers,
  loadTeamTasks,
  logAudit,
  replaceTask,
  saveTeamTasks,
  seedDemoTeamIfEmpty,
  startTask,
  todayISO,
  type TeamPerson,
} from "@/lib/user-workspace";

type ScreenItem = { title: string; sub?: string };
type Screen = { kind: "list"; heading: string; items: ScreenItem[] } | null;
type Turn = { who: "you" | "atlas"; text: string; screen?: Screen };
type PendingAction = { type: "refund"; amount: number; label: string } | { type: "delete"; label: string } | null;
type Mode = "ceo" | "employee" | "field" | "customer";

const MODES: { id: Mode; label: string }[] = [
  { id: "ceo", label: "CEO" },
  { id: "employee", label: "Employee" },
  { id: "field", label: "Field Worker" },
  { id: "customer", label: "Customer" },
];

const VOICES = ["Professional", "Warm", "Calm", "Energetic"];
const SPEEDS = [0.75, 1, 1.25, 1.5];

const OVERDUE_PROJECTS = [
  { name: "Phoenix", days: 4, risk: 2, reason: "A vendor slipped their delivery date.", owner: "Casey Nolan" },
  { name: "Dallas Expansion", days: 2, risk: 3, reason: "Two tasks are blocked waiting on permits, and the site survey came back late.", owner: "Mike Ross" },
  { name: "Website Redesign", days: 1, risk: 1, reason: "Copywriting is still in review.", owner: "Ashley Kim" },
];

const SAMPLES: Record<Mode, string[]> = {
  ceo: ["Give me my morning briefing", "Tell me about Dallas", "What happens if we add another project manager?", "Prepare that recommendation for my COO", "How are sales doing today?"],
  employee: ["What should I do next?", "Start my inventory task", "Mark this task blocked", "Find the safety procedure", "Message my manager that I'm waiting on approval"],
  field: ["Pull up the customer I'm visiting", "What equipment did we install last time?", "Add a note that the compressor needs replacement", "Message my manager that I'm running late"],
  customer: ["I need to reschedule my appointment", "Thursday", "What time is my appointment?"],
};

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

export function TalkToAtlasStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [personaId, setPersonaId] = useState("");
  const [mode, setMode] = useState<Mode>("ceo");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [reschedule, setReschedule] = useState<"offered" | null>(null);
  const [voice, setVoice] = useState("Professional");
  const [rate, setRate] = useState(1);
  const [length, setLength] = useState<"short" | "detailed">("detailed");
  const [history, setHistory] = useState<{ id: string; text: string; mode: string; at: string }[]>([]);
  const recRef = useRef<SpeechRec | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    seedApprovalsIfEmpty();
    const list = loadTeamMembers();
    setMembers(list);
    const sarah = list.find((m) => m.name === "Sarah Williams");
    setPersonaId((prev) => prev || sarah?.id || list[0]?.id || "");
    setHistory(loadVoiceHistory());
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [turns]);

  const persona = useMemo(() => members.find((m) => m.id === personaId) ?? null, [members, personaId]);
  const first = (n: string) => n.split(" ")[0];

  function stopSpeaking() {
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    setSpeaking(false);
  }
  function speak(text: string) {
    try {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate * (voice === "Energetic" ? 1.08 : voice === "Calm" ? 0.92 : 1);
      u.pitch = voice === "Warm" ? 1.1 : voice === "Calm" ? 0.9 : 1;
      u.onend = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(u);
      window.setTimeout(() => setSpeaking(false), Math.min(12000, 1500 + (text.length * 55) / rate));
    } catch { setSpeaking(false); }
  }
  function say(text: string, screen?: Screen) {
    setTurns((t) => [...t, { who: "atlas", text, screen }]);
    speak(text);
  }
  const pick = (short: string, detailed: string) => (length === "short" ? short : detailed);

  function personaOpenTasks() {
    if (!persona) return [];
    const today = todayISO();
    return loadTeamTasks().filter((t) => t.memberId === persona.id && isOpenTask(t.status) && (!t.dueDate || t.dueDate <= today));
  }

  function runIntent(raw: string) {
    let q = raw.trim();
    if (!q) return;
    stopSpeaking(); // interrupt any current speech immediately
    q = q.replace(/^\s*hey,?\s+atlas[,!.]?\s*/i, "").trim();
    const ql = q.toLowerCase();
    setTurns((t) => [...t, { who: "you", text: raw.trim() }]);
    setHistory(pushVoiceHistory(raw.trim(), mode));

    // ── Pending confirmations ────────────────────────────────────────────
    if (pending && /^(yes|yep|confirm|submit|do it|go ahead)\b/.test(ql)) {
      confirmPending();
      return;
    }
    if (pending && /^(no|cancel|stop|never ?mind)\b/.test(ql)) {
      setPending(null);
      say("Okay, cancelled.");
      return;
    }

    // ── Customer reschedule flow ─────────────────────────────────────────
    if (mode === "customer") {
      if (/reschedule|move my appointment|change my appointment/.test(ql)) {
        setReschedule("offered");
        say("Your appointment is currently Wednesday at 10 AM. I have Thursday at 9 AM or Friday at 1 PM available.", { kind: "list", heading: "Reschedule", items: [{ title: "Current", sub: "Wednesday at 10:00 AM" }, { title: "Option 1", sub: "Thursday at 9:00 AM" }, { title: "Option 2", sub: "Friday at 1:00 PM" }] });
        return;
      }
      if (reschedule === "offered" && /thursday|thu\b|option 1|9 ?am/.test(ql)) {
        setReschedule(null);
        say("You're rescheduled for Thursday at 9 AM. I've sent you a confirmation.", { kind: "list", heading: "Confirmed", items: [{ title: "New appointment", sub: "Thursday at 9:00 AM · confirmation emailed" }] });
        return;
      }
      if (reschedule === "offered" && /friday|fri\b|option 2|1 ?pm/.test(ql)) {
        setReschedule(null);
        say("You're rescheduled for Friday at 1 PM. I've sent you a confirmation.", { kind: "list", heading: "Confirmed", items: [{ title: "New appointment", sub: "Friday at 1:00 PM · confirmation emailed" }] });
        return;
      }
      if (/what time.*appointment|when.*appointment/.test(ql)) {
        say("Your appointment is Wednesday at 10 AM.", { kind: "list", heading: "Your appointment", items: [{ title: "Wednesday", sub: "10:00 AM" }] });
        return;
      }
    }

    // ── CEO mode ─────────────────────────────────────────────────────────
    if (/morning briefing|brief me|my briefing|good morning/.test(ql)) {
      say(
        pick(
          "Good morning. Revenue up 6%. Three projects need attention. Five approvals waiting. First meeting 9:30.",
          "Good morning. Revenue is up 6% this week. Three projects require attention. Dallas Expansion is projected to exceed budget by $41,000. You have five approvals waiting, and your first meeting begins at 9:30.",
        ),
        { kind: "list", heading: "Morning briefing", items: [
          { title: "Revenue", sub: "▲ 6% this week" },
          { title: "Projects needing attention", sub: "3 (Dallas Expansion projected +$41,000 over budget)" },
          { title: "Approvals waiting", sub: "5 in your inbox" },
          { title: "First meeting", sub: "9:30 AM" },
        ] },
      );
      return;
    }
    if (/tell me about dallas|about dallas|dallas expansion/.test(ql)) {
      setSubject("Dallas Expansion");
      say(
        pick(
          "Dallas Expansion is ~$41K over budget; permits blocked two tasks.",
          "Dallas Expansion is projected to exceed budget by $41,000. Two tasks are blocked waiting on permits and the site survey came back late, pushing the schedule out about two weeks. Mike Ross owns the delayed tasks.",
        ),
        { kind: "list", heading: "Dallas Expansion", items: [
          { title: "Budget", sub: "Projected +$41,000 over" },
          { title: "Schedule", sub: "~2 weeks behind" },
          { title: "Blockers", sub: "Permits (2 tasks) · late site survey" },
          { title: "Owner", sub: "Mike Ross" },
        ] },
      );
      return;
    }
    if (/add(ing)? (another )?(a )?project manager|extra pm|another pm/.test(ql)) {
      say(
        pick(
          "Adding a PM: back on schedule ~9 days, overage drops to ~$12K for +$18K cost. Near break-even, deadline protected.",
          "Running the simulation: adding another project manager is projected to recover about 9 days, cutting the overage from $41,000 to roughly $12,000 at an added engagement cost of $18,000 — close to break-even, and it protects the delivery date.",
        ),
        { kind: "list", heading: "Simulation: +1 project manager", items: [
          { title: "Schedule", sub: "Recovers ~9 days" },
          { title: "Budget overage", sub: "$41,000 → ~$12,000" },
          { title: "Added cost", sub: "$18,000 engagement" },
          { title: "Net", sub: "≈ break-even · deadline protected" },
        ] },
      );
      return;
    }
    if (/prepare (that )?recommendation|send.*to my coo|for my coo/.test(ql)) {
      logAudit("CEO", "prepared recommendation (voice)", "Dallas Expansion — add a project manager");
      say("Done — I drafted the recommendation and shared it with your COO.", { kind: "list", heading: "Recommendation prepared", items: [{ title: "Dallas Expansion — add a PM", sub: "Shared with COO · summary + simulation attached" }] });
      return;
    }

    // ── Employee mode ────────────────────────────────────────────────────
    if (/what should i do next|what.?s next|what do i do next/.test(ql)) {
      const open = personaOpenTasks();
      const top = [...open].sort((a, b) => (a.dueTime && b.dueTime ? (a.dueTime < b.dueTime ? -1 : 1) : 0))[0];
      say(top ? `Work on ${top.title} next${top.dueTime ? ` — it's due at ${top.dueTime}` : ""}.` : "You're all caught up — nothing pending.", top ? { kind: "list", heading: "Do next", items: [{ title: top.title, sub: `${top.priority}${top.dueTime ? ` · ${top.dueTime}` : ""}` }] } : null);
      return;
    }
    if (/start (my )?(the )?inventory( task)?/.test(ql)) {
      const open = personaOpenTasks();
      const inv = open.find((t) => /inventory/i.test(t.title));
      if (inv && persona) {
        saveTeamTasks(replaceTask(loadTeamTasks(), startTask(inv)));
        logAudit(persona.name, "started task (voice)", inv.title);
        say(`Started “${inv.title}”. Your status is now Working.`, { kind: "list", heading: "Working on", items: [{ title: inv.title, sub: "Timer started · status: Working" }] });
      } else {
        say("I couldn't find an inventory task on your list right now.");
      }
      return;
    }
    if (/mark (this |my )?task (as )?blocked|i.?m blocked/.test(ql)) {
      const open = personaOpenTasks();
      const t0 = open[0];
      if (t0 && persona) {
        saveTeamTasks(replaceTask(loadTeamTasks(), blockTask(t0, "Waiting on approval")));
        logAudit(persona.name, "blocked task (voice)", t0.title);
        say(`Marked “${t0.title}” as blocked and notified your manager.`, { kind: "list", heading: "Blocked", items: [{ title: t0.title, sub: "Manager notified" }] });
      } else {
        say("Marked as blocked and notified your manager.");
      }
      return;
    }
    if (/find (the )?safety procedure|safety procedure|safety guide/.test(ql)) {
      say(
        pick(
          "Safety: PPE on, isolate power (LOTO), verify de-energized, then proceed. Source: Safety Manual §2.",
          "Here's the safety procedure: put on required PPE, isolate and lock out power (lockout/tagout), verify the equipment is de-energized, then proceed. Stop and call a supervisor if anything is unclear.",
        ),
        { kind: "list", heading: "Safety procedure", items: [{ title: "Lockout/Tagout", sub: "PPE → isolate power → verify de-energized → proceed" }, { title: "Source", sub: "Safety Manual, §2" }] },
      );
      return;
    }
    if (/message my manager.*(waiting|approval)|tell my manager.*approval/.test(ql)) {
      say("Done — I messaged your manager: “I'm waiting on approval.”", { kind: "list", heading: "Message sent", items: [{ title: "To your manager", sub: "I'm waiting on approval." }] });
      return;
    }
    if (/message my manager.*(late|running late)/.test(ql)) {
      say("Done — I let your manager know you're running late.", { kind: "list", heading: "Message sent", items: [{ title: "To your manager", sub: "Running late." }] });
      return;
    }

    // ── Field worker mode ────────────────────────────────────────────────
    if (/pull up (the )?customer|customer i.?m visiting|open (the )?customer/.test(ql)) {
      setSubject("Elena Brooks");
      say("Here's Elena Brooks — your 1:00 PM visit.", { kind: "list", heading: "Elena Brooks", items: [{ title: "Phone", sub: "(555) 301-7788" }, { title: "Address", sub: "742 Oak Ave" }, { title: "Account", sub: "7 jobs · $5,680 lifetime" }, { title: "Today", sub: "1:00 PM — Faucet replacement" }] });
      return;
    }
    if (/what.*(equipment|install).*last( time)?|service history|last (visit|service)/.test(ql)) {
      say("On the last visit (March 3), we installed a 3-ton compressor and replaced the thermostat.", { kind: "list", heading: "Service history — Elena Brooks", items: [{ title: "Mar 3", sub: "Installed 3-ton compressor" }, { title: "Mar 3", sub: "Replaced thermostat" }, { title: "Jan 12", sub: "Annual maintenance" }] });
      return;
    }
    const note = ql.match(/add a note (?:that )?(.+)/);
    if (note) {
      const who = subject || "the customer";
      say(`Saved a note to ${who}: “${note[1].trim()}”.`, { kind: "list", heading: "Note saved", items: [{ title: who, sub: note[1].trim() }] });
      return;
    }

    // ── General actions (any mode) ───────────────────────────────────────
    const createTask = q.match(/create (?:a )?task for (\w+) to (.+)/i);
    if (createTask) {
      const who = members.find((m) => first(m.name).toLowerCase() === createTask[1].toLowerCase());
      let body = createTask[2].trim();
      const tomorrow = /tomorrow/i.test(body);
      body = body.replace(/\b(by\s+)?(tomorrow|today)( morning| afternoon| evening)?.*$/i, "").trim();
      const title = body.charAt(0).toUpperCase() + body.slice(1);
      if (who) {
        saveTeamTasks([createTeamTask({ memberId: who.id, title, assignedBy: "Atlas (voice)", dueDate: tomorrow ? todayISO(new Date(Date.now() + 864e5)) : "" }), ...loadTeamTasks()]);
        logAudit(persona?.name ?? "User", "created task (voice)", `${title} → ${who.name}`);
        say(`I created “${title}” for ${first(who.name)}${tomorrow ? ", due tomorrow morning" : ""}.`, { kind: "list", heading: "New task", items: [{ title, sub: `Assigned to ${who.name}${tomorrow ? " · due tomorrow" : ""}` }] });
      } else {
        say(`I couldn't find "${createTask[1]}" on the team.`);
      }
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
        say(`Done — I refunded the customer $${amount.toLocaleString()} (within your limit).`);
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

    // ── General queries ──────────────────────────────────────────────────
    if (/most behind|furthest behind|worst project|which project/.test(ql)) {
      const worst = [...OVERDUE_PROJECTS].sort((a, b) => b.risk - a.risk)[0];
      setSubject(worst.name);
      say(`${worst.name}.`, { kind: "list", heading: "Most behind", items: [{ title: worst.name, sub: `${worst.days} days overdue` }] });
      return;
    }
    if (/overdue|behind schedule|late projects/.test(ql)) {
      setSubject(null);
      say("You currently have three overdue projects.", { kind: "list", heading: "Overdue projects", items: OVERDUE_PROJECTS.map((p) => ({ title: p.name, sub: `${p.days} day${p.days === 1 ? "" : "s"} overdue` })) });
      return;
    }
    if (/^\s*why\b/.test(ql) && subject) {
      const p = OVERDUE_PROJECTS.find((x) => x.name === subject);
      if (p) { say(`${p.name} is behind because ${p.reason}`); return; }
    }
    if (/\bwho\b.*(responsible|owns|handling|on it)|who is responsible/.test(ql) && subject) {
      const p = OVERDUE_PROJECTS.find((x) => x.name === subject);
      if (p) { say(`${p.owner} owns the delayed tasks on ${p.name}.`, { kind: "list", heading: `${p.name} — owner`, items: [{ title: p.owner, sub: "Responsible for the delayed tasks" }] }); return; }
    }
    if (/tasks?.*(left|remaining|today|do i have)/.test(ql)) {
      const open = personaOpenTasks();
      const high = open.filter((t) => t.priority === "High" || t.priority === "Urgent").length;
      const timed = open.filter((t) => t.dueTime).sort((a, b) => (a.dueTime < b.dueTime ? -1 : 1))[0];
      say(`You have ${open.length} tasks remaining.${high ? ` ${high} are high priority.` : ""}${timed ? ` Your next deadline is ${timed.title}${timed.dueTime ? ` at ${timed.dueTime}` : ""}.` : ""}`, { kind: "list", heading: "Tasks remaining", items: open.slice(0, 6).map((t) => ({ title: t.title, sub: `${t.priority}${t.dueTime ? ` · ${t.dueTime}` : ""}` })) });
      return;
    }
    if (/sales|revenue|numbers today|how are we doing/.test(ql)) {
      say("Sales are currently $184,200, up 8.4% from the same time yesterday. The Midwest region is performing best.", { kind: "list", heading: "Sales today · $184,200 (▲ 8.4%)", items: [{ title: "Midwest", sub: "$71,400 · best" }, { title: "Northeast", sub: "$52,900" }, { title: "West", sub: "$41,300" }, { title: "South", sub: "$18,600" }] });
      return;
    }

    say("I can help with briefings, tasks, projects, customers, scheduling, messages, and actions. Try a suggestion below.");
  }

  function confirmPending() {
    if (!pending) return;
    if (pending.type === "delete") {
      logAudit(persona?.name ?? "User", "deleted customer account (voice, confirmed)", pending.label);
      setPending(null);
      say("The customer account has been permanently deleted and recorded in the audit log.");
    } else {
      createApprovalRequest({ kind: "Refund", title: pending.label, amount: pending.amount, requestedBy: persona ? first(persona.name) : "Employee", reason: "Requested via Atlas voice", priority: pending.amount >= 500 ? "urgent" : "normal" });
      logAudit(persona?.name ?? "Employee", "submitted approval request (voice)", pending.label);
      setPending(null);
      say("Submitted for manager approval. It's now in the Approval Inbox.");
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    runIntent(text);
  }

  function toggleMic() {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { setMicNote("Voice input isn't available in this browser — type your request below (a supported mode)."); return; }
    const rec = new Ctor();
    rec.lang = "en-US"; rec.interimResults = false; rec.continuous = false;
    rec.onresult = (ev) => { const tr = ev.results?.[0]?.[0]?.transcript ?? ""; if (tr) runIntent(tr); };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setMicNote("I couldn't capture audio — please type instead."); };
    recRef.current = rec; setMicNote(null); setListening(true); rec.start();
  }

  const lastScreen = [...turns].reverse().find((t) => t.who === "atlas" && t.screen)?.screen;

  return (
    <div className="training-studio">
      <section className="panel">
        <div className="train-head">
          <div>
            <h2>🎤 Talk to Atlas</h2>
            <p className="panel-lead">Voice or text, answered out loud and on screen — with follow-up context and permitted actions.</p>
          </div>
          <div className="field-row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
            <label>Mode<select value={mode} onChange={(e) => { setMode(e.target.value as Mode); setReschedule(null); }}>{MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
            <label>Speaking as<select value={personaId} onChange={(e) => setPersonaId(e.target.value)}>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
          </div>
        </div>

        <div className="field-row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
          <label>Atlas voice<select value={voice} onChange={(e) => setVoice(e.target.value)}>{VOICES.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
          <label>Speed<select value={rate} onChange={(e) => setRate(Number(e.target.value))}>{SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}</select></label>
          <label>Answers<select value={length} onChange={(e) => setLength(e.target.value as "short" | "detailed")}><option value="short">Short answers</option><option value="detailed">Detailed answers</option></select></label>
        </div>

        <div className="train-actions" style={{ alignItems: "center", marginTop: "0.4rem" }}>
          <button className={listening ? "btn btn-dark" : "btn btn-outline"} type="button" onClick={toggleMic}>{listening ? "● Listening… (stop)" : "🎤 Talk to Atlas"}</button>
          {speaking ? (
            <>
              <span className="badge ok">🔊 Atlas is speaking…</span>
              <button className="btn btn-outline" type="button" onClick={stopSpeaking}>■ Interrupt</button>
            </>
          ) : null}
        </div>
        {micNote ? <p className="muted-line" style={{ marginTop: "0.4rem" }}>{micNote}</p> : null}

        <form className="command-form" style={{ marginTop: "0.6rem" }} onSubmit={submit}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Atlas…" aria-label="Ask Atlas" />
          <button className="btn btn-dark" type="submit">Send</button>
        </form>

        <div className="status-picker" style={{ marginTop: "0.5rem" }}>
          {SAMPLES[mode].map((s) => <button key={s} type="button" className="status-chip" onClick={() => runIntent(s)}>{s}</button>)}
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Conversation</h2>
          <div className="command-thread" ref={threadRef} style={{ maxHeight: "24rem", overflowY: "auto" }}>
            {turns.length === 0 ? <p className="muted-line">Pick your mode, then tap a suggestion or ask something.</p> : turns.map((t, i) => (
              <div key={i} className={`bubble ${t.who === "you" ? "bubble-user" : "bubble-ai"}`}>
                <span className="agent-tag">{t.who === "you" ? (persona ? persona.name : "You") : "Atlas"}</span>
                {t.text}
              </div>
            ))}
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
          {lastScreen ? (
            <>
              <div className="label">{lastScreen.heading}</div>
              <div className="list">
                {lastScreen.items.map((it, i) => (
                  <div className="list-row" key={i}><span className="badge">•</span><p><strong>{it.title}</strong>{it.sub ? <span className="muted-line">{it.sub}</span> : null}</p></div>
                ))}
              </div>
            </>
          ) : <p className="muted-line">Atlas shows details here while it speaks.</p>}
        </section>
      </div>

      <section className="panel">
        <h2>Voice history</h2>
        <p className="panel-lead">Your recent Atlas requests — tap one to reopen it.</p>
        {history.length === 0 ? <p className="muted-line">No history yet.</p> : (
          <div className="list">
            {history.slice(0, 12).map((h) => (
              <div className="list-row" key={h.id}>
                <span className="badge">{new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <p style={{ flex: 1 }}><strong>{h.text}</strong><span className="muted-line">{MODES.find((m) => m.id === h.mode)?.label ?? h.mode} mode</span></p>
                <button className="btn btn-outline" type="button" onClick={() => runIntent(h.text)}>Reopen</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
