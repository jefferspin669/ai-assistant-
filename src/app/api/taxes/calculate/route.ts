import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse } from "@/lib/api/http";

export async function POST() {
  return apiResponse(atlasApi.taxes.estimate());
}
