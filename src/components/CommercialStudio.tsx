"use client";

import { useCallback, useEffect, useState } from "react";
import { SiteLink } from "@/components/SiteLink";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import type { IntegrationMode } from "@/lib/integrations/config";

type IntegrationStatus = {
  id: string;
  label: string;
  configured: boolean;
  mode: IntegrationMode;
  detail: string;
};

type StatusPayload = {
  storeMode: "live" | "simulation";
  integrations: IntegrationStatus[];
  calendarsConnected: string[];
  missedCalls: {
    id: string;
    from: string;
    status: string;
    receivedAt: string;
    leadName?: string;
  }[];
};

type AutonomyStrip = {
  level: number;
  levelName: string;
  headline: string;
  killSwitch: boolean;
  autoPaymentLimit: string;
  pending: number;
};

export function CommercialStudio() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [autonomy, setAutonomy] = useState<AutonomyStrip | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("+15551234567");
  const [invoiceName, setInvoiceName] = useState("Jamie Cole");
  const [invoiceAmount, setInvoiceAmount] = useState("1250");

  const twilioMode =
    status?.integrations.find((i) => i.id === "twilio")?.mode || ("simulation" as IntegrationMode);

  const refresh = useCallback(async () => {
    try {
      await fetch("/api/session", { credentials: "include" });
    } catch {
      /* session mint is best-effort in development */
    }
    const res = await fetch("/api/integrations/status", { credentials: "include" });
    const json = (await res.json()) as { ok: boolean; data?: StatusPayload };
    if (json.ok && json.data) setStatus(json.data);
    try {
      const auto = (await fetch("/api/autonomy", { credentials: "include" }).then((r) => r.json())) as {
        ok?: boolean;
        data?: {
          policy?: {
            level: number;
            levelName: string;
            headline: string;
            killSwitch: boolean;
            autoPaymentLimit: string;
          };
          pending?: unknown[];
        };
      };
      if (auto.ok && auto.data?.policy) {
        setAutonomy({
          level: auto.data.policy.level,
          levelName: auto.data.policy.levelName,
          headline: auto.data.policy.headline,
          killSwitch: auto.data.policy.killSwitch,
          autoPaymentLimit: auto.data.policy.autoPaymentLimit,
          pending: auto.data.pending?.length || 0,
        });
      }
    } catch {
      /* autonomy strip is optional on this page */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function postJson(url: string, body: Record<string, unknown>) {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setNote(JSON.stringify(json, null, 2));
      await refresh();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Business store</span>
          <strong>{status?.storeMode || "…"}</strong>
          <small>Supabase when configured</small>
        </div>
        <div className="stat">
          <span>Live integrations</span>
          <strong>{status?.integrations.filter((i) => i.mode === "live").length ?? 0}</strong>
          <small>of {status?.integrations.length ?? 0} systems</small>
        </div>
        <div className="stat">
          <span>Calendars</span>
          <strong>{status?.calendarsConnected.length ?? 0}</strong>
          <small>{status?.calendarsConnected.join(", ") || "none connected"}</small>
        </div>
        <div className="stat">
          <span>Missed-call leads</span>
          <strong>{status?.missedCalls.length ?? 0}</strong>
          <small>Recovery queue</small>
        </div>
        <div className="stat">
          <span>Autonomy</span>
          <strong>
            {autonomy ? `L${autonomy.level} · ${autonomy.levelName}` : "…"}
          </strong>
          <small>
            {autonomy
              ? autonomy.killSwitch
                ? "Kill switch on"
                : `${autonomy.pending} waiting · pay ${autonomy.autoPaymentLimit}`
              : "Permission engine"}
          </small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Commercial stack</h2>
          <p className="panel-lead">
            Every system is labeled Live, Partially connected, Simulation, or Unavailable.
            Production refuses quiet simulation for Twilio/SMS.
          </p>
          <div className="list">
            {(status?.integrations || []).map((item) => (
              <div className="list-row" key={item.id}>
                <ConnectionStatusBadge mode={item.mode} />
                <div>
                  <p>
                    <strong>{item.label}</strong>
                  </p>
                  <small className="muted-line">{item.detail}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="train-actions">
            <button className="btn btn-outline" type="button" onClick={() => void refresh()} disabled={busy}>
              Refresh status
            </button>
            <SiteLink className="btn btn-dark" href="/app/autonomous">
              Open autonomy engine
            </SiteLink>
          </div>
        </section>

        <section className="panel">
          <h2>Receptionist · missed-call recovery</h2>
          <p className="panel-lead">
            Twilio webhooks: <code>/api/webhooks/twilio/voice</code>,{" "}
            <code>/api/webhooks/twilio/sms</code>. Requires a signed-in owner session.
            {twilioMode === "live"
              ? " Twilio is Live — recovery sends a real SMS."
              : twilioMode === "unavailable"
                ? " Unavailable in this environment."
                : " Development only: may log a simulated SMS when Twilio credentials are unset."}
          </p>
          <div className="train-form">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label="Caller phone"
              placeholder="+1…"
            />
            <button
              className="btn btn-dark"
              type="button"
              disabled={busy || twilioMode === "unavailable"}
              onClick={() => void postJson("/api/receptionist/missed-call", { from: phone })}
            >
              {twilioMode === "live" ? "Trigger missed-call recovery" : "Dev: trigger recovery (simulation)"}
            </button>
          </div>
          <div className="list" style={{ marginTop: "0.9rem" }}>
            {(status?.missedCalls || []).slice(0, 5).map((call) => (
              <div className="list-row" key={call.id}>
                <span className={`badge${call.status === "booked" ? " ok" : " warn"}`}>
                  {call.status}
                </span>
                <div>
                  <p>
                    <strong>{call.from}</strong>
                  </p>
                  <small className="muted-line">
                    {call.leadName || "Lead"} · {new Date(call.receivedAt).toLocaleString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Calendar</h2>
          <p className="panel-lead">Connect Google or Microsoft, then create a real event.</p>
          <div className="train-actions">
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                window.location.href = "/api/calendar/oauth/google";
              }}
            >
              Connect Google
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                window.location.href = "/api/calendar/oauth/microsoft";
              }}
            >
              Connect Microsoft
            </button>
            <button
              className="btn btn-dark"
              type="button"
              disabled={busy}
              onClick={() => {
                const start = new Date();
                start.setDate(start.getDate() + 1);
                start.setHours(9, 0, 0, 0);
                const end = new Date(start.getTime() + 90 * 60 * 1000);
                void postJson("/api/calendar/sync", {
                  title: "Atlas service visit",
                  startsAt: start.toISOString(),
                  endsAt: end.toISOString(),
                });
              }}
            >
              Create tomorrow 9am event
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Real actions + Stripe</h2>
          <p className="panel-lead">
            SMS/invoice stage a server approval first. Client <code>approved</code> flags are
            ignored — use Approvals, then resend with <code>confirmationId</code>.
          </p>
          <div className="train-form">
            <input
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
              aria-label="Invoice customer"
            />
            <input
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              aria-label="Amount dollars"
            />
          </div>
          <div className="train-actions">
            <button
              className="btn btn-outline"
              type="button"
              disabled={busy}
              onClick={() =>
                void postJson("/api/actions/send-invoice", {
                  customerName: invoiceName,
                  amount: Number(invoiceAmount),
                  customerPhone: phone,
                  memo: "Service visit",
                })
              }
            >
              Draft invoice (needs approval)
            </button>
            <button
              className="btn btn-dark"
              type="button"
              disabled={busy}
              onClick={() =>
                void postJson("/api/actions/send-invoice", {
                  customerName: invoiceName,
                  amount: Number(invoiceAmount),
                  customerPhone: phone,
                  memo: "Service visit",
                  confirmationId: note.match(/appr-[a-z0-9-]+/i)?.[0],
                })
              }
            >
              Send invoice (with confirmationId)
            </button>
            <button
              className="btn btn-outline"
              type="button"
              disabled={busy}
              onClick={() =>
                void postJson("/api/actions/send-sms", {
                  to: phone,
                  body: "Atlas here — your visit is confirmed for tomorrow 9am.",
                })
              }
            >
              Stage SMS
            </button>
            <button
              className="btn btn-dark"
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const res = await fetch("/api/billing/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: "{}",
                  });
                  const json = (await res.json()) as {
                    ok: boolean;
                    data?: { url?: string; mode?: string };
                  };
                  if (json.data?.url) {
                    setNote(`Checkout (${json.data.mode}): ${json.data.url}`);
                    if (json.data.mode === "live") window.location.href = json.data.url;
                  } else {
                    setNote(JSON.stringify(json, null, 2));
                  }
                } finally {
                  setBusy(false);
                }
              }}
            >
              Stripe Checkout
            </button>
          </div>
        </section>
      </div>

      {note ? (
        <section className="panel">
          <h2>Last response</h2>
          <pre className="muted-line" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {note}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
