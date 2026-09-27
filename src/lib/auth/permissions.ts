import type { OrgRole, Permission, SessionContext } from "@/lib/domain/types";
import { AuthorizationError } from "@/lib/domain/errors";

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
    "customers.read",
    "customers.write",
    "tasks.read",
    "tasks.write",
    "calendar.read",
    "calendar.write",
    "payments.read",
    "payments.refund",
    "actions.sms",
    "actions.invoice",
    "workspace.read",
    "workspace.write",
    "employees.manage",
    "atlas.autonomous",
    "audit.read",
  ],
  admin: [
    "customers.read",
    "customers.write",
    "tasks.read",
    "tasks.write",
    "calendar.read",
    "calendar.write",
    "payments.read",
    "payments.refund",
    "actions.sms",
    "actions.invoice",
    "workspace.read",
    "workspace.write",
    "employees.manage",
    "audit.read",
  ],
  manager: [
    "customers.read",
    "customers.write",
    "tasks.read",
    "tasks.write",
    "calendar.read",
    "calendar.write",
    "payments.read",
    "actions.sms",
    "actions.invoice",
    "workspace.read",
    "workspace.write",
    "audit.read",
  ],
  employee: [
    "customers.read",
    "tasks.read",
    "tasks.write",
    "calendar.read",
    "calendar.write",
    "workspace.read",
  ],
  accountant: [
    "customers.read",
    "payments.read",
    "actions.invoice",
    "workspace.read",
    "audit.read",
  ],
  viewer: ["customers.read", "tasks.read", "calendar.read", "workspace.read"],
};

export function permissionsFor(role: OrgRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(ctx: SessionContext, permission: Permission): boolean {
  return permissionsFor(ctx.role).includes(permission);
}

export function requirePermission(ctx: SessionContext, permission: Permission) {
  if (!hasPermission(ctx, permission)) {
    throw new AuthorizationError(`Missing permission: ${permission}`);
  }
}

export const OWNER_ONLY_PATHS = ["/app/admin", "/app/governance", "/app/architecture"];
