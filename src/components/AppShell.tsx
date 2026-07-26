"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { customEmployee, navItems } from "@/lib/data";

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
          Atlas <span>AI</span>
        </Link>
        <p className="sidebar-tag">Atlas — Your AI Workforce</p>
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
            <strong>{customEmployee.name} is online</strong>
            <span>Never sleeps · {customEmployee.languages.join(" · ")}</span>
          </div>
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
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
