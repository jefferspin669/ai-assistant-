import "server-only";
import { fileExists, readJsonFile, writeJsonFile } from "@/lib/db/file-persist";
import { AuthenticationError, ValidationError } from "@/lib/domain/errors";
import type { SessionContext } from "@/lib/domain/types";
import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import { database } from "@/lib/services/access";
import { createSession } from "@/lib/auth/session";
import { writeAudit } from "@/lib/services/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type ServerEmployee = {
  id: string;
  organizationId: string;
  userId: string | null;
  name: string;
  email: string;
  role: string;
  department: string;
  accessCodeHash: string;
  status: "active" | "disabled";
  createdAt: string;
};

type EmployeeStore = {
  updatedAt: string;
  employees: ServerEmployee[];
};

const EMPLOYEE_FILE = "employees.json";

type AtlasGlobal = typeof globalThis & { __atlasEmployees?: EmployeeStore };

function emptyStore(): EmployeeStore {
  return { updatedAt: new Date().toISOString(), employees: [] };
}

function getStore(): EmployeeStore {
  const g = globalThis as AtlasGlobal;
  if (!g.__atlasEmployees) {
    g.__atlasEmployees = readJsonFile<EmployeeStore>(EMPLOYEE_FILE) || emptyStore();
    if (!fileExists(EMPLOYEE_FILE)) writeJsonFile(EMPLOYEE_FILE, g.__atlasEmployees);
  }
  return g.__atlasEmployees;
}

function setStore(next: EmployeeStore) {
  (globalThis as AtlasGlobal).__atlasEmployees = next;
  writeJsonFile(EMPLOYEE_FILE, next);
}

function makeAccessCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return code;
}

/** Seed a demo roster for the default org once (dev/demo only). */
export function ensureDemoEmployees(organizationId: string) {
  const store = getStore();
  if (store.employees.some((e) => e.organizationId === organizationId)) {
    return listEmployees(organizationId).map((e) => ({
      ...e,
      accessCode: undefined as string | undefined,
    }));
  }
  const demos = [
    { name: "Marcus Lee", email: "marcus@business.local", role: "Technician", department: "Field", code: "MARCUS" },
    { name: "Sarah Kim", email: "sarah@business.local", role: "Office Manager", department: "Operations", code: "SARAH1" },
    { name: "Jordan Price", email: "jordan@business.local", role: "Dispatcher", department: "Operations", code: "JORDAN" },
  ];
  const created: ServerEmployee[] = [];
  const codes: Record<string, string> = {};
  for (const demo of demos) {
    const code = demo.code;
    codes[demo.email] = code;
    created.push({
      id: newId("emp"),
      organizationId,
      userId: null,
      name: demo.name,
      email: demo.email,
      role: demo.role,
      department: demo.department,
      accessCodeHash: hashPassword(code),
      status: "active",
      createdAt: nowIso(),
    });
  }
  setStore({
    updatedAt: nowIso(),
    employees: [...created, ...store.employees],
  });
  return created.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.role,
    department: e.department,
    accessCode: codes[e.email],
  }));
}

export function listEmployees(organizationId: string) {
  return getStore().employees.filter(
    (e) => e.organizationId === organizationId && e.status === "active",
  );
}

export function createEmployee(
  ctx: SessionContext,
  input: { name: string; email: string; role?: string; department?: string; accessCode?: string },
) {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.name.trim()) throw new ValidationError("name and email required");
  const store = getStore();
  if (store.employees.some((e) => e.organizationId === ctx.organizationId && e.email === email)) {
    throw new ValidationError("Employee email already exists.");
  }
  const accessCode = (input.accessCode || makeAccessCode()).toUpperCase();
  const row: ServerEmployee = {
    id: newId("emp"),
    organizationId: ctx.organizationId,
    userId: null,
    name: input.name.trim(),
    email,
    role: input.role?.trim() || "Team member",
    department: input.department?.trim() || "Operations",
    accessCodeHash: hashPassword(accessCode),
    status: "active",
    createdAt: nowIso(),
  };
  setStore({ updatedAt: nowIso(), employees: [row, ...store.employees] });
  writeAudit(ctx, { action: "employee.created", entityType: "employee", entityId: row.id });
  return { employee: row, accessCode };
}

function ensureEmployeeUser(employee: ServerEmployee) {
  const db = database();
  if (employee.userId) {
    const existing = db.users.find((u) => u.id === employee.userId);
    if (existing) return existing.id;
  }
  const stamp = nowIso();
  const userId = newId("user");
  const memberId = newId("mem");
  saveDatabase({
    ...db,
    users: [
      {
        id: userId,
        email: employee.email,
        full_name: employee.name,
        profile_image: null,
        timezone: "America/Chicago",
        preferred_language: "en",
        email_verified_at: stamp,
        created_at: stamp,
        updated_at: stamp,
      },
      ...db.users,
    ],
    user_credentials: [
      {
        user_id: userId,
        // Access code is the employee credential; stored hashed on the employee record.
        password_hash: hashPassword(randomPlaceholder()),
        mfa_secret: null,
        mfa_enabled: false,
      },
      ...db.user_credentials,
    ],
    organization_members: [
      {
        id: memberId,
        organization_id: employee.organizationId,
        user_id: userId,
        role: "employee",
        status: "active",
        joined_at: stamp,
      },
      ...db.organization_members,
    ],
  });
  const store = getStore();
  setStore({
    ...store,
    employees: store.employees.map((e) => (e.id === employee.id ? { ...e, userId } : e)),
  });
  return userId;
}

function randomPlaceholder() {
  return `emp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function authenticateEmployeeLogin(input: {
  email: string;
  accessCode: string;
  organizationId?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const code = input.accessCode.trim().toUpperCase();
  if (!email || !code) throw new AuthenticationError("Email and access code required.");

  const store = getStore();
  let matches = store.employees.filter(
    (e) => e.email === email && e.status === "active" && verifyPassword(code, e.accessCodeHash),
  );
  if (input.organizationId) {
    matches = matches.filter((e) => e.organizationId === input.organizationId);
  }
  if (!matches.length) {
    // Auto-seed demo roster for the default org when empty (local demos only).
    const orgId = input.organizationId || database().organizations[0]?.id;
    if (orgId && !store.employees.some((e) => e.organizationId === orgId)) {
      ensureDemoEmployees(orgId);
      return authenticateEmployeeLogin(input);
    }
    throw new AuthenticationError("Email or access code doesn’t match.");
  }
  const employee = matches[0]!;
  const userId = ensureEmployeeUser(employee);
  const session = createSession(userId, employee.organizationId, "employee-portal");
  return {
    token: session.token,
    sessionId: session.sessionId,
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      organizationId: employee.organizationId,
      userId,
    },
  };
}

export function employeeFromSession(ctx: SessionContext) {
  const store = getStore();
  const employee = store.employees.find(
    (e) =>
      e.organizationId === ctx.organizationId &&
      e.status === "active" &&
      (e.userId === ctx.userId || e.email === database().users.find((u) => u.id === ctx.userId)?.email),
  );
  if (!employee) throw new AuthenticationError("Not signed in as an employee.");
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    department: employee.department,
    organizationId: employee.organizationId,
    userId: employee.userId,
  };
}
