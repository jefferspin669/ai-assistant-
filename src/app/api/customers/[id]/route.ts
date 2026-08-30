import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { deleteCustomer, listCustomers } from "@/lib/services/workspace";
import { NotFoundError } from "@/lib/domain/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = resolveSession(req);
    const customer = listCustomers(session).find((row) => row.id === id);
    if (!customer) throw new NotFoundError("Customer not found.");
    return apiResponse(ok(customer));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = resolveSession(req);
    return apiResponse(ok(deleteCustomer(session, id)));
  } catch (error) {
    return jsonError(error);
  }
}
