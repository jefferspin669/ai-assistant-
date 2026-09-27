import { apiSuccess, withPermission } from "@/lib/api/http";
import { listOrgTransactions } from "@/lib/services/workspace";

// Tax liability requires filing status, entity type, jurisdiction, deductions and payments.
export const POST = withPermission("payments.read", async ({ workspace }) => {
  const year = new Date().getFullYear();
  const rows = listOrgTransactions(workspace).filter(
    (row) =>
      row.provenance !== "DEMO" &&
      row.category !== "invoice" &&
      row.date.startsWith(String(year)),
  );
  const income = rows
    .filter((row) => row.kind === "income")
    .reduce((total, row) => total + row.amount, 0);
  const expenses = rows
    .filter((row) => row.kind === "expense")
    .reduce((total, row) => total + row.amount, 0);
  return apiSuccess({
    year,
    income,
    expenses,
    net: income - expenses,
    taxDue: null,
    note: "Ledger summary only. Tax due requires a verified tax profile and professional review.",
  });
});
