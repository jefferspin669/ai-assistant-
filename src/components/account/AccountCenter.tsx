"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAccount } from "@/components/AccountProvider";
import {
  DEMO_2FA_CODE,
  LANGUAGES,
  TIMEZONES,
  formatMoney,
  formatWhen,
  type CloudKind,
  type MemoryKind,
  type OAuthProvider,
  type ThemePreference,
} from "@/lib/account";
import { industries } from "@/lib/data";
import {
  NotificationsPanel,
  OrganizationPanel,
  SettingsPanel,
  TeamPanel,
} from "@/components/account/WorkspacePanels";
import {
  AiWorkspacePanel,
  AnalyticsPanel,
  BillingPanel,
  DeveloperPanel,
  ReliabilityPanel,
} from "@/components/account/PlatformPanels";

type Section =
  | "overview"
  | "auth"
  | "profiles"
  | "cloud"
  | "memory"
  | "security"
  | "organization"
  | "notifications"
  | "team"
  | "settings"
  | "ai-workspace"
  | "reliability"
  | "developer"
  | "billing"
  | "analytics";

const SECTIONS: { id: Section; label: string; blurb: string }[] = [
  { id: "overview", label: "Overview", blurb: "Profile snapshot, profits, AI name" },
  { id: "ai-workspace", label: "AI Workspace", blurb: "Chats, prompts, files, projects" },
  { id: "auth", label: "Authentication", blurb: "Password, OAuth, 2FA, passkeys, sessions" },
  { id: "profiles", label: "Profiles", blurb: "Personal + businesses, photo, preferences" },
  { id: "organization", label: "Organization", blurb: "Folders, tags, favorites, search, archive" },
  { id: "cloud", label: "Cloud storage", blurb: "Conversations, files, versions, trash" },
  { id: "memory", label: "Memory", blurb: "Preferences, people, projects, long-term" },
  { id: "notifications", label: "Notifications", blurb: "Push, email, SMS, desktop, DND" },
  { id: "team", label: "Team", blurb: "Invites, roles, workspaces, chat, audit" },
  { id: "reliability", label: "Reliability", blurb: "Autosave, offline, sync, recovery" },
  { id: "developer", label: "Developer", blurb: "API, webhooks, plugins, sandbox" },
  { id: "billing", label: "Billing", blurb: "Plans, usage, invoices, referrals" },
  { id: "analytics", label: "Analytics", blurb: "Usage, time saved, productivity" },
  { id: "settings", label: "Settings", blurb: "AI, privacy, apps, export" },
  { id: "security", label: "Security", blurb: "Encryption, alerts, permissions, devices" },
];

const PROVIDERS: OAuthProvider[] = ["google", "apple", "microsoft"];
const CLOUD_KINDS: CloudKind[] = ["conversation", "file", "document", "workflow", "template"];
const MEMORY_KINDS: MemoryKind[] = ["preference", "prompt", "person", "project", "long-term"];

