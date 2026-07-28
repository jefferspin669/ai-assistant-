"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  TaxAlertsPanel,
  TaxDocumentsPanel,
  TaxInterviewPanel,
  TaxPayrollPanel,
  TaxPortalPanel,
} from "@/components/TaxCenterAdvanced";
import {
  taxCenterReply,
  taxDeductionHints,
  taxEstimate,
  taxExpenses,
  taxFilingChecklist,
  taxIncomeEntries,
  taxIncomeSources,
  taxMileageTrips,
  taxQuarterlyPayments,
  taxSmartAlerts,
} from "@/lib/atlas-platform";

type Mode =
  | "estimate"
  | "income"
  | "expenses"
  | "quarterly"
  | "mileage"
  | "documents"
  | "interview"
  | "portal"
  | "payroll"
  | "alerts"
  | "filing"
  | "sources"
  | "review";

type ExpenseOverride = "Approved" | "Rejected" | "Needs Review" | "Categorized";
type TripClass = "Business" | "Personal" | "Needs Review";
type ChecklistStatus = "Done" | "In progress" | "Not started";

const modes: { id: Mode; label: string }[] = [
  { id: "estimate", label: "Estimate" },
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "quarterly", label: "Quarterly" },
  { id: "mileage", label: "Mileage" },
  { id: "documents", label: "Documents" },
  { id: "interview", label: "Interview" },
  { id: "portal", label: "Portal" },
  { id: "payroll", label: "Payroll" },
  { id: "alerts", label: "Alerts" },
  { id: "filing", label: "Tax-Time" },
  { id: "sources", label: "Sources" },
  { id: "review", label: "Needs Review" },
];

const incomeFilters = ["All", "Business", "Client", "Type"] as const;

function statusTone(status: string) {
  if (
    status === "Categorized" ||
    status === "Connected" ||
    status === "Approved" ||
    status === "User entered" ||
    status === "Business" ||
    status === "Done" ||
    status === "Paid" ||
    status === "On"
  ) {
    return "ok";
  }
  if (
    status === "Needs Review" ||
    status === "Needs auth" ||
    status === "Rejected" ||
    status === "Needs top-up" ||
    status === "Upcoming" ||
    status === "In progress" ||
    status === "Not started" ||
    status === "Personal"
  ) {
    return "warn";
  }
  return "";
}

