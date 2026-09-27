import { newId, nowIso } from "@/lib/db/store";
import type { AtlasEvent, AtlasEventType, EventHandler } from "@/lib/events/types";

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

  if (typeof window === "undefined") {
    void import("@/lib/events/persist").then((mod) => mod.persistEvent(event)).catch(() => undefined);
    void import("@/lib/events/router").then((mod) => mod.routeEvent(event)).catch((error) => {
      console.error("[atlas:events]", error instanceof Error ? error.message : error);
    });
  }

  for (const handler of handlers.get(event.type) || []) void handler(event);
  for (const handler of handlers.get("*") || []) void handler(event);
  return event;
}
