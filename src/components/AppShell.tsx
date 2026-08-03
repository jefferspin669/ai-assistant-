"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "@/components/AccountProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { GlobalSearch } from "@/components/GlobalSearch";
import { SyncStatusBar } from "@/components/SyncStatusBar";
import { accountNeedsSetup } from "@/lib/account";
import { navGroups } from "@/lib/atlas-platform";
import { customEmployee } from "@/lib/data";
import { applyAccessibility, loadAccessibility } from "@/lib/accessibility";
import { refreshOfflineCache } from "@/lib/offline";
import { ensureDailyBackup } from "@/lib/recovery";

export function AppShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { account, aiName, ownerName, ready, logout } = useAccount();
  const { language, setLanguage, languages, t, tNav, tTitle } = useLanguage();
  const needsSetup = accountNeedsSetup(account);

  const accountId = account?.id;
  useEffect(() => {
    if (accountId) ensureDailyBackup();
    refreshOfflineCache();
    applyAccessibility(loadAccessibility());
  }, [accountId]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="sidebar-brand">
          Atlas <span>AI</span>
        </Link>
        <p className="sidebar-tag">Frontend · API · Database</p>
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{tNav(group.label)}</div>
              {group.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? "nav-item active" : "nav-item"}
                  >
                    {tNav(item.label)}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <label className="language-switcher">
            <span>{t("shell.language", "Language")}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={t("shell.language", "Language")}
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.native}
                </option>
              ))}
            </select>
          </label>
          <div className="ai-chip">
            <strong>
              {aiName} {t("shell.online", "is online")}
            </strong>
            <span>
              {account
                ? `${ownerName} · ${t("shell.savedAccount", "saved account")}`
                : `Never sleeps · ${customEmployee.languages.join(" · ")}`}
            </span>
          </div>
          <Link href="/app/account" className="ghost-link">
            {account ? t("shell.account", "Account Center") : t("shell.createAccount", "Create account")}
          </Link>
          {account ? (
            <button type="button" className="ghost-link" onClick={() => logout()}>
              {t("shell.logout", "Log out")}
            </button>
          ) : (
            <Link href="/login" className="ghost-link">
              {t("shell.login", "Log in")}
            </Link>
          )}
          <Link href="/app/setup" className="ghost-link">
            {t("shell.setup", "First-time setup")}
          </Link>
          <Link href="/app/notes" className="ghost-link">
            {t("shell.capture", "Quick capture")}
          </Link>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-top">
          <div>
            <h1>{tTitle(title)}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="app-top-actions">
            <SyncStatusBar />
            <GlobalSearch />
            {action}
          </div>
        </header>
        <div className="app-content">
          {ready && !account ? (
            <div className="tax-safety-banner" style={{ marginBottom: "1rem" }}>
              <div className="tax-safety-banner-head">
                <strong>{t("shell.guest", "Guest mode")}</strong>
                <span>{t("shell.guestHint")}</span>
              </div>
              <div className="cta-row">
                <Link className="btn btn-dark" href="/signup">
                  {t("shell.register", "Register")}
                </Link>
                <Link className="btn btn-outline" href="/login">
                  {t("shell.login", "Log in")}
                </Link>
                <Link className="ghost-link" href="/forgot-password">
                  {t("shell.reset", "Reset password")}
                </Link>
              </div>
            </div>
          ) : null}
          {ready && needsSetup && pathname !== "/app/setup" ? (
            <div className="tax-safety-banner" style={{ marginBottom: "1rem" }}>
              <div className="tax-safety-banner-head">
                <strong>{t("shell.finishSetup", "Finish first-time setup")}</strong>
                <span>{t("shell.finishSetupHint")}</span>
              </div>
              <div className="cta-row">
                <Link className="btn btn-dark" href="/app/setup">
                  {t("shell.continueSetup", "Continue setup")}
                </Link>
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
