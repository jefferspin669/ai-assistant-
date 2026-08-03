import { NextResponse } from "next/server";
import { databaseStats, loadDatabase } from "@/lib/db/store";
import { dataDir, fileExists } from "@/lib/db/file-persist";
import { workspaceStats } from "@/lib/backend/workspace-store";

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
      workspaceFile: fileExists("workspace.json") ? "file:.data/workspace.json" : "memory-seeding",
      dataDir: dataDir(),
      workspace: workspaceStats(),
      stats,
    },
  });
}
