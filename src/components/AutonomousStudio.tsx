"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AutonomyLevel } from "@/lib/autonomy/types";
import type { AutoPermissionKey, ControlMode } from "@/lib/autonomy/permissions";

type PolicyView = {
  organizationId: string;
  level: AutonomyLevel;
  controlMode: ControlMode;
  autoPermissions: Record<AutoPermissionKey, boolean>;
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
  permissions?: PermissionDef[];
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

type PermissionDef = {
  key: AutoPermissionKey;
  label: string;
  description: string;
};

type AuditRow = {
  id: string;
  action: string;
  summary: string;
  at: string;
  actor: string;
};

type AutonomyPayload = {
  policy: PolicyView;
  pending: PendingCard[];
  slogan: string;
  permissions?: PermissionDef[];
};

const MODES: { id: ControlMode; title: string; detail: string }[] = [
  {
    id: "manual",
    title: "Manual",
    detail: "Atlas suggests actions. You approve everything.",
  },
  {
    id: "assisted",
    title: "Assisted",
    detail: "Routine work runs automatically. Higher-impact actions ask first.",
  },
  {
    id: "autonomous",
    title: "Autonomous",
    detail: "Atlas executes approved categories within limits you set.",
  },
];

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
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [payLimit, setPayLimit] = useState("5000");
  const [refundLimit, setRefundLimit] = useState("100");
  const [discountCap, setDiscountCap] = useState("10");
  const [marketing, setMarketing] = useState("1500");

  const policy = payload?.policy;
  const pending = payload?.pending || [];
  const permissionDefs = policy?.permissions ?? payload?.permissions ?? [];

  const refresh = useCallback(async () => {
    await fetch("/api/session");
    const data = await readOk<AutonomyPayload>(await fetch("/api/autonomy"));
    setPayload(data);
    setPayLimit(dollars(data.policy.autoPaymentLimitCents));
    setRefundLimit(dollars(data.policy.refundLimitCents));
    setDiscountCap(String(data.policy.discountCapPercent));
    setMarketing(dollars(data.policy.marketingBudgetCents));
    try {
      const auditRes = await fetch("/api/audit");
      const auditJson = (await auditRes.json()) as {
        ok?: boolean;
        data?: Array<{
          id: string;
          action: string;
          entity_type?: string;
          entity_id?: string | null;
          created_at: string;
          actor_label: string;
        }>;
      };
      if (auditJson.ok && Array.isArray(auditJson.data)) {
        setAudit(
          auditJson.data.slice(0, 12).map((row) => ({
            id: row.id,
            action: row.action.replace(/_/g, " "),
            summary: row.entity_type ? `${row.entity_type}${row.entity_id ? ` · ${row.entity_id}` : ""}` : "",
            at: row.created_at,
            actor: row.actor_label,
          })),
        );
      }
    } catch {
      setAudit([]);
    }
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
      setPayload((prev) => ({
        slogan: prev?.slogan || "Atlas runs the routine company. Humans handle the exceptions.",
        policy: data.policy,
        pending: data.pending,
      }));
      setNote("Autonomy settings saved.");
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

  const paused = Boolean(policy?.killSwitch);
  const modeCards = useMemo(
    () =>
      MODES.map((mode) => ({
        ...mode,
        active: policy?.controlMode === mode.id,
      })),
    [policy?.controlMode],
  );

  return (
    <div className="training-studio">
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">Autonomous control system</p>
          <h2>How independently can Atlas work?</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            {policy
              ? `${policy.levelName} — ${policy.headline}`
              : "Loading autonomy policy…"}
          </p>
        </div>
        <div className="cta-row">
          <button
            className={`btn ${paused ? "btn-primary" : "btn-outline"}`}
            type="button"
            disabled={busy || !policy}
            onClick={() => void putPolicy({ killSwitch: !policy?.killSwitch })}
          >
            {paused ? "Pause autonomous actions · ON" : "Pause autonomous actions"}
          </button>
        </div>
      </section>

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Control mode</span>
          <strong>{policy?.levelName || "…"}</strong>
          <small>{paused ? "Paused — nothing runs automatically" : "Active policy"}</small>
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
          <span>Approval threshold</span>
          <strong>{policy?.refundLimit || "…"}</strong>
          <small>Refunds / discounts above this ask first</small>
        </div>
      </div>

      <section className="panel">
        <h2>Control mode</h2>
        <p className="panel-lead">Pick how much authority Atlas has before it must ask.</p>
        <div className="dash-preset-grid">
          {modeCards.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`dash-preset-card ${mode.active ? "active" : ""}`}
              disabled={busy}
              onClick={() => void putPolicy({ controlMode: mode.id, killSwitch: false })}
            >
              <strong>{mode.title}</strong>
              <span className="muted-line">{mode.detail}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>What can Atlas do automatically?</h2>
        <p className="panel-lead">
          Enable categories of work Atlas may run without asking. Anything outside these permissions
          waits for you.
        </p>
        <ul className="manage-list">
          {permissionDefs.map((perm) => {
            const enabled = policy?.autoPermissions?.[perm.key] ?? false;
            return (
              <li key={perm.key}>
                <div>
                  <strong>{perm.label}</strong>
                  <small>{perm.description}</small>
                </div>
                <button
                  type="button"
                  className={`biz-chip ${enabled ? "active" : ""}`}
                  disabled={busy || !policy || policy.controlMode === "manual"}
                  onClick={() =>
                    void putPolicy({
                      autoPermissions: { [perm.key]: !enabled },
                    })
                  }
                >
                  {enabled ? "Enabled" : "Ask first"}
                </button>
              </li>
            );
          })}
        </ul>
        {policy?.controlMode === "manual" ? (
          <p className="muted-line" style={{ marginTop: "0.75rem" }}>
            Manual mode keeps all categories on ask-first. Switch to Assisted or Autonomous to enable
            automatic categories.
          </p>
        ) : null}
      </section>

      <div className="split">
        <section className="panel">
          <h2>Spending limits & thresholds</h2>
          <p className="panel-lead">Caps Atlas must respect before escalating to you.</p>
          <div className="train-form">
            <label>
              Auto-pay limit ($)
              <input
                value={payLimit}
                onChange={(e) => setPayLimit(e.target.value)}
                inputMode="decimal"
                aria-label="Auto-pay limit dollars"
              />
            </label>
            <label>
              Approval threshold — refunds ($)
              <input
                value={refundLimit}
                onChange={(e) => setRefundLimit(e.target.value)}
                inputMode="decimal"
                aria-label="Refund limit dollars"
              />
            </label>
            <label>
              Discount cap (%)
              <input
                value={discountCap}
                onChange={(e) => setDiscountCap(e.target.value)}
                inputMode="decimal"
                aria-label="Discount cap percent"
              />
            </label>
            <label>
              Marketing budget ($)
              <input
                value={marketing}
                onChange={(e) => setMarketing(e.target.value)}
                inputMode="decimal"
                aria-label="Marketing budget dollars"
              />
            </label>
          </div>
          <div className="train-actions">
            <button className="btn btn-dark" type="button" disabled={busy} onClick={() => void saveLimits()}>
              Save limits
            </button>
          </div>
          {policy?.standingOrders?.length ? (
            <div className="list" style={{ marginTop: "0.9rem" }}>
              {policy.standingOrders.map((order) => (
                <div className="list-row" key={order}>
                  <span className="badge">Standing order</span>
                  <p>{order}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="panel">
          <h2>Atlas needs you</h2>
          <p className="panel-lead">Restricted work never gets a blank check — even on Autonomous.</p>
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
                    <button
                      className="btn btn-dark"
                      type="button"
                      disabled={busy}
                      onClick={() => void decide(card.id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-outline"
                      type="button"
                      disabled={busy}
                      onClick={() => void decide(card.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {note ? <p className="muted-line" style={{ marginTop: "0.6rem" }}>{note}</p> : null}
        </section>
      </div>

      <section className="panel">
        <h2>Audit history</h2>
        <p className="panel-lead">Recent autonomy and approval events for this workspace.</p>
        {audit.length === 0 ? (
          <p className="muted-line">No audit entries yet. Sensitive actions will appear here.</p>
        ) : (
          <ol className="activity-timeline">
            {audit.map((row) => (
              <li key={row.id} className="activity-item activity-neutral">
                <span className="activity-time">
                  {row.at ? new Date(row.at).toLocaleString() : "—"}
                </span>
                <span>
                  <strong>{row.actor}</strong> {row.action}
                  {row.summary ? ` — ${row.summary}` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
