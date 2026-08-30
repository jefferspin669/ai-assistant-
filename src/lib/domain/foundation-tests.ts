import { decodeAtlasAction, executeAtlasAction } from "@/lib/domain/actions";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/domain/errors";
import { createCustomerSchema } from "@/lib/domain/schemas";
import { loadEnv } from "@/lib/env";
import { sessionFromToken } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { newId, resetDatabase, saveDatabase } from "@/lib/db/store";
import { database, testSession } from "@/lib/services/access";
import { ingestWebhook } from "@/lib/services/integrations";
import {
  createCustomer,
  createOrgTask,
  createOrgTransaction,
  deleteCustomer,
  listCustomers,
  listOrgTasks,
} from "@/lib/services/workspace";

export type FoundationTest = { name: string; ok: boolean; detail: string };

function result(name: string, fn: () => void): FoundationTest {
  try {
    fn();
    return { name, ok: true, detail: "passed" };
  } catch (error) {
    return { name, ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

export function runFoundationTests(): FoundationTest[] {
  resetDatabase();
  const db = database();
  const owner = db.users[0];
  const org = db.organizations[0];
  if (!owner || !org) {
    return [{ name: "seed workspace", ok: false, detail: "Missing seeded user/org" }];
  }
  const ctxA = testSession(owner.id, org.id, "owner");
  const outsiderId = newId("user");
  const otherOrgId = newId("org");
  const employeeId = newId("user");
  const stamp = new Date().toISOString();
  const snap = database();
  saveDatabase({
    ...snap,
    users: [
      ...snap.users,
      {
        id: outsiderId,
        email: "outsider@atlas.ai",
        full_name: "Outsider",
        profile_image: null,
        timezone: "America/Chicago",
        preferred_language: "en",
        email_verified_at: stamp,
        created_at: stamp,
        updated_at: stamp,
      },
      {
        id: employeeId,
        email: "worker@atlas.ai",
        full_name: "Worker",
        profile_image: null,
        timezone: "America/Chicago",
        preferred_language: "en",
        email_verified_at: stamp,
        created_at: stamp,
        updated_at: stamp,
      },
    ],
    organizations: [
      ...snap.organizations,
      {
        id: otherOrgId,
        owner_id: outsiderId,
        business_name: "Other Co",
        logo_url: null,
        business_type: "HVAC",
        tax_structure: "LLC",
        state: "TX",
        created_at: stamp,
      },
    ],
    organization_members: [
      ...snap.organization_members,
      {
        id: newId("om"),
        organization_id: otherOrgId,
        user_id: outsiderId,
        role: "owner",
        status: "active",
        joined_at: stamp,
      },
      {
        id: newId("om"),
        organization_id: org.id,
        user_id: employeeId,
        role: "employee",
        status: "active",
        joined_at: stamp,
      },
    ],
  });
  const ctxB = testSession(outsiderId, otherOrgId, "owner");
  const ctxCross = testSession(outsiderId, org.id, "owner");
  const employeeCtx = testSession(employeeId, org.id, "employee");

  const created = createCustomer(ctxA, { name: "Sarah Chen", email: "sarah@example.com" });
  createOrgTask(ctxA, { title: "Persist me" });

  return [
    result("User cannot access another organization", () => {
      const visible = listCustomers(ctxB);
      if (visible.some((row) => row.id === created.id)) {
        throw new Error("Leaked customer across organizations.");
      }
    }),
    result("Outsider cannot list another org's customers", () => {
      let threw = false;
      try {
        listCustomers(ctxCross);
      } catch (error) {
        threw = error instanceof AuthorizationError;
      }
      if (!threw) throw new Error("Expected AuthorizationError");
    }),
    result("Unauthorized API calls return 401", () => {
      let threw = false;
      try {
        sessionFromToken(null);
      } catch (error) {
        threw = error instanceof AuthenticationError && error.status === 401;
      }
      if (!threw) throw new Error("Expected AuthenticationError 401");
    }),
    result("Employee cannot access owner-only permissions", () => {
      if (hasPermission(employeeCtx, "employees.manage") || hasPermission(employeeCtx, "payments.refund")) {
        throw new Error("Employee must not have owner-only permissions.");
      }
    }),
    result("Deleting a customer requires organization membership", () => {
      let threw = false;
      try {
        deleteCustomer(ctxCross, created.id);
      } catch (error) {
        threw = error instanceof AuthorizationError;
      }
      if (!threw) throw new Error("Expected AuthorizationError");
    }),
    result("Creating a task persists in the workspace", () => {
      const again = listOrgTasks(ctxA);
      if (!again.some((task) => task.title === "Persist me")) {
        throw new Error("Task missing after write.");
      }
    }),
    result("Calendar event belongs to the correct organization", () => {
      const action = executeAtlasAction(
        {
          type: "CREATE_APPOINTMENT",
          payload: {
            customerId: created.id,
            startTime: "2026-09-01T14:00:00.000Z",
            endTime: "2026-09-01T15:00:00.000Z",
          },
        },
        ctxA,
      );
      if (action.type !== "CREATE_APPOINTMENT") throw new Error("Wrong action");
      if (action.event.organizationId !== org.id) throw new Error("Wrong org on event");
    }),
    result("Invalid customer payload returns 400", () => {
      const parsed = createCustomerSchema.safeParse({ name: "" });
      if (parsed.success) throw new Error("Empty name should fail");
    }),
    result("Deleted customer cannot be fetched", () => {
      const doomed = createCustomer(ctxA, { name: "Temp Delete" });
      deleteCustomer(ctxA, doomed.id);
      if (listCustomers(ctxA).some((row) => row.id === doomed.id)) {
        throw new Error("Deleted customer still listed.");
      }
      let threw = false;
      try {
        deleteCustomer(ctxA, doomed.id);
      } catch (error) {
        threw = error instanceof NotFoundError;
      }
      if (!threw) throw new Error("Expected NotFoundError");
    }),
    result("Duplicate transaction is not inserted", () => {
      const payload = {
        kind: "income" as const,
        label: "Johnson invoice",
        amount: 1200,
        date: "2026-08-01",
      };
      createOrgTransaction(ctxA, payload);
      let threw = false;
      try {
        createOrgTransaction(ctxA, payload);
      } catch (error) {
        threw = error instanceof ConflictError;
      }
      if (!threw) throw new Error("Expected ConflictError");
    }),
    result("Duplicate webhooks are ignored", () => {
      const first = ingestWebhook(ctxA, "wh_dup_1");
      const second = ingestWebhook(ctxA, "wh_dup_1");
      if (!first.accepted || second.accepted || !second.ignored) {
        throw new Error("Duplicate webhook must be ignored.");
      }
    }),
    result("Atlas cannot execute unknown actions", () => {
      let threw = false;
      try {
        decodeAtlasAction({ type: "DROP_DATABASE", payload: {} });
      } catch (error) {
        threw = error instanceof ValidationError;
      }
      if (!threw) throw new Error("Expected ValidationError");
    }),
    result("Sensitive SEND_MESSAGE requires approval", () => {
      const action = executeAtlasAction(
        {
          type: "SEND_MESSAGE",
          payload: { customerId: created.id, message: "See you tomorrow." },
        },
        ctxA,
      );
      if (action.type !== "SEND_MESSAGE" || !action.requiresApproval) {
        throw new Error("Message must not send without approval.");
      }
    }),
    result("Missing production secret fails env validation", () => {
      let threw = false;
      try {
        loadEnv({ NODE_ENV: "production", ATLAS_APP_PASSWORD: "" });
      } catch {
        threw = true;
      }
      if (!threw) throw new Error("Empty production password should fail");
    }),
  ];
}
