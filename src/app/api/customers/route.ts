import { createCustomerSchema } from "@/lib/domain/schemas";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { createCustomer, listCustomers } from "@/lib/services/workspace";

export const GET = withPermission("customers.read", async ({ workspace }) => {
  return apiSuccess(listCustomers(workspace));
});

export const POST = withPermission("customers.write", async ({ workspace, body }) => {
  return apiSuccess(createCustomer(workspace, parseBody(createCustomerSchema, body)));
});
