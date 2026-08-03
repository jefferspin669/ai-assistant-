"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  SUITE_META,
  loadTestHistory,
  runAllSuites,
  runAndRecordSuite,
  type SuiteRun,
  type TestResult,
  type TestSuiteId,
} from "@/lib/testing";

export function TestingStudio() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [history, setHistory] = useState<SuiteRun[]>([]);
  const [message, setMessage] = useState("");
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    setHistory(loadTestHistory());
  }, []);

  const passed = hasRun ? results.filter((r) => r.ok).length : history[0]?.passed ?? 0;
  const failed = hasRun ? results.filter((r) => !r.ok).length : history[0]?.failed ?? 0;

  function runOne(id: TestSuiteId) {
    const run = runAndRecordSuite(id);
    setResults(run.results);
    setHistory(loadTestHistory());
    setHasRun(true);
    setMessage(
      `${SUITE_META.find((s) => s.id === id)?.title}: ${run.passed}/${run.results.length} passed`,
    );
  }

  function runAll() {
    const run = runAllSuites();
    setResults(run.results);
    setHistory(loadTestHistory());
    setHasRun(true);
    setMessage(`Full suite: ${run.passed} passed · ${run.failed} failed`);
  }

  return (
    <AppShell
      title="Testing system"
      subtitle="Login, payments, permissions, calendar, tax math, backup recovery, mobile, and security — run before you ship."
      action={
        <button type="button" className="btn btn-dark" onClick={runAll}>
          Run all tests
        </button>
      }
    >
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Last run passed</span>
          <strong>{passed}</strong>
          <small>Assertions</small>
        </div>
        <div className="stat">
          <span>Failed</span>
          <strong>{failed}</strong>
          <small>Must be zero for tax & permissions</small>
        </div>
        <div className="stat">
          <span>Suites</span>
          <strong>{SUITE_META.length}</strong>
          <small>Critical paths</small>
        </div>
        <div className="stat">
          <span>History</span>
          <strong>{history.length}</strong>
          <small>Stored locally</small>
        </div>
      </div>

      <section className="panel">
        <h2>Test suites</h2>
        <ul className="manage-list">
          {SUITE_META.map((suite) => (
            <li key={suite.id}>
              <div>
                <strong>{suite.title}</strong>
                <span>{suite.why}</span>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => runOne(suite.id)}>
                Run
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Results</h2>
          <ul className="manage-list">
            {results.length ? (
              results.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>
                      [{item.ok ? "PASS" : "FAIL"}] {item.name}
                    </strong>
                    <span>
                      {item.suite} · {item.detail}
                    </span>
                  </div>
                  <span className={`badge ${item.ok ? "ok" : "warn"}`}>{item.ok ? "ok" : "fail"}</span>
                </li>
              ))
            ) : (
              <li className="muted">Run a suite to see assertions.</li>
            )}
          </ul>
        </section>

        <section className="panel">
          <h2>Run history</h2>
          <ul className="manage-list">
            {history.length ? (
              history.slice(0, 8).map((run) => (
                <li key={run.id}>
                  <div>
                    <strong>
                      {run.passed} passed · {run.failed} failed
                    </strong>
                    <span>
                      {new Date(run.at).toLocaleString()} · {run.results.length} checks
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setResults(run.results);
                      setHasRun(true);
                      setMessage(`Loaded run from ${new Date(run.at).toLocaleString()}`);
                    }}
                  >
                    View
                  </button>
                </li>
              ))
            ) : (
              <li className="muted">No runs stored yet.</li>
            )}
          </ul>
        </section>
      </div>

      {message ? <p className={failed > 0 && hasRun ? "auth-error" : "auth-success"}>{message}</p> : null}
    </AppShell>
  );
}
