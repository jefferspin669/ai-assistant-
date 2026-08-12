"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GUARDRAILS,
  INDUSTRY_TEMPLATES,
  INTEGRATIONS,
  ONBOARDING_QUICKSTART,
  PRICING_TIERS,
  SECURITY_FEATURES,
} from "@/lib/platform-catalog";

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]") as string[]); } catch { return new Set(); }
}
function saveSet(key: string, set: Set<string>) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify([...set]));
}

function guardrailVerdict(text: string): { label: string; cls: string } {
  const q = text.toLowerCase();
  if (/payroll|salary|financial data|bank account/.test(q)) return { label: "❌ Blocked without permission", cls: "badge" };
  if (/delete|remove/.test(q) && /(customer|employee|account)/.test(q)) return { label: "⛔ Requires explicit confirmation + audit", cls: "badge warn" };
  const amt = q.match(/\$?\s*([\d,]{3,})/);
  if (/refund|discount|transfer|wire|pay\b/.test(q) && amt && Number(amt[1].replace(/,/g, "")) > 500) return { label: "⚠️ Over limit — routed for approval", cls: "badge warn" };
  if (/everyone|company[- ]wide|all employees|broadcast/.test(q)) return { label: "👁️ Preview & approve before sending", cls: "badge" };
  return { label: "✅ Allowed within policy", cls: "badge ok" };
}

