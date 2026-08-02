"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import {
  aiEmployees,
  commandSuggestions,
  morningBriefing,
} from "@/lib/data";
import { runOwnerCommand, type CommandResult } from "@/lib/commands";

type ChatItem =
  | { kind: "user"; text: string }
  | { kind: "ai"; text: string; agentLabel: string }
  | {
      kind: "confirm";
      text: string;
      agentLabel: string;
      confirmPrompt: string;
      doneLabel: string;
      resolved?: "approved" | "cancelled";
    };

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function CommandCenter() {
  const { ownerName, businessName, aiName, aiRole, ready, account, saveConversation } = useAccount();
  const greeting = useMemo(() => timeGreeting(), []);
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
        text: `${timeGreeting()}, ${ownerName}. Nothing else needs to be checked — here’s what already happened.`,
      },
    ]);
  }, [ready, ownerName]);

  function persistTurn(userText: string, aiText: string, agentLabel: string) {
    if (!account) return;
    const result = saveConversation(userText, aiText, agentLabel);
    if (result.ok) {
      setSavedNote("Conversation saved to your AI workspace.");
    }
  }

  function pushResult(result: CommandResult, spoken: string) {
    const next: ChatItem[] = [{ kind: "user", text: spoken }];
    if (result.needsConfirm && result.confirmPrompt && result.doneLabel) {
      next.push({
        kind: "confirm",
        text: result.reply,
        agentLabel: result.agentLabel,
        confirmPrompt: result.confirmPrompt,
        doneLabel: result.doneLabel,
      });
    } else {
      next.push({ kind: "ai", text: result.reply, agentLabel: result.agentLabel });
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
      const reply = approved ? item.doneLabel : "Understood — I won’t take that action.";
      persistTurn(item.confirmPrompt, reply, item.agentLabel);
      const updated = prev.map((entry, i) =>
        i === index && entry.kind === "confirm"
          ? { ...entry, resolved: approved ? ("approved" as const) : ("cancelled" as const) }
          : entry,
      );
      return [
        ...updated,
        {
          kind: "ai" as const,
          agentLabel: item.agentLabel,
          text: reply,
        },
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
          text: "Voice isn’t available in this browser. Type instead — same Atlas brain.",
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

  return (
    <div className="command-layout">
      <section className="briefing panel">
        <p className="briefing-kicker">Atlas never sleeps</p>
        <h2>
          {greeting}, {ownerName}.
        </h2>
        <p className="briefing-sub">
          {businessName} · {aiName} is your {aiRole}
        </p>
        <ul className="briefing-list">
          {morningBriefing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="employee-row">
          {aiEmployees.slice(0, 5).map((employee) => (
            <div className="employee-pill" key={employee.id}>
              <span aria-hidden="true">{employee.emoji}</span>
              <div>
                <strong>{employee.name}</strong>
                <small>{employee.status}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel command-panel">
        <div className="command-head">
          <div>
            <h2>Talk to Atlas</h2>
            <p>
              Prefer outcomes over how-tos — try Atlas Actions for multi-step work that continues on
              every device.
              {account
                ? " Signed-in chats are saved to your AI workspace."
                : " Sign in to save conversations."}
            </p>
            {savedNote ? <p className="auth-success">{savedNote}</p> : null}
          </div>
          <button className={`btn ${listening ? "btn-primary" : "btn-outline"}`} type="button" onClick={onSpeakToggle}>
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
                <div className="agent-tag">{message.agentLabel}</div>
                {message.text}
              </div>
            );
          })}
        </div>

        <div className="suggestion-row">
          {commandSuggestions.map((suggestion) => (
            <button key={suggestion} type="button" className="suggestion" onClick={() => onSuggestion(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>

        <form className="command-form" onSubmit={onSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try: “Create an invoice for Acme Corp for $1,250…” or “How is business?”'
            aria-label="Talk to Atlas"
          />
          <button className="btn btn-dark" type="submit">
            Send
          </button>
        </form>
      </section>
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
