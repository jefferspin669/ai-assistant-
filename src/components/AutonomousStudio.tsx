"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { autonomousLoops } from "@/lib/atlas-platform";
import { LEVEL_LABELS, type AutonomyLevel } from "@/lib/autonomy/types";

type PolicyView = {
  organizationId: string;
  level: AutonomyLevel;
  levelName: string;
  headline: string;
  killSwitch: boolean;
  autoPaymentLimitCents: number;
  refundLimitCents: number;
  discountCapPercent: number;
  marketingBudgetCents: number;
  earliestScheduleHour: number;
  wakeOnlyEmergencies: boolean;
  standingOrders: string[];
  autoPaymentLimit: string;
  refundLimit: string;
  marketingBudget: string;
};

type PendingCard = {
  id: string;
  kind: string;
  title: string;
  summary: string;
  ownerPrompt: string;
  amountCents: number | null;
  limitCents: number | null;
  band: string;
  createdAt: string;
};

type AutonomyPayload = {
  policy: PolicyView;
  pending: PendingCard[];
  slogan: string;
};

async function readOk<T>(res: Response): Promise<T> {
  const json = (await res.json()) as { ok?: boolean; data?: T; error?: string };
  if (!json.ok || json.data == null) throw new Error(json.error || "Request failed");
  return json.data;
}

function dollars(cents: number) {
  return String(cents / 100);
}

