"use client";

import { useMemo, useState } from "react";
import {
  taxDocuments,
  taxInformationLedger,
  taxInterviewQuestions,
  taxPayroll,
  taxPayrollItems,
  taxPortalAudit,
  taxPortalPro,
  taxPortalTransactions,
  taxPrepPackageParts,
  taxProClients,
  taxProductTiers,
  taxProfile,
  taxSafetyLayers,
  taxSmartAlerts,
} from "@/lib/atlas-platform";

function tone(status: string) {
  if (
    status === "Collected" ||
    status === "Approved" ||
    status === "Tracked" ||
    status === "Authorized" ||
    status === "Exported" ||
    status === "Yes" ||
    status === "Acked" ||
    status === "Pro approved"
  ) {
    return "ok";
  }
  if (
    status === "Missing" ||
    status === "Partial" ||
    status === "Needs correction" ||
    status === "Docs requested" ||
    status === "Due soon" ||
    status === "Upcoming" ||
    status === "In progress" ||
    status === "Warn" ||
    status === "Action" ||
    status === "No" ||
    status === "Staged" ||
    status === "Needs review" ||
    status === "Interview open" ||
    status === "Docs missing"
  ) {
    return "warn";
  }
  return "";
}

function Badge({ status }: { status: string }) {
  const t = tone(status);
  return <span className={`badge${t === "ok" ? " ok" : t === "warn" ? " warn" : ""}`}>{status}</span>;
}

export function TaxSafetyBanner() {
  return (
    <div className="tax-safety-banner">
      <div className="tax-safety-banner-head">
        <strong>Safety design</strong>
        <span>
          {taxProfile.taxYear} · {taxProfile.filingStatus} · {taxProfile.businessStructure} ·{" "}
          {taxProfile.state}
        </span>
      </div>
      <p className="tax-safety-disclaimer">{taxProfile.disclaimer}</p>
      <div className="tax-source-row">
        {taxSafetyLayers.map((layer) => (
          <span
            key={layer.id}
            className={`tax-source-chip tax-source-${layer.id}`}
            title={layer.meaning}
          >
            {layer.label}
          </span>
        ))}
      </div>
      <small className="muted-line">Rules: {taxProfile.rulesVersion}</small>
    </div>
  );
}

