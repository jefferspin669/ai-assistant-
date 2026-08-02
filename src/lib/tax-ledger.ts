export type TaxTxnKind = "income" | "expense";

export type TaxTransaction = {
  id: string;
  kind: TaxTxnKind;
  label: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
  receiptName: string | null;
  createdAt: string;
};

export type TaxEstimateBreakdown = {
  grossIncome: number;
  expenses: number;
  taxableProfit: number;
  federal: number;
  state: number;
  selfEmployment: number;
  totalEstimated: number;
  effectiveRate: number;
};

const STORAGE_KEY = "atlas-tax-ledger-v1";

/** Demo planning rates — not legal advice. */
const FEDERAL_RATE = 0.22;
const STATE_RATE = 0.05;
const SE_RATE = 0.153;

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `tax-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function seedTaxTransactions(now = new Date()): TaxTransaction[] {
  const d = (offset: number, label: string, kind: TaxTxnKind, amount: number, category: string) => {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    return {
      id: newId(),
      kind,
      label,
      amount,
      category,
      date: date.toISOString().slice(0, 10),
      notes: "",
      receiptName: null as string | null,
      createdAt: nowIso(),
    };
  };
  return [
    d(-40, "Johnson Construction · invoice #1042", "income", 4200, "Service income"),
    d(-28, "HomeBase pilot deposit", "income", 1500, "Service income"),
    d(-21, "Parts · Apex Supply", "expense", 380, "Supplies"),
    d(-14, "Internet & phone", "expense", 129, "Utilities"),
    d(-10, "Truck fuel", "expense", 214, "Vehicle"),
    d(-5, "CallbackFlow consulting hours", "income", 2800, "Service income"),
    d(-2, "Software subscriptions", "expense", 96, "Software"),
  ];
}

export function loadTaxTransactions(): TaxTransaction[] {
  if (typeof window === "undefined") return seedTaxTransactions();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedTaxTransactions();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as TaxTransaction[];
    return Array.isArray(parsed) && parsed.length ? parsed : seedTaxTransactions();
  } catch {
    return seedTaxTransactions();
  }
}

export function saveTaxTransactions(rows: TaxTransaction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function createTaxTransaction(input: {
  kind: TaxTxnKind;
  label: string;
  amount: number;
  category: string;
  date?: string;
  notes?: string;
  receiptName?: string | null;
}): TaxTransaction {
  return {
    id: newId(),
    kind: input.kind,
    label: input.label.trim() || (input.kind === "income" ? "Income" : "Expense"),
    amount: Math.max(0, Number(input.amount) || 0),
    category: input.category.trim() || "General",
    date: input.date || new Date().toISOString().slice(0, 10),
    notes: (input.notes || "").trim(),
    receiptName: input.receiptName ?? null,
    createdAt: nowIso(),
  };
}

export function removeTaxTransaction(rows: TaxTransaction[], id: string) {
  return rows.filter((row) => row.id !== id);
}

export function computeTaxEstimate(rows: TaxTransaction[]): TaxEstimateBreakdown {
  const grossIncome = rows
    .filter((r) => r.kind === "income")
    .reduce((sum, r) => sum + r.amount, 0);
  const expenses = rows
    .filter((r) => r.kind === "expense")
    .reduce((sum, r) => sum + r.amount, 0);
  const taxableProfit = Math.max(0, grossIncome - expenses);
  const federal = Math.round(taxableProfit * FEDERAL_RATE);
  const state = Math.round(taxableProfit * STATE_RATE);
  const selfEmployment = Math.round(taxableProfit * SE_RATE);
  const totalEstimated = federal + state + selfEmployment;
  const effectiveRate = taxableProfit > 0 ? Math.round((totalEstimated / taxableProfit) * 1000) / 10 : 0;
  return {
    grossIncome,
    expenses,
    taxableProfit,
    federal,
    state,
    selfEmployment,
    totalEstimated,
    effectiveRate,
  };
}

export function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
