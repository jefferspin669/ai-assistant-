"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  boardAdvisors,
  boardReplyForQuestion,
  boardTopics,
} from "@/lib/atlas-platform";

type Mode = "chamber" | "ask" | "roster";

const modes: { id: Mode; label: string }[] = [
  { id: "chamber", label: "Board chamber" },
  { id: "ask", label: "Ask the board" },
  { id: "roster", label: "Advisors" },
];

function stanceTone(stance: string) {
  if (stance === "Supportive" || stance === "Recommend") return "ok";
  if (stance === "Caution") return "warn";
  return "";
}

export function BoardAdvisorStudio() {
  const [mode, setMode] = useState<Mode>("chamber");
  const [topicId, setTopicId] = useState<string>(boardTopics[0].id);
  const [input, setInput] = useState("Should we open another location?");
  const [deliberating, setDeliberating] = useState(false);
  const [customTopic, setCustomTopic] = useState<ReturnType<typeof boardReplyForQuestion> | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = useState<number>(boardTopics[0].voices.length);

  const active = useMemo(() => {
    if (customTopic) return customTopic;
    return boardTopics.find((topic) => topic.id === topicId) ?? boardTopics[0];
  }, [customTopic, topicId]);

  function runDeliberation(question: string) {
    const topic = boardReplyForQuestion(question.trim() || boardTopics[0].question);
    setCustomTopic(
      boardTopics.some((item) => item.id === topic.id)
        ? null
        : topic,
    );
    if (boardTopics.some((item) => item.id === topic.id)) {
      setTopicId(topic.id);
    }
    setVisibleCount(0);
    setDeliberating(true);
    setMode("chamber");

    const voices = topic.voices;
    voices.forEach((_, index) => {
      window.setTimeout(() => {
        setVisibleCount(index + 1);
        if (index === voices.length - 1) setDeliberating(false);
      }, 350 * (index + 1));
    });
  }

  function onAsk(e: FormEvent) {
    e.preventDefault();
    runDeliberation(input);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Advisors</span>
          <strong>{boardAdvisors.length}</strong>
          <small>Specialist viewpoints</small>
        </div>
        <div className="stat">
          <span>Open topics</span>
          <strong>{boardTopics.length}</strong>
          <small>Ready for debate</small>
        </div>
        <div className="stat">
          <span>Style</span>
          <strong>Balanced</strong>
          <small>Not one answer</small>
        </div>
        <div className="stat">
          <span>Chair</span>
          <strong>CEO AI</strong>
          <small>Final recommendation</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Board advisor modes">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "training-tab active" : "training-tab"}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "chamber" ? (
        <div className="split">
          <section className="panel">
            <h2>Imagine your own board of advisors</h2>
            <p className="panel-lead">Different AI experts discuss decisions — balanced viewpoints, not a single answer.</p>
            <div className="list">
              {boardTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  className={
                    !customTopic && topicId === topic.id
                      ? "compliance-row active"
                      : "compliance-row"
                  }
                  onClick={() => {
                    setCustomTopic(null);
                    setTopicId(topic.id);
                    setInput(topic.question);
                    setVisibleCount(topic.voices.length);
                  }}
                >
                  <span className="badge">CEO</span>
                  <p>{topic.question}</p>
                </button>
              ))}
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                disabled={deliberating}
                onClick={() => runDeliberation(active.question)}
              >
                {deliberating ? "Deliberating…" : "Re-run deliberation"}
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>Board response</h2>
            <div className="memory-card" style={{ marginBottom: "1rem" }}>
              <div className="label">CEO asks</div>
              <p>{active.question}</p>
            </div>
            <div className="chat-mock">
              {active.voices.slice(0, visibleCount).map((voice) => (
                <div className="bubble bubble-ai board-voice" key={voice.advisor}>
                  <div className="board-voice-head">
                    <strong>{voice.advisor}</strong>
                    <span className={`badge${stanceTone(voice.stance) === "ok" ? " ok" : stanceTone(voice.stance) === "warn" ? " warn" : ""}`}>
                      {voice.stance}
                    </span>
                  </div>
                  <p>“{voice.say}”</p>
                </div>
              ))}
              {deliberating && visibleCount < active.voices.length ? (
                <div className="bubble bubble-ai">Advisors are weighing in…</div>
              ) : null}
            </div>
            {!deliberating && visibleCount >= active.voices.length ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                Consensus: {active.summary}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "ask" ? (
        <div className="split">
          <section className="panel">
            <h2>Ask the board</h2>
            <p className="panel-lead">Put a decision in front of Operations, Finance, Marketing, Risk, and CEO AI.</p>
            <form onSubmit={onAsk} className="train-form">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Should we open another location?"
              />
              <button className="btn btn-dark" type="submit">
                Deliberate
              </button>
            </form>
            <div className="list" style={{ marginTop: "1rem" }}>
              {boardTopics.map((topic) => (
                <div className="list-row" key={topic.id}>
                  <span className="badge">Try</span>
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      setInput(topic.question);
                      runDeliberation(topic.question);
                    }}
                  >
                    {topic.question}
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>Why this is different</h2>
            <div className="list">
              {[
                "Multiple expert lenses, not one chatbot reply",
                "Supportive and caution signals shown side by side",
                "CEO AI synthesizes a recommendation after debate",
                "Ties into Digital Twin, Score, and Project Manager",
              ].map((item) => (
                <div className="list-row" key={item}>
                  <span className="badge ok">Board</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {mode === "roster" ? (
        <section className="panel">
          <h2>Advisor roster</h2>
          <div className="create-type-grid">
            {boardAdvisors.map((advisor) => (
              <div className="store-card" key={advisor.id} style={{ cursor: "default" }}>
                <h3>{advisor.name}</h3>
                <p className="muted-line">{advisor.focus}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
