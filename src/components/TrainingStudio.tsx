"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  academyCertifications,
  trainingLearners,
  trainingLesson,
  trainingModules,
  trainingQuiz,
  trainingRoleplay,
  trainingVoiceScenario,
} from "@/lib/atlas-platform";

type Mode = "progress" | "certs" | "lesson" | "quiz" | "voice" | "roleplay";

type ChatMsg = { role: "ai" | "user"; text: string };

const modes: { id: Mode; label: string }[] = [
  { id: "progress", label: "Manager progress" },
  { id: "certs", label: "Certifications" },
  { id: "lesson", label: "Interactive lesson" },
  { id: "quiz", label: "Knowledge test" },
  { id: "voice", label: "Voice practice" },
  { id: "roleplay", label: "Role-playing" },
];

function scoreVoice(text: string) {
  const lower = text.toLowerCase();
  const hits = trainingVoiceScenario.goodPhrases.filter((phrase) => lower.includes(phrase)).length;
  return Math.min(100, 55 + hits * 10);
}

function roleplayReply(text: string) {
  const lower = text.toLowerCase();
  for (const reply of trainingRoleplay.replies) {
    if (reply.match.some((word) => lower.includes(word))) return reply.say;
  }
  return trainingRoleplay.fallback;
}

export function TrainingStudio() {
  const [mode, setMode] = useState<Mode>("progress");
  const [lessonStep, setLessonStep] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");
  const [voiceLast, setVoiceLast] = useState("");
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceScore, setVoiceScore] = useState<number | null>(null);
  const [roleplayInput, setRoleplayInput] = useState("");
  const [roleplay, setRoleplay] = useState<ChatMsg[]>([
    { role: "ai", text: `Customer: ${trainingRoleplay.customerOpener}` },
  ]);

  const lessonProgress = useMemo(
    () => Math.round(((lessonStep + 1) / trainingLesson.steps.length) * 100),
    [lessonStep],
  );

  const question = trainingQuiz.questions[quizIndex];

  function submitQuizChoice() {
    if (quizChoice === null || !question) return;
    const correct = quizChoice === question.answer;
    const nextScore = quizScore + (correct ? 1 : 0);
    if (quizIndex >= trainingQuiz.questions.length - 1) {
      setQuizScore(nextScore);
      setQuizDone(true);
      return;
    }
    setQuizScore(nextScore);
    setQuizIndex((i) => i + 1);
    setQuizChoice(null);
  }

  function resetQuiz() {
    setQuizIndex(0);
    setQuizChoice(null);
    setQuizScore(0);
    setQuizDone(false);
  }

  function onVoice(e: FormEvent) {
    e.preventDefault();
    const trimmed = voiceInput.trim();
    if (!trimmed) return;
    const score = scoreVoice(trimmed);
    setVoiceLast(trimmed);
    setVoiceScore(score);
    setVoiceFeedback(score >= 80 ? trainingVoiceScenario.coachPass : trainingVoiceScenario.coachRetry);
    setVoiceInput("");
  }

  function onRoleplay(e: FormEvent) {
    e.preventDefault();
    const trimmed = roleplayInput.trim();
    if (!trimmed) return;
    setRoleplay((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "ai", text: roleplayReply(trimmed) },
    ]);
    setRoleplayInput("");
  }

  return (
    <div className="training-studio">
      <div className="training-tabs" role="tablist" aria-label="Training modes">
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

      {mode === "progress" ? (
        <div className="split">
          <section className="panel">
            <h2>New employee path</h2>
            <p className="panel-lead">
              Atlas Academy teaches your team — interactive lessons, role-playing, certifications,
              knowledge tests, and voice practice. Managers see progress live.
            </p>
            <div className="list">
              {trainingModules.map((mod) => (
                <div className="list-row" key={mod.id}>
                  <span className={`badge${mod.progress >= 100 ? " ok" : mod.progress >= 50 ? "" : " warn"}`}>
                    {mod.progress}%
                  </span>
                  <div>
                    <p>
                      <strong>{mod.title}</strong>
                    </p>
                    <small className="muted-line">
                      {mod.type} · {mod.duration}
                    </small>
                    <div className="train-track" aria-hidden>
                      <div className="train-fill" style={{ width: `${mod.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Team progress</h2>
            <div className="list">
              {trainingLearners.map((learner) => (
                <div className="list-row" key={learner.name}>
                  <span className="badge">{learner.overall}</span>
                  <div>
                    <p>
                      <strong>{learner.name}</strong>
                    </p>
                    <small className="muted-line">
                      {learner.role} · {learner.modulesDone}/{learner.modulesTotal} modules ·{" "}
                      {learner.certs} certs
                    </small>
                    <div className="train-track" aria-hidden>
                      <div className="train-fill" style={{ width: `${learner.overall}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-dark" style={{ marginTop: "1rem" }} type="button" onClick={() => setMode("lesson")}>
              Continue Alex’s lesson
            </button>
          </section>
        </div>
      ) : null}

      {mode === "certs" ? (
        <section className="panel">
          <h2>Certification tracking</h2>
          <p className="panel-lead">Managers can see who is certified, in progress, or expiring.</p>
          <table className="table">
            <thead>
              <tr>
                <th>Certification</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {academyCertifications.map((cert) => (
                <tr key={cert.id}>
                  <td>
                    <strong>{cert.title}</strong>
                  </td>
                  <td>{cert.holder}</td>
                  <td>
                    <span className={`badge${cert.status === "Active" ? " ok" : " warn"}`}>{cert.status}</span>
                  </td>
                  <td>{cert.expires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {mode === "lesson" ? (
        <section className="panel">
          <div className="train-head">
            <div>
              <h2>{trainingLesson.title}</h2>
              <p className="panel-lead">Interactive lesson · step {lessonStep + 1} of {trainingLesson.steps.length}</p>
            </div>
            <strong className="train-pct">{lessonProgress}%</strong>
          </div>
          <div className="train-track tall" aria-hidden>
            <div className="train-fill" style={{ width: `${lessonProgress}%` }} />
          </div>
          <div className="memory-card" style={{ marginTop: "1rem" }}>
            <div className="label">Step {lessonStep + 1}</div>
            <h3 style={{ marginBottom: "0.35rem" }}>{trainingLesson.steps[lessonStep].title}</h3>
            <p>{trainingLesson.steps[lessonStep].body}</p>
          </div>
          <div className="train-actions">
            <button
              className="btn btn-outline"
              type="button"
              disabled={lessonStep === 0}
              onClick={() => setLessonStep((s) => Math.max(0, s - 1))}
            >
              Back
            </button>
            <button
              className="btn btn-dark"
              type="button"
              onClick={() => {
                if (lessonStep >= trainingLesson.steps.length - 1) setMode("quiz");
                else setLessonStep((s) => s + 1);
              }}
            >
              {lessonStep >= trainingLesson.steps.length - 1 ? "Take safety quiz" : "Next step"}
            </button>
          </div>
        </section>
      ) : null}

      {mode === "quiz" ? (
        <section className="panel">
          <h2>{trainingQuiz.title}</h2>
          <p className="panel-lead">Pass at {trainingQuiz.passScore}% · Atlas explains every answer.</p>
          {quizDone ? (
            <div className="memory-card">
              <div className="label">Result</div>
              <h3 style={{ marginBottom: "0.35rem" }}>
                {Math.round((quizScore / trainingQuiz.questions.length) * 100)}%
              </h3>
              <p>
                {Math.round((quizScore / trainingQuiz.questions.length) * 100) >= trainingQuiz.passScore
                  ? "Passed. Progress saved to Alex’s Employee Hub."
                  : "Not yet — review the explanations and retry."}
              </p>
              <div className="train-actions">
                <button className="btn btn-outline" type="button" onClick={resetQuiz}>
                  Retry quiz
                </button>
                <button className="btn btn-dark" type="button" onClick={() => setMode("voice")}>
                  Start voice practice
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="memory-card">
                <div className="label">
                  Question {quizIndex + 1} / {trainingQuiz.questions.length}
                </div>
                <h3 style={{ marginBottom: "0.75rem" }}>{question.prompt}</h3>
                <div className="quiz-choices">
                  {question.choices.map((choice, index) => (
                    <button
                      key={choice}
                      type="button"
                      className={quizChoice === index ? "quiz-choice selected" : "quiz-choice"}
                      onClick={() => setQuizChoice(index)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                {quizChoice !== null ? (
                  <p className="muted-line" style={{ marginTop: "0.75rem" }}>
                    {quizChoice === question.answer ? "Correct. " : "Not quite. "}
                    {question.explain}
                  </p>
                ) : null}
              </div>
              <div className="train-actions">
                <button
                  className="btn btn-dark"
                  type="button"
                  disabled={quizChoice === null}
                  onClick={submitQuizChoice}
                >
                  {quizIndex >= trainingQuiz.questions.length - 1 ? "Finish quiz" : "Next question"}
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {mode === "voice" ? (
        <div className="split">
          <section className="panel">
            <h2>{trainingVoiceScenario.title}</h2>
            <p className="panel-lead">{trainingVoiceScenario.prompt}</p>
            <div className="list">
              {trainingVoiceScenario.tips.map((tip) => (
                <div className="list-row" key={tip}>
                  <span className="badge ok">Tip</span>
                  <p>{tip}</p>
                </div>
              ))}
            </div>
            <form onSubmit={onVoice} className="train-form">
              <input
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                placeholder="Type what you’d say on the call…"
              />
              <button className="btn btn-dark" type="submit">
                Practice
              </button>
            </form>
          </section>
          <section className="panel">
            <h2>Atlas coach</h2>
            {voiceFeedback ? (
              <div className="chat-mock">
                <div className="bubble bubble-user">{voiceLast}</div>
                <div className="bubble bubble-ai">
                  {voiceScore !== null ? `Score ${voiceScore}. ` : ""}
                  {voiceFeedback}
                </div>
              </div>
            ) : (
              <p className="panel-lead">Submit a practice line to get instant coaching.</p>
            )}
            <button className="btn btn-outline" style={{ marginTop: "1rem" }} type="button" onClick={() => setMode("roleplay")}>
              Move to roleplay
            </button>
          </section>
        </div>
      ) : null}

      {mode === "roleplay" ? (
        <div className="split">
          <section className="panel">
            <h2>{trainingRoleplay.title}</h2>
            <div className="chat-mock" style={{ minHeight: 280 }}>
              {roleplay.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`bubble ${msg.role === "ai" ? "bubble-ai" : "bubble-user"}`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={onRoleplay} className="train-form">
              <input
                value={roleplayInput}
                onChange={(e) => setRoleplayInput(e.target.value)}
                placeholder="Reply as the employee…"
              />
              <button className="btn btn-dark" type="submit">
                Send
              </button>
            </form>
          </section>
          <section className="panel">
            <h2>Policy hints</h2>
            <div className="list">
              {trainingRoleplay.hints.map((hint) => (
                <div className="list-row" key={hint}>
                  <span className="badge">Hint</span>
                  <p>{hint}</p>
                </div>
              ))}
            </div>
            <p className="muted-line" style={{ marginTop: "0.85rem" }}>
              Atlas scores tone, policy accuracy, and escalation judgment — then saves progress to the
              Employee Hub.
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
