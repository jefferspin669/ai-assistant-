"use client";

import Link from "@/components/SiteLink";
import { useEffect, useState } from "react";
import {
  AUTONOMY_DESCRIPTIONS,
  loadReceptionistConfig,
  saveReceptionistConfig,
  type AutonomyMode,
  type ReceptionistConfig,
  type ReceptionistPersonality,
} from "@/lib/receptionist-assistant";

export function ReceptionistControlStudio() {
  const [config, setConfig] = useState<ReceptionistConfig>(loadReceptionistConfig());
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setConfig(loadReceptionistConfig());
  }, []);

  function save() {
    saveReceptionistConfig(config);
    setNote("Receptionist settings saved. Account Assistant uses Business Memory for answers.");
  }

  function toggleCapability(key: keyof ReceptionistConfig["capabilities"]) {
    setConfig((c) => ({
      ...c,
      capabilities: { ...c.capabilities, [key]: !c.capabilities[key] },
    }));
  }

  function toggleEscalate(key: keyof ReceptionistConfig["escalateWhen"]) {
    setConfig((c) => ({
      ...c,
      escalateWhen: { ...c.escalateWhen, [key]: !c.escalateWhen[key] },
    }));
  }

  return (
    <div className="training-studio">
      {note ? (
        <div className="memory-card">
          <div className="label">Atlas</div>
          <p>{note}</p>
        </div>
      ) : null}

      <section className="panel">
        <h2>Account Assistant control</h2>
        <p className="panel-lead">
          How much autonomy Atlas has on calls and messages. Powered by{" "}
          <Link href="/app/memory">Business Memory</Link>.
        </p>
        <label>
          Autonomy mode
          <select
            value={config.autonomyMode}
            onChange={(e) => setConfig({ ...config, autonomyMode: e.target.value as AutonomyMode })}
          >
            <option value="manual">Manual</option>
            <option value="assisted">Assisted</option>
            <option value="automatic">Automatic</option>
          </select>
        </label>
        <p className="muted-line">{AUTONOMY_DESCRIPTIONS[config.autonomyMode]}</p>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Personality & voice</h2>
          <label>
            Personality
            <select
              value={config.personality}
              onChange={(e) => setConfig({ ...config, personality: e.target.value as ReceptionistPersonality })}
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="concise">Concise</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          {config.personality === "custom" ? (
            <label>
              Custom tone
              <input
                value={config.customPersonality ?? ""}
                onChange={(e) => setConfig({ ...config, customPersonality: e.target.value })}
              />
            </label>
          ) : null}
          <label>
            Voice
            <input value={config.voice} onChange={(e) => setConfig({ ...config, voice: e.target.value })} />
          </label>
        </section>

        <section className="panel">
          <h2>What Atlas can do</h2>
          {(
            [
              ["bookAppointments", "Book appointments"],
              ["rescheduleAppointments", "Reschedule appointments"],
              ["takeMessages", "Take messages"],
              ["routeCalls", "Route calls"],
              ["answerFaqs", "Answer FAQs"],
              ["checkOrders", "Check orders"],
              ["sendTexts", "Send texts"],
              ["answerPricing", "Answer pricing (approved rates)"],
              ["missedCallTexts", "Missed-call texts"],
              ["issueRefunds", "Issue refunds"],
              ["changePricing", "Change pricing"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} style={{ display: "block", marginBottom: "0.35rem" }}>
              <input
                type="checkbox"
                checked={config.capabilities[key]}
                onChange={() => toggleCapability(key)}
              />
              {label}
            </label>
          ))}
        </section>
      </div>

      <section className="panel">
        <h2>Rules</h2>
        <div className="form-grid">
          <label>
            Discounts over % require approval
            <input
              type="number"
              value={config.rules.discountApprovalPct}
              onChange={(e) =>
                setConfig({
                  ...config,
                  rules: { ...config.rules, discountApprovalPct: Number(e.target.value) || 10 },
                })
              }
            />
          </label>
          <label>
            Transaction limit ($)
            <input
              type="number"
              value={config.rules.transactionLimit}
              onChange={(e) =>
                setConfig({
                  ...config,
                  rules: { ...config.rules, transactionLimit: Number(e.target.value) || 500 },
                })
              }
            />
          </label>
        </div>
        <label style={{ display: "block", marginTop: "0.5rem" }}>
          <input
            type="checkbox"
            checked={config.rules.refundsAlwaysApproval}
            onChange={(e) =>
              setConfig({ ...config, rules: { ...config.rules, refundsAlwaysApproval: e.target.checked } })
            }
          />
          Refunds always require approval
        </label>
        <label style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={config.rules.neverDiscloseEmployeePrivate}
            onChange={(e) =>
              setConfig({ ...config, rules: { ...config.rules, neverDiscloseEmployeePrivate: e.target.checked } })
            }
          />
          Never disclose employee private information
        </label>
      </section>

      <section className="panel">
        <h2>Escalate when</h2>
        {(
          [
            ["managerRequest", "Customer asks for manager"],
            ["upsetCustomer", "Customer becomes upset"],
            ["lowConfidence", "Atlas confidence is low"],
            ["transactionExceedsLimit", "Transaction exceeds limit"],
            ["legalSafety", "Legal / safety issue appears"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} style={{ display: "block", marginBottom: "0.35rem" }}>
            <input type="checkbox" checked={config.escalateWhen[key]} onChange={() => toggleEscalate(key)} />
            {label}
          </label>
        ))}
      </section>

      <button className="btn btn-dark" type="button" onClick={save}>Save control center</button>
    </div>
  );
}
