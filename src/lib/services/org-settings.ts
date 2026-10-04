import "server-only";
import { requirePermission } from "@/lib/auth/permissions";
import { ValidationError } from "@/lib/domain/errors";
import type { SessionContext } from "@/lib/domain/types";
import {
  getWorkspaceDomain,
  getWorkspaceDomainAuthoritative,
  putWorkspaceDomain,
  putWorkspaceDomainAuthoritative,
} from "@/lib/backend/workspace-store";
import { nowIso, saveDatabase } from "@/lib/db/store";
import { database, requireOrgMember } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";
import type { AtlasProject, ProjectFolder } from "@/lib/projects-workspace";

export type ProjectsDomainState = {
  projects: AtlasProject[];
  folders: ProjectFolder[];
};

function emptyState(): ProjectsDomainState {
  return { projects: [], folders: [] };
}

function normalize(raw: unknown): ProjectsDomainState {
  if (!raw || typeof raw !== "object") return emptyState();
  const bag = raw as Partial<ProjectsDomainState>;
  return {
    projects: Array.isArray(bag.projects) ? bag.projects : [],
    folders: Array.isArray(bag.folders) ? bag.folders : [],
  };
}

export function getOrgProjects(ctx: SessionContext): ProjectsDomainState {
  requireOrgMember(database(), ctx);
  requirePermission(ctx, "workspace.read");
  return normalize(getWorkspaceDomain(ctx.organizationId, "projects").data);
}

export function putOrgProjects(ctx: SessionContext, state: ProjectsDomainState): ProjectsDomainState {
  requireOrgMember(database(), ctx);
  requirePermission(ctx, "workspace.write");
  const next = normalize(state);
  putWorkspaceDomain(ctx.organizationId, "projects", next);
  writeAudit(ctx, {
    action: "projects.put",
    entityType: "workspace",
    entityId: "projects",
  });
  return next;
}

export async function getOrgProjectsAuthoritative(ctx: SessionContext): Promise<ProjectsDomainState> {
  requireOrgMember(database(), ctx);
  requirePermission(ctx, "workspace.read");
  return normalize((await getWorkspaceDomainAuthoritative(ctx.organizationId, "projects")).data);
}

export async function putOrgProjectsAuthoritative(
  ctx: SessionContext,
  state: ProjectsDomainState,
): Promise<ProjectsDomainState> {
  requireOrgMember(database(), ctx);
  requirePermission(ctx, "workspace.write");
  const next = normalize(state);
  await putWorkspaceDomainAuthoritative(ctx.organizationId, "projects", next);
  writeAudit(ctx, { action: "projects.put", entityType: "workspace", entityId: "projects" });
  return next;
}

export type OrgSettingsState = {
  businessName: string;
  businessType: string;
  taxStructure: string;
  state: string;
  logoUrl: string | null;
  timezone: string;
  preferredLanguage: string;
  /** Customer-facing FAQ copy for the website chatbot (optional). */
  publicHours: string | null;
  publicServices: string | null;
  publicPricing: string | null;
  publicAddress: string | null;
  updatedAt: string;
};

export function getOrgSettings(ctx: SessionContext): OrgSettingsState {
  requireOrgMember(database(), ctx);
  requirePermission(ctx, "workspace.read");
  const db = database();
  const org = db.organizations.find((o) => o.id === ctx.organizationId);
  const user = db.users.find((u) => u.id === ctx.userId);
  const remote = getWorkspaceDomain(ctx.organizationId, "settings").data as Partial<OrgSettingsState> | null;
  return {
    businessName: remote?.businessName || org?.business_name || "Atlas Business",
    businessType: remote?.businessType || org?.business_type || "service",
    taxStructure: remote?.taxStructure || org?.tax_structure || "LLC",
    state: remote?.state || org?.state || "TX",
    logoUrl: remote?.logoUrl !== undefined ? remote.logoUrl : org?.logo_url ?? null,
    timezone: remote?.timezone || user?.timezone || "America/Chicago",
    preferredLanguage: remote?.preferredLanguage || user?.preferred_language || "en",
    publicHours: remote?.publicHours ?? null,
    publicServices: remote?.publicServices ?? null,
    publicPricing: remote?.publicPricing ?? null,
    publicAddress: remote?.publicAddress ?? null,
    updatedAt: remote?.updatedAt || org?.created_at || nowIso(),
  };
}

export function putOrgSettings(
  ctx: SessionContext,
  patch: Partial<Omit<OrgSettingsState, "updatedAt">>,
): OrgSettingsState {
  requireOrgMember(database(), ctx);
  requirePermission(ctx, "workspace.write");
  const current = getOrgSettings(ctx);
  const next: OrgSettingsState = {
    businessName: (patch.businessName ?? current.businessName).trim() || current.businessName,
    businessType: (patch.businessType ?? current.businessType).trim() || "service",
    taxStructure: (patch.taxStructure ?? current.taxStructure).trim() || "LLC",
    state: (patch.state ?? current.state).trim().toUpperCase().slice(0, 2) || "TX",
    logoUrl:
      patch.logoUrl !== undefined
        ? patch.logoUrl
          ? String(patch.logoUrl).trim() || null
          : null
        : current.logoUrl,
    timezone: (patch.timezone ?? current.timezone).trim() || "America/Chicago",
    preferredLanguage: (patch.preferredLanguage ?? current.preferredLanguage).trim() || "en",
    publicHours:
      patch.publicHours !== undefined
        ? patch.publicHours
          ? String(patch.publicHours).trim() || null
          : null
        : current.publicHours,
    publicServices:
      patch.publicServices !== undefined
        ? patch.publicServices
          ? String(patch.publicServices).trim() || null
          : null
        : current.publicServices,
    publicPricing:
      patch.publicPricing !== undefined
        ? patch.publicPricing
          ? String(patch.publicPricing).trim() || null
          : null
        : current.publicPricing,
    publicAddress:
      patch.publicAddress !== undefined
        ? patch.publicAddress
          ? String(patch.publicAddress).trim() || null
          : null
        : current.publicAddress,
    updatedAt: nowIso(),
  };
  if (next.businessName.length < 2) throw new ValidationError("Business name is required.");

  const db = database();
  saveDatabase({
    ...db,
    organizations: db.organizations.map((o) =>
      o.id === ctx.organizationId
        ? {
            ...o,
            business_name: next.businessName,
            business_type: next.businessType,
            tax_structure: next.taxStructure,
            state: next.state,
            logo_url: next.logoUrl,
          }
        : o,
    ),
    users: db.users.map((u) =>
      u.id === ctx.userId
        ? {
            ...u,
            timezone: next.timezone,
            preferred_language: next.preferredLanguage,
            updated_at: next.updatedAt,
          }
        : u,
    ),
  });

  putWorkspaceDomain(ctx.organizationId, "settings", next);
  writeAudit(ctx, {
    action: "settings.put",
    entityType: "organization",
    entityId: ctx.organizationId,
  });
  return next;
}