export function PlatformStudio() {
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [security, setSecurity] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState("hvac");
  const [applied, setApplied] = useState<string | null>(null);
  const [testInput, setTestInput] = useState("Refund the customer $2,400");
  const [verdict, setVerdict] = useState<{ label: string; cls: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConnected(loadSet("atlas-integrations-v1"));
    const sec = loadSet("atlas-security-v1");
    // Default the toggleable security features to on the first time.
    if (sec.size === 0) SECURITY_FEATURES.filter((f) => f.on).forEach((f) => sec.add(f.id));
    setSecurity(sec);
    setReady(true);
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof INTEGRATIONS>();
    for (const i of INTEGRATIONS) map.set(i.category, [...(map.get(i.category) ?? []), i]);
    return [...map.entries()];
  }, []);

  function toggleConnect(id: string) {
    setConnected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); saveSet("atlas-integrations-v1", next); return next; });
  }
  function toggleSecurity(id: string) {
    setSecurity((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); saveSet("atlas-security-v1", next); return next; });
  }
  function applyTemplate() {
    const t = INDUSTRY_TEMPLATES.find((x) => x.id === template);
    setApplied(t ? `Applied “${t.name}”. Atlas configured: ${t.sets.join(", ")}.` : null);
  }

  const tpl = INDUSTRY_TEMPLATES.find((x) => x.id === template);

  return (
    <div className="training-studio">
      <section className="panel">
        <h2>Quick start — signup to useful in minutes</h2>
        <p className="panel-lead">No wall of 100 settings — Atlas walks you through the essentials.</p>
        <div className="list">
          {ONBOARDING_QUICKSTART.map((s, i) => (
            <div className="list-row" key={s.step}>
              <span className="badge">{i + 1}</span>
              <p><strong>{s.step}</strong><span className="muted-line">{s.detail}</span></p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Industry templates</h2>
        <p className="panel-lead">Pick your business type and Atlas is pre-configured for it.</p>
        <div className="pack-grid">
          {INDUSTRY_TEMPLATES.map((t) => (
            <button key={t.id} type="button" className={template === t.id ? "pack-card active" : "pack-card"} style={{ textAlign: "left", cursor: "pointer" }} onClick={() => { setTemplate(t.id); setApplied(null); }}>
              <div style={{ fontSize: "1.4rem" }}>{t.emoji}</div>
              <strong>{t.name}</strong>
              <span className="muted-line">{t.sets.slice(0, 3).join(" · ")}</span>
            </button>
          ))}
        </div>
        {tpl ? (
          <div className="memory-card" style={{ marginTop: "0.6rem" }}>
            <div className="label">{tpl.emoji} {tpl.name} sets up</div>
            <div className="status-picker">{tpl.sets.map((s) => <span key={s} className="badge">{s}</span>)}</div>
            <div className="train-actions" style={{ marginTop: "0.5rem" }}><button className="btn btn-dark" type="button" onClick={applyTemplate}>Apply this template</button></div>
            {applied ? <p className="muted-line" style={{ marginTop: "0.4rem" }}>{applied}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>Integrations</h2>
        <p className="panel-lead">Connect the tools you already use — email, calendar, accounting, payments, phone/SMS, payroll, and storage.</p>
        {byCategory.map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: "0.6rem" }}>
            <div className="label">{cat}</div>
            <div className="list">
              {items.map((i) => {
                const on = connected.has(i.id);
                return (
                  <div className="list-row" key={i.id}>
                    <span className="badge">{i.emoji}</span>
                    <div style={{ flex: 1 }}><p><strong>{i.name}</strong><span className="muted-line">{i.blurb}</span></p></div>
                    <button className={on ? "btn btn-outline" : "btn btn-dark"} type="button" onClick={() => toggleConnect(i.id)}>{on ? "Connected ✓ — Disconnect" : "Connect"}</button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {ready ? <p className="muted-line">{connected.size} integration{connected.size === 1 ? "" : "s"} connected.</p> : null}
      </section>

      <section className="panel">
        <h2>Security &amp; compliance</h2>
        <p className="panel-lead">Enterprise-grade by default: SSO, MFA, encryption, backups, disaster recovery, and admin controls.</p>
        <div className="list">
          {SECURITY_FEATURES.map((f) => {
            const on = security.has(f.id);
            return (
              <div className="list-row" key={f.id}>
                <span className={on ? "badge ok" : "badge"}>{on ? "On" : "Off"}</span>
                <div style={{ flex: 1 }}><p><strong>{f.name}</strong><span className="muted-line">{f.desc}</span></p></div>
                {f.managed ? <span className="badge">Managed by Atlas</span> : (
                  <button className="btn btn-outline" type="button" onClick={() => toggleSecurity(f.id)}>{on ? "Disable" : "Enable"}</button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>AI guardrails</h2>
        <p className="panel-lead">Atlas won&apos;t confidently take the wrong action — actions are bounded, previewed, and audited.</p>
        <div className="list">
          {GUARDRAILS.map((g) => (
            <div className="list-row" key={g.id}>
              <span className="badge ok">🛡️</span>
              <p><strong>{g.rule}</strong><span className="muted-line">{g.example}</span></p>
            </div>
          ))}
        </div>
        <div className="memory-card" style={{ marginTop: "0.6rem" }}>
          <div className="label">Test a request against the guardrails</div>
          <form className="command-form" onSubmit={(e) => { e.preventDefault(); setVerdict(guardrailVerdict(testInput)); }}>
            <input value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder="e.g. Delete this customer / Refund $2,400 / Show me payroll" />
            <button className="btn btn-outline" type="submit">Check</button>
          </form>
          {verdict ? <p style={{ marginTop: "0.5rem" }}><span className={verdict.cls}>{verdict.label}</span></p> : null}
        </div>
      </section>

      <section className="panel">
        <h2>Plans &amp; pricing</h2>
        <p className="panel-lead">Clear tiers — obvious what a small business gets versus enterprise or the CEO package.</p>
        <div className="pack-grid">
          {PRICING_TIERS.map((t) => (
            <div key={t.id} className="pack-card" style={{ borderLeft: t.highlight ? "4px solid var(--teal)" : undefined }}>
              <strong>{t.name}{t.highlight ? " ★" : ""}</strong>
              <div className="label">{t.price}</div>
              <span className="muted-line">{t.blurb}</span>
              <div className="list" style={{ marginTop: "0.4rem" }}>
                {t.features.map((f) => <div className="list-row" key={f}><span className="badge ok">✓</span><p>{f}</p></div>)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