export function TaxTiersPanel({
  selectedTier,
  setSelectedTier,
  onOpenPro,
  note,
  setNote,
}: {
  selectedTier: string;
  setSelectedTier: (id: string) => void;
  onOpenPro: () => void;
  note: string | null;
  setNote: (value: string | null) => void;
}) {
  const selected = taxProductTiers.find((t) => t.id === selectedTier) ?? taxProductTiers[2];

  return (
    <div className="split">
      <section className="panel">
        <h2>Product tiers</h2>
        <p className="panel-lead">
          Choose the Atlas Tax surface that matches how you earn — or open Tax Pro if you manage
          clients.
        </p>
        <div className="list">
          {taxProductTiers.map((tier) => (
            <button
              key={tier.id}
              type="button"
              className={selectedTier === tier.id ? "compliance-row active" : "compliance-row"}
              onClick={() => {
                setSelectedTier(tier.id);
                setNote(`Viewing ${tier.name}.`);
                if (tier.id === "pro") onOpenPro();
              }}
            >
              <span className={`badge${selectedTier === tier.id ? " ok" : ""}`}>
                {selectedTier === tier.id ? "Selected" : "Tier"}
              </span>
              <div>
                <p>
                  <strong>{tier.name}</strong>
                </p>
                <small className="muted-line">
                  {tier.audience} · {tier.price}
                </small>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{selected.name}</h2>
        <p className="panel-lead">{selected.audience}</p>
        <div className="list">
          {selected.includes.map((item) => (
            <div className="list-row" key={item}>
              <span className="badge ok">Includes</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
        <div className="memory-card" style={{ marginTop: "1rem" }}>
          <div className="label">Safety across every tier</div>
          <p>
            Estimated · AI suggestion · Accountant-reviewed · Officially filed stay labeled.{" "}
            {taxProfile.disclaimer}
          </p>
        </div>
        <div className="train-actions">
          {selected.id === "pro" ? (
            <button className="btn btn-dark" type="button" onClick={onOpenPro}>
              Open Tax Pro dashboard
            </button>
          ) : (
            <button
              className="btn btn-dark"
              type="button"
              onClick={() => setNote(`${selected.name} is active for this demo workspace.`)}
            >
              Use {selected.name.split(" ").slice(-2).join(" ")}
            </button>
          )}
        </div>
        {note ? (
          <p className="muted-line" style={{ marginTop: "0.85rem" }}>
            {note}
          </p>
        ) : null}
      </section>
    </div>
  );
}

export function TaxProPanel({
  note,
  setNote,
}: {
  note: string | null;
  setNote: (value: string | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(taxProClients[0].id);
  const [requested, setRequested] = useState<Record<string, boolean>>({});
  const selected = taxProClients.find((c) => c.id === selectedId) ?? taxProClients[0];

  return (
    <div className="split">
      <section className="panel">
        <h2>Atlas Tax Pro</h2>
        <p className="panel-lead">
          Dashboard for accountants managing multiple Atlas customers — review queues, document
          requests, packages, and audit-ready handoffs.
        </p>
        <div className="list">
          {taxProClients.map((client) => (
            <button
              key={client.id}
              type="button"
              className={selectedId === client.id ? "compliance-row active" : "compliance-row"}
              onClick={() => setSelectedId(client.id)}
            >
              <Badge status={client.status} />
              <div>
                <p>
                  <strong>{client.business}</strong>
                </p>
                <small className="muted-line">
                  {client.tier} · {client.openItems} open · {client.lastActive}
                </small>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{selected.business}</h2>
        <div className="list">
          <div className="list-row">
            <span className="badge">Tier</span>
            <p>{selected.tier}</p>
          </div>
          <div className="list-row">
            <Badge status={selected.status} />
            <p>Client status</p>
          </div>
          <div className="list-row">
            <span className="badge">Package</span>
            <p>{selected.package}</p>
          </div>
          <div className="list-row">
            <span className="badge warn">Open items</span>
            <p>{selected.openItems}</p>
          </div>
        </div>
        <div className="train-actions">
          <button
            className="btn btn-dark"
            type="button"
            onClick={() => {
              setRequested((prev) => ({ ...prev, [selected.id]: true }));
              setNote(`Document request sent to ${selected.business}. Logged on audit trail.`);
            }}
          >
            {requested[selected.id] ? "Request sent" : "Request missing documents"}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() =>
              setNote(
                `Downloaded staged package for ${selected.business}. Client authorization still required before any filing.`,
              )
            }
          >
            Download client package
          </button>
        </div>
        <div className="confirm-card" style={{ marginTop: "1rem" }}>
          <div className="agent-tag">Client authorization</div>
          <p>
            Tax Pro can prepare and review. Atlas will not file for any customer without that
            customer’s explicit authorization.
          </p>
        </div>
        {note ? (
          <p className="muted-line" style={{ marginTop: "0.85rem" }}>
            {note}
          </p>
        ) : null}
      </section>
    </div>
  );
}

export function TaxSafetyLedgerPanel() {
  return (
    <section className="panel">
      <h2>Information sources</h2>
      <p className="panel-lead">
        Every figure is labeled so estimated math, AI suggestions, accountant review, and filed
        facts stay separate.
      </p>
      <div className="list">
        {taxSafetyLayers.map((layer) => (
          <div className="list-row" key={layer.id}>
            <span className={`tax-source-chip tax-source-${layer.id}`}>{layer.label}</span>
            <p>{layer.meaning}</p>
          </div>
        ))}
      </div>
      <h2 style={{ marginTop: "1.25rem" }}>Live ledger</h2>
      <div className="list">
        {taxInformationLedger.map((row) => (
          <div className="list-row" key={row.id}>
            <span
              className={`tax-source-chip tax-source-${
                row.layer === "Estimated"
                  ? "estimated"
                  : row.layer === "AI suggestion"
                    ? "suggestion"
                    : row.layer === "Accountant-reviewed"
                      ? "accountant"
                      : "filed"
              }`}
            >
              {row.layer}
            </span>
            <div>
              <p>
                <strong>{row.item}</strong>
              </p>
              <small className="muted-line">{row.detail}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TaxDocumentsPanel({
  note,
  setNote,
}: {
  note: string | null;
  setNote: (value: string | null) => void;
}) {
  const [docStatus, setDocStatus] = useState<Record<string, string>>({});
  const [packageBuilt, setPackageBuilt] = useState(false);
  const [exports, setExports] = useState<{ pdf: boolean; sheet: boolean }>({
    pdf: false,
    sheet: false,
  });
  const [authorized, setAuthorized] = useState(false);

  const docs = taxDocuments.map((doc) => ({
    ...doc,
    status: docStatus[doc.id] ?? doc.status,
  }));
  const missing = docs.filter((d) => d.status === "Missing" || d.status === "Partial");

  function collect(id: string, name: string) {
    setDocStatus((prev) => ({ ...prev, [id]: "Collected" }));
    setNote(`Collected “${name}” into the Tax Preparation Package.`);
  }

  return (
    <div className="split">
      <section className="panel">
        <h2>Document collection</h2>
        <p className="panel-lead">
          W-2, 1099, business income, mortgage, student loans, health insurance, vehicles, estimated
          payments, receipts, and prior-year returns.
        </p>
        <div className="list">
          {docs.map((doc) => (
            <div className="list-row" key={doc.id}>
              <Badge status={doc.status} />
              <div>
                <p>
                  <strong>{doc.name}</strong>
                </p>
                <small className="muted-line">
                  {doc.kind} · {doc.detail}
                </small>
                {doc.status !== "Collected" ? (
                  <div className="train-actions">
                    <button
                      className="btn btn-dark"
                      type="button"
                      onClick={() => collect(doc.id, doc.name)}
                    >
                      Mark collected
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Tax Preparation Package</h2>
        <p className="panel-lead">
          Atlas builds an accountant-ready package. Nothing is filed until you review and authorize.
        </p>
        <div className="list">
          {taxPrepPackageParts.map((part) => (
            <div className="list-row" key={part.id}>
              <Badge
                status={
                  packageBuilt
                    ? part.id === "pkg-pdf"
                      ? exports.pdf
                        ? "Exported"
                        : "Staged"
                      : part.id === "pkg-xls"
                        ? exports.sheet
                          ? "Exported"
                          : "Staged"
                        : "Staged"
                    : "Partial"
                }
              />
              <div>
                <p>
                  <strong>{part.title}</strong>
                </p>
                <small className="muted-line">{part.detail}</small>
              </div>
            </div>
          ))}
        </div>
        <div className="memory-card" style={{ marginTop: "1rem" }}>
          <div className="label">Missing-document checklist</div>
          <p>
            {missing.length === 0
              ? "All tracked documents collected."
              : missing.map((d) => d.name).join(" · ")}
          </p>
        </div>
        <div className="confirm-card" style={{ marginTop: "1rem" }}>
          <div className="agent-tag">Authorization required</div>
          <p>
            Atlas will never silently submit a tax return. Generate the package, export PDF /
            spreadsheet, then authorize handoff — you stay in control.
          </p>
          <div className="train-actions">
            <button
              className="btn btn-dark"
              type="button"
              onClick={() => {
                setPackageBuilt(true);
                setNote("Tax Preparation Package staged — income, expenses, deductions, mileage, quarterly history, and missing docs.");
              }}
            >
              {packageBuilt ? "Package staged" : "Generate package"}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              disabled={!packageBuilt}
              onClick={() => {
                setExports((prev) => ({ ...prev, pdf: true }));
                setNote("Accountant-ready PDF exported.");
              }}
            >
              {exports.pdf ? "PDF ready" : "Export PDF"}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              disabled={!packageBuilt}
              onClick={() => {
                setExports((prev) => ({ ...prev, sheet: true }));
                setNote("Spreadsheet export ready (income, expenses, mileage).");
              }}
            >
              {exports.sheet ? "Sheet ready" : "Export spreadsheet"}
            </button>
            <button
              className="btn btn-dark"
              type="button"
              disabled={!packageBuilt || authorized}
              onClick={() => {
                setAuthorized(true);
                setNote(
                  "You authorized CPA handoff. Atlas shared the package with your professional — filing still requires your final signature.",
                );
              }}
            >
              {authorized ? "Authorized" : "Authorize handoff"}
            </button>
          </div>
        </div>
        {note ? (
          <p className="muted-line" style={{ marginTop: "0.85rem" }}>
            {note}
          </p>
        ) : null}
      </section>
    </div>
  );
}

export function TaxInterviewPanel({
  note,
  setNote,
}: {
  note: string | null;
  setNote: (value: string | null) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, "Yes" | "No">>({});
  const [index, setIndex] = useState(0);
  const current = taxInterviewQuestions[index] ?? taxInterviewQuestions[0];
  const answered = Object.keys(answers).length;

  function answer(value: "Yes" | "No") {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
    setNote(value === "Yes" ? current.yesFlag : current.noFlag);
    if (index < taxInterviewQuestions.length - 1) {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="split">
      <section className="panel">
        <h2>AI Tax Interview</h2>
        <p className="panel-lead">
          Atlas asks conversational questions, then updates estimates and flags deductions or
          documents.
        </p>
        <div className="confirm-card">
          <div className="agent-tag">
            Question {index + 1} of {taxInterviewQuestions.length}
          </div>
          <p>
            <strong>{current.question}</strong>
          </p>
          <small className="muted-line">{current.hint}</small>
          <div className="train-actions">
            <button className="btn btn-dark" type="button" onClick={() => answer("Yes")}>
              Yes
            </button>
            <button className="btn btn-outline" type="button" onClick={() => answer("No")}>
              No
            </button>
            {index > 0 ? (
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Back
              </button>
            ) : null}
          </div>
        </div>
        {note ? (
          <p className="muted-line" style={{ marginTop: "0.85rem" }}>
            {note}
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Interview impact</h2>
        <p className="panel-lead">
          {answered}/{taxInterviewQuestions.length} answered — estimate and deduction flags refresh
          as you go.
        </p>
        <div className="list">
          {taxInterviewQuestions.map((q) => {
            const ans = answers[q.id];
            return (
              <div className="list-row" key={q.id}>
                <Badge status={ans ?? "Partial"} />
                <div>
                  <p>
                    <strong>{q.question}</strong>
                  </p>
                  <small className="muted-line">
                    {ans ? (ans === "Yes" ? q.yesFlag : q.noFlag) : "Waiting for your answer"}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
        <div className="memory-card" style={{ marginTop: "1rem" }}>
          <div className="label">Estimate note</div>
          <p>
            {answered === 0
              ? "Answer a few questions to refine taxable profit, home-office, equipment, and quarterly estimates."
              : "Interview answers applied — Potential deductions and missing documents updated. Open Estimate or Documents to review."}
          </p>
        </div>
      </section>
    </div>
  );
}

export function TaxPortalPanel({
  note,
  setNote,
}: {
  note: string | null;
  setNote: (value: string | null) => void;
}) {
  const [invited, setInvited] = useState(taxPortalPro.invited);
  const [txStatus, setTxStatus] = useState<Record<string, string>>({});
  const [audit, setAudit] = useState<
    { id: string; when: string; actor: string; action: string; detail: string }[]
  >([...taxPortalAudit]);
  const [reportApproved, setReportApproved] = useState(false);

  const transactions = taxPortalTransactions.map((tx) => ({
    ...tx,
    status: txStatus[tx.id] ?? tx.status,
  }));

  function pushAudit(action: string, detail: string) {
    setAudit((prev) => [
      {
        id: `aud-${Date.now()}`,
        when: "Just now",
        actor: taxPortalPro.name,
        action,
        detail,
      },
      ...prev,
    ]);
  }

  return (
    <div className="split">
      <section className="panel">
        <h2>Tax Professional Portal</h2>
        <p className="panel-lead">
          Securely invite your accountant or tax preparer. They can review, correct, request docs,
          leave notes, approve reports, and download packages — with a full audit trail.
        </p>
        <div className="memory-card">
          <div className="label">{invited ? "Connected professional" : "Invite professional"}</div>
          <p>
            <strong>{taxPortalPro.name}</strong> · {taxPortalPro.firm}
            <br />
            {taxPortalPro.email}
            <br />
            Access: {taxPortalPro.access}
          </p>
        </div>
        <div className="train-actions">
          <button
            className="btn btn-dark"
            type="button"
            onClick={() => {
              setInvited(true);
              pushAudit("Access confirmed", "Portal invite accepted");
              setNote(`Invite active for ${taxPortalPro.email}.`);
            }}
          >
            {invited ? "Invite active" : "Send secure invite"}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            disabled={!invited || reportApproved}
            onClick={() => {
              setReportApproved(true);
              pushAudit("Approved reports", "Deduction + mileage reports approved for package");
              setNote("Professional approved reports. Your authorization is still required to file.");
            }}
          >
            {reportApproved ? "Reports approved" : "Approve reports (pro)"}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            disabled={!invited}
            onClick={() => {
              pushAudit("Downloaded package", "PDF + spreadsheet tax package");
              setNote("Professional downloaded the Tax Preparation Package.");
            }}
          >
            Download package (pro)
          </button>
        </div>

        <h2 style={{ marginTop: "1.25rem" }}>Categorized transactions</h2>
        <div className="list">
          {transactions.map((tx) => (
            <div className="list-row" key={tx.id}>
              <Badge status={tx.status} />
              <div>
                <p>
                  <strong>
                    {tx.merchant} · {tx.amount}
                  </strong>
                </p>
                <small className="muted-line">
                  {tx.category} · {tx.note}
                </small>
                <div style={{ marginTop: "0.35rem" }}>
                  <span
                    className={`tax-source-chip ${
                      tx.status === "Approved"
                        ? "tax-source-accountant"
                        : "tax-source-suggestion"
                    }`}
                  >
                    {tx.status === "Approved" ? "Accountant-reviewed" : "AI suggestion"}
                  </span>
                </div>
                <div className="train-actions">
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setTxStatus((prev) => ({ ...prev, [tx.id]: "Approved" }));
                      pushAudit("Corrected expense", `${tx.merchant} approved`);
                      setNote(`Corrected / approved ${tx.merchant}.`);
                    }}
                  >
                    Correct / approve
                  </button>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setTxStatus((prev) => ({ ...prev, [tx.id]: "Docs requested" }));
                      pushAudit("Requested document", `${tx.merchant} supporting docs`);
                      setNote(`Document requested for ${tx.merchant}.`);
                    }}
                  >
                    Request docs
                  </button>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      pushAudit("Left note", `${tx.merchant}: ${tx.note}`);
                      setNote(`Note left on ${tx.merchant}: ${tx.note}`);
                    }}
                  >
                    Leave note
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {note ? (
          <p className="muted-line" style={{ marginTop: "0.85rem" }}>
            {note}
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Audit trail</h2>
        <p className="panel-lead">Every change is logged. Atlas never files without your review.</p>
        <div className="list">
          {audit.map((row) => (
            <div className="list-row" key={row.id}>
              <span className="badge">{row.action}</span>
              <div>
                <p>
                  <strong>{row.actor}</strong>
                </p>
                <small className="muted-line">
                  {row.when} · {row.detail}
                </small>
              </div>
            </div>
          ))}
        </div>
        <div className="confirm-card" style={{ marginTop: "1rem" }}>
          <div className="agent-tag">Filing guardrail</div>
          <p>
            Professionals can prepare and approve reports. Only you can authorize submission — Atlas
            will not silently e-file.
          </p>
        </div>
      </section>
    </div>
  );
}

export function TaxPayrollPanel({
  note,
  setNote,
}: {
  note: string | null;
  setNote: (value: string | null) => void;
}) {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="split">
      <section className="panel">
        <h2>{taxPayroll.addon}</h2>
        <p className="panel-lead">{taxPayroll.blurb}</p>
        <div className="stat-grid metrics-dense">
          <div className="stat">
            <span>Employee wages</span>
            <strong>{taxPayroll.wagesYtd}</strong>
            <small>YTD</small>
          </div>
          <div className="stat">
            <span>Withholding</span>
            <strong>{taxPayroll.withholdingYtd}</strong>
            <small>Employee payroll tax</small>
          </div>
          <div className="stat">
            <span>Employer taxes</span>
            <strong>{taxPayroll.employerTaxes}</strong>
            <small>Next: {taxPayroll.nextDeadline}</small>
          </div>
          <div className="stat">
            <span>Sales tax due</span>
            <strong>{taxPayroll.salesTaxDue}</strong>
            <small>Collected {taxPayroll.salesTaxCollected}</small>
          </div>
        </div>
        <div className="confirm-card" style={{ marginTop: "1rem" }}>
          <div className="agent-tag">Paid add-on</div>
          <p>
            Enable <strong>Atlas Payroll & Tax</strong> to track wages, withholding, employer taxes,
            contractor payments, W-2 / 1099 prep, payroll filing deadlines, and sales-tax
            obligations.
          </p>
          <div className="train-actions">
            <button
              className="btn btn-dark"
              type="button"
              onClick={() => {
                setEnabled(true);
                setNote("Atlas Payroll & Tax enabled for this business (demo). Tracking is live.");
              }}
            >
              {enabled ? "Add-on enabled" : "Enable Atlas Payroll & Tax"}
            </button>
          </div>
        </div>
        {note ? (
          <p className="muted-line" style={{ marginTop: "0.85rem" }}>
            {note}
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Payroll & sales tax board</h2>
        <div className="list">
          {taxPayrollItems.map((item) => (
            <div className="list-row" key={item.id}>
              <Badge status={enabled && item.status === "Due soon" ? item.status : item.status} />
              <div>
                <p>
                  <strong>
                    {item.label} · {item.value}
                  </strong>
                </p>
                <small className="muted-line">{item.detail}</small>
              </div>
            </div>
          ))}
        </div>
        <div className="memory-card" style={{ marginTop: "1rem" }}>
          <div className="label">Contractors & forms</div>
          <p>
            Contractor payments {taxPayroll.contractorPayments} feed 1099 prep. W-2 drafts stage at
            year-end. Filing deadlines surface as Smart Tax Alerts.
          </p>
        </div>
      </section>
    </div>
  );
}

export function TaxAlertsPanel({
  note,
  setNote,
  onOpen,
}: {
  note: string | null;
  setNote: (value: string | null) => void;
  onOpen?: (target: "quarterly" | "review" | "documents" | "mileage" | "portal" | "estimate") => void;
}) {
  const [acked, setAcked] = useState<Record<string, boolean>>({});
  const openCount = useMemo(
    () => taxSmartAlerts.filter((a) => !acked[a.id]).length,
    [acked],
  );

  function ack(id: string, title: string) {
    setAcked((prev) => ({ ...prev, [id]: true }));
    setNote(`Acknowledged: ${title}`);
  }

  return (
    <div className="training-studio" style={{ gap: "1rem", display: "grid" }}>
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Open alerts</span>
          <strong>{openCount}</strong>
          <small>of {taxSmartAlerts.length} smart alerts</small>
        </div>
      </div>
      <section className="panel">
        <h2>Smart Tax Alerts</h2>
        <p className="panel-lead">
          Documents, deadlines, deductible transactions, savings balance, mileage, income spikes,
          uncategorized items, and accountant requests.
        </p>
        <div className="list">
          {taxSmartAlerts.map((alert) => (
            <div className="list-row" key={alert.id}>
              <Badge status={acked[alert.id] ? "Acked" : alert.severity} />
              <div>
                <p>
                  <strong>{alert.title}</strong>
                </p>
                <small className="muted-line">{alert.detail}</small>
                {!acked[alert.id] ? (
                  <div className="train-actions">
                    <button
                      className="btn btn-dark"
                      type="button"
                      onClick={() => ack(alert.id, alert.title)}
                    >
                      Acknowledge
                    </button>
                    {alert.id === "al-2" ? (
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => onOpen?.("quarterly")}
                      >
                        Open quarterly
                      </button>
                    ) : null}
                    {alert.id === "al-4" ? (
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => onOpen?.("estimate")}
                      >
                        Open estimate
                      </button>
                    ) : null}
                    {alert.id === "al-5" ? (
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => onOpen?.("mileage")}
                      >
                        Open mileage
                      </button>
                    ) : null}
                    {alert.id === "al-7" || alert.id === "al-3" ? (
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => onOpen?.("review")}
                      >
                        Open review
                      </button>
                    ) : null}
                    {alert.id === "al-1" ? (
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => onOpen?.("documents")}
                      >
                        Open documents
                      </button>
                    ) : null}
                    {alert.id === "al-8" ? (
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => onOpen?.("portal")}
                      >
                        Open portal
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {note ? (
          <p className="muted-line" style={{ marginTop: "0.85rem" }}>
            {note}
          </p>
        ) : null}
      </section>
    </div>
  );
}
