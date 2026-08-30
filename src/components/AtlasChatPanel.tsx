"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { commandSuggestions } from "@/lib/data";
import { runOwnerCommand, type CommandResult } from "@/lib/commands";
import { FeedbackToolbar } from "@/components/FeedbackToolbar";
import { requestConfirmation, resolveConfirmation } from "@/lib/confirmations";
import { applyOwnerEffect } from "@/lib/dashboard";

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
  const { ownerName, ready, account, saveConversation } = useAccount();
  const greetedRef = useRef(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
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

  function pushResult(result: CommandResult, spoken: string) {
    const next: ChatItem[] = [{ kind: "user", text: spoken }];
    if (result.needsConfirm && result.confirmPrompt && result.doneLabel) {
      const confirmation = requestConfirmation({
        kind: "other",
        title: result.confirmPrompt.replace(/\?$/, ""),
        summary: result.reply,
        details: [result.confirmPrompt, `Requested from Command Center: “${spoken}”`],
        impact: "Atlas will only continue after you confirm.",
        requestedBy: result.agentLabel,
      });
      next.push({
        kind: "confirm",
        text: result.reply,
        agentLabel: "Atlas",
        confirmPrompt: result.confirmPrompt,
        doneLabel: result.doneLabel,
        confirmationId: confirmation.id,
        effect: result.effect,
      });
    } else {
      next.push({ kind: "ai", text: result.reply, agentLabel: "Atlas" });
      persistTurn(spoken, result.reply, result.agentLabel);
    }
    setMessages((prev) => [...prev, ...next]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    pushResult(runOwnerCommand(trimmed), trimmed);
    setInput("");
  }

  function onSuggestion(text: string) {
    pushResult(runOwnerCommand(text), text);
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
        pushResult(runOwnerCommand(transcript), transcript);
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
            {account
              ? "You talk to Atlas. Specialists run in the background."
              : "Sign in to save conversations. Atlas still answers as Atlas."}
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
      </div>

      <div className="suggestion-row">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" className="suggestion" onClick={() => onSuggestion(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>

      <form className="command-form" onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try: "How did we do this week?" or "Move John’s 2 PM to tomorrow."'
          aria-label="Talk to Atlas"
        />
        <button className="btn btn-dark" type="submit">
          Send
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