async function fileToDataUrl(file: File, maxBytes = 400_000): Promise<string | null> {
  if (file.size > maxBytes) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function AccountCenter() {
  const {
    ready,
    account,
    ownerName,
    businessName,
    aiName,
    aiRole,
    aiPersonality,
    profitTotal,
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
  } = useAccount();

  const [section, setSection] = useState<Section>("overview");
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");

  // Overview / AI basics
  const [name, setName] = useState(ownerName);
  const [business, setBusiness] = useState(businessName);
  const [industry, setIndustry] = useState("HVAC");
  const [employeeName, setEmployeeName] = useState(aiName);
  const [role, setRole] = useState(aiRole);
  const [personality, setPersonality] = useState(aiPersonality);
  const [profitAmount, setProfitAmount] = useState("");
  const [profitNote, setProfitNote] = useState("");

  // Profiles
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [newBizName, setNewBizName] = useState("");
  const [newBizIndustry, setNewBizIndustry] = useState<string>(industries[0]);

  // Cloud
  const [cloudKind, setCloudKind] = useState<CloudKind>("conversation");
  const [cloudTitle, setCloudTitle] = useState("");
  const [cloudContent, setCloudContent] = useState("");
  const [selectedCloudId, setSelectedCloudId] = useState<string | null>(null);

  // Memory
  const [memKind, setMemKind] = useState<MemoryKind>("preference");
  const [memTitle, setMemTitle] = useState("");
  const [memContent, setMemContent] = useState("");
  const [memApproved, setMemApproved] = useState(true);

  // Auth
  const [passkeyLabel, setPasskeyLabel] = useState("");

  useEffect(() => {
    if (!account) return;
    const biz =
      account.businesses.find((b) => b.id === account.activeBusinessId) || account.businesses[0];
    setName(account.personal.fullName);
    setBusiness(biz?.name || "");
    setIndustry(biz?.industry || "HVAC");
    setEmployeeName(biz?.aiName || "Sarah");
    setRole(biz?.aiRole || "Office Manager");
    setPersonality(biz?.aiPersonality || "Friendly");
    setPhone(account.personal.phone);
    setTitle(account.personal.title);
    setBio(account.personal.bio);
    setTimezone(account.personal.timezone);
    setLanguage(account.personal.language);
    setTheme(account.personal.theme);
  }, [account]);

  const activeBiz = useMemo(() => {
    if (!account) return null;
    return account.businesses.find((b) => b.id === account.activeBusinessId) || account.businesses[0];
  }, [account]);

  const liveCloud = account?.cloudItems.filter((c) => !c.deletedAt) || [];
  const trash = account?.cloudItems.filter((c) => c.deletedAt) || [];
  const selectedCloud = liveCloud.find((c) => c.id === selectedCloudId) || null;
  const unreadAlerts = account?.securityAlerts.filter((a) => !a.read).length || 0;

  function note(msg: string) {
    setError("");
    setFlash(msg);
  }

  function fail(msg: string) {
    setFlash("");
    setError(msg);
  }

  if (!ready) {
    return (
      <AppShell title="Account Center" subtitle="Loading your secured workspace…">
        <div className="panel">Loading…</div>
      </AppShell>
    );
  }

  if (!account) {
    return (
      <AppShell
        title="Account Center"
        subtitle="Secure sign-up, profiles, cloud vault, memory, and device security."
      >
        <section className="panel account-guest">
          <h2>Create a secured Atlas account</h2>
          <p>
            Email/password, Google/Apple/Microsoft, 2FA, passkeys, cloud backup, and long-term memory —
            all saved on this device for the prototype.
          </p>
          <div className="cta-row">
            <Link className="btn btn-dark" href="/signup">
              Secure sign up
            </Link>
            <Link className="btn btn-outline" href="/login">
              Sign in
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Account Center"
      subtitle={`${account.email} · encryption at rest on · ${unreadAlerts} unread security alert${unreadAlerts === 1 ? "" : "s"}`}
      action={
        <button className="btn btn-outline" type="button" onClick={logout}>
          Sign out
        </button>
      }
    >
      <div className="account-center">
        <nav className="account-tabs" aria-label="Account sections">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={section === item.id ? "account-tab active" : "account-tab"}
              onClick={() => {
                setSection(item.id);
                setFlash("");
                setError("");
              }}
            >
              <strong>{item.label}</strong>
              <span>{item.blurb}</span>
            </button>
          ))}
        </nav>

        {(flash || error) && (
          <p className={error ? "auth-error" : "auth-success"} role="status">
            {error || flash}
          </p>
        )}

        {section === "overview" && (
          <div className="account-layout">
            <section className="panel">
              <h2>Profile & AI</h2>
              <p className="panel-lead">Quick edits for the active business and AI employee name.</p>
              <form
                className="form-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  const result = updateProfile({
                    ownerName: name,
                    businessName: business,
                    industry,
                    aiName: employeeName,
                    aiPersonality: personality,
                    aiRole: role,
                  });
                  result.ok ? note("Profile saved.") : fail(result.error);
                }}
              >
                <label>
                  Your name
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                  Active business
                  <input value={business} onChange={(e) => setBusiness(e.target.value)} required />
                </label>
                <label>
                  Industry
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                    {industries.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  AI employee name
                  <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} required />
                </label>
                <label>
                  AI role
                  <input value={role} onChange={(e) => setRole(e.target.value)} required />
                </label>
                <label>
                  Personality
                  <select value={personality} onChange={(e) => setPersonality(e.target.value)}>
                    {["Friendly", "Professional", "Funny", "Serious"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <button className="btn btn-dark" type="submit">
                  Save profile
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>Profits</h2>
              <p className="panel-lead">Add to your running profit total anytime.</p>
              <div className="profit-total">
                <span>Running total</span>
                <strong>{formatMoney(profitTotal)}</strong>
              </div>
              <form
                className="form-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  const result = addProfit(Number(profitAmount), profitNote);
                  if (!result.ok) return fail(result.error);
                  setProfitAmount("");
                  setProfitNote("");
                  note("Profit entry added.");
                }}
              >
                <label>
                  Amount (USD)
                  <input
                    type="number"
                    value={profitAmount}
                    onChange={(e) => setProfitAmount(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Note
                  <input value={profitNote} onChange={(e) => setProfitNote(e.target.value)} />
                </label>
                <button className="btn btn-dark" type="submit">
                  Add to profits
                </button>
              </form>
              <ul className="profit-list">
                {account.profits.length === 0 ? (
                  <li className="profit-empty">No profit entries yet.</li>
                ) : (
                  account.profits.map((entry) => (
                    <li key={entry.id}>
                      <div>
                        <strong className={entry.amount >= 0 ? "profit-pos" : "profit-neg"}>
                          {entry.amount >= 0 ? "+" : ""}
                          {formatMoney(entry.amount)}
                        </strong>
                        <span>{entry.note}</span>
                        <small>{formatWhen(entry.date)}</small>
                      </div>
                      <button type="button" className="ghost-link" onClick={() => removeProfit(entry.id)}>
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="panel account-preview">
              <h2>AI preview</h2>
              <div className="chat-mock">
                <div className="bubble bubble-ai">
                  Hello! Thanks for calling {business}. I’m {employeeName}. How can I help you today?
                </div>
              </div>
            </section>
          </div>
        )}

        {section === "auth" && (
          <div className="account-stack">
            <section className="panel">
              <h2>Sign-in methods</h2>
              <p className="panel-lead">
                Email/password {account.hasPassword ? "is set" : "not set"} · OAuth + passkeys available.
              </p>
              <div className="provider-grid">
                {PROVIDERS.map((provider) => {
                  const linked = Boolean(account.oauth[provider]);
                  return (
                    <div className="provider-card" key={provider}>
                      <strong>{provider[0].toUpperCase() + provider.slice(1)}</strong>
                      <span>{linked ? "Linked" : "Not linked"}</span>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          const result = linked ? unlinkProvider(provider) : linkProvider(provider);
                          result.ok
                            ? note(linked ? `${provider} unlinked.` : `${provider} linked.`)
                            : fail(result.error);
                        }}
                      >
                        {linked ? "Unlink" : "Link"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="account-hint">
                Need a password reset? <Link href="/forgot-password">Reset password</Link>
              </p>
            </section>

            <section className="panel">
              <h2>Two-factor authentication</h2>
              <p className="panel-lead">
                {account.security.twoFactorEnabled
                  ? `2FA is on. Demo authenticator code: ${account.security.twoFactorCode || DEMO_2FA_CODE}`
                  : "Add an authenticator step after password login."}
              </p>
              {account.security.recoveryCodes.length > 0 && (
                <p className="account-hint">
                  Recovery codes: {account.security.recoveryCodes.join(" · ")}
                </p>
              )}
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => {
                  const result = patchSecurity({
                    twoFactorEnabled: !account.security.twoFactorEnabled,
                  });
                  result.ok
                    ? note(account.security.twoFactorEnabled ? "2FA disabled." : "2FA enabled.")
                    : fail(result.error);
                }}
              >
                {account.security.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </button>
            </section>

            <section className="panel">
              <h2>Passkeys</h2>
              <form
                className="form-grid inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const result = registerPasskey(passkeyLabel);
                  if (!result.ok) return fail(result.error);
                  setPasskeyLabel("");
                  note("Passkey registered on this device vault.");
                }}
              >
                <label>
                  Passkey label
                  <input
                    value={passkeyLabel}
                    onChange={(e) => setPasskeyLabel(e.target.value)}
                    placeholder="MacBook Touch ID"
                  />
                </label>
                <button className="btn btn-dark" type="submit">
                  Add passkey
                </button>
              </form>
              <ul className="manage-list">
                {account.passkeys.length === 0 ? (
                  <li>No passkeys yet.</li>
                ) : (
                  account.passkeys.map((passkey) => (
                    <li key={passkey.id}>
                      <div>
                        <strong>{passkey.label}</strong>
                        <small>Added {formatWhen(passkey.createdAt)}</small>
                      </div>
                      <button type="button" className="ghost-link" onClick={() => deletePasskey(passkey.id)}>
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="panel">
              <h2>Session management</h2>
              <div className="cta-row" style={{ marginBottom: "0.85rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const result = endOtherSessions();
                    result.ok ? note("Other sessions signed out.") : fail(result.error);
                  }}
                >
                  Sign out other sessions
                </button>
              </div>
              <ul className="manage-list">
                {account.sessions.map((session) => (
                  <li key={session.id}>
                    <div>
                      <strong>
                        {session.deviceName}
                        {session.current ? " · current" : ""}
                      </strong>
                      <small>
                        {session.ip} · {session.location} · active {formatWhen(session.lastActiveAt)}
                      </small>
                    </div>
                    {!session.current ? (
                      <button type="button" className="ghost-link" onClick={() => endSession(session.id)}>
                        Revoke
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h2>Login history</h2>
              <ul className="manage-list">
                {account.loginHistory.length === 0 ? (
                  <li>No logins recorded yet.</li>
                ) : (
                  account.loginHistory.map((event) => (
                    <li key={event.id}>
                      <div>
                        <strong>
                          {event.success ? "Success" : "Failed"} · {event.method}
                          {event.provider ? `/${event.provider}` : ""}
                        </strong>
                        <small>
                          {formatWhen(event.at)} · {event.deviceName} · {event.detail}
                        </small>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        )}

        {section === "profiles" && (
          <div className="account-stack">
            <section className="panel">
              <h2>Personal profile</h2>
              <div className="media-row">
                <div className="avatar-frame">
                  {account.personal.photoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={account.personal.photoDataUrl} alt="" />
                  ) : (
                    <span>{account.personal.fullName.slice(0, 1)}</span>
                  )}
                </div>
                <label className="btn btn-outline file-btn">
                  Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await fileToDataUrl(file);
                      if (!url) return fail("Photo must be under ~400KB for this demo vault.");
                      const result = updatePersonal({ photoDataUrl: url });
                      result.ok ? note("Profile photo saved.") : fail(result.error);
                    }}
                  />
                </label>
              </div>
              <form
                className="form-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  const result = updatePersonal({
                    fullName: name,
                    phone,
                    title,
                    bio,
                    timezone,
                    language,
                    theme,
                  });
                  result.ok ? note("Personal profile saved.") : fail(result.error);
                }}
              >
                <label>
                  Full name
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                  Title
                  <input value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>
                <label>
                  Phone
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label>
                  Contact email
                  <input value={account.email} disabled />
                </label>
                <label>
                  Time zone
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    {TIMEZONES.map((tz) => (
                      <option key={tz}>{tz}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Language
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Theme
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as ThemePreference)}
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="mist">Mist</option>
                  </select>
                </label>
                <label>
                  Bio
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
                </label>
                <button className="btn btn-dark" type="submit">
                  Save personal profile
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>Businesses</h2>
              <p className="panel-lead">Multiple businesses per account — switch the active one anytime.</p>
              <div className="biz-switcher">
                {account.businesses.map((biz) => (
                  <button
                    key={biz.id}
                    type="button"
                    className={biz.id === account.activeBusinessId ? "biz-chip active" : "biz-chip"}
                    onClick={() => {
                      const result = switchBusiness(biz.id);
                      result.ok ? note(`Active business: ${biz.name}`) : fail(result.error);
                    }}
                  >
                    {biz.name}
                  </button>
                ))}
              </div>

              {activeBiz && (
                <form
                  className="form-grid"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const result = updateBusiness(activeBiz.id, {
                      name: business,
                      industry,
                      phone: activeBiz.phone,
                      email: activeBiz.email,
                      website: activeBiz.website,
                      address: activeBiz.address,
                      aiName: employeeName,
                      aiPersonality: personality,
                      aiRole: role,
                    });
                    result.ok ? note("Business profile saved.") : fail(result.error);
                  }}
                >
                  <div className="media-row">
                    <div className="avatar-frame logo-frame">
                      {activeBiz.logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={activeBiz.logoDataUrl} alt="" />
                      ) : (
                        <span>{activeBiz.name.slice(0, 1)}</span>
                      )}
                    </div>
                    <label className="btn btn-outline file-btn">
                      Upload company logo
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !activeBiz) return;
                          const url = await fileToDataUrl(file);
                          if (!url) return fail("Logo must be under ~400KB for this demo vault.");
                          const result = updateBusiness(activeBiz.id, { logoDataUrl: url });
                          result.ok ? note("Company logo saved.") : fail(result.error);
                        }}
                      />
                    </label>
                  </div>
                  <label>
                    Business name
                    <input value={business} onChange={(e) => setBusiness(e.target.value)} required />
                  </label>
                  <label>
                    Industry
                    <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                      {industries.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Business phone
                    <input
                      value={activeBiz.phone}
                      onChange={(e) =>
                        updateBusiness(activeBiz.id, { phone: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Business email
                    <input
                      value={activeBiz.email}
                      onChange={(e) =>
                        updateBusiness(activeBiz.id, { email: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Website
                    <input
                      value={activeBiz.website}
                      onChange={(e) =>
                        updateBusiness(activeBiz.id, { website: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Address
                    <input
                      value={activeBiz.address}
                      onChange={(e) =>
                        updateBusiness(activeBiz.id, { address: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    AI employee name
                    <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
                  </label>
                  <div className="cta-row">
                    <button className="btn btn-dark" type="submit">
                      Save business
                    </button>
                    {account.businesses.length > 1 ? (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          const result = deleteBusiness(activeBiz.id);
                          result.ok ? note("Business removed.") : fail(result.error);
                        }}
                      >
                        Remove business
                      </button>
                    ) : null}
                  </div>
                </form>
              )}

              <form
                className="form-grid inline-form"
                style={{ marginTop: "1rem" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const result = createBusiness(newBizName, newBizIndustry);
                  if (!result.ok) return fail(result.error);
                  setNewBizName("");
                  note("Business added.");
                }}
              >
                <label>
                  Add another business
                  <input
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    placeholder="Second location or brand"
                    required
                  />
                </label>
                <label>
                  Industry
                  <select value={newBizIndustry} onChange={(e) => setNewBizIndustry(e.target.value)}>
                    {industries.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <button className="btn btn-dark" type="submit">
                  Add business
                </button>
              </form>
            </section>
          </div>
        )}

        {section === "cloud" && (
          <div className="account-stack">
            <section className="panel">
              <h2>Cloud vault</h2>
              <p className="panel-lead">
                Conversations, uploads, AI documents, workflows, and templates — with version history and
                trash restore.
              </p>
              <div className="cta-row" style={{ marginBottom: "0.85rem" }}>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => {
                    const result = backupCloud();
                    result.ok ? note("Automatic cloud backup completed.") : fail(result.error);
                  }}
                >
                  Run cloud backup
                </button>
              </div>
              <form
                className="form-grid"
                onSubmit={async (e) => {
                  e.preventDefault();
                  let content = cloudContent;
                  if (cloudKind === "file" && !content.trim()) {
                    fail("Choose a file to upload, or paste text content.");
                    return;
                  }
                  if (!content.trim() && cloudKind !== "file") {
                    fail("Add content before saving.");
                    return;
                  }
                  const result = saveCloud({
                    kind: cloudKind,
                    title: cloudTitle || "Untitled upload",
                    content: content || "Empty file placeholder",
                    id: selectedCloudId || undefined,
                  });
                  if (!result.ok) return fail(result.error);
                  setCloudTitle("");
                  setCloudContent("");
                  setSelectedCloudId(null);
                  note(selectedCloudId ? "Cloud item updated." : "Saved to cloud vault.");
                }}
              >
                <label>
                  Type
                  <select
                    value={cloudKind}
                    onChange={(e) => setCloudKind(e.target.value as CloudKind)}
                  >
                    {CLOUD_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Title
                  <input value={cloudTitle} onChange={(e) => setCloudTitle(e.target.value)} required />
                </label>
                {cloudKind === "file" ? (
                  <label>
                    Upload file
                    <input
                      type="file"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await fileToDataUrl(file, 900_000);
                        if (!url) {
                          fail("File is too large for the demo vault (keep under ~900KB).");
                          return;
                        }
                        setCloudTitle((prev) => prev || file.name);
                        setCloudContent(
                          `File: ${file.name}\nType: ${file.type || "unknown"}\nSize: ${Math.round(file.size / 1024)} KB\n\n${url}`,
                        );
                        note(`Ready to save “${file.name}”.`);
                      }}
                    />
                  </label>
                ) : null}
                <label>
                  Content
                  <textarea
                    value={cloudContent}
                    onChange={(e) => setCloudContent(e.target.value)}
                    rows={4}
                    required={cloudKind !== "file"}
                    placeholder={
                      cloudKind === "file"
                        ? "Filled automatically from your upload — or paste text"
                        : "Notes, transcript, or document body"
                    }
                  />
                </label>
                <button className="btn btn-dark" type="submit">
                  {selectedCloudId ? "Update item" : "Save to cloud"}
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>Saved items</h2>
              <ul className="manage-list">
                {liveCloud.length === 0 ? (
                  <li>Vault is empty — save your first item.</li>
                ) : (
                  liveCloud.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>
                          {item.title} · {item.kind}
                        </strong>
                        <small>
                          Updated {formatWhen(item.updatedAt)} · {item.versions.length} versions
                        </small>
                      </div>
                      <div className="list-actions">
                        <button
                          type="button"
                          className="ghost-link"
                          onClick={() => {
                            setSelectedCloudId(item.id);
                            setCloudKind(item.kind);
                            setCloudTitle(item.title);
                            setCloudContent(item.content);
                            note(`Editing “${item.title}”.`);
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" className="ghost-link" onClick={() => trashCloud(item.id)}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>

              {selectedCloud && selectedCloud.versions.length > 0 && (
                <>
                  <h3 style={{ marginTop: "1rem" }}>Version history</h3>
                  <ul className="manage-list">
                    {selectedCloud.versions.map((version) => (
                      <li key={version.id}>
                        <div>
                          <strong>{version.label}</strong>
                          <small>{formatWhen(version.at)}</small>
                        </div>
                        <button
                          type="button"
                          className="ghost-link"
                          onClick={() => {
                            const result = restoreVersion(selectedCloud.id, version.id);
                            result.ok ? note(`Restored ${version.label}.`) : fail(result.error);
                          }}
                        >
                          Restore
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="panel">
              <h2>Trash</h2>
              <ul className="manage-list">
                {trash.length === 0 ? (
                  <li>No deleted items.</li>
                ) : (
                  trash.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <small>Deleted {item.deletedAt ? formatWhen(item.deletedAt) : ""}</small>
                      </div>
                      <button type="button" className="ghost-link" onClick={() => restoreCloud(item.id)}>
                        Restore
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        )}

        {section === "memory" && (
          <div className="account-stack">
            <section className="panel">
              <h2>Memory system</h2>
              <p className="panel-lead">
                Preferences, favorite prompts, important people, projects, and long-term memory (with
                approval).
              </p>
              <form
                className="form-grid"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  const result = createMemory({
                    kind: memKind,
                    title: memTitle,
                    content: memContent,
                    approved: memKind === "long-term" ? memApproved : true,
                  });
                  if (!result.ok) return fail(result.error);
                  setMemTitle("");
                  setMemContent("");
                  note("Memory saved.");
                }}
              >
                <label>
                  Type
                  <select value={memKind} onChange={(e) => setMemKind(e.target.value as MemoryKind)}>
                    {MEMORY_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Title
                  <input value={memTitle} onChange={(e) => setMemTitle(e.target.value)} required />
                </label>
                <label>
                  Content
                  <textarea
                    value={memContent}
                    onChange={(e) => setMemContent(e.target.value)}
                    rows={3}
                    required
                  />
                </label>
                {memKind === "long-term" ? (
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={memApproved}
                      onChange={(e) => setMemApproved(e.target.checked)}
                    />
                    User approved for long-term memory
                  </label>
                ) : null}
                <button className="btn btn-dark" type="submit">
                  Save memory
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>Stored memories</h2>
              <ul className="manage-list">
                {account.memories.map((memory) => (
                  <li key={memory.id}>
                    <div>
                      <strong>
                        {memory.title} · {memory.kind}
                        {!memory.approved ? " · pending approval" : ""}
                      </strong>
                      <small>{memory.content}</small>
                    </div>
                    <div className="list-actions">
                      {memory.kind === "long-term" && !memory.approved ? (
                        <button
                          type="button"
                          className="ghost-link"
                          onClick={() => editMemory(memory.id, { approved: true })}
                        >
                          Approve
                        </button>
                      ) : null}
                      <button type="button" className="ghost-link" onClick={() => removeMemory(memory.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {section === "ai-workspace" && account ? (
          <AiWorkspacePanel account={account} note={note} fail={fail} />
        ) : null}

        {section === "organization" && account ? (
          <OrganizationPanel account={account} note={note} fail={fail} />
        ) : null}

        {section === "notifications" && account ? (
          <NotificationsPanel account={account} note={note} fail={fail} />
        ) : null}

        {section === "team" && account ? (
          <TeamPanel account={account} note={note} fail={fail} />
        ) : null}

        {section === "reliability" && account ? (
          <ReliabilityPanel account={account} note={note} fail={fail} />
        ) : null}

        {section === "developer" && account ? (
          <DeveloperPanel account={account} note={note} fail={fail} />
        ) : null}

        {section === "billing" && account ? (
          <BillingPanel account={account} note={note} fail={fail} />
        ) : null}

        {section === "analytics" && account ? (
          <AnalyticsPanel account={account} note={note} fail={fail} />
        ) : null}

        {section === "settings" && account ? (
          <SettingsPanel account={account} note={note} fail={fail} />
        ) : null}

        {section === "security" && (
          <div className="account-stack">
            <section className="panel">
              <h2>Protection</h2>
              <div className="toggle-grid">
                <label className="check-row">
                  <input type="checkbox" checked={account.security.encryptionAtRest} readOnly />
                  Data encryption at rest
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={account.security.e2eConversations}
                    onChange={(e) => {
                      const result = patchSecurity({ e2eConversations: e.target.checked });
                      result.ok
                        ? note(e.target.checked ? "E2E conversations enabled." : "E2E conversations off.")
                        : fail(result.error);
                    }}
                  />
                  End-to-end encryption for conversations
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={account.security.loginNotifications}
                    onChange={(e) => patchSecurity({ loginNotifications: e.target.checked })}
                  />
                  Login notifications / security alerts
                </label>
              </div>
              <label className="form-grid" style={{ marginTop: "0.85rem" }}>
                Automatic logout on inactive devices (minutes)
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={account.security.inactiveLogoutMinutes}
                  onChange={(e) =>
                    patchSecurity({ inactiveLogoutMinutes: Number(e.target.value) || 60 })
                  }
                />
              </label>
            </section>

            <section className="panel">
              <h2>Permission management</h2>
              <div className="toggle-grid">
                {(
                  [
                    ["shareAnalytics", "Share anonymized analytics"],
                    ["allowTeamInvite", "Allow team invites"],
                    ["allowExport", "Allow data export"],
                    ["allowMemoryWrite", "Allow memory writes"],
                  ] as const
                ).map(([key, label]) => (
                  <label className="check-row" key={key}>
                    <input
                      type="checkbox"
                      checked={account.security.permissions[key]}
                      onChange={(e) =>
                        patchSecurity({
                          permissions: {
                            ...account.security.permissions,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Security alerts</h2>
              <div className="cta-row" style={{ marginBottom: "0.75rem" }}>
                <button type="button" className="btn btn-outline" onClick={() => readAlerts()}>
                  Mark all read
                </button>
              </div>
              <ul className="manage-list">
                {account.securityAlerts.map((alert) => (
                  <li key={alert.id}>
                    <div>
                      <strong>
                        {alert.title}
                        {!alert.read ? " · new" : ""}
                      </strong>
                      <small>
                        {formatWhen(alert.at)} · {alert.severity} · {alert.detail}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h2>Trusted devices & device management</h2>
              <ul className="manage-list">
                {account.devices.map((device) => (
                  <li key={device.id}>
                    <div>
                      <strong>
                        {device.name}
                        {device.current ? " · this device" : ""}
                        {device.trusted ? " · trusted" : ""}
                      </strong>
                      <small>
                        {device.browser}/{device.os} · {device.location} · last seen{" "}
                        {formatWhen(device.lastSeenAt)}
                      </small>
                    </div>
                    <div className="list-actions">
                      <button
                        type="button"
                        className="ghost-link"
                        onClick={() => trustDevice(device.id, !device.trusted)}
                      >
                        {device.trusted ? "Untrust" : "Trust"}
                      </button>
                      {!device.current ? (
                        <button type="button" className="ghost-link" onClick={() => deleteDevice(device.id)}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h2>Activity logs</h2>
              <ul className="manage-list">
                {account.activityLog.map((entry) => (
                  <li key={entry.id}>
                    <div>
                      <strong>{entry.action}</strong>
                      <small>
                        {formatWhen(entry.at)} · {entry.detail}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
