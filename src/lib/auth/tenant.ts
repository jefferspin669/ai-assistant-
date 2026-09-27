import { ValidationError } from "@/lib/domain/errors";
import { isProduction } from "@/lib/ops/environment";
import { loadDatabase } from "@/lib/db/store";

/**
 * Every production write/query must receive an authenticated organizationId.
 * Default-organization fallbacks are banned in production.
 */
export function requireOrganizationId(
  organizationId: string | null | undefined,
  label = "organizationId",
): string {
  const id = organizationId?.trim();
  if (id && id !== "org_demo") return id;
  if (isProduction()) {
    throw new ValidationError(`${label} is required — default organization fallbacks are disabled in production.`);
  }
  const fallback = loadDatabase().organizations[0]?.id;
  if (!fallback) {
    throw new ValidationError(`No ${label} available.`);
  }
  return fallback;
}

export function forbidDemoOrgInProduction(organizationId: string) {
  if (isProduction() && (organizationId === "org_demo" || organizationId === "user_demo")) {
    throw new ValidationError("Demo tenant ids are not allowed in production.");
  }
  return organizationId;
}
