"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addProfitEntry,
  demoDefaults,
  getCurrentAccount,
  loginAccount,
  logoutAccount,
  removeProfitEntry,
  signupAccount,
  totalProfits,
  updateAccountProfile,
  type ProfileUpdate,
  type PublicAccount,
  type SignupInput,
} from "@/lib/account";
import { customEmployee, owner } from "@/lib/data";

type AccountContextValue = {
  ready: boolean;
  account: PublicAccount | null;
  ownerName: string;
  businessName: string;
  aiName: string;
  aiRole: string;
  aiPersonality: string;
  profitTotal: number;
  signup: (input: SignupInput) => { ok: true } | { ok: false; error: string };
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  updateProfile: (updates: ProfileUpdate) => { ok: true } | { ok: false; error: string };
  addProfit: (amount: number, note: string) => { ok: true } | { ok: false; error: string };
  removeProfit: (entryId: string) => { ok: true } | { ok: false; error: string };
  refresh: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<PublicAccount | null>(null);

  const refresh = useCallback(() => {
    setAccount(getCurrentAccount());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  const signup = useCallback((input: SignupInput) => {
    const result = signupAccount(input);
    if (!result.ok) return { ok: false as const, error: result.error };
    setAccount(result.account);
    return { ok: true as const };
  }, []);

  const login = useCallback((email: string, password: string) => {
    const result = loginAccount(email, password);
    if (!result.ok) return { ok: false as const, error: result.error };
    setAccount(result.account);
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    logoutAccount();
    setAccount(null);
  }, []);

  const updateProfile = useCallback((updates: ProfileUpdate) => {
    const result = updateAccountProfile(updates);
    if (!result.ok) return { ok: false as const, error: result.error };
    setAccount(result.account);
    return { ok: true as const };
  }, []);

  const addProfit = useCallback((amount: number, note: string) => {
    const result = addProfitEntry(amount, note);
    if (!result.ok) return { ok: false as const, error: result.error };
    setAccount(result.account);
    return { ok: true as const };
  }, []);

  const removeProfit = useCallback((entryId: string) => {
    const result = removeProfitEntry(entryId);
    if (!result.ok) return { ok: false as const, error: result.error };
    setAccount(result.account);
    return { ok: true as const };
  }, []);

  const defaults = demoDefaults();

  const value = useMemo<AccountContextValue>(
    () => ({
      ready,
      account,
      ownerName: account?.ownerName ?? owner.name,
      businessName: account?.businessName ?? owner.business,
      aiName: account?.aiName ?? customEmployee.name,
      aiRole: account?.aiRole ?? customEmployee.role,
      aiPersonality: account?.aiPersonality ?? defaults.aiPersonality,
      profitTotal: totalProfits(account),
      signup,
      login,
      logout,
      updateProfile,
      addProfit,
      removeProfit,
      refresh,
    }),
    [
      ready,
      account,
      defaults.aiPersonality,
      signup,
      login,
      logout,
      updateProfile,
      addProfit,
      removeProfit,
      refresh,
    ],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error("useAccount must be used within AccountProvider");
  }
  return ctx;
}
