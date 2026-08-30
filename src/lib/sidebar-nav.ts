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
  | "folder"
  | "business"
  | "team"
  | "atlas"
  | "money";

export type SidebarNavItem = NavItem & { icon: SidebarIconId };

export type SidebarPrimaryGroup = {
  id: string;
  label: string;
  icon: SidebarIconId;
  items: SidebarNavItem[];
};

/** Six primary groups. Everything else stays under More. */
export const sidebarPrimary: SidebarPrimaryGroup[] = [
  {
    id: "home",
    label: "Home",
    icon: "dashboard",
    items: [
      { href: "/app", label: "Dashboard", exact: true, icon: "dashboard" },
      { href: "/app/ask", label: "Atlas Chat", icon: "chat" },
      { href: "/app/approvals", label: "Approvals", icon: "folder" },
      { href: "/app/messages", label: "Notifications", icon: "chat" },
    ],
  },
  {
    id: "business",
    label: "Business",
    icon: "business",
    items: [
      { href: "/app/customers", label: "Customers", icon: "folder" },
      { href: "/app/sales", label: "Sales", icon: "folder" },
      { href: "/app/appointments", label: "Appointments", icon: "calendar" },
      { href: "/app/projects", label: "Projects", icon: "folder" },
      { href: "/app/quotes", label: "Invoices", icon: "folder" },
      { href: "/app/inventory", label: "Inventory", icon: "folder" },
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: "team",
    items: [
      { href: "/app/team", label: "Employees", icon: "account" },
      { href: "/app/tasks", label: "Tasks", icon: "folder" },
      { href: "/app/meetings", label: "Meetings", icon: "calendar" },
      { href: "/app/training", label: "Training", icon: "folder" },
    ],
  },
  {
    id: "atlas",
    label: "Atlas AI",
    icon: "atlas",
    items: [
      { href: "/app/digital-employees", label: "Agents", icon: "atlas" },
      { href: "/app/automations", label: "Automations", icon: "folder" },
      { href: "/app/memory", label: "Memory", icon: "folder" },
      { href: "/app/receptionist", label: "Receptionist", icon: "chat" },
      { href: "/app/actions", label: "AI Activity", icon: "folder" },
      { href: "/app/autonomous", label: "Autonomy", icon: "atlas" },
    ],
  },
  {
    id: "money",
    label: "Money",
    icon: "money",
    items: [
      { href: "/app/finance", label: "Finance", icon: "money" },
      { href: "/app/tax", label: "Tax", icon: "tax" },
      { href: "/app/payments", label: "Payments", icon: "money" },
      { href: "/app/analytics", label: "Analytics", icon: "folder" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings",
    items: [
      { href: "/app/connections", label: "Integrations", icon: "settings" },
      { href: "/app/security", label: "Security", icon: "settings" },
      { href: "/app/privacy", label: "Privacy", icon: "settings" },
      { href: "/app/account", label: "Organizations", icon: "account" },
      { href: "/app/commercial", label: "Billing", icon: "money" },
      { href: "/app/developers", label: "Developer", icon: "folder" },
      { href: "/app/flags", label: "Feature Flags", icon: "folder" },
      { href: "/app/sync", label: "System Status", icon: "folder" },
    ],
  },
];

const pinnedHrefs = new Set(sidebarPrimary.flatMap((group) => group.items.map((item) => item.href)));

/** Remaining catalog items, excluding the six primary groups. */
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

export function groupContainsPath(pathname: string, group: { items: NavItem[] }) {
  return group.items.some((item) => isNavItemActive(pathname, item));
}

export const SIDEBAR_COLLAPSED_KEY = "atlas-sidebar-collapsed";
export const SIDEBAR_MORE_OPEN_KEY = "atlas-sidebar-more-open";
export const SIDEBAR_GROUP_OPEN_KEY = "atlas-sidebar-group-open";
