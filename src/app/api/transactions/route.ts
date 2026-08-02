import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, readJson } from "@/lib/api/http";
import { err } from "@/lib/api/types";

export async function GET() {
  return apiResponse(atlasApi.transactions.list());
}

export async function POST(req: Request) {
  const body = await readJson(req);
  const users = atlasApi.users.list();
  const orgs = atlasApi.businesses.list();
  const userId = String(body.userId || body.user_id || (users.ok && users.data[0]?.id) || "");
  const orgId = String(body.orgId || body.organization_id || (orgs.ok && orgs.data[0]?.id) || "");
  if (!userId || !orgId) return apiResponse(err("user_id and organization_id are required.", 422));
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return apiResponse(err("amount must be a positive number.", 422));
  }
  return apiResponse(
    atlasApi.transactions.create({
      orgId,
      userId,
      kind: body.kind === "expense" ? "expense" : "income",
      label: String(body.label || body.title || "Transaction"),
      amount,
      category: String(body.category || "General"),
      date: String(body.date || new Date().toISOString().slice(0, 10)),
      receiptName: body.receiptName != null ? String(body.receiptName) : body.receipt_name != null ? String(body.receipt_name) : null,
    }),
  );
}
