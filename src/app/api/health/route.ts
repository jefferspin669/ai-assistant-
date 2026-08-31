import { NextResponse } from "next/server";
import { databaseStats, loadDatabase } from "@/lib/db/store";
import { dataDir, fileExists } from "@/lib/db/file-persist";
import { workspaceStats } from "@/lib/backend/workspace-store";
import { integrationStatus } from "@/lib/integrations/config";
import { atlasStore } from "@/lib/integrations/supabase";
import { pingPostgres, hasPostgres } from "@/lib/db/postgres";
import { pingRedis } from "@/lib/redis";
import { queueDriver } from "@/lib/queue/env";
import { databaseDriver } from "@/lib/db/driver";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { supabaseAuthConfigured } from "@/lib/auth/supabase-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ensure = await ensureServerDatabase();
  const db = loadDatabase();
  const stats = databaseStats(db);
  const postgres = await pingPostgres();
  const redis = await pingRedis();
  const driver = databaseDriver();
  return NextResponse.json({
    ok: true,
    data: {
      status: "ok",
      engine: "atlas-database-v5",
      driver,
      persistence:
        driver === "postgres"
          ? `postgres:${ensure.source}`
          : fileExists("atlas-db.json")
            ? "file:.data/atlas-db.json"
            : "memory-seeding",
      postgres: {
        configured: hasPostgres(),
        ...postgres,
      },
      redis,
      queue: queueDriver(),
      auth: supabaseAuthConfigured() ? "supabase+atlas_session" : "atlas_session",
      businessStore: atlasStore.mode(),
      workspaceFile: fileExists("workspace.json") ? "file:.data/workspace.json" : "memory-seeding",
      dataDir: dataDir(),
      integrations: integrationStatus(),
      workspace: workspaceStats(),
      stats,
    },
  });
}
