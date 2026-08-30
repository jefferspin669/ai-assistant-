import { readJsonFile, writeJsonFile } from "@/lib/db/file-persist";
import type { AtlasEvent } from "@/backend/events/types";

const FILE = "atlas-events.json";
const CAP = 400;

type EventLog = { events: AtlasEvent[] };

export function loadEvents(): AtlasEvent[] {
  return (readJsonFile<EventLog>(FILE) || { events: [] }).events;
}

export function appendEvent(event: AtlasEvent) {
  const events = [event, ...loadEvents()].slice(0, CAP);
  writeJsonFile(FILE, { events });
  return event;
}
