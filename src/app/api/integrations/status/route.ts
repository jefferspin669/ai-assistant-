import { NextResponse } from "next/server";
import { integrationStatus } from "@/lib/integrations/config";
import { getConnectedProviders } from "@/lib/integrations/calendar";
import { listMissedCalls } from "@/lib/integrations/twilio";
import { atlasStore } from "@/lib/integrations/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      storeMode: atlasStore.mode(),
      integrations: integrationStatus(),
      calendarsConnected: getConnectedProviders(),
      missedCalls: listMissedCalls().slice(0, 10),
    },
  });
}
