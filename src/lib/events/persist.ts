import { getDrizzle, hasPostgres } from "@/lib/db/postgres";
import { domainEvents } from "@/lib/db/drizzle-schema";
import type { AtlasEvent } from "@/lib/events/types";

export async function persistEvent(event: AtlasEvent) {
  if (!hasPostgres()) return;
  const pg = getDrizzle();
  await pg.insert(domainEvents).values({
    id: event.id,
    organizationId: event.organizationId,
    type: event.type,
    payload: event.payload,
    actorId: event.actorId,
    actorLabel: event.actorLabel,
    createdAt: event.createdAt,
  });
}
