"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  boardAdvisors,
  boardReplyForQuestion,
  boardTopics,
} from "@/lib/atlas-platform";
import {
  createBoardDecision,
  loadBoardDecisions,
  saveBoardDecisions,
  type BoardDecision,
} from "@/lib/ops-workspace";

type Mode = "chamber" | "ask" | "decisions" | "roster";

const modes: { id: Mode; label: string }[] = [
  { id: "chamber", label: "Board chamber" },
  { id: "ask", label: "Ask the board" },
  { id: "decisions", label: "Your decisions" },
  { id: "roster", label: "Advisors" },
];

function stanceTone(stance: string) {
  if (stance === "Supportive" || stance === "Recommend") return "ok";
  if (stance === "Caution") return "warn";
  return "";
}

export function BoardAdvisorStudio({ newSignal = 0 }: { newSignal?: number }) {
  const [mode, setMode] = useState<Mode>("chamber");
  const [topicId, setTopicId] = useState<string>(boardTopics[0].id);
  const [input, setInput] = useState("Should we open another location?");
  const [deliberating, setDeliberating] = useState(false);
  const [customTopic, setCustomTopic] = useState<ReturnType<typeof boardReplyForQuestion> | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = useState<number>(boardTopics[0].voices.length);
  const [decisions, setDecisions] = useState<BoardDecision[]>([]);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setDecisions(loadBoardDecisions());
  }, []);

  useEffect(() => {
    if (newSignal <= 0) return;
    setMode("ask");
    setInput("");
    setNote("Describe a decision for the board to debate — then save it.");
  }, [newSignal]);

  const active = useMemo(() => {
    if (customTopic) return customTopic;
    return boardTopics.find((topic) => topic.id === topicId) ?? boardTopics[0];
  }, [customTopic, topicId]);

  function persist(next: BoardDecision[]) {
    setDecisions(next);
    saveBoardDecisions(next);
  }

  function runDeliberation(question: string) {
    const topic = boardReplyForQuestion(question.trim() || boardTopics[0].question);
    setCustomTopic(boardTopics.some((item) => item.id === topic.id) ? null : topic);
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

  function saveDecision() {
    const decision = createBoardDecision({
      question: active.question,
      summary: active.summary,
      voices: active.voices.map((voice) => ({
        advisor: voice.advisor,
        stance: voice.stance,
        say: voice.say,
      })),
    });
    persist([decision, ...decisions]);
    setMode("decisions");
    setNote(`Saved decision: “${decision.question}”.`);
  }

  function removeDecision(id: string) {
    persist(decisions.filter((item) => item.id !== id));
    setNote("Decision removed.");
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
          <span>Saved decisions</span>
          <strong>{decisions.length}</strong>
          <small>Yours to keep or delete</small>
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
      {note ? <p className="muted-line">{note}</p> : null}

      {mode === "chamber" ? (
        <div className="split">
          <section className="panel">
            <h2>Imagine your own board of advisors</h2>
            <p className="panel-lead">
              Different AI experts discuss decisions — balanced viewpoints, not a single answer.
            </p>
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
              <button className="btn btn-outline" type="button" onClick={saveDecision}>
                Save decision
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
                    <span
                      className={`badge${stanceTone(voice.stance) === "ok" ? " ok" : stanceTone(voice.stance) === "warn" ? " warn" : ""}`}
                    >
                      {voice.stance}
                    </span>
                  </div>
                  <p>{voice.say}</p>
                </div>
              ))}
            </div>
            {!deliberating && visibleCount > 0 ? (
              <div className="memory-card" style={{ marginTop: "1rem" }}>
                <div className="label">Board summary</div>
                <p>{active.summary}</p>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "ask" ? (
        <section className="panel">
          <h2>New decision</h2>
          <p className="panel-lead">Ask the board anything — then save or delete the result.</p>
          <form className="train-form" onSubmit={onAsk}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Should we hire an apprentice this quarter?"
              required
            />
            <button className="btn btn-dark" type="submit" disabled={deliberating}>
              {deliberating ? "Deliberating…" : "Ask board"}
            </button>
          </form>
        </section>
      ) : null}

      {mode === "decisions" ? (
        <section className="panel">
          <h2>Your decisions</h2>
          {decisions.length === 0 ? (
            <p className="muted-line">No saved decisions yet. Ask the board and click Save decision.</p>
          ) : (
            <div className="list">
              {decisions.map((item) => (
                <div className="list-row" key={item.id}>
                  <span className="badge ok">Saved</span>
                  <div style={{ flex: 1 }}>
                    <p>
                      <strong>{item.question}</strong>
                    </p>
                    <small className="muted-line">{item.summary}</small>
                  </div>
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => removeDecision(item.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {mode === "roster" ? (
        <section className="panel">
          <h2>Advisor roster</h2>
          <div className="employee-grid">
            {boardAdvisors.map((advisor) => (
              <div className="store-card" key={advisor.name} style={{ cursor: "default" }}>
                <h3>{advisor.name}</h3>
                <p>{advisor.focus}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
