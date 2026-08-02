import { customEmployee, owner } from "@/lib/data";
import type { Industry } from "@/lib/data";

export type ProfitEntry = {
  id: string;
  amount: number;
  note: string;
  date: string;
};

export type UserAccount = {
  id: string;
  email: string;
  /** Demo-only local credential — not real security. */
  password: string;
  ownerName: string;
  businessName: string;
  industry: Industry | string;
  aiName: string;
  aiPersonality: string;
  aiRole: string;
  profits: ProfitEntry[];
  createdAt: string;
  updatedAt: string;
};

export type PublicAccount = Omit<UserAccount, "password">;

export type SignupInput = {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
  industry: string;
  aiName: string;
  aiPersonality: string;
};

export type ProfileUpdate = {
  ownerName: string;
  businessName: string;
  industry: string;
  aiName: string;
  aiPersonality: string;
  aiRole: string;
};

const ACCOUNTS_KEY = "atlas-accounts-v1";
const SESSION_KEY = "atlas-session-v1";

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readAccounts(): UserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: UserAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function toPublic(account: UserAccount): PublicAccount {
  const { password: _password, ...rest } = account;
  return rest;
}

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionUserId(id: string | null) {
  if (id) localStorage.setItem(SESSION_KEY, id);
  else localStorage.removeItem(SESSION_KEY);
}

export function getCurrentAccount(): PublicAccount | null {
  const id = getSessionUserId();
  if (!id) return null;
  const account = readAccounts().find((a) => a.id === id);
  return account ? toPublic(account) : null;
}

export function signupAccount(input: SignupInput): { ok: true; account: PublicAccount } | { ok: false; error: string } {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const ownerName = input.ownerName.trim();
  const businessName = input.businessName.trim();
  const aiName = input.aiName.trim() || customEmployee.name;

  if (!email || !email.includes("@")) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 4) return { ok: false, error: "Password must be at least 4 characters." };
  if (!ownerName) return { ok: false, error: "Enter your name." };
  if (!businessName) return { ok: false, error: "Enter your business name." };

  const accounts = readAccounts();
  if (accounts.some((a) => a.email === email)) {
    return { ok: false, error: "An account with that email already exists. Try signing in." };
  }

  const stamp = nowIso();
  const account: UserAccount = {
    id: newId(),
    email,
    password,
    ownerName,
    businessName,
    industry: input.industry || "HVAC",
    aiName,
    aiPersonality: input.aiPersonality || "Friendly",
    aiRole: customEmployee.role,
    profits: [],
    createdAt: stamp,
    updatedAt: stamp,
  };

  writeAccounts([...accounts, account]);
  setSessionUserId(account.id);
  return { ok: true, account: toPublic(account) };
}

export function loginAccount(
  emailRaw: string,
  passwordRaw: string,
): { ok: true; account: PublicAccount } | { ok: false; error: string } {
  const email = normalizeEmail(emailRaw);
  const password = passwordRaw.trim();
  const account = readAccounts().find((a) => a.email === email);
  if (!account || account.password !== password) {
    return { ok: false, error: "Email or password doesn’t match." };
  }
  setSessionUserId(account.id);
  return { ok: true, account: toPublic(account) };
}

export function logoutAccount() {
  setSessionUserId(null);
}

export function updateAccountProfile(
  updates: ProfileUpdate,
): { ok: true; account: PublicAccount } | { ok: false; error: string } {
  const id = getSessionUserId();
  if (!id) return { ok: false, error: "You’re not signed in." };

  const accounts = readAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index < 0) return { ok: false, error: "Account not found." };

  const ownerName = updates.ownerName.trim();
  const businessName = updates.businessName.trim();
  const aiName = updates.aiName.trim();
  if (!ownerName || !businessName || !aiName) {
    return { ok: false, error: "Name, business, and AI name are required." };
  }

  const next: UserAccount = {
    ...accounts[index],
    ownerName,
    businessName,
    industry: updates.industry.trim() || accounts[index].industry,
    aiName,
    aiPersonality: updates.aiPersonality.trim() || accounts[index].aiPersonality,
    aiRole: updates.aiRole.trim() || accounts[index].aiRole,
    updatedAt: nowIso(),
  };
  accounts[index] = next;
  writeAccounts(accounts);
  return { ok: true, account: toPublic(next) };
}

export function addProfitEntry(
  amount: number,
  note: string,
): { ok: true; account: PublicAccount } | { ok: false; error: string } {
  const id = getSessionUserId();
  if (!id) return { ok: false, error: "You’re not signed in." };
  if (!Number.isFinite(amount) || amount === 0) {
    return { ok: false, error: "Enter a non-zero profit amount." };
  }

  const accounts = readAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index < 0) return { ok: false, error: "Account not found." };

  const entry: ProfitEntry = {
    id: newId(),
    amount,
    note: note.trim() || (amount >= 0 ? "Profit added" : "Adjustment"),
    date: nowIso(),
  };

  const next: UserAccount = {
    ...accounts[index],
    profits: [entry, ...accounts[index].profits],
    updatedAt: nowIso(),
  };
  accounts[index] = next;
  writeAccounts(accounts);
  return { ok: true, account: toPublic(next) };
}

export function removeProfitEntry(
  entryId: string,
): { ok: true; account: PublicAccount } | { ok: false; error: string } {
  const id = getSessionUserId();
  if (!id) return { ok: false, error: "You’re not signed in." };

  const accounts = readAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index < 0) return { ok: false, error: "Account not found." };

  const next: UserAccount = {
    ...accounts[index],
    profits: accounts[index].profits.filter((p) => p.id !== entryId),
    updatedAt: nowIso(),
  };
  accounts[index] = next;
  writeAccounts(accounts);
  return { ok: true, account: toPublic(next) };
}

export function totalProfits(account: PublicAccount | null | undefined) {
  if (!account) return 0;
  return account.profits.reduce((sum, entry) => sum + entry.amount, 0);
}

export function demoDefaults() {
  return {
    ownerName: owner.name,
    businessName: owner.business,
    aiName: customEmployee.name,
    aiRole: customEmployee.role,
    aiPersonality: "Friendly",
  };
}

export function formatMoney(amount: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return amount < 0 ? `−${formatted}` : formatted;
}
