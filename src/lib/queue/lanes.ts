import type { WorkerLane } from "@/lib/orchestrator/types";

/** Logical lanes on the existing atlas-jobs queue — not a second queue engine. */
export function laneForKind(kind: string): WorkerLane {
  const k = kind.toLowerCase();
  if (k.includes("sms") || k.includes("twilio") || k.includes("missed-call") || k.includes("waitlist") || k === "send_message") {
    return "sms";
  }
  if (k.includes("email") || k.includes("resend") || k.includes("invoice-overdue")) return "email";
  if (k.includes("payment") || k.includes("refund") || k.includes("stripe") || k.includes("vendor")) return "payment";
  if (k.includes("calendar") || k.includes("appointment")) return "calendar";
  if (k.includes("orchestrator") || k.includes("brain") || k.includes("ai")) return "ai";
  if (k.includes("automation") || k.includes("lead")) return "automation";
  return "maintenance";
}
