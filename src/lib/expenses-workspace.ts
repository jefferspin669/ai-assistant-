/** Expenses & purchases — receipt scan, card match, approval rules. */

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export type ApprovalTier = {
  id: string;
  maxAmount: number;
  approver: "auto" | "manager" | "owner";
  label: string;
};

export type ExpensePurchase = {
  id: string;
  merchant: string;
  amount: number;
  purchasedBy: string;
  purchasedById: string;
  date: string;
  category: string;
  project?: string;
  receiptMatched: boolean;
  cardMatched: boolean;
  status: "pending" | "approved" | "flagged";
  tax?: number;
  items?: string;
  paymentMethod?: string;
  note?: string;
  createdAt: string;
};

const PURCHASES_KEY = "atlas-expenses-v1";
const RULES_KEY = "atlas-expense-rules-v1";

export const DEFAULT_APPROVAL_TIERS: ApprovalTier[] = [
  { id: "auto", maxAmount: 100, approver: "auto", label: "Under $100 — auto-approved" },
  { id: "mgr", maxAmount: 500, approver: "manager", label: "$100–$500 — manager approval" },
  { id: "owner", maxAmount: 999999, approver: "owner", label: "Over $500 — owner approval" },
];

export function loadApprovalTiers(): ApprovalTier[] {
  const saved = loadJson<ApprovalTier[]>(RULES_KEY, []);
  return saved.length ? saved : DEFAULT_APPROVAL_TIERS;
}

export function saveApprovalTiers(tiers: ApprovalTier[]) {
  saveJson(RULES_KEY, tiers);
}

export function loadPurchases(): ExpensePurchase[] {
  return loadJson<ExpensePurchase[]>(PURCHASES_KEY, []);
}

export function savePurchases(items: ExpensePurchase[]) {
  saveJson(PURCHASES_KEY, items);
}

export function approverForAmount(amount: number): ApprovalTier["approver"] {
  const tiers = [...loadApprovalTiers()].sort((a, b) => a.maxAmount - b.maxAmount);
  const tier = tiers.find((t) => amount <= t.maxAmount) ?? tiers[tiers.length - 1];
  return tier.approver;
}

export type ReceiptScanResult = {
  merchant: string;
  date: string;
  amount: number;
  tax: number;
  items: string;
  paymentMethod: string;
};

/** Parse receipt text (demo OCR) — production would use vision API. */
export function parseReceiptText(raw: string): ReceiptScanResult {
  const amountMatch = raw.match(/\$?\s*([\d,]+\.\d{2})/);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : 0;
  const merchant = raw.split("\n")[0]?.trim() || "Unknown merchant";
  return {
    merchant,
    date: new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" }),
    amount,
    tax: amount > 0 ? Math.round(amount * 0.08 * 100) / 100 : 0,
    items: raw.length > 80 ? raw.slice(0, 80) : raw,
    paymentMethod: /card|visa|amex/i.test(raw) ? "Company card" : "Card",
  };
}

export function createPurchaseFromReceipt(
  scan: ReceiptScanResult,
  employeeId: string,
  employeeName: string,
  project?: string,
): ExpensePurchase {
  const approver = approverForAmount(scan.amount);
  const purchase: ExpensePurchase = {
    id: newId("exp"),
    merchant: scan.merchant,
    amount: scan.amount,
    purchasedBy: employeeName,
    purchasedById: employeeId,
    date: scan.date,
    category: "Equipment",
    project,
    receiptMatched: true,
    cardMatched: scan.amount > 0,
    status: approver === "auto" ? "approved" : "pending",
    tax: scan.tax,
    items: scan.items,
    paymentMethod: scan.paymentMethod,
    createdAt: nowIso(),
  };
  savePurchases([purchase, ...loadPurchases()]);
  return purchase;
}

export function flagUnmatchedTransactions(): ExpensePurchase[] {
  return loadPurchases().filter((p) => !p.receiptMatched || !p.cardMatched);
}
