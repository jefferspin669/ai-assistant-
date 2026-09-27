import { z } from "zod";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { createEmployee, listEmployees } from "@/lib/services/employees";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  role: z.string().max(80).optional(),
  department: z.string().max(80).optional(),
  accessCode: z.string().min(4).max(32).optional(),
});

export const GET = withPermission("employees.manage", async ({ workspace }) => {
  const employees = listEmployees(workspace.organizationId).map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.role,
    department: e.department,
    userId: e.userId,
    createdAt: e.createdAt,
  }));
  return apiSuccess({ employees });
});

export const POST = withPermission("employees.manage", async ({ workspace, body }) => {
  const parsed = parseBody(createSchema, body);
  const result = createEmployee(workspace, parsed);
  return apiSuccess({
    employee: {
      id: result.employee.id,
      name: result.employee.name,
      email: result.employee.email,
      role: result.employee.role,
      department: result.employee.department,
      organizationId: result.employee.organizationId,
    },
    /** Shown once — store securely; not returned on later GETs. */
    accessCode: result.accessCode,
  });
});
