"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "@/components/AccountProvider";
import { customEmployee } from "@/lib/data";
import { navGroups } from "@/lib/atlas-platform";

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="sidebar-brand">
          Atlas <span>AI</span>
        </Link>
        <p className="sidebar-tag">Atlas v1 · first usable version</p>
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
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
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="ai-chip">
            <strong>{aiName} is online</strong>
            <span>
              {account ? `${ownerName} · saved account` : `Never sleeps · ${customEmployee.languages.join(" · ")}`}
            </span>
          </div>
          <Link href="/app/account" className="ghost-link">
            {account ? "Account Center" : "Create account"}
          </Link>
          {account ? (
            <button type="button" className="ghost-link" onClick={() => logout()}>
              Log out
            </button>
          ) : (
            <Link href="/login" className="ghost-link">
              Log in
            </Link>
          )}
          <Link href="/onboarding" className="ghost-link">
            Customize your AI employee
          </Link>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-top">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {action}
        </header>
        <div className="app-content">
          {ready && !account ? (
            <div className="tax-safety-banner" style={{ marginBottom: "1rem" }}>
              <div className="tax-safety-banner-head">
                <strong>Guest mode</strong>
                <span>Create an account to save chats, files, and password-protected vault data.</span>
              </div>
              <div className="cta-row">
                <Link className="btn btn-dark" href="/signup">
                  Register
                </Link>
                <Link className="btn btn-outline" href="/login">
                  Log in
                </Link>
                <Link className="ghost-link" href="/forgot-password">
                  Reset password
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
