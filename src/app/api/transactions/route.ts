import { createTransactionSchema } from "@/lib/domain/schemas";
import { apiSuccess, parseBody, withWorkspace } from "@/lib/api/http";
import { createOrgTransaction, listOrgTransactions } from "@/lib/services/workspace";

export const GET = withWorkspace(async ({ workspace }) => {
  return apiSuccess(listOrgTransactions(workspace));
});

export const POST = withWorkspace(async ({ workspace, body }) => {
  return apiSuccess(createOrgTransaction(workspace, parseBody(createTransactionSchema, body)));
});
