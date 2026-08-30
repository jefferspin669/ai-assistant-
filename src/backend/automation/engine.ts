import { onEvent } from "@/backend/events/bus";
import { addJob } from "@/backend/jobs/queue";
import type { AtlasEvent } from "@/backend/events/types";

let registered = false;

function hoursUntil(iso: string | undefined) {
  if (!iso) return Number.POSITIVE_INFINITY;
  return (new Date(iso).getTime() - Date.now()) / 36e5;
}

function handleCancelled(event: AtlasEvent) {
  const start = String(event.payload.startTime || event.payload.startsAt || "");
  const within72h = hoursUntil(start) <= 72;
  addJob(
    { userId: event.actorId || "atlas", organizationId: event.organizationId },
    within72h ? "waitlist-contact" : "cancellation-logged",
    {
      appointmentId: event.payload.appointmentId || event.payload.id,
      title: event.payload.title,
      within72h,
    },
  );
}

function handleMissedCall(event: AtlasEvent) {
  addJob(
    { userId: event.actorId || "atlas", organizationId: event.organizationId },
    "missed-call-follow-up",
    { from: event.payload.from, callId: event.payload.id },
  );
}

/** Subscribe domain events to jobs. Idempotent. */
export function registerAutomationHandlers() {
  if (registered) return;
  registered = true;
  onEvent("appointment.cancelled", handleCancelled);
  onEvent("customer.missed_call", handleMissedCall);
  onEvent("lead.created", (event) => {
    addJob(
      { userId: event.actorId || "atlas", organizationId: event.organizationId },
      "lead-qualification",
      event.payload,
    );
  });
}
