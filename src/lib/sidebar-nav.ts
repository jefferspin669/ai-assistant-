import type { NavGroup, NavItem } from "@/lib/atlas-platform";
import { navGroups } from "@/lib/atlas-platform";

export type SidebarIconId =
  | "dashboard"
  | "calendar"
  | "chat"
  | "files"
  | "settings"
  | "tax"
  | "account"
  | "more"
  | "folder";

export type SidebarNavItem = NavItem & { icon: SidebarIconId };

/** Always-visible primary destinations. */
export const sidebarMain: SidebarNavItem[] = [
  { href: "/app", label: "Dashboard", exact: true, icon: "dashboard" },
  { href: "/app/appointments", label: "Calendar", icon: "calendar" },
  { href: "/app/ask", label: "Ask Atlas", icon: "chat" },
  { href: "/app/files", label: "Files", icon: "files" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
];

/** Secondary but frequent admin destinations. */
export const sidebarAdmin: SidebarNavItem[] = [
  { href: "/app/tax", label: "Tax", icon: "tax" },
  { href: "/app/account", label: "Account Center", icon: "account" },
];

const pinnedHrefs = new Set(
  [...sidebarMain, ...sidebarAdmin].map((item) => item.href),
);

/**
 * Remaining catalog items, deduped and excluding pinned Main/Admin links.
 * Used under the collapsible "More" section.
 */
export function getSidebarMoreGroups(): NavGroup[] {
  const seen = new Set(pinnedHrefs);
  return navGroups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => {
        if (seen.has(item.href)) return false;
        seen.add(item.href);
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function groupContainsPath(pathname: string, group: NavGroup) {
  return group.items.some((item) => isNavItemActive(pathname, item));
}

export const SIDEBAR_COLLAPSED_KEY = "atlas-sidebar-collapsed";
export const SIDEBAR_MORE_OPEN_KEY = "atlas-sidebar-more-open";
