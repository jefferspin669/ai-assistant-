import { NextResponse } from "next/server";
import { databaseStats, loadDatabase } from "@/lib/db/store";
import { dataDir, fileExists } from "@/lib/db/file-persist";
import { workspaceStats } from "@/lib/backend/workspace-store";
import { integrationStatus } from "@/lib/integrations/config";
import { atlasStore } from "@/lib/integrations/supabase";
import { pingPostgres, hasPostgres } from "@/lib/db/postgres";
import { pingRedis } from "@/lib/redis";
import { queueDriver } from "@/lib/queue/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = loadDatabase();
  const stats = databaseStats(db);
  const postgres = await pingPostgres();
  const redis = await pingRedis();
  return NextResponse.json({
    ok: true,
    data: {
      status: "ok",
      engine: "atlas-database-v5",
      persistence: fileExists("atlas-db.json") ? "file:.data/atlas-db.json" : "memory-seeding",
      postgres: {
        configured: hasPostgres(),
        ...postgres,
      },
      redis,
      queue: queueDriver(),
      businessStore: atlasStore.mode(),
      workspaceFile: fileExists("workspace.json") ? "file:.data/workspace.json" : "memory-seeding",
      dataDir: dataDir(),
      integrations: integrationStatus(),
      workspace: workspaceStats(),
      stats,
    },
  });
}
