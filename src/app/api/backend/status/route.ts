import { NextResponse } from "next/server";
import {
  BACKEND_MODULES,
  BACKEND_PHASES,
  NOT_YET,
  DEFAULT_ACTION_POLICIES,
  listActivity,
  queueDriver,
  recentEvents,
} from "@/backend";
import { database } from "@/lib/services/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = database();
  const orgId = db.organizations[0]?.id;
  return NextResponse.json({
    ok: true,
    data: {
      runtime: "next.js-modules",
      nestjs: "later-extract",
      queue: queueDriver(),
      phases: BACKEND_PHASES,
      modules: BACKEND_MODULES,
      notYet: NOT_YET,
      policies: DEFAULT_ACTION_POLICIES,
      events: recentEvents(orgId, 12),
      activity: orgId ? listActivity(orgId).slice(0, 12) : [],
      jobsQueued: db.jobs.filter((job) => job.status === "queued").length,
    },
  });
}
