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
  addKnowledgeArticle,
  addMemory,
  addPasskey,
  addProfitEntry,
  createApiKey,
  createFolder,
  createTag,
  createWorkspace,
  deleteAccountData,
  deleteCloudItem,
  deleteFolder,
  deleteMemory,
  deleteTag,
  demoDefaults,
  exportAccountData,
  getCurrentAccount,
  inviteTeamMember,
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
  removeTeamMember,
  requestPasswordReset,
  resetPasswordWithToken,
  restoreCloudItem,
  restoreCloudVersion,
  revokeApiKey,
  revokeOtherSessions,
  revokeSession,
  runCloudBackup,
  saveCloudItem,
  sendTeamChat,
  setActiveBusiness,
  setConnectedApp,
  setDeviceTrusted,
  setDoNotDisturb,
  signupAccount,
  totalProfits,
  touchSessionActivity,
  unlinkOAuthProvider,
  updateAccountProfile,
  updateAppSettings,
  updateBilling,
  updateBusinessProfile,
  updateCloudOrganization,
  updateMemory,
  updateNotificationSettings,
  updatePersonalProfile,
  updateSecuritySettings,
  updateTeamMemberRole,
  verifyTwoFactor,
  type AppSettings,
  type BillingInfo,
  type BusinessProfile,
  type CloudItem,
  type CloudKind,
  type LoginSuccess,
  type MemoryKind,
  type NotificationSettings,
  type OAuthProvider,
  type PersonalProfile,
  type ProfileUpdate,
  type PublicAccount,
  type SecuritySettings,
  type SignupInput,
  type TeamRole,
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
  createOrgFolder: (name: string) => ActionResult;
  removeOrgFolder: (id: string) => ActionResult;
  createOrgTag: (name: string) => ActionResult;
  removeOrgTag: (id: string) => ActionResult;
  organizeCloud: (
    itemId: string,
    patch: Partial<Pick<CloudItem, "folderId" | "tagIds" | "favorite" | "archived" | "pinned">>,
  ) => ActionResult;
  patchNotifications: (patch: Partial<NotificationSettings>) => ActionResult;
  toggleDnd: (enabled: boolean) => ActionResult;
  inviteMember: (name: string, email: string, role: TeamRole) => ActionResult;
  changeMemberRole: (memberId: string, role: TeamRole) => ActionResult;
  removeMember: (memberId: string) => ActionResult;
  addWorkspace: (name: string, description: string) => ActionResult;
  addKnowledge: (workspaceId: string, title: string, content: string) => ActionResult;
  postTeamChat: (workspaceId: string, text: string) => ActionResult;
  updateAppPrefs: (patch: Partial<AppSettings>) => ActionResult;
  connectApp: (appId: string, connected: boolean) => ActionResult;
  changeBilling: (patch: Partial<BillingInfo>) => ActionResult;
  createKey: (name: string) => ActionResult;
  revokeKey: (keyId: string) => ActionResult;
  exportData: () => { ok: true; json: string } | { ok: false; error: string };
  wipeData: () => ActionResult;
  refresh: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

