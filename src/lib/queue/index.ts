import { enqueueJob, processJobs } from "@/lib/services/jobs";
import type { SessionContext } from "@/lib/domain/types";
import { queueDriver } from "@/lib/queue/env";
import { laneForKind } from "@/lib/queue/lanes";

export { queueDriver, redisUrl } from "@/lib/queue/env";
export type { QueueDriver } from "@/lib/queue/env";

export async function enqueueBackgroundJob(
  ctx: Pick<SessionContext, "userId" | "organizationId">,
  kind: string,
  payload: Record<string, unknown>,
) {
  return enqueueJob(
    {
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      role: "owner",
      sessionId: "queue",
    },
    kind,
    { ...payload, userId: ctx.userId, lane: laneForKind(kind) },
  );
}

export function drainFileQueue(limit = 20) {
  return processJobs(limit);
}
