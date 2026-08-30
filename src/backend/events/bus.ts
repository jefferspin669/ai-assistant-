import { newId, nowIso } from "@/lib/db/store";
import { appendEvent, loadEvents } from "@/backend/events/store";
import type { AtlasEvent, AtlasEventType, EventHandler } from "@/backend/events/types";

const handlers = new Map<AtlasEventType | "*", Set<EventHandler>>();

export function onEvent(type: AtlasEventType | "*", handler: EventHandler) {
  const set = handlers.get(type) ?? new Set();
  set.add(handler);
  handlers.set(type, set);
  return () => set.delete(handler);
}

export function emitEvent(input: {
  type: AtlasEventType;
  organizationId: string;
  actorId?: string;
  actorLabel?: string;
  payload?: Record<string, unknown>;
}): AtlasEvent {
  const event: AtlasEvent = {
    id: newId("evtbus"),
    type: input.type,
    organizationId: input.organizationId,
    actorId: input.actorId,
    actorLabel: input.actorLabel,
    payload: input.payload || {},
    createdAt: nowIso(),
  };
  appendEvent(event);
  for (const handler of handlers.get(event.type) || []) handler(event);
  for (const handler of handlers.get("*") || []) handler(event);
  return event;
}

export function recentEvents(organizationId?: string, limit = 40) {
  const all = loadEvents();
  const scoped = organizationId ? all.filter((item) => item.organizationId === organizationId) : all;
  return scoped.slice(0, limit);
}
