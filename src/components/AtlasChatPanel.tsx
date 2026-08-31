"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { commandSuggestions } from "@/lib/data";
import { runOwnerCommand, type CommandResult } from "@/lib/commands";
import {
  createTaskFromSuggestion,
  loadTeamMembers,
  loadTeamTasks,
  parseNaturalAssignCommand,
  saveTeamTasks,
  seedDemoTeamIfEmpty,
} from "@/lib/user-workspace";
import { FeedbackToolbar } from "@/components/FeedbackToolbar";
import { requestConfirmation, resolveConfirmation } from "@/lib/confirmations";
import { applyOwnerEffect } from "@/lib/dashboard";
import { styleReplyWithFeedback } from "@/lib/feedback";

type BrainApiData = {
  reply: string;
  agentLabel: string;
  mode?: "live" | "simulation";
  model?: string;
  needsConfirm: boolean;
  confirmPrompt?: string;
  doneLabel?: string;
};

type ChatItem =
  | { kind: "user"; text: string }
  | { kind: "ai"; text: string; agentLabel: string; receipts?: { label: string; source: string }[] }
  | {
      kind: "confirm";
      text: string;
      agentLabel: string;
      confirmPrompt: string;
      doneLabel: string;
      confirmationId?: string;
      effect?: import("@/lib/dashboard").OwnerEffectId;
      resolved?: "approved" | "cancelled";
    };

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type AtlasChatPanelProps = {
  compact?: boolean;
};

