import type { AtlasEvent } from "@/lib/events/types";
import { enqueueBackgroundJob } from "@/lib/queue";

function hoursUntil(iso: unknown) {
  const raw = String(iso || "");
  if (!raw) return Number.POSITIVE_INFINITY;
  return (new Date(raw).getTime() - Date.now()) / 36e5;
}

/** Event → job. Atlas reacts instead of polling. */
export async function routeEvent(event: AtlasEvent) {
  const ctx = {
    userId: event.actorId || "atlas",
    organizationId: event.organizationId,
  };

  switch (event.type) {
    case "appointment.cancelled": {
      const within72h = hoursUntil(event.payload.startTime || event.payload.startsAt) <= 72;
      await enqueueBackgroundJob(ctx, within72h ? "waitlist-contact" : "cancellation-logged", {
        appointmentId: event.payload.id,
        title: event.payload.title,
        within72h,
      });
      return;
    }
    case "customer.missed_call":
    case "call.missed":
      await enqueueBackgroundJob(
        ctx,
        event.payload.handled ? "missed-call-logged" : "missed-call-follow-up",
        event.payload,
      );
      return;
    case "lead.created":
      await enqueueBackgroundJob(ctx, "lead-qualification", event.payload);
      return;
    case "invoice.overdue":
      await enqueueBackgroundJob(ctx, "invoice-overdue-reminder", event.payload);
      return;
    case "payment.received":
      await enqueueBackgroundJob(ctx, "payment-received-ack", event.payload);
      return;
    case "file.uploaded":
      await enqueueBackgroundJob(ctx, "file-indexed", event.payload);
      return;
    default:
      return;
  }
}