function wrap(
  result: { ok: true; account: PublicAccount } | { ok: false; error: string },
  setAccount: (a: PublicAccount) => void,
): ActionResult {
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

  useEffect(() => {
    const theme = account?.personal.theme || "system";
    document.documentElement.dataset.theme = theme;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [account?.personal.theme]);

  const accountId = account?.id ?? null;
  const inactiveMinutes = account?.security.inactiveLogoutMinutes ?? 0;

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

    const events: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => window.addEventListener(event, bump, { passive: true }));
    bump();
    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, bump));
    };
  }, [accountId, inactiveMinutes]);

  const signup = useCallback((input: SignupInput) => wrap(signupAccount(input), setAccount), []);
  const login = useCallback((email: string, password: string) => {
    const result = loginAccount(email, password);
    if (result.ok && !("requires2fa" in result && result.requires2fa)) {
      setAccount(result.account);
    }
    return result;
  }, []);
  const verify2fa = useCallback(
    (challengeId: string, code: string) => wrap(verifyTwoFactor(challengeId, code), setAccount),
    [],
  );
  const loginOAuth = useCallback(
    (provider: OAuthProvider, nameHint?: string) => wrap(loginWithOAuth(provider, nameHint), setAccount),
    [],
  );
  const loginPasskey = useCallback(
    (email: string) => wrap(loginWithPasskey(email), setAccount),
    [],
  );
  const logout = useCallback(() => {
    logoutAccount();
    setAccount(null);
  }, []);

  const updateProfile = useCallback(
    (updates: ProfileUpdate) => wrap(updateAccountProfile(updates), setAccount),
    [],
  );
  const updatePersonal = useCallback(
    (patch: Partial<PersonalProfile>) => wrap(updatePersonalProfile(patch), setAccount),
    [],
  );
  const updateBusiness = useCallback(
    (businessId: string, patch: Partial<BusinessProfile>) =>
      wrap(updateBusinessProfile(businessId, patch), setAccount),
    [],
  );
  const createBusiness = useCallback(
    (name: string, industry: string) => wrap(addBusiness(name, industry), setAccount),
    [],
  );
  const switchBusiness = useCallback(
    (businessId: string) => wrap(setActiveBusiness(businessId), setAccount),
    [],
  );
  const deleteBusiness = useCallback(
    (businessId: string) => wrap(removeBusiness(businessId), setAccount),
    [],
  );
  const addProfit = useCallback(
    (amount: number, note: string) => wrap(addProfitEntry(amount, note), setAccount),
    [],
  );
  const removeProfit = useCallback(
    (entryId: string) => wrap(removeProfitEntry(entryId), setAccount),
    [],
  );
  const linkProvider = useCallback(
    (provider: OAuthProvider) => wrap(linkOAuthProvider(provider), setAccount),
    [],
  );
  const unlinkProvider = useCallback(
    (provider: OAuthProvider) => wrap(unlinkOAuthProvider(provider), setAccount),
    [],
  );
  const registerPasskey = useCallback(
    (label: string) => wrap(addPasskey(label), setAccount),
    [],
  );
  const deletePasskey = useCallback((id: string) => wrap(removePasskey(id), setAccount), []);
  const forgotPassword = useCallback((email: string) => requestPasswordReset(email), []);
  const resetPassword = useCallback(
    (token: string, password: string) => wrap(resetPasswordWithToken(token, password), setAccount),
    [],
  );
  const saveCloud = useCallback(
    (input: { kind: CloudKind; title: string; content: string; id?: string }) =>
      wrap(saveCloudItem(input), setAccount),
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
    (
      id: string,
      patch: Partial<{ title: string; content: string; approved: boolean; kind: MemoryKind }>,
    ) => wrap(updateMemory(id, patch), setAccount),
    [],
  );
  const removeMemory = useCallback((id: string) => wrap(deleteMemory(id), setAccount), []);
  const patchSecurity = useCallback(
    (patch: Partial<SecuritySettings>) => wrap(updateSecuritySettings(patch), setAccount),
    [],
  );
  const endSession = useCallback((sessionId: string) => wrap(revokeSession(sessionId), setAccount), []);
  const endOtherSessions = useCallback(() => wrap(revokeOtherSessions(), setAccount), []);
  const trustDevice = useCallback(
    (deviceId: string, trusted: boolean) => wrap(setDeviceTrusted(deviceId, trusted), setAccount),
    [],
  );
  const deleteDevice = useCallback((deviceId: string) => wrap(removeDevice(deviceId), setAccount), []);
  const readAlerts = useCallback(() => wrap(markAlertsRead(), setAccount), []);

  const createOrgFolder = useCallback((name: string) => wrap(createFolder(name), setAccount), []);
  const removeOrgFolder = useCallback((id: string) => wrap(deleteFolder(id), setAccount), []);
  const createOrgTag = useCallback((name: string) => wrap(createTag(name), setAccount), []);
  const removeOrgTag = useCallback((id: string) => wrap(deleteTag(id), setAccount), []);
  const organizeCloud = useCallback(
    (
      itemId: string,
      patch: Partial<Pick<CloudItem, "folderId" | "tagIds" | "favorite" | "archived" | "pinned">>,
    ) => wrap(updateCloudOrganization(itemId, patch), setAccount),
    [],
  );
  const patchNotifications = useCallback(
    (patch: Partial<NotificationSettings>) => wrap(updateNotificationSettings(patch), setAccount),
    [],
  );
  const toggleDnd = useCallback((enabled: boolean) => wrap(setDoNotDisturb(enabled), setAccount), []);
  const inviteMember = useCallback(
    (name: string, email: string, role: TeamRole) =>
      wrap(inviteTeamMember(name, email, role), setAccount),
    [],
  );
  const changeMemberRole = useCallback(
    (memberId: string, role: TeamRole) => wrap(updateTeamMemberRole(memberId, role), setAccount),
    [],
  );
  const removeMember = useCallback(
    (memberId: string) => wrap(removeTeamMember(memberId), setAccount),
    [],
  );
  const addWorkspace = useCallback(
    (name: string, description: string) => wrap(createWorkspace(name, description), setAccount),
    [],
  );
  const addKnowledge = useCallback(
    (workspaceId: string, title: string, content: string) =>
      wrap(addKnowledgeArticle(workspaceId, title, content), setAccount),
    [],
  );
  const postTeamChat = useCallback(
    (workspaceId: string, text: string) => wrap(sendTeamChat(workspaceId, text), setAccount),
    [],
  );
  const updateAppPrefs = useCallback(
    (patch: Partial<AppSettings>) => wrap(updateAppSettings(patch), setAccount),
    [],
  );
  const connectApp = useCallback(
    (appId: string, connected: boolean) => wrap(setConnectedApp(appId, connected), setAccount),
    [],
  );
  const changeBilling = useCallback(
    (patch: Partial<BillingInfo>) => wrap(updateBilling(patch), setAccount),
    [],
  );
  const createKey = useCallback((name: string) => wrap(createApiKey(name), setAccount), []);
  const revokeKey = useCallback((keyId: string) => wrap(revokeApiKey(keyId), setAccount), []);
  const exportData = useCallback(() => exportAccountData(), []);
  const wipeData = useCallback(() => wrap(deleteAccountData(), setAccount), []);

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
      createOrgFolder,
      removeOrgFolder,
      createOrgTag,
      removeOrgTag,
      organizeCloud,
      patchNotifications,
      toggleDnd,
      inviteMember,
      changeMemberRole,
      removeMember,
      addWorkspace,
      addKnowledge,
      postTeamChat,
      updateAppPrefs,
      connectApp,
      changeBilling,
      createKey,
      revokeKey,
      exportData,
      wipeData,
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
      createOrgFolder,
      removeOrgFolder,
      createOrgTag,
      removeOrgTag,
      organizeCloud,
      patchNotifications,
      toggleDnd,
      inviteMember,
      changeMemberRole,
      removeMember,
      addWorkspace,
      addKnowledge,
      postTeamChat,
      updateAppPrefs,
      connectApp,
      changeBilling,
      createKey,
      revokeKey,
      exportData,
      wipeData,
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
