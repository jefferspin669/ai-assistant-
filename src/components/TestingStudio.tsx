"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  SUITE_META,
  loadTestHistory,
  runAllSuites,
  runSuite,
  type SuiteRun,
  type TestResult,
  type TestSuiteId,
} from "@/lib/testing";

export function TestingStudio() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [history, setHistory] = useState<SuiteRun[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setHistory(loadTestHistory());
  }, []);

  function runOne(id: TestSuiteId) {
    const next = runSuite(id);
    setResults(next);
    setMessage(`${SUITE_META.find((s) => s.id === id)?.title}: ${next.filter((r) => r.ok).length}/${next.length} passed`);
  }

  function runAll() {
    const run = runAllSuites();
    setResults(run.results);
    setHistory(loadTestHistory());
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
          <strong>{results.filter((r) => r.ok).length || history[0]?.passed || 0}</strong>
          <small>Assertions</small>
        </div>
        <div className="stat">
          <span>Failed</span>
          <strong>{results.filter((r) => !r.ok).length || history[0]?.failed || 0}</strong>
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

      {message ? <p className={results.some((r) => !r.ok) ? "auth-error" : "auth-success"}>{message}</p> : null}
    </AppShell>
  );
}
