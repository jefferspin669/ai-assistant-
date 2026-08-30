"use client";

import Link from "@/components/SiteLink";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NavIcon } from "@/components/NavIcon";
import { SyncStatusBar } from "@/components/SyncStatusBar";
import { accountNeedsSetup } from "@/lib/account";
import {
  SIDEBAR_COLLAPSED_KEY,
  SIDEBAR_MORE_OPEN_KEY,
  getSidebarMoreGroups,
  groupContainsPath,
  isNavItemActive,
  sidebarAdmin,
  sidebarMain,
  type SidebarNavItem,
} from "@/lib/sidebar-nav";
import { applyAccessibility, loadAccessibility } from "@/lib/accessibility";
import { refreshOfflineCache } from "@/lib/offline";
import { ensureDailyBackup } from "@/lib/recovery";

function NavLink({
  item,
  pathname,
  collapsed,
  tNav,
}: {
  item: SidebarNavItem;
  pathname: string;
  collapsed: boolean;
  tNav: (label: string) => string;
}) {
  const active = isNavItemActive(pathname, item);
  const label = tNav(item.label);
  return (
    <Link
      href={item.href}
      className={active ? "nav-item active" : "nav-item"}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
    >
      <NavIcon id={item.icon} className="nav-item-icon" />
      <span className="nav-item-label">{label}</span>
    </Link>
  );
}

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
  const moreGroups = useMemo(() => getSidebarMoreGroups(), []);

  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const accountId = account?.id;
  useEffect(() => {
    if (accountId) ensureDailyBackup();
    refreshOfflineCache();
    applyAccessibility(loadAccessibility());
  }, [accountId]);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
      setMoreOpen(window.localStorage.getItem(SIDEBAR_MORE_OPEN_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountMenuOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    const activeIndex = moreGroups.findIndex((group) => groupContainsPath(pathname, group));
    if (activeIndex < 0) return;
    const groupKey = `${moreGroups[activeIndex].label}-${activeIndex}`;
    setMoreOpen(true);
    setOpenGroups((prev) =>
      prev[groupKey] ? prev : { ...prev, [groupKey]: true },
    );
  }, [pathname, moreGroups]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function toggleMore() {
    setMoreOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_MORE_OPEN_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className={`app-shell${collapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-head">
          <Link href="/" className="sidebar-brand" title="Atlas AI">
            <span className="sidebar-brand-mark">A</span>
            <span className="sidebar-brand-text">
              Atlas <span>AI</span>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? t("shell.expandNav", "Expand sidebar") : t("shell.collapseNav", "Collapse sidebar")}
            title={collapsed ? t("shell.expandNav", "Expand sidebar") : t("shell.collapseNav", "Collapse sidebar")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? (
                <path d="M9 6l6 6-6 6" />
              ) : (
                <path d="M15 6l-6 6 6 6" />
              )}
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav" aria-label={t("shell.nav", "Main navigation")}>
          <div className="nav-group">
            <div className="nav-group-label">{tNav("Main")}</div>
            {sidebarMain.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} tNav={tNav} />
            ))}
          </div>

          <div className="nav-group">
            <div className="nav-group-label">{tNav("Admin")}</div>
            {sidebarAdmin.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} tNav={tNav} />
            ))}
          </div>

          <div className="nav-group nav-group-more">
            <button
              type="button"
              className={`nav-section-toggle${moreOpen ? " open" : ""}`}
              onClick={toggleMore}
              aria-expanded={moreOpen}
              title={collapsed ? tNav("More") : undefined}
            >
              <NavIcon id="more" className="nav-item-icon" />
              <span className="nav-item-label">{tNav("More")}</span>
              <span className="nav-section-chevron" aria-hidden="true">
                {moreOpen ? "▾" : "▸"}
              </span>
            </button>

            {moreOpen ? (
              <div className="nav-more-panel">
                {moreGroups.map((group, groupIndex) => {
                  const groupKey = `${group.label}-${groupIndex}`;
                  const open = Boolean(openGroups[groupKey]) || groupContainsPath(pathname, group);
                  return (
                    <div className="nav-subgroup" key={groupKey}>
                      <button
                        type="button"
                        className={`nav-subgroup-toggle${open ? " open" : ""}`}
                        onClick={() => toggleGroup(groupKey)}
                        aria-expanded={open}
                        title={collapsed ? tNav(group.label) : undefined}
                      >
                        <NavIcon id="folder" className="nav-item-icon" />
                        <span className="nav-item-label">{tNav(group.label)}</span>
                        <span className="nav-section-chevron" aria-hidden="true">
                          {open ? "▾" : "▸"}
                        </span>
                      </button>
                      {open ? (
                        <div className="nav-subgroup-items">
                          {group.items.map((item) => {
                            const active = isNavItemActive(pathname, item);
                            const label = tNav(item.label);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={active ? "nav-item nav-item-sub active" : "nav-item nav-item-sub"}
                                title={collapsed ? label : undefined}
                                aria-label={collapsed ? label : undefined}
                              >
                                <span className="nav-item-label">{label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="sidebar-foot">
          <div className="ai-presence" title={`${aiName} ${t("shell.online", "is online")}`}>
            <span className="ai-presence-dot" aria-hidden="true" />
            <div className="ai-presence-copy">
              <span className="ai-presence-status">{t("shell.onlineNow", "Online now")}</span>
              <strong className="ai-presence-name">{aiName}</strong>
            </div>
          </div>

          {!collapsed ? (
            <label className="language-switcher language-switcher-compact">
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
          ) : null}
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
            <div className="account-menu" ref={accountMenuRef}>
              <button
                type="button"
                className="account-menu-trigger"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                {account ? ownerName || t("shell.account", "Account") : t("shell.guest", "Guest")}
              </button>
              {accountMenuOpen ? (
                <div className="account-menu-panel" role="menu">
                  <Link
                    href="/app/account"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    {account ? t("shell.account", "Account Center") : t("shell.createAccount", "Create account")}
                  </Link>
                  <Link
                    href="/app/settings"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    {tNav("Settings")}
                  </Link>
                  {account ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="account-logout"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        logout();
                      }}
                    >
                      {t("shell.logout", "Sign out")}
                    </button>
                  ) : (
                    <Link href="/login" role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      {t("shell.login", "Log in")}
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
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
