import { createCustomerSchema } from "@/lib/domain/schemas";
import { apiResponse, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { createCustomer, listCustomers } from "@/lib/services/workspace";

export async function GET(req: Request) {
  try {
    const ctx = resolveSession(req);
    return apiResponse(ok(listCustomers(ctx)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = resolveSession(req);
    const parsed = createCustomerSchema.parse(await readJson(req));
    return apiResponse(ok(createCustomer(ctx, parsed)));
  } catch (error) {
    return jsonError(error);
  }
}
