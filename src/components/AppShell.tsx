"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/data";

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="sidebar-brand">
          CallFlow <span>AI</span>
        </Link>
        <p className="sidebar-tag">AI Employee for Smith Plumbing</p>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? "nav-item active" : "nav-item"}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="ai-chip">
            <strong>5 AI employees online</strong>
            <span>Reception · Sales · Scheduler · Marketing · Analyst</span>
          </div>
          <Link href="/onboarding" className="ghost-link">
            Change industry template
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
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
