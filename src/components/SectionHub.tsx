import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import type { HubLink } from "@/lib/section-hubs";

export function SectionHub({
  title,
  subtitle,
  items,
  children,
}: {
  title: string;
  subtitle: string;
  items: HubLink[];
  children?: ReactNode;
}) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      {children}
      <div className="hub-grid">
        {items.map((item) => (
          <Link className="hub-card" href={item.href} key={item.href}>
            <h3>{item.label}</h3>
            <p>{item.blurb}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
