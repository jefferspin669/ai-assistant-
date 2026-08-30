/** Domain events Atlas reacts to. Things tell Atlas when they happen. */

export type AtlasEventType =
  | "customer.created"
  | "customer.missed_call"
  | "appointment.created"
  | "appointment.cancelled"
  | "invoice.overdue"
  | "payment.received"
  | "lead.created"
  | "employee.clocked_in"
  | "employee.late"
  | "inventory.low"
  | "review.received"
  | "brain.completed"
  | "approval.granted"
  | "file.uploaded";

export type AtlasEvent = {
  id: string;
  type: AtlasEventType;
  organizationId: string;
  actorId?: string;
  actorLabel?: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type EventHandler = (event: AtlasEvent) => void;