export function AutonomousStudio() {
  const [payload, setPayload] = useState<AutonomyPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [atlasReply, setAtlasReply] = useState<string | null>(null);
  const [payLimit, setPayLimit] = useState("5000");
  const [refundLimit, setRefundLimit] = useState("100");
  const [discountCap, setDiscountCap] = useState("10");
  const [marketing, setMarketing] = useState("1500");
  const [activeLoop, setActiveLoop] = useState(autonomousLoops[0].id);

  const policy = payload?.policy;
  const pending = payload?.pending || [];
  const loop = useMemo(
    () => autonomousLoops.find((item) => item.id === activeLoop) ?? autonomousLoops[0],
    [activeLoop],
  );

  const refresh = useCallback(async () => {
    await fetch("/api/session");
    const data = await readOk<AutonomyPayload>(await fetch("/api/autonomy"));
    setPayload(data);
    setPayLimit(dollars(data.policy.autoPaymentLimitCents));
    setRefundLimit(dollars(data.policy.refundLimitCents));
    setDiscountCap(String(data.policy.discountCapPercent));
    setMarketing(dollars(data.policy.marketingBudgetCents));
  }, []);

  useEffect(() => {
    void refresh().catch((error: unknown) => {
      setNote(error instanceof Error ? error.message : "Could not load autonomy policy.");
    });
  }, [refresh]);

  async function putPolicy(body: Record<string, unknown>) {
    setBusy(true);
    setNote(null);
    try {
      const data = await readOk<{ policy: PolicyView; pending: PendingCard[] }>(
        await fetch("/api/autonomy", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
      setPayload((prev) =>
        prev
          ? { ...prev, policy: data.policy, pending: data.pending }
          : { policy: data.policy, pending: data.pending, slogan: prev?.slogan || "" },
      );
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveLimits() {
    await putPolicy({
      autoPaymentLimitDollars: Number(payLimit),
      refundLimitDollars: Number(refundLimit),
      discountCapPercent: Number(discountCap),
      marketingBudgetDollars: Number(marketing),
    });
  }

  async function postWork(body: Record<string, unknown>) {
    setBusy(true);
    setNote(null);
    try {
      const json = await fetch("/api/autonomy/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((res) => res.json());
      if (json.data?.asked?.reply) setAtlasReply(String(json.data.asked.reply));
      if (json.data?.decision) {
        setNote(
          json.data.decision.verdict === "execute"
            ? `Atlas will handle: ${json.data.decision.title}. ${json.data.decision.reason}`
            : json.data.decision.ownerPrompt || json.data.decision.reason,
        );
      }
      await refresh();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Work failed");
    } finally {
      setBusy(false);
    }
  }

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusy(true);
    try {
      await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      await refresh();
      setNote(decision === "approved" ? "Approved — Atlas will execute." : "Rejected.");
    } finally {
      setBusy(false);
    }
  }

  async function tickQueue() {
    setBusy(true);
    try {
      const json = await fetch("/api/autonomy/tick", { method: "POST" }).then((res) => res.json());
      setNote(`Queue tick: ${JSON.stringify(json.data?.processed || json)}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="training-studio">
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">Permission engine</p>
          <h2>{payload?.slogan || "Atlas runs the routine company. Humans handle the exceptions."}</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            {policy
              ? `Level ${policy.level} — ${policy.levelName}. ${policy.headline}`
              : "Loading autonomy policy…"}
          </p>
        </div>
        <div className="cta-row">
          <button
            className={`btn ${policy?.killSwitch ? "btn-outline" : "btn-primary"}`}
            type="button"
            disabled={busy || !policy}
            onClick={() => void putPolicy({ killSwitch: !policy?.killSwitch })}
          >
            {policy?.killSwitch ? "Kill switch · ON" : "Kill switch · off"}
          </button>
        </div>
      </section>

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Level</span>
          <strong>{policy ? `${policy.level} · ${policy.levelName}` : "…"}</strong>
          <small>{policy?.killSwitch ? "Paused" : "Live policy"}</small>
        </div>
        <div className="stat">
          <span>Auto-pay limit</span>
          <strong>{policy?.autoPaymentLimit || "…"}</strong>
          <small>Vendor payments over this ask you</small>
        </div>
        <div className="stat">
          <span>Waiting on you</span>
          <strong>{pending.length}</strong>
          <small>Exceptions in the queue</small>
        </div>
        <div className="stat">
          <span>Refunds / discounts</span>
          <strong>
            {policy ? `${policy.refundLimit} · ${policy.discountCapPercent}%` : "…"}
          </strong>
          <small>Level 3 rules</small>
        </div>
      </div>

      <section className="panel">
        <h2>Autonomy level</h2>
        <p className="panel-lead">
          1 recommends. 2 handles routine. 3 decides inside your rules. 4 runs the company and only
          pings you for exceptions.
        </p>
        <div className="cta-row" style={{ flexWrap: "wrap" }}>
          {([1, 2, 3, 4] as AutonomyLevel[]).map((level) => (
            <button
              key={level}
              className={`btn ${policy?.level === level ? "btn-dark" : "btn-outline"}`}
              type="button"
              disabled={busy}
              onClick={() => void putPolicy({ level, killSwitch: false })}
            >
              L{level} {LEVEL_LABELS[level].name}
            </button>
          ))}
        </div>
        <div className="train-actions" style={{ marginTop: "0.8rem" }}>
          <button
            className="btn btn-dark"
            type="button"
            disabled={busy}
            onClick={() => void putPolicy({ awayMessage: "I'm going on vacation. Run the company." })}
          >
            I&apos;m going on vacation. Run the company.
          </button>
          <button className="btn btn-outline" type="button" disabled={busy} onClick={() => void tickQueue()}>
            Run background tick
          </button>
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Rules the owner sets</h2>
          <p className="panel-lead">Discounts, refunds, fill-ins, and marketing stay inside these caps.</p>
          <div className="train-form">
            <input
              value={payLimit}
              onChange={(e) => setPayLimit(e.target.value)}
              inputMode="decimal"
              aria-label="Auto-pay limit dollars"
              placeholder="Auto-pay $"
            />
            <input
              value={refundLimit}
              onChange={(e) => setRefundLimit(e.target.value)}
              inputMode="decimal"
              aria-label="Refund limit dollars"
              placeholder="Refunds $"
            />
            <input
              value={discountCap}
              onChange={(e) => setDiscountCap(e.target.value)}
              inputMode="decimal"
              aria-label="Discount cap percent"
              placeholder="Discount %"
            />
            <input
              value={marketing}
              onChange={(e) => setMarketing(e.target.value)}
              inputMode="decimal"
              aria-label="Marketing budget dollars"
              placeholder="Marketing $"
            />
          </div>
          <div className="train-actions">
            <button className="btn btn-dark" type="button" disabled={busy} onClick={() => void saveLimits()}>
              Save limits
            </button>
            <button
              className="btn btn-outline"
              type="button"
              disabled={busy}
              onClick={() => void postWork({ demo: "vendor_payment" })}
            >
              Simulate $18,420 vendor payment
            </button>
          </div>
          {policy?.standingOrders?.length ? (
            <div className="list" style={{ marginTop: "0.9rem" }}>
              {policy.standingOrders.map((order) => (
                <div className="list-row" key={order}>
                  <span className="badge">Order</span>
                  <p>{order}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="panel">
          <h2>Atlas needs you</h2>
          <p className="panel-lead">Restricted work never gets a blank check — even on Autopilot.</p>
          {pending.length === 0 ? (
            <p className="muted-line">No exceptions right now. Atlas is within authority.</p>
          ) : (
            <div className="list">
              {pending.map((card) => (
                <div className="confirm-card" key={card.id} style={{ marginBottom: "0.8rem" }}>
                  <div className="agent-tag">
                    {card.band || "exception"} · {card.kind.replace(/_/g, " ")}
                  </div>
                  <pre className="muted-line" style={{ whiteSpace: "pre-wrap", margin: "0.4rem 0" }}>
                    {card.ownerPrompt || `${card.title}\n${card.summary}`}
                  </pre>
                  <div className="cta-row">
                    <button className="btn btn-dark" type="button" disabled={busy} onClick={() => void decide(card.id, "approved")}>
                      Approve
                    </button>
                    <button className="btn btn-outline" type="button" disabled={busy} onClick={() => void decide(card.id, "rejected")}>
                      Reject
                    </button>
                    <button
                      className="btn btn-outline"
                      type="button"
                      disabled={busy}
                      onClick={() => void postWork({ askApprovalId: card.id })}
                    >
                      Ask Atlas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {atlasReply ? <p className="muted-line" style={{ marginTop: "0.6rem" }}>{atlasReply}</p> : null}
          {note ? <p className="muted-line" style={{ marginTop: "0.6rem" }}>{note}</p> : null}
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Level 2 — routine work Atlas can run</h2>
          <p className="panel-lead">Scheduling, confirmations, reminders, follow-ups, receptionist, texts, leads, tasks, invoices, reviews.</p>
          <div className="list">
            {autonomousLoops.map((item) => (
              <button
                key={item.id}
                type="button"
                className="list-row"
                onClick={() => setActiveLoop(item.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: activeLoop === item.id ? "var(--paper)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 12,
                  padding: "0.65rem 0.5rem",
                }}
              >
                <span className={`badge ${policy && !policy.killSwitch && policy.level >= 2 ? "ok" : ""}`}>
                  {policy && !policy.killSwitch && policy.level >= 2 ? "In authority" : "Needs you at L1"}
                </span>
                <div>
                  <p>
                    <strong>{item.title}</strong>
                  </p>
                  <small className="muted-line">{item.trigger}</small>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>{loop.title}</h2>
          <p className="panel-lead">{loop.trigger}</p>
          <div className="list">
            {loop.steps.map((step) => (
              <div className="list-row" key={step}>
                <span className="badge">Step</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
