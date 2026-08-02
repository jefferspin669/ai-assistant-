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
  accountAiName,
  accountAiPersonality,
  accountAiRole,
  accountBusinessName,
  accountOwnerName,
  addBusiness,
  addMemory,
  addPasskey,
  addProfitEntry,
  deleteCloudItem,
  deleteMemory,
  demoDefaults,
  getCurrentAccount,
  linkOAuthProvider,
  loginAccount,
  loginWithOAuth,
  loginWithPasskey,
  logoutAccount,
  markAlertsRead,
  removeBusiness,
  removeDevice,
  removePasskey,
  removeProfitEntry,
  requestPasswordReset,
  resetPasswordWithToken,
  restoreCloudItem,
  restoreCloudVersion,
  revokeOtherSessions,
  revokeSession,
  runCloudBackup,
  saveCloudItem,
  setActiveBusiness,
  setDeviceTrusted,
  signupAccount,
  totalProfits,
  touchSessionActivity,
  unlinkOAuthProvider,
  updateAccountProfile,
  updateBusinessProfile,
  updateMemory,
  updatePersonalProfile,
  updateSecuritySettings,
  verifyTwoFactor,
  type CloudKind,
  type LoginSuccess,
  type MemoryKind,
  type OAuthProvider,
  type PersonalProfile,
  type ProfileUpdate,
  type PublicAccount,
  type SecuritySettings,
  type SignupInput,
  type BusinessProfile,
} from "@/lib/account";
import { customEmployee, owner } from "@/lib/data";

type ActionResult = { ok: true } | { ok: false; error: string };

