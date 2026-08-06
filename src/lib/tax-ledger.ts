export type TaxTxnKind = "income" | "expense";
export type TaxBucket = "business" | "personal";

export type TaxTransaction = {
  id: string;
  kind: TaxTxnKind;
  bucket?: TaxBucket;
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
  businessExpenses: number;
  personalExpenses: number;
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
  const d = (
    offset: number,
    label: string,
    kind: TaxTxnKind,
    amount: number,
    category: string,
    bucket: TaxBucket = "business",
  ) => {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    return {
      id: newId(),
      kind,
      bucket,
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
    d(-3, "Home office supplies", "expense", 48, "Office", "personal"),
  ];
}

function normalizeRow(row: TaxTransaction): TaxTransaction {
  return {
    ...row,
    bucket: row.bucket === "personal" ? "personal" : "business",
  };
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
    if (!Array.isArray(parsed) || !parsed.length) return seedTaxTransactions();
    return parsed.map(normalizeRow);
  } catch {
    return seedTaxTransactions();
  }
}

export function saveTaxTransactions(rows: TaxTransaction[]) {
  if (typeof window === "undefined") return;
  const normalized = rows.map(normalizeRow);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  void import("@/lib/backend/client").then(({ pushWorkspace }) => pushWorkspace("tax", normalized));
}

export async function hydrateTaxTransactions(): Promise<TaxTransaction[]> {
  if (typeof window === "undefined") return seedTaxTransactions();
  try {
    const { pullWorkspace } = await import("@/lib/backend/client");
    const remote = await pullWorkspace<TaxTransaction[]>("tax");
    if (Array.isArray(remote) && remote.length) {
      const normalized = remote.map(normalizeRow);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
  } catch {
    /* fall through */
  }
  return loadTaxTransactions();
}

export function createTaxTransaction(input: {
  kind: TaxTxnKind;
  label: string;
  amount: number;
  category: string;
  bucket?: TaxBucket;
  date?: string;
  notes?: string;
  receiptName?: string | null;
}): TaxTransaction {
  return {
    id: newId(),
    kind: input.kind,
    bucket: input.bucket === "personal" ? "personal" : "business",
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
  // Business tax estimate: income + business expenses. Personal expenses tracked separately.
  const businessRows = rows.filter((r) => r.bucket !== "personal");
  const grossIncome = businessRows
    .filter((r) => r.kind === "income")
    .reduce((sum, r) => sum + r.amount, 0);
  const businessExpenses = businessRows
    .filter((r) => r.kind === "expense")
    .reduce((sum, r) => sum + r.amount, 0);
  const personalExpenses = rows
    .filter((r) => r.bucket === "personal" && r.kind === "expense")
    .reduce((sum, r) => sum + r.amount, 0);
  const expenses = businessExpenses;
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
    businessExpenses,
    personalExpenses,
  };
}

export function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
