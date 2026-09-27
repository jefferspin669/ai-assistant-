/**
 * Capability registry — what Atlas can actually do right now.
 * Status comes from existing integration config + org connection rows.
 * Permissions stay in src/lib/auth/permissions.ts (not a second engine).
 */

import type { SessionContext, Permission } from "@/lib/domain/types";
import { hasPermission } from "@/lib/auth/permissions";
import { requireLive, integrationStatus } from "@/lib/integrations/config";
import { database } from "@/lib/services/access";
import type { Capability, CapabilityStatus } from "@/lib/orchestrator/types";

function orgProviderStatus(organizationId: string, provider: string): CapabilityStatus | null {
  const row = database().integrations.find(
    (item) => item.organization_id === organizationId && item.provider === provider,
  );
  if (!row) return null;
  if (row.status === "connected") return "AVAILABLE";
  if (row.status === "disconnected") return "DISCONNECTED";
  return "UNAVAILABLE";
}

function fromLive(id: Parameters<typeof requireLive>[0], connected?: CapabilityStatus | null): CapabilityStatus {
  if (connected === "DISCONNECTED" || connected === "UNAVAILABLE") return connected;
  if (requireLive(id)) return "AVAILABLE";
  return "SIMULATED";
}

export function listCapabilities(ctx: Pick<SessionContext, "organizationId" | "role">): Capability[] {
  const orgId = ctx.organizationId;
  const live = Object.fromEntries(integrationStatus().map((row) => [row.id, row]));

  return [
    {
      id: "send_sms",
      label: "Send SMS",
      provider: "Twilio",
      permission: "customers.write",
      approval: "conditional",
      status: fromLive("twilio"),
      lane: "sms",
      detail: live.twilio?.detail || "",
    },
    {
      id: "twilio_call",
      label: "Place a call",
      provider: "Twilio",
      permission: "customers.write",
      approval: "conditional",
      status: fromLive("twilio"),
      lane: "sms",
      detail: live.twilio?.detail || "",
    },
    {
      id: "send_email",
      label: "Send email",
      provider: "Gmail",
      permission: "customers.write",
      approval: "conditional",
      status: orgProviderStatus(orgId, "gmail") || (requireLive("resend") ? "AVAILABLE" : "DISCONNECTED"),
      lane: "email",
      detail: orgProviderStatus(orgId, "gmail")
        ? "Org Gmail connection"
        : requireLive("resend")
          ? "Resend live"
          : "Gmail disconnected — Resend unset",
    },
    {
      id: "refund_payment",
      label: "Refund a payment",
      provider: "Stripe",
      permission: "payments.refund",
      approval: "REQUIRED",
      status: fromLive("stripe", orgProviderStatus(orgId, "stripe")),
      lane: "payment",
      detail: live.stripe?.detail || "",
    },
    {
      id: "stripe_invoice",
      label: "Create / send invoice",
      provider: "Stripe",
      permission: "payments.read",
      approval: "conditional",
      status: fromLive("stripe", orgProviderStatus(orgId, "stripe")),
      lane: "payment",
      detail: live.stripe?.detail || "",
    },
    {
      id: "calendar_create",
      label: "Create calendar event",
      provider: "Google Calendar",
      permission: "calendar.write",
      approval: "none",
      status: fromLive("google_calendar", orgProviderStatus(orgId, "google-calendar")),
      lane: "calendar",
      detail: live.google_calendar?.detail || "",
    },
    {
      id: "quickbooks_post",
      label: "Post to QuickBooks",
      provider: "QuickBooks",
      permission: "payments.read",
      approval: "conditional",
      status: orgProviderStatus(orgId, "quickbooks") || "UNAVAILABLE",
      lane: "payment",
      detail: "No QuickBooks adapter until the org connects it",
    },
    {
      id: "run_payroll",
      label: "Run payroll",
      provider: "none",
      permission: "employees.manage",
      approval: "REQUIRED",
      status: "UNAVAILABLE",
      lane: "maintenance",
      detail: "Atlas does not run payroll",
    },
  ];
}

export function getCapability(ctx: Pick<SessionContext, "organizationId" | "role">, id: string) {
  return listCapabilities(ctx).find((row) => row.id === id) || null;
}

export function assertCapabilityAvailable(cap: Capability | null, id: string) {
  if (!cap) return { ok: false as const, reason: `Unknown capability: ${id}` };
  if (cap.status === "UNAVAILABLE" || cap.status === "DISCONNECTED") {
    return { ok: false as const, reason: `${cap.label} is ${cap.status} (${cap.provider}). Atlas cannot pretend it completed this.` };
  }
  return { ok: true as const, capability: cap };
}

export function canUseCapability(ctx: SessionContext, cap: Capability) {
  if (cap.permission && !hasPermission(ctx, cap.permission as Permission)) {
    return { ok: false as const, reason: `Missing permission ${cap.permission}` };
  }
  return assertCapabilityAvailable(cap, cap.id);
}
