import { NextResponse } from "next/server";
import { databaseStats, loadDatabase } from "@/lib/db/store";
import { dataDir, fileExists } from "@/lib/db/file-persist";
import { workspaceStats } from "@/lib/backend/workspace-store";
import { integrationStatus } from "@/lib/integrations/config";
import { atlasStore } from "@/lib/integrations/supabase";
import { queueDriver } from "@/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = loadDatabase();
  const stats = databaseStats(db);
  return NextResponse.json({
    ok: true,
    data: {
      status: "ok",
      engine: "atlas-database-v5",
      persistence: fileExists("atlas-db.json") ? "file:.data/atlas-db.json" : "memory-seeding",
      businessStore: atlasStore.mode(),
      workspaceFile: fileExists("workspace.json") ? "file:.data/workspace.json" : "memory-seeding",
      dataDir: dataDir(),
      integrations: integrationStatus(),
      workspace: workspaceStats(),
      stats,
      kernel: {
        queue: queueDriver(),
        brain: "src/backend/ai/pipeline",
        events: "src/backend/events",
      },
    },
  });
}
