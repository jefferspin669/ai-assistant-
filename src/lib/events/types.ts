/** Domain events. Things tell Atlas when they happen — Atlas does not poll. */

export type AtlasEventType =
  | "customer.created"
  | "customer.replied"
  | "customer.missed_call"
  | "appointment.created"
  | "appointment.cancelled"
  | "invoice.overdue"
  | "payment.received"
  | "lead.created"
  | "employee.clocked_in"
  | "employee.late"
  | "inventory.low"
  | "approval.granted"
  | "file.uploaded"
  | "call.missed"
  | "brain.completed";

export type AtlasEvent = {
  id: string;
  type: AtlasEventType;
  organizationId: string;
  actorId?: string;
  actorLabel?: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type EventHandler = (event: AtlasEvent) => void | Promise<void>;
