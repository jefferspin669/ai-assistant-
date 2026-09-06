import { apiSuccess, withAuth } from "@/lib/api/http";
import { employeeFromSession } from "@/lib/services/employees";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ workspace }) => {
  return apiSuccess({ employee: employeeFromSession(workspace) });
});
