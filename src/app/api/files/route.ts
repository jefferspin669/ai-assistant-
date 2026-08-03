import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return apiResponse(atlasApi.files.list());
}