export function TaxCenterStudio() {
  const [mode, setMode] = useState<Mode>("estimate");
  const [incomeLens, setIncomeLens] = useState<(typeof incomeFilters)[number]>("All");
  const [incomeGroup, setIncomeGroup] = useState<string>("All");
  const [selectedIncomeId, setSelectedIncomeId] = useState<string>(taxIncomeEntries[0].id);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>(
    taxExpenses.find((e) => e.status === "Needs Review")?.id ?? taxExpenses[0].id,
  );
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>(taxQuarterlyPayments[0].id);
  const [selectedTripId, setSelectedTripId] = useState<string>(
    taxMileageTrips.find((t) => t.classification === "Needs Review")?.id ?? taxMileageTrips[0].id,
  );
  const [expenseStatus, setExpenseStatus] = useState<Record<string, ExpenseOverride>>({});
  const [sourceStatus, setSourceStatus] = useState<Record<string, "Connected" | "Needs auth">>({});
  const [tripClass, setTripClass] = useState<Record<string, TripClass>>({});
  const [quarterPaid, setQuarterPaid] = useState<Record<string, string>>({});
  const [checklistStatus, setChecklistStatus] = useState<Record<string, ChecklistStatus>>({});
  const [autosaveOn, setAutosaveOn] = useState(true);
  const [exportedReport, setExportedReport] = useState(false);
  const [uploaded, setUploaded] = useState<
    {
      id: string;
      merchant: string;
      date: string;
      amount: string;
      salesTax: string;
      category: string;
      businessPurpose: string;
      paymentMethod: string;
      deduction: string;
      status: "Needs Review";
      confidence: number;
      receipt: string;
    }[]
  >([]);
  const [note, setNote] = useState<string | null>(null);
  const [ask, setAsk] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "ai",
      text: "I can estimate taxes owed, run quarterly payments, track mileage, and walk filing season. Try: “mark yesterday’s trip to Chicago as business mileage.”",
    },
  ]);

  const expenses = useMemo(() => [...uploaded, ...taxExpenses], [uploaded]);
  const resolvedExpense = (id: string, fallback: string) => expenseStatus[id] ?? fallback;
  const resolvedTrip = (id: string, fallback: TripClass) => tripClass[id] ?? fallback;
  const resolvedChecklist = (id: string, fallback: ChecklistStatus) =>
    checklistStatus[id] ?? fallback;

  const needsReview = expenses.filter((e) => resolvedExpense(e.id, e.status) === "Needs Review");
  const tripReview = taxMileageTrips.filter(
    (t) => resolvedTrip(t.id, t.classification) === "Needs Review",
  );
  const reviewCount =
    needsReview.length +
    taxIncomeEntries.filter((i) => i.status === "Needs Review").length +
    tripReview.length;

  const incomeGroups = useMemo(() => {
    if (incomeLens === "Business") {
      return ["All", ...Array.from(new Set(taxIncomeEntries.map((e) => e.business)))];
    }
    if (incomeLens === "Client") {
      return ["All", ...Array.from(new Set(taxIncomeEntries.map((e) => e.client)))];
    }
    if (incomeLens === "Type") {
      return ["All", ...Array.from(new Set(taxIncomeEntries.map((e) => e.incomeType)))];
    }
    return ["All"];
  }, [incomeLens]);

  const filteredIncome = useMemo(() => {
    if (incomeGroup === "All" || incomeLens === "All") return [...taxIncomeEntries];
    if (incomeLens === "Business") return taxIncomeEntries.filter((e) => e.business === incomeGroup);
    if (incomeLens === "Client") return taxIncomeEntries.filter((e) => e.client === incomeGroup);
    return taxIncomeEntries.filter((e) => e.incomeType === incomeGroup);
  }, [incomeLens, incomeGroup]);

  const selectedIncome =
    taxIncomeEntries.find((e) => e.id === selectedIncomeId) ?? taxIncomeEntries[0];
  const selectedExpense = expenses.find((e) => e.id === selectedExpenseId) ?? expenses[0];
  const selectedQuarter =
    taxQuarterlyPayments.find((q) => q.id === selectedQuarterId) ?? taxQuarterlyPayments[0];
  const selectedTrip = taxMileageTrips.find((t) => t.id === selectedTripId) ?? taxMileageTrips[0];

  const businessMiles = taxMileageTrips
    .filter((t) => resolvedTrip(t.id, t.classification) === "Business")
    .reduce((sum, t) => sum + t.miles, 0);

  const filingDone = taxFilingChecklist.filter(
    (item) => resolvedChecklist(item.id, item.status) === "Done",
  ).length;

  function setLens(lens: (typeof incomeFilters)[number]) {
    setIncomeLens(lens);
    setIncomeGroup("All");
  }

  function approveExpense(id: string, merchant: string) {
    setExpenseStatus((prev) => ({ ...prev, [id]: "Approved" }));
    setNote(`Approved “${merchant}” as a deduction. Atlas will include it in tax prep.`);
  }

  function keepInReview(id: string, merchant: string) {
    setExpenseStatus((prev) => ({ ...prev, [id]: "Needs Review" }));
    setNote(`“${merchant}” stays in Needs Review — Atlas will not claim it automatically.`);
  }

  function rejectExpense(id: string, merchant: string) {
    setExpenseStatus((prev) => ({ ...prev, [id]: "Rejected" }));
    setNote(`Marked “${merchant}” as personal / not deductible.`);
  }

  function connectSource(id: string, name: string) {
    setSourceStatus((prev) => ({ ...prev, [id]: "Connected" }));
    setNote(`${name} connected. Atlas will pull income on the next sync.`);
  }

  function classifyTrip(id: string, next: TripClass, label: string) {
    setTripClass((prev) => ({ ...prev, [id]: next }));
    setNote(
      next === "Business"
        ? `Marked “${label}” as business mileage.`
        : next === "Personal"
          ? `Marked “${label}” as personal — excluded from deductions.`
          : `“${label}” returned to Needs Review.`,
    );
  }

  function markChicagoBusinessFromChat() {
    const chicago = taxMileageTrips.find((t) => t.to.toLowerCase().includes("chicago"));
    if (!chicago) return;
    setTripClass((prev) => ({ ...prev, [chicago.id]: "Business" }));
    setSelectedTripId(chicago.id);
    setMode("mileage");
  }

  function recordQuarterPayment(id: string, amount: string, quarter: string) {
    const confirmation = `IRS-${quarter.replace(/\s+/g, "")}-${Math.floor(Math.random() * 90000 + 10000)}`;
    setQuarterPaid((prev) => ({ ...prev, [id]: confirmation }));
    setNote(
      `Recorded ${amount} for ${quarter}. Confirmation ${confirmation} and receipt saved to Tax Center.`,
    );
  }

  function toggleChecklist(id: string, current: ChecklistStatus, task: string) {
    const next: ChecklistStatus =
      current === "Done" ? "Not started" : current === "In progress" ? "Done" : "In progress";
    setChecklistStatus((prev) => ({ ...prev, [id]: next }));
    setNote(
      next === "Done"
        ? `Completed: ${task}`
        : next === "In progress"
          ? `Started: ${task}`
          : `Reset: ${task}`,
    );
  }

  function simulateUpload() {
    const id = `upload-${Date.now()}`;
    const receipt = {
      id,
      merchant: "Office Depot",
      date: "Mar 19",
      amount: "$54.18",
      salesTax: "$4.06",
      category: "Office supplies",
      businessPurpose: "Paper, binders, shipping labels",
      paymentMethod: "Business debit",
      deduction: "Office supplies",
      status: "Needs Review" as const,
      confidence: 72,
      receipt: "Photo · just now",
    };
    setUploaded((prev) => [receipt, ...prev]);
    setSelectedExpenseId(id);
    setMode("expenses");
    setNote(
      "Receipt scanned: merchant, date, amount, sales tax, category, purpose, and payment method extracted. Marked Needs Review until you confirm.",
    );
  }

  function onAsk(e: FormEvent) {
    e.preventDefault();
    const trimmed = ask.trim();
    if (!trimmed) return;
    const reply = taxCenterReply(trimmed);
    if (
      (trimmed.toLowerCase().includes("chicago") || trimmed.toLowerCase().includes("trip")) &&
      (trimmed.toLowerCase().includes("business") || trimmed.toLowerCase().includes("mileage"))
    ) {
      markChicagoBusinessFromChat();
    }
    setChat((prev) => [...prev, { role: "user", text: trimmed }, { role: "ai", text: reply }]);
    setAsk("");
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Estimated taxes owed</span>
          <strong>{taxEstimate.estimatedOwed}</strong>
          <small>Federal + state + SE − credits</small>
        </div>
        <div className="stat">
          <span>Already saved</span>
          <strong>{taxEstimate.alreadySaved}</strong>
          <small>{taxEstimate.taxSavingsAccount}</small>
        </div>
        <div className="stat">
          <span>Additional recommended</span>
          <strong>{taxEstimate.recommendedSave}</strong>
          <small>Remaining balance {taxEstimate.remainingBalance}</small>
        </div>
        <div className="stat">
          <span>Needs Review</span>
          <strong>{reviewCount}</strong>
          <small>Expenses · income · trips</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Tax Center modes">
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
            {item.id === "review" && reviewCount > 0 ? (
              <span className="hub-tab-count">{reviewCount}</span>
            ) : null}
            {item.id === "quarterly" ? <span className="hub-tab-count">1</span> : null}
            {item.id === "alerts" ? (
              <span className="hub-tab-count">{taxSmartAlerts.length}</span>
            ) : null}
            {item.id === "documents" ? <span className="hub-tab-count">3</span> : null}
          </button>
        ))}
      </div>

      {mode === "estimate" ? (
        <div className="split">
          <section className="panel">
            <h2>Tax estimate dashboard</h2>
            <p className="panel-lead">
              Live view of income, expenses, taxable profit, and what you still need to set aside.
              Recalculated {taxEstimate.lastRecalc}.
            </p>
            <div className="list">
              <div className="list-row">
                <span className="badge">Income</span>
                <p>
                  <strong>{taxEstimate.totalIncome}</strong>
                  <small className="muted-line"> Total income YTD</small>
                </p>
              </div>
              <div className="list-row">
                <span className="badge">Expenses</span>
                <p>
                  <strong>{taxEstimate.businessExpenses}</strong>
                  <small className="muted-line"> Business expenses</small>
                </p>
              </div>
              <div className="list-row">
                <span className="badge ok">Profit</span>
                <p>
                  <strong>{taxEstimate.taxableProfit}</strong>
                  <small className="muted-line"> Estimated taxable profit</small>
                </p>
              </div>
              <div className="list-row">
                <span className="badge">Federal</span>
                <p>{taxEstimate.federalTax} estimated federal tax</p>
              </div>
              <div className="list-row">
                <span className="badge">State</span>
                <p>{taxEstimate.stateTax} estimated state tax</p>
              </div>
              <div className="list-row">
                <span className="badge">SE tax</span>
                <p>{taxEstimate.selfEmploymentTax} self-employment tax</p>
              </div>
              <div className="list-row">
                <span className="badge ok">Credits</span>
                <p>{taxEstimate.taxCredits} estimated tax credits</p>
              </div>
              <div className="list-row">
                <span className="badge">Paid</span>
                <p>{taxEstimate.taxesPaid} taxes already paid / saved</p>
              </div>
              <div className="list-row">
                <span className="badge warn">Remaining</span>
                <p>
                  <strong>{taxEstimate.remainingBalance}</strong> estimated remaining balance
                </p>
              </div>
            </div>
            <div className="confirm-card" style={{ marginTop: "1rem" }}>
              <div className="agent-tag">Savings plan</div>
              <p>
                Estimated taxes owed: <strong>{taxEstimate.estimatedOwed}</strong>
                <br />
                Already saved: <strong>{taxEstimate.alreadySaved}</strong>
                <br />
                Additional amount recommended: <strong>{taxEstimate.recommendedSave}</strong>
              </p>
              <div className="train-actions">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => {
                    setNote(
                      `Queued transfer of ${taxEstimate.recommendedSave} to ${taxEstimate.taxSavingsAccount}.`,
                    );
                  }}
                >
                  Move {taxEstimate.recommendedSave} to tax savings
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setMode("quarterly")}>
                  Open quarterly assistant
                </button>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Auto tax savings</h2>
            <p className="panel-lead">
              Atlas can move a percentage of each payment into a separate tax savings account.
            </p>
            <div className="memory-card">
              <div className="label">Recommendation</div>
              <p>
                Set aside <strong>{taxEstimate.autosavePercent}%</strong> of each customer payment
                into <strong>{taxEstimate.taxSavingsAccount}</strong> so quarterly estimates stay
                funded.
              </p>
            </div>
            <div className="list" style={{ marginTop: "1rem" }}>
              <div className="list-row">
                <span className={`badge${autosaveOn ? " ok" : " warn"}`}>
                  {autosaveOn ? "On" : "Off"}
                </span>
                <p>Auto-move {taxEstimate.autosavePercent}% of each payment</p>
              </div>
              <div className="list-row">
                <span className="badge">Account</span>
                <p>{taxEstimate.taxSavingsAccount}</p>
              </div>
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => {
                  setAutosaveOn(true);
                  setNote(
                    `Autosave on — ${taxEstimate.autosavePercent}% of each payment moves to tax savings.`,
                  );
                }}
              >
                Enable autosave
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setAutosaveOn(false);
                  setNote("Autosave paused. You can still move funds manually.");
                }}
              >
                Pause
              </button>
            </div>
            <div className="chat-mock" style={{ marginTop: "1rem", minHeight: 160 }}>
              {chat.slice(-4).map((bubble, i) => (
                <div
                  className={`bubble ${bubble.role === "user" ? "bubble-user" : "bubble-ai"}`}
                  key={`${bubble.role}-${i}`}
                >
                  {bubble.text}
                </div>
              ))}
            </div>
            <form className="train-form" onSubmit={onAsk}>
              <input
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                placeholder="Ask about estimates, mileage, or quarterly taxes…"
                aria-label="Ask Tax Center"
              />
              <button className="btn btn-dark" type="submit">
                Ask
              </button>
            </form>
            {note ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                {note}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "income" ? (
        <div className="split">
          <section className="panel">
            <h2>Automatic income tracking</h2>
            <p className="panel-lead">
              Organized by business, job, client, and income type — from banks, payroll, processors,
              accounting, Atlas invoices, 1099, and W-2 entries.
            </p>
            <div className="quality-filter-row">
              {incomeFilters.map((lens) => (
                <button
                  key={lens}
                  type="button"
                  className={incomeLens === lens ? "training-tab active" : "training-tab"}
                  onClick={() => setLens(lens)}
                >
                  {lens === "All" ? "All income" : `By ${lens.toLowerCase()}`}
                </button>
              ))}
            </div>
            {incomeLens !== "All" ? (
              <div className="quality-filter-row" style={{ marginTop: "0.55rem" }}>
                {incomeGroups.map((group) => (
                  <button
                    key={group}
                    type="button"
                    className={incomeGroup === group ? "training-tab active" : "training-tab"}
                    onClick={() => setIncomeGroup(group)}
                  >
                    {group}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="list" style={{ marginTop: "0.9rem" }}>
              {filteredIncome.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={
                    selectedIncomeId === entry.id ? "compliance-row active" : "compliance-row"
                  }
                  onClick={() => setSelectedIncomeId(entry.id)}
                >
                  <span
                    className={`badge${statusTone(entry.status) === "ok" ? " ok" : statusTone(entry.status) === "warn" ? " warn" : ""}`}
                  >
                    {entry.status}
                  </span>
                  <div>
                    <p>
                      <strong>
                        {entry.amount} · {entry.client === "—" ? entry.job : entry.client}
                      </strong>
                    </p>
                    <small className="muted-line">
                      {entry.business} · {entry.incomeType} · {entry.source} · {entry.date}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>{selectedIncome.job}</h2>
            <p className="panel-lead">
              {selectedIncome.amount} on {selectedIncome.date}
            </p>
            <div className="list">
              <div className="list-row">
                <span className="badge">Business</span>
                <p>{selectedIncome.business}</p>
              </div>
              <div className="list-row">
                <span className="badge">Client</span>
                <p>{selectedIncome.client}</p>
              </div>
              <div className="list-row">
                <span className="badge">Type</span>
                <p>{selectedIncome.incomeType}</p>
              </div>
              <div className="list-row">
                <span className="badge">Source</span>
                <p>{selectedIncome.source}</p>
              </div>
              <div className="list-row">
                <span
                  className={`badge${statusTone(selectedIncome.status) === "ok" ? " ok" : statusTone(selectedIncome.status) === "warn" ? " warn" : ""}`}
                >
                  {selectedIncome.status}
                </span>
                <p>Classification</p>
              </div>
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Atlas note</div>
              <p>
                {selectedIncome.status === "Needs Review"
                  ? "P2P payment matched to a job with medium confidence. Confirm client and income type before filing."
                  : selectedIncome.incomeType === "W-2"
                    ? "W-2 wages entered by you — kept under Personal and excluded from business revenue totals where appropriate."
                    : "Synced automatically and tagged to business, job, client, and income type. Estimates recalculate when income changes."}
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {mode === "expenses" ? (
        <div className="split">
          <section className="panel">
            <h2>Expense & deduction tracking</h2>
            <p className="panel-lead">
              Photograph or upload receipts. Atlas extracts merchant, date, amount, sales tax,
              category, business purpose, and payment method — then suggests deductions.
            </p>
            <div className="train-actions" style={{ marginTop: 0, marginBottom: "0.85rem" }}>
              <button className="btn btn-dark" type="button" onClick={simulateUpload}>
                Upload / photograph receipt
              </button>
            </div>
            <div className="list">
              {expenses.map((expense) => {
                const status = resolvedExpense(expense.id, expense.status);
                return (
                  <button
                    key={expense.id}
                    type="button"
                    className={
                      selectedExpenseId === expense.id
                        ? "compliance-row active"
                        : "compliance-row"
                    }
                    onClick={() => setSelectedExpenseId(expense.id)}
                  >
                    <span
                      className={`badge${statusTone(status) === "ok" ? " ok" : statusTone(status) === "warn" ? " warn" : ""}`}
                    >
                      {status}
                    </span>
                    <div>
                      <p>
                        <strong>
                          {expense.merchant} · {expense.amount}
                        </strong>
                      </p>
                      <small className="muted-line">
                        {expense.deduction} · {expense.date} · {expense.confidence}% confidence
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>{selectedExpense.merchant}</h2>
            <p className="panel-lead">Extracted from {selectedExpense.receipt}</p>
            <div className="list">
              <div className="list-row">
                <span className="badge">Date</span>
                <p>{selectedExpense.date}</p>
              </div>
              <div className="list-row">
                <span className="badge">Amount</span>
                <p>{selectedExpense.amount}</p>
              </div>
              <div className="list-row">
                <span className="badge">Sales tax</span>
                <p>{selectedExpense.salesTax}</p>
              </div>
              <div className="list-row">
                <span className="badge">Category</span>
                <p>{selectedExpense.category}</p>
              </div>
              <div className="list-row">
                <span className="badge">Purpose</span>
                <p>{selectedExpense.businessPurpose}</p>
              </div>
              <div className="list-row">
                <span className="badge">Paid with</span>
                <p>{selectedExpense.paymentMethod}</p>
              </div>
              <div className="list-row">
                <span className="badge ok">Deduction</span>
                <p>{selectedExpense.deduction}</p>
              </div>
              <div className="list-row">
                <span
                  className={`badge${statusTone(resolvedExpense(selectedExpense.id, selectedExpense.status)) === "ok" ? " ok" : " warn"}`}
                >
                  {resolvedExpense(selectedExpense.id, selectedExpense.status)}
                </span>
                <p>{selectedExpense.confidence}% extraction confidence</p>
              </div>
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Possible deductions Atlas watches</div>
              <p>{taxDeductionHints.join(" · ")}</p>
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => approveExpense(selectedExpense.id, selectedExpense.merchant)}
                disabled={resolvedExpense(selectedExpense.id, selectedExpense.status) === "Approved"}
              >
                Approve deduction
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => keepInReview(selectedExpense.id, selectedExpense.merchant)}
              >
                Keep Needs Review
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => rejectExpense(selectedExpense.id, selectedExpense.merchant)}
              >
                Not deductible
              </button>
            </div>
            {note ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                {note}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "quarterly" ? (
        <div className="split">
          <section className="panel">
            <h2>Quarterly tax assistant</h2>
            <p className="panel-lead">
              Estimated payments for self-employed owners — track what’s paid, warn before
              deadlines, and recalculate when income changes.
            </p>
            <div className="list">
              {taxQuarterlyPayments.map((q) => {
                const confirmation = quarterPaid[q.id];
                const status = confirmation ? "Paid" : q.status;
                return (
                  <button
                    key={q.id}
                    type="button"
                    className={
                      selectedQuarterId === q.id ? "compliance-row active" : "compliance-row"
                    }
                    onClick={() => setSelectedQuarterId(q.id)}
                  >
                    <span
                      className={`badge${statusTone(status) === "ok" ? " ok" : statusTone(status) === "warn" ? " warn" : ""}`}
                    >
                      {status}
                    </span>
                    <div>
                      <p>
                        <strong>
                          {q.quarter} · {q.revisedEstimate}
                        </strong>
                      </p>
                      <small className="muted-line">
                        Due {q.due} · Paid {confirmation ? q.revisedEstimate : q.paid}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>{selectedQuarter.quarter}</h2>
            {selectedQuarter.alert ? (
              <div className="confirm-card" style={{ marginBottom: "1rem" }}>
                <div className="agent-tag">Alert</div>
                <p>{selectedQuarter.alert}</p>
              </div>
            ) : null}
            <div className="list">
              <div className="list-row">
                <span className="badge">Original</span>
                <p>{selectedQuarter.originalEstimate}</p>
              </div>
              <div className="list-row">
                <span className="badge warn">Revised</span>
                <p>{selectedQuarter.revisedEstimate}</p>
              </div>
              <div className="list-row">
                <span className="badge">Paid so far</span>
                <p>{quarterPaid[selectedQuarter.id] ? selectedQuarter.revisedEstimate : selectedQuarter.paid}</p>
              </div>
              <div className="list-row">
                <span className="badge">Due</span>
                <p>{selectedQuarter.due}</p>
              </div>
              <div className="list-row">
                <span className="badge">Confirmation</span>
                <p>{quarterPaid[selectedQuarter.id] ?? selectedQuarter.confirmation}</p>
              </div>
              <div className="list-row">
                <span className="badge">Receipt</span>
                <p>
                  {quarterPaid[selectedQuarter.id]
                    ? "Saved · just now"
                    : selectedQuarter.receipt}
                </p>
              </div>
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Payment instructions</div>
              <p>{selectedQuarter.instructions}</p>
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                disabled={Boolean(quarterPaid[selectedQuarter.id])}
                onClick={() => {
                  const remaining =
                    selectedQuarter.status === "Needs top-up"
                      ? "$450"
                      : selectedQuarter.revisedEstimate;
                  recordQuarterPayment(
                    selectedQuarter.id,
                    remaining,
                    selectedQuarter.quarter,
                  );
                }}
              >
                {quarterPaid[selectedQuarter.id] ? "Payment saved" : "Generate & record payment"}
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() =>
                  setNote(
                    `Recalculated ${selectedQuarter.quarter} from latest income — estimate remains ${selectedQuarter.revisedEstimate}.`,
                  )
                }
              >
                Recalculate from income
              </button>
            </div>
            {note ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                {note}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "mileage" ? (
        <div className="split">
          <section className="panel">
            <h2>Mileage tracker</h2>
            <p className="panel-lead">
              Automatic trip detection for contractors, delivery drivers, and owners — classify
              business vs personal, log purpose, and export reports.
            </p>
            <div className="stat-grid metrics-dense" style={{ marginBottom: "0.9rem" }}>
              <div className="stat">
                <span>Business miles</span>
                <strong>{businessMiles.toFixed(1)}</strong>
                <small>YTD classified business</small>
              </div>
              <div className="stat">
                <span>Trips logged</span>
                <strong>{taxMileageTrips.length}</strong>
                <small>{tripReview.length} need review</small>
              </div>
            </div>
            <div className="list">
              {taxMileageTrips.map((trip) => {
                const classification = resolvedTrip(trip.id, trip.classification);
                return (
                  <button
                    key={trip.id}
                    type="button"
                    className={
                      selectedTripId === trip.id ? "compliance-row active" : "compliance-row"
                    }
                    onClick={() => setSelectedTripId(trip.id)}
                  >
                    <span
                      className={`badge${statusTone(classification) === "ok" ? " ok" : statusTone(classification) === "warn" ? " warn" : ""}`}
                    >
                      {classification}
                    </span>
                    <div>
                      <p>
                        <strong>
                          {trip.to} · {trip.miles} mi
                        </strong>
                      </p>
                      <small className="muted-line">
                        {trip.date} · {trip.from} → {trip.to} · {trip.detection}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>
              {selectedTrip.from} → {selectedTrip.to}
            </h2>
            <p className="panel-lead">
              {selectedTrip.miles} miles · {selectedTrip.detection}
            </p>
            <div className="list">
              <div className="list-row">
                <span className="badge">Date</span>
                <p>{selectedTrip.date}</p>
              </div>
              <div className="list-row">
                <span className="badge">Start</span>
                <p>{selectedTrip.from}</p>
              </div>
              <div className="list-row">
                <span className="badge">End</span>
                <p>{selectedTrip.to}</p>
              </div>
              <div className="list-row">
                <span className="badge">Purpose</span>
                <p>{selectedTrip.purpose}</p>
              </div>
              <div className="list-row">
                <span className="badge">Vehicle</span>
                <p>{selectedTrip.vehicle}</p>
              </div>
              <div className="list-row">
                <span className="badge">Expense</span>
                <p>{selectedTrip.expense} vehicle expense estimate</p>
              </div>
              <div className="list-row">
                <span
                  className={`badge${statusTone(resolvedTrip(selectedTrip.id, selectedTrip.classification)) === "ok" ? " ok" : " warn"}`}
                >
                  {resolvedTrip(selectedTrip.id, selectedTrip.classification)}
                </span>
                <p>Classification</p>
              </div>
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                onClick={() =>
                  classifyTrip(selectedTrip.id, "Business", `${selectedTrip.to} trip`)
                }
              >
                Mark business
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() =>
                  classifyTrip(selectedTrip.id, "Personal", `${selectedTrip.to} trip`)
                }
              >
                Mark personal
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setExportedReport(true);
                  setNote(
                    `Mileage report exported — ${businessMiles.toFixed(1)} business miles with start/end, purpose, and vehicle expense.`,
                  );
                }}
              >
                {exportedReport ? "Report exported" : "Export mileage report"}
              </button>
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Voice / chat</div>
              <p>
                “Atlas, mark yesterday’s trip to Chicago as business mileage.” — Atlas will
                reclassify the auto-detected trip and update deductions.
              </p>
            </div>
            <form className="train-form" onSubmit={onAsk}>
              <input
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                placeholder="Atlas, mark yesterday’s trip to Chicago as business mileage."
                aria-label="Mileage command"
              />
              <button className="btn btn-dark" type="submit">
                Say it
              </button>
            </form>
            {note ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                {note}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "documents" ? <TaxDocumentsPanel note={note} setNote={setNote} /> : null}

      {mode === "interview" ? <TaxInterviewPanel note={note} setNote={setNote} /> : null}

      {mode === "portal" ? <TaxPortalPanel note={note} setNote={setNote} /> : null}

      {mode === "payroll" ? <TaxPayrollPanel note={note} setNote={setNote} /> : null}

      {mode === "alerts" ? (
        <TaxAlertsPanel
          note={note}
          setNote={setNote}
          onOpen={(target) => setMode(target)}
        />
      ) : null}

      {mode === "filing" ? (
        <div className="split">
          <section className="panel">
            <h2>Tax-Time Mode</h2>
            <p className="panel-lead">
              When filing season arrives, Atlas guides you through a structured checklist — nothing
              gets skipped.
            </p>
            <div className="stat-grid metrics-dense" style={{ marginBottom: "0.9rem" }}>
              <div className="stat">
                <span>Checklist</span>
                <strong>
                  {filingDone}/{taxFilingChecklist.length}
                </strong>
                <small>Steps complete</small>
              </div>
            </div>
            <div className="list">
              {taxFilingChecklist.map((item) => {
                const status = resolvedChecklist(item.id, item.status);
                return (
                  <div className="list-row" key={item.id}>
                    <span
                      className={`badge${statusTone(status) === "ok" ? " ok" : statusTone(status) === "warn" ? " warn" : ""}`}
                    >
                      {status}
                    </span>
                    <div>
                      <p>
                        <strong>{item.task}</strong>
                      </p>
                      <small className="muted-line">{item.detail}</small>
                      <div className="train-actions">
                        <button
                          className="btn btn-dark"
                          type="button"
                          onClick={() => toggleChecklist(item.id, status, item.task)}
                        >
                          {status === "Done"
                            ? "Reopen"
                            : status === "In progress"
                              ? "Mark done"
                              : "Start"}
                        </button>
                        {item.id === "file-3" ? (
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => {
                              setExportedReport(true);
                              setChecklistStatus((prev) => ({ ...prev, [item.id]: "Done" }));
                              setMode("mileage");
                              setNote("Opened Mileage Tracker to export the report.");
                            }}
                          >
                            Open mileage
                          </button>
                        ) : null}
                        {item.id === "file-1" ? (
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => setMode("review")}
                          >
                            Open review
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>Filing season guide</h2>
            <div className="memory-card">
              <div className="label">Atlas walks you through</div>
              <p>
                Confirm income → clear Needs Review → export mileage → attach quarterly receipts →
                home-office worksheet → generate CPA package → file or hand off.
              </p>
            </div>
            <div className="confirm-card" style={{ marginTop: "1rem" }}>
              <div className="agent-tag">Next up</div>
              <p>
                {taxFilingChecklist.find(
                  (item) => resolvedChecklist(item.id, item.status) !== "Done",
                )?.task ?? "All checklist items complete — ready to file or hand off."}
              </p>
              <div className="train-actions">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => {
                    const next = taxFilingChecklist.find(
                      (item) => resolvedChecklist(item.id, item.status) !== "Done",
                    );
                    if (!next) {
                      setNote("Checklist complete. Atlas staged the e-file / CPA handoff packet.");
                      return;
                    }
                    toggleChecklist(
                      next.id,
                      resolvedChecklist(next.id, next.status),
                      next.task,
                    );
                  }}
                >
                  Advance next step
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
      ) : null}

      {mode === "sources" ? (
        <div className="split">
          <section className="panel">
            <h2>Income sources</h2>
            <p className="panel-lead">
              Business and personal banks, payroll, Stripe, Square, PayPal, Venmo, Cash App,
              accounting platforms, Atlas invoices, contractor 1099, and W-2 income you enter.
            </p>
            <div className="list">
              {taxIncomeSources.map((source) => {
                const status = sourceStatus[source.id] ?? source.status;
                return (
                  <div className="list-row" key={source.id}>
                    <span
                      className={`badge${statusTone(status) === "ok" ? " ok" : statusTone(status) === "warn" ? " warn" : ""}`}
                    >
                      {status}
                    </span>
                    <div>
                      <p>
                        <strong>{source.name}</strong>
                      </p>
                      <small className="muted-line">
                        {source.kind} · Last sync {source.lastSync}
                      </small>
                      {status === "Needs auth" ? (
                        <div className="train-actions">
                          <button
                            className="btn btn-dark"
                            type="button"
                            onClick={() => connectSource(source.id, source.name)}
                          >
                            Connect
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>Ask Tax Center</h2>
            <div className="chat-mock">
              {chat.map((bubble, i) => (
                <div
                  className={`bubble ${bubble.role === "user" ? "bubble-user" : "bubble-ai"}`}
                  key={`${bubble.role}-${i}`}
                >
                  {bubble.text}
                </div>
              ))}
            </div>
            <form className="train-form" onSubmit={onAsk}>
              <input
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                placeholder="Ask about estimates, quarterly taxes, or mileage…"
                aria-label="Ask Tax Center"
              />
              <button className="btn btn-dark" type="submit">
                Ask
              </button>
            </form>
            {note ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                {note}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "review" ? (
        <section className="panel">
          <h2>Needs Review</h2>
          <p className="panel-lead">
            Uncertain expenses and trips are never claimed automatically. Confirm, split, or reject
            before tax prep.
          </p>
          <div className="list">
            {needsReview.length === 0 && tripReview.length === 0 ? (
              <div className="list-row">
                <span className="badge ok">Clear</span>
                <p>No uncertain expenses or trips — nice work.</p>
              </div>
            ) : null}
            {needsReview.map((expense) => (
              <div className="list-row" key={expense.id}>
                <span className="badge warn">Needs Review</span>
                <div>
                  <p>
                    <strong>
                      {expense.merchant} · {expense.amount}
                    </strong>
                  </p>
                  <small className="muted-line">
                    Suggested: {expense.deduction} · {expense.confidence}% confidence ·{" "}
                    {expense.businessPurpose}
                  </small>
                  <div className="train-actions">
                    <button
                      className="btn btn-dark"
                      type="button"
                      onClick={() => {
                        setSelectedExpenseId(expense.id);
                        setMode("expenses");
                      }}
                    >
                      Open expense
                    </button>
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => approveExpense(expense.id, expense.merchant)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => rejectExpense(expense.id, expense.merchant)}
                    >
                      Not deductible
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {tripReview.map((trip) => (
              <div className="list-row" key={trip.id}>
                <span className="badge warn">Needs Review</span>
                <div>
                  <p>
                    <strong>
                      Trip · {trip.to} · {trip.miles} mi
                    </strong>
                  </p>
                  <small className="muted-line">
                    {trip.date} · {trip.purpose} · {trip.detection}
                  </small>
                  <div className="train-actions">
                    <button
                      className="btn btn-dark"
                      type="button"
                      onClick={() => {
                        setSelectedTripId(trip.id);
                        setMode("mileage");
                      }}
                    >
                      Open trip
                    </button>
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => classifyTrip(trip.id, "Business", `${trip.to} trip`)}
                    >
                      Mark business
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {taxIncomeEntries
              .filter((entry) => entry.status === "Needs Review")
              .map((entry) => (
                <div className="list-row" key={entry.id}>
                  <span className="badge warn">Needs Review</span>
                  <div>
                    <p>
                      <strong>
                        Income · {entry.amount} · {entry.client}
                      </strong>
                    </p>
                    <small className="muted-line">
                      {entry.source} · {entry.incomeType} · {entry.job}
                    </small>
                    <div className="train-actions">
                      <button
                        className="btn btn-dark"
                        type="button"
                        onClick={() => {
                          setSelectedIncomeId(entry.id);
                          setMode("income");
                        }}
                      >
                        Open income
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
      ) : null}
    </div>
  );
}