type AccountContextValue = {
  ready: boolean;
  account: PublicAccount | null;
  ownerName: string;
  businessName: string;
  aiName: string;
  aiRole: string;
  aiPersonality: string;
  profitTotal: number;
  signup: (input: SignupInput) => ActionResult;
  login: (email: string, password: string) => LoginSuccess | { ok: false; error: string };
  verify2fa: (challengeId: string, code: string) => ActionResult;
  loginOAuth: (provider: OAuthProvider, nameHint?: string) => ActionResult;
  loginPasskey: (email: string) => ActionResult;
  logout: () => void;
  updateProfile: (updates: ProfileUpdate) => ActionResult;
  updatePersonal: (patch: Partial<PersonalProfile>) => ActionResult;
  updateBusiness: (businessId: string, patch: Partial<BusinessProfile>) => ActionResult;
  createBusiness: (name: string, industry: string) => ActionResult;
  switchBusiness: (businessId: string) => ActionResult;
  deleteBusiness: (businessId: string) => ActionResult;
  addProfit: (amount: number, note: string) => ActionResult;
  removeProfit: (entryId: string) => ActionResult;
  linkProvider: (provider: OAuthProvider) => ActionResult;
  unlinkProvider: (provider: OAuthProvider) => ActionResult;
  registerPasskey: (label: string) => ActionResult;
  deletePasskey: (id: string) => ActionResult;
  forgotPassword: (email: string) => { ok: true; token?: string; message: string } | { ok: false; error: string };
  resetPassword: (token: string, password: string) => ActionResult;
  saveCloud: (input: { kind: CloudKind; title: string; content: string; id?: string }) => ActionResult;
  trashCloud: (id: string) => ActionResult;
  restoreCloud: (id: string) => ActionResult;
  restoreVersion: (itemId: string, versionId: string) => ActionResult;
  backupCloud: () => ActionResult;
  createMemory: (input: {
    kind: MemoryKind;
    title: string;
    content: string;
    approved?: boolean;
  }) => ActionResult;
  editMemory: (
    id: string,
    patch: Partial<{ title: string; content: string; approved: boolean; kind: MemoryKind }>,
  ) => ActionResult;
  removeMemory: (id: string) => ActionResult;
  patchSecurity: (patch: Partial<SecuritySettings>) => ActionResult;
  endSession: (sessionId: string) => ActionResult;
  endOtherSessions: () => ActionResult;
  trustDevice: (deviceId: string, trusted: boolean) => ActionResult;
  deleteDevice: (deviceId: string) => ActionResult;
  readAlerts: () => ActionResult;
  refresh: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

function wrap(result: { ok: true; account: PublicAccount } | { ok: false; error: string }, setAccount: (a: PublicAccount) => void): ActionResult {
  if (!result.ok) return { ok: false, error: result.error };
  setAccount(result.account);
  return { ok: true };
}

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

  // Theme preference
  useEffect(() => {
    const theme = account?.personal.theme || "system";
    document.documentElement.dataset.theme = theme;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [account?.personal.theme]);

  const accountId = account?.id ?? null;
  const inactiveMinutes = account?.security.inactiveLogoutMinutes ?? 0;

  // Idle auto-logout + session touch
  useEffect(() => {
    if (!accountId) return;
    let timer: number | undefined;
    let lastTouch = 0;

    const bump = () => {
      const now = Date.now();
      if (now - lastTouch > 15_000) {
        lastTouch = now;
        touchSessionActivity();
      }
      if (timer) window.clearTimeout(timer);
      if (inactiveMinutes > 0) {
        timer = window.setTimeout(() => {
          logoutAccount();
          setAccount(null);
        }, inactiveMinutes * 60 * 1000);
      }
    };

    const events: Array<keyof WindowEventMap> = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, bump, { passive: true }));
    bump();
    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, bump));
    };
  }, [accountId, inactiveMinutes]);

  const signup = useCallback((input: SignupInput) => {
    return wrap(signupAccount(input), setAccount);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const result = loginAccount(email, password);
    if (result.ok && !("requires2fa" in result && result.requires2fa)) {
      setAccount(result.account);
    }
    return result;
  }, []);

  const verify2fa = useCallback((challengeId: string, code: string) => {
    return wrap(verifyTwoFactor(challengeId, code), setAccount);
  }, []);

  const loginOAuth = useCallback((provider: OAuthProvider, nameHint?: string) => {
    return wrap(loginWithOAuth(provider, nameHint), setAccount);
  }, []);

  const loginPasskey = useCallback((email: string) => {
    return wrap(loginWithPasskey(email), setAccount);
  }, []);

  const logout = useCallback(() => {
    logoutAccount();
    setAccount(null);
  }, []);

  const updateProfile = useCallback((updates: ProfileUpdate) => wrap(updateAccountProfile(updates), setAccount), []);
  const updatePersonal = useCallback((patch: Partial<PersonalProfile>) => wrap(updatePersonalProfile(patch), setAccount), []);
  const updateBusiness = useCallback(
    (businessId: string, patch: Partial<BusinessProfile>) => wrap(updateBusinessProfile(businessId, patch), setAccount),
    [],
  );
  const createBusiness = useCallback((name: string, industry: string) => wrap(addBusiness(name, industry), setAccount), []);
  const switchBusiness = useCallback((businessId: string) => wrap(setActiveBusiness(businessId), setAccount), []);
  const deleteBusiness = useCallback((businessId: string) => wrap(removeBusiness(businessId), setAccount), []);
  const addProfit = useCallback((amount: number, note: string) => wrap(addProfitEntry(amount, note), setAccount), []);
  const removeProfit = useCallback((entryId: string) => wrap(removeProfitEntry(entryId), setAccount), []);
  const linkProvider = useCallback((provider: OAuthProvider) => wrap(linkOAuthProvider(provider), setAccount), []);
  const unlinkProvider = useCallback((provider: OAuthProvider) => wrap(unlinkOAuthProvider(provider), setAccount), []);
  const registerPasskey = useCallback((label: string) => wrap(addPasskey(label), setAccount), []);
  const deletePasskey = useCallback((id: string) => wrap(removePasskey(id), setAccount), []);
  const forgotPassword = useCallback((email: string) => requestPasswordReset(email), []);
  const resetPassword = useCallback((token: string, password: string) => wrap(resetPasswordWithToken(token, password), setAccount), []);
  const saveCloud = useCallback(
    (input: { kind: CloudKind; title: string; content: string; id?: string }) => wrap(saveCloudItem(input), setAccount),
    [],
  );
  const trashCloud = useCallback((id: string) => wrap(deleteCloudItem(id), setAccount), []);
  const restoreCloud = useCallback((id: string) => wrap(restoreCloudItem(id), setAccount), []);
  const restoreVersion = useCallback(
    (itemId: string, versionId: string) => wrap(restoreCloudVersion(itemId, versionId), setAccount),
    [],
  );
  const backupCloud = useCallback(() => wrap(runCloudBackup(), setAccount), []);
  const createMemory = useCallback(
    (input: { kind: MemoryKind; title: string; content: string; approved?: boolean }) =>
      wrap(addMemory(input), setAccount),
    [],
  );
  const editMemory = useCallback(
    (id: string, patch: Partial<{ title: string; content: string; approved: boolean; kind: MemoryKind }>) =>
      wrap(updateMemory(id, patch), setAccount),
    [],
  );
  const removeMemory = useCallback((id: string) => wrap(deleteMemory(id), setAccount), []);
  const patchSecurity = useCallback((patch: Partial<SecuritySettings>) => wrap(updateSecuritySettings(patch), setAccount), []);
  const endSession = useCallback((sessionId: string) => wrap(revokeSession(sessionId), setAccount), []);
  const endOtherSessions = useCallback(() => wrap(revokeOtherSessions(), setAccount), []);
  const trustDevice = useCallback(
    (deviceId: string, trusted: boolean) => wrap(setDeviceTrusted(deviceId, trusted), setAccount),
    [],
  );
  const deleteDevice = useCallback((deviceId: string) => wrap(removeDevice(deviceId), setAccount), []);
  const readAlerts = useCallback(() => wrap(markAlertsRead(), setAccount), []);

  const defaults = demoDefaults();

  const value = useMemo<AccountContextValue>(
    () => ({
      ready,
      account,
      ownerName: accountOwnerName(account) || owner.name,
      businessName: accountBusinessName(account) || owner.business,
      aiName: accountAiName(account) || customEmployee.name,
      aiRole: accountAiRole(account) || customEmployee.role,
      aiPersonality: accountAiPersonality(account) || defaults.aiPersonality,
      profitTotal: totalProfits(account),
      signup,
      login,
      verify2fa,
      loginOAuth,
      loginPasskey,
      logout,
      updateProfile,
      updatePersonal,
      updateBusiness,
      createBusiness,
      switchBusiness,
      deleteBusiness,
      addProfit,
      removeProfit,
      linkProvider,
      unlinkProvider,
      registerPasskey,
      deletePasskey,
      forgotPassword,
      resetPassword,
      saveCloud,
      trashCloud,
      restoreCloud,
      restoreVersion,
      backupCloud,
      createMemory,
      editMemory,
      removeMemory,
      patchSecurity,
      endSession,
      endOtherSessions,
      trustDevice,
      deleteDevice,
      readAlerts,
      refresh,
    }),
    [
      ready,
      account,
      defaults.aiPersonality,
      signup,
      login,
      verify2fa,
      loginOAuth,
      loginPasskey,
      logout,
      updateProfile,
      updatePersonal,
      updateBusiness,
      createBusiness,
      switchBusiness,
      deleteBusiness,
      addProfit,
      removeProfit,
      linkProvider,
      unlinkProvider,
      registerPasskey,
      deletePasskey,
      forgotPassword,
      resetPassword,
      saveCloud,
      trashCloud,
      restoreCloud,
      restoreVersion,
      backupCloud,
      createMemory,
      editMemory,
      removeMemory,
      patchSecurity,
      endSession,
      endOtherSessions,
      trustDevice,
      deleteDevice,
      readAlerts,
      refresh,
    ],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
