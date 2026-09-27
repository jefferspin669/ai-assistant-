import type { AtlasEvent } from "@/lib/events/types";
import { enqueueBackgroundJob } from "@/lib/queue";
import { database } from "@/lib/services/access";

function hoursUntil(iso: unknown) {
  const raw = String(iso || "");
  if (!raw) return Number.POSITIVE_INFINITY;
  return (new Date(raw).getTime() - Date.now()) / 36e5;
}

export type EventRoute = {
  eventId: string;
  type: AtlasEvent["type"];
  jobs: string[];
  automations: string[];
  orchestratorIntent?: string;
};

function matchingAutomations(event: AtlasEvent) {
  const trigger = event.type.replace(".", "_");
  return database().automations.filter(
    (row) =>
      row.organization_id === event.organizationId &&
      row.enabled &&
      (row.trigger === event.type || row.trigger === trigger || row.trigger === event.type.split(".")[1]),
  );
}

function ownerCtx(organizationId: string) {
  const member =
    database().organization_members.find(
      (row) => row.organization_id === organizationId && row.role === "owner" && row.status === "active",
    ) || database().organization_members.find((row) => row.organization_id === organizationId && row.status === "active");
  return {
    userId: member?.user_id || eventActor(organizationId),
    organizationId,
  };
}

function eventActor(organizationId: string) {
  return database().organizations.find((row) => row.id === organizationId)?.owner_id || "atlas";
}

/** Who cares about this event? Extends the existing event → job map; does not replace webhooks. */
export function subscribersFor(event: AtlasEvent): EventRoute {
  const jobs: string[] = [];
  let orchestratorIntent: string | undefined;
  switch (event.type) {
    case "appointment.cancelled":
      jobs.push(hoursUntil(event.payload.startTime || event.payload.startsAt) <= 72 ? "waitlist-contact" : "cancellation-logged");
      break;
    case "customer.missed_call":
    case "call.missed":
      jobs.push(event.payload.handled ? "missed-call-logged" : "missed-call-follow-up");
      break;
    case "lead.created":
      jobs.push("lead-qualification");
      break;
    case "invoice.overdue":
      orchestratorIntent = "recover_invoice";
      break;
    case "payment.received":
      jobs.push("payment-received-ack");
      break;
    case "file.uploaded":
      jobs.push("file-indexed");
      break;
    case "email.received":
      jobs.push("email-triage");
      break;
    case "inventory.low":
      jobs.push("inventory-alert");
      break;
    case "employee.clocked_in":
      jobs.push("employee-clock-ack");
      break;
    case "customer.created":
      jobs.push("customer-welcome");
      break;
    default:
      break;
  }
  return {
    eventId: event.id,
    type: event.type,
    jobs,
    automations: matchingAutomations(event).map((row) => row.name),
    orchestratorIntent,
  };
}

/** Event → job / automation / orchestrator. Atlas reacts instead of polling. */
export async function routeEvent(event: AtlasEvent) {
  const route = subscribersFor(event);
  const ctx = ownerCtx(event.organizationId);

  for (const kind of route.jobs) {
    await enqueueBackgroundJob(ctx, kind, event.payload);
  }
  for (const name of route.automations) {
    await enqueueBackgroundJob(ctx, `automation:${name}`, { ...event.payload, automation: name });
  }
  if (route.orchestratorIntent) {
    const customer = String(event.payload.customerName || event.payload.name || event.payload.customer || "the customer");
    const goal = `Get ${customer}'s overdue invoice paid.`;
    await import("@/lib/orchestrator").then((mod) =>
      mod.orchestrate(
        {
          userId: ctx.userId,
          organizationId: ctx.organizationId,
          role: "owner",
          sessionId: "orchestrator",
        },
        goal,
      ),
    );
  }
  return route;
}
