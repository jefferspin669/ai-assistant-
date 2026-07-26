"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  aiEmployees,
  commandSuggestions,
  morningBriefing,
  owner,
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

export function CommandCenter() {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      kind: "ai",
      agentLabel: "CallFlow",
      text: `Good morning, ${owner.name}. Here’s what needs your attention before the day gets loud.`,
    },
  ]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

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
          text: approved ? item.doneLabel : "Understood — I won’t take that action.",
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
          agentLabel: "CallFlow",
          text: "Voice isn’t available in this browser. Type a command instead — same results.",
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
        setInput(transcript);
        pushResult(runOwnerCommand(transcript), transcript);
        setInput("");
      }
    };
    recognition.start();
  }

  return (
    <div className="command-layout">
      <section className="briefing panel">
        <p className="briefing-kicker">Owner briefing</p>
        <h2>
          {greeting}, {owner.name}.
        </h2>
        <p className="briefing-sub">{owner.business} · your AI employees are already working</p>
        <ul className="briefing-list">
          {morningBriefing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="employee-row">
          {aiEmployees.map((employee) => (
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
            <h2>Talk to your business</h2>
            <p>One assistant on the surface. Specialized employees underneath.</p>
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
            placeholder='Try “How’s the business doing?” or “Book John for Friday at 3.”'
            aria-label="Command your AI employees"
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
