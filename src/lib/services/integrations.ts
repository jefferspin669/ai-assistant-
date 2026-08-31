import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { SessionContext } from "@/lib/domain/types";
import { database, requireOrgMember } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";
import {
  calendarOAuthConfigured,
  calendarReconnectUrl,
  disconnectCalendar,
  refreshConnectedTokens,
  type CalendarProvider,
} from "@/lib/integrations/calendar";

const CATALOG = [
  { id: "gmail", provider: "gmail", label: "Gmail" },
  { id: "google-calendar", provider: "google-calendar", label: "Google Calendar" },
  { id: "stripe", provider: "stripe", label: "Stripe" },
  { id: "quickbooks", provider: "quickbooks", label: "QuickBooks" },
  { id: "twilio", provider: "twilio", label: "Phone" },
];

export function listIntegrations(ctx: SessionContext) {
  const db = database();
  requireOrgMember(db, ctx);
  const existing = db.integrations.filter((row) => row.organization_id === ctx.organizationId);
  return CATALOG.map((item) => {
    const row = existing.find((entry) => entry.provider === item.provider);
    return (
      row || {
        id: item.id,
        organization_id: ctx.organizationId,
        provider: item.provider,
        status: "disconnected" as const,
        account_label: null,
        last_error: null,
        updated_at: nowIso(),
      }
    );
  });
}

export function setIntegrationStatus(
  ctx: SessionContext,
  provider: string,
  status: "connected" | "expired" | "error" | "disconnected",
  accountLabel?: string | null,
) {
  const db = database();
  requireOrgMember(db, ctx);
  const current = db.integrations.find(
    (row) => row.organization_id === ctx.organizationId && row.provider === provider,
  );
  const row = {
    id: current?.id || provider,
    organization_id: ctx.organizationId,
    provider,
    status,
    account_label: status === "disconnected" ? null : accountLabel || current?.account_label || `${provider} account`,
    last_error: status === "error" ? "Provider returned an error." : null,
    updated_at: nowIso(),
  };
  const rest = db.integrations.filter(
    (item) => !(item.organization_id === ctx.organizationId && item.provider === provider),
  );
  saveDatabase({ ...db, integrations: [row, ...rest] });
  writeAudit(ctx, {
    action: status === "disconnected" ? `removed ${provider} connection` : `updated ${provider} connection`,
    entityType: "integration",
    entityId: provider,
  });
  return row;
}

export function ingestWebhook(ctx: SessionContext, eventId: string) {
  const db = database();
  requireOrgMember(db, ctx);
  if (
    db.webhook_receipts.some(
      (row) => row.id === eventId && row.organization_id === ctx.organizationId,
    )
  ) {
    return { accepted: false, ignored: true as const, eventId };
  }
  saveDatabase({
    ...db,
    webhook_receipts: [
      { id: eventId, organization_id: ctx.organizationId, received_at: nowIso() },
      ...db.webhook_receipts,
    ],
  });
  return { accepted: true, ignored: false as const, eventId };
}

function calendarProvider(provider: string): CalendarProvider | null {
  if (provider === "google" || provider === "google-calendar") return "google";
  if (provider === "microsoft" || provider === "microsoft-calendar") return "microsoft";
  return null;
}

export async function reconnectIntegration(ctx: SessionContext, provider: string) {
  const db = database();
  requireOrgMember(db, ctx);
  const cal = calendarProvider(provider);
  if (cal) {
    disconnectCalendar(cal);
    setIntegrationStatus(ctx, provider === "google" ? "google-calendar" : provider, "disconnected");
    writeAudit(ctx, {
      action: `reconnect ${provider}`,
      entityType: "integration",
      entityId: provider,
    });
    const configured = calendarOAuthConfigured(cal);
    return {
      provider,
      action: "reconnect" as const,
      configured,
      url: configured ? calendarReconnectUrl(cal, `org:${ctx.organizationId}`) : null,
    };
  }
  setIntegrationStatus(ctx, provider, "expired");
  writeAudit(ctx, {
    action: `reconnect ${provider}`,
    entityType: "integration",
    entityId: provider,
  });
  return { provider, action: "reconnect" as const, configured: false, url: null };
}

export async function refreshIntegrationTokens(ctx: SessionContext) {
  requireOrgMember(database(), ctx);
  const refreshed = await refreshConnectedTokens();
  writeAudit(ctx, {
    action: "refreshed integration tokens",
    entityType: "integration",
    entityId: ctx.organizationId,
  });
  return { refreshed };
}