export function AtlasChatPanel({ compact = false }: AtlasChatPanelProps) {
  const { ownerName, businessName, ready, account, saveConversation } = useAccount();
  const greetedRef = useRef(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [brainMode, setBrainMode] = useState<"live" | "simulation" | "unknown">("unknown");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    if (!ready || greetedRef.current) return;
    greetedRef.current = true;
    setMessages([
      {
        kind: "ai",
        agentLabel: "Atlas",
        text: `${timeGreeting()}, ${ownerName}. Ask about your business, approve actions, or tell me what to handle next.`,
      },
    ]);
  }, [ready, ownerName]);

  function persistTurn(userText: string, aiText: string, agentLabel: string) {
    if (!account) return;
    const result = saveConversation(userText, aiText, agentLabel);
    if (result.ok) setSavedNote("Saved to your AI workspace.");
  }

  function applyResult(result: CommandResult, spoken: string) {
    const reply = styleReplyWithFeedback(result.reply);
    const confirmPrompt = result.confirmPrompt;
    const doneLabel = result.doneLabel;
    if (result.needsConfirm && confirmPrompt && doneLabel) {
      const confirmation = requestConfirmation({
        kind: "other",
        title: confirmPrompt.replace(/\?$/, ""),
        summary: reply,
        details: [confirmPrompt, `Requested from Command Center: “${spoken}”`],
        impact: "Atlas will only continue after you confirm.",
        requestedBy: result.agentLabel,
      });
      setMessages((prev) => [
        ...prev,
        {
          kind: "confirm",
          text: reply,
          agentLabel: result.agentLabel || "Atlas",
          confirmPrompt,
          doneLabel,
          confirmationId: confirmation.id,
          effect: result.effect,
        },
      ]);
      return;
    }
    persistTurn(spoken, reply, result.agentLabel);
    setMessages((prev) => [...prev, { kind: "ai", text: reply, agentLabel: result.agentLabel || "Atlas" }]);
  }

  async function askBrain(spoken: string) {
    const trimmed = spoken.trim();
    if (!trimmed || busy) return;

    const assignSuggestion = (() => {
      seedDemoTeamIfEmpty();
      const members = loadTeamMembers();
      return parseNaturalAssignCommand(trimmed, members);
    })();
    if (assignSuggestion) {
      setBusy(true);
      setMessages((prev) => [...prev, { kind: "user", text: trimmed }]);
      const task = createTaskFromSuggestion(assignSuggestion, loadTeamMembers()[0]?.id ?? "", "Atlas Assistant");
      saveTeamTasks([task, ...loadTeamTasks()]);
      applyResult(
        {
          agent: "ceo",
          agentLabel: "Atlas Assistant",
          reply: `Done — I assigned “${task.title}” to ${assignSuggestion.assigneeName}${task.dueDate ? ` (due ${task.dueDate})` : ""}. They’ll get a notification and it’s on their dashboard.`,
          needsConfirm: false,
        },
        trimmed,
      );
      setBusy(false);
      return;
    }

    setBusy(true);
    setMessages((prev) => [...prev, { kind: "user", text: trimmed }]);
    try {
      const history = messages
        .filter((m) => m.kind === "user" || m.kind === "ai")
        .slice(-8)
        .map((m) =>
          m.kind === "user"
            ? { role: "user" as const, content: m.text }
            : { role: "assistant" as const, content: m.text },
        );
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          ownerName,
          businessName,
          history,
        }),
      });
      const json = (await res.json()) as { ok: boolean; data?: BrainApiData; error?: string };
      if (!json.ok || !json.data) {
        throw new Error(json.error || "Brain request failed");
      }
      if (json.data.mode) setBrainMode(json.data.mode);
      applyResult(
        {
          agent: "ceo",
          agentLabel: json.data.agentLabel || "Atlas",
          reply: json.data.reply,
          needsConfirm: Boolean(json.data.needsConfirm),
          confirmPrompt: json.data.confirmPrompt,
          doneLabel: json.data.doneLabel,
        },
        trimmed,
      );
    } catch {
      applyResult(runOwnerCommand(trimmed), trimmed);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    void askBrain(trimmed);
    setInput("");
  }

  function onSuggestion(text: string) {
    void askBrain(text);
  }

  function resolveConfirm(index: number, approved: boolean) {
    setMessages((prev) => {
      const item = prev[index];
      if (!item || item.kind !== "confirm" || item.resolved) return prev;
      if (item.confirmationId) resolveConfirmation(item.confirmationId, approved);
      let reply = approved ? item.doneLabel : "Understood — I won't take that action.";
      let receipts: { label: string; source: string }[] | undefined;
      if (approved && item.effect) {
        const result = applyOwnerEffect(item.effect);
        reply = result.note;
        receipts = result.receipts;
      }
      persistTurn(item.confirmPrompt, reply, item.agentLabel);
      const updated = prev.map((entry, i) =>
        i === index && entry.kind === "confirm"
          ? { ...entry, resolved: approved ? ("approved" as const) : ("cancelled" as const) }
          : entry,
      );
      return [
        ...updated,
        { kind: "ai" as const, agentLabel: "Atlas", text: reply, receipts },
      ];
    });
  }

  function onSpeakToggle() {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              SpeechRecognition?: new () => SpeechRecognitionLike;
              webkitSpeechRecognition?: new () => SpeechRecognitionLike;
            }
          ).SpeechRecognition ||
          (
            window as unknown as {
              webkitSpeechRecognition?: new () => SpeechRecognitionLike;
            }
          ).webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        {
          kind: "ai",
          agentLabel: "Atlas",
          text: "Voice isn't available in this browser. Type instead — same Atlas brain.",
        },
      ]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        void askBrain(transcript);
        setInput("");
      }
    };
    recognition.start();
  }

  const suggestions = compact ? commandSuggestions.slice(0, 4) : commandSuggestions;

  return (
    <div className={`atlas-chat-panel${compact ? " atlas-chat-panel-compact" : ""}`}>
      <div className="command-head">
        <div>
          <h2>Ask Atlas</h2>
          <p>
            Routed through Atlas Brain.{" "}
            {brainMode === "live"
              ? "Live LLM is on."
              : brainMode === "simulation"
                ? "Simulation fallback is on."
                : "First message selects live vs simulation."}{" "}
            {account
              ? "Signed-in chats are saved to your AI workspace."
              : "Sign in to save conversations."}
          </p>
          {savedNote ? <p className="auth-success">{savedNote}</p> : null}
        </div>
        <button
          className={`btn ${listening ? "btn-primary" : "btn-outline"}`}
          type="button"
          onClick={onSpeakToggle}
        >
          {listening ? "Listening…" : "Speak"}
        </button>
      </div>

      <div className="command-thread" aria-live="polite">
        {messages.map((message, index) => {
          if (message.kind === "user") {
            return (
              <div className="bubble bubble-user" key={`u-${index}`}>
                {message.text}
              </div>
            );
          }
          if (message.kind === "confirm") {
            return (
              <div className="confirm-card" key={`c-${index}`}>
                <div className="agent-tag">{message.agentLabel} · needs your OK</div>
                <p>{message.text}</p>
                <p className="confirm-prompt">{message.confirmPrompt}</p>
                {message.resolved ? (
                  <span className={message.resolved === "approved" ? "badge ok" : "badge warn"}>
                    {message.resolved === "approved" ? "Approved" : "Cancelled"}
                  </span>
                ) : (
                  <div className="cta-row">
                    <button className="btn btn-dark" type="button" onClick={() => resolveConfirm(index, true)}>
                      Yes, proceed
                    </button>
                    <button className="btn btn-outline" type="button" onClick={() => resolveConfirm(index, false)}>
                      Not now
                    </button>
                  </div>
                )}
              </div>
            );
          }
          return (
            <div className="bubble bubble-ai" key={`a-${index}`}>
              <div className="agent-tag">Atlas</div>
              {message.text}
              {message.receipts?.length ? (
                <ul className="action-receipts">
                  {message.receipts.map((receipt) => (
                    <li key={receipt.label}>
                      <span>{receipt.label}</span>
                      <span className={`data-badge data-badge-${receipt.source === "CONNECTED DATA" ? "connected" : receipt.source.toLowerCase()}`}>
                        {receipt.source}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <FeedbackToolbar target={message.text.slice(0, 80)} compact />
            </div>
          );
        })}
        {busy ? (
          <div className="bubble bubble-ai">
            <div className="agent-tag">Atlas</div>
            Thinking…
          </div>
        ) : null}
      </div>

      <div className="suggestion-row">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="suggestion"
            onClick={() => onSuggestion(suggestion)}
            disabled={busy}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form className="command-form" onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try: “How is business?” or “Going home — handle tonight”'
          aria-label="Talk to Atlas"
          disabled={busy}
        />
        <button className="btn btn-dark" type="submit" disabled={busy}>
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
