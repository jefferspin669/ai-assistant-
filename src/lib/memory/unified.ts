/**
 * Unified business memory — org-scoped, permission-aware.
 * Source of truth is Postgres (or JSON adapter); never leaks across tenants.
 */

import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/domain/errors";
import { requirePermission } from "@/lib/auth/permissions";
import type { OrgRole, SessionContext } from "@/lib/domain/types";
import type { DbMemory, DbMemoryOutcome } from "@/lib/db/schema";
import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import { database, requireOrgMember } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";

export type MemoryType = DbMemory["memoryType"];
export type MemoryAccess = DbMemory["accessLevel"];

const ACCESS_RANK: Record<MemoryAccess, number> = {
  customer_facing: 0,
  all_staff: 1,
  managers: 2,
  leadership: 3,
  owner: 4,
};

function roleAccessCeiling(role: OrgRole): number {
  if (role === "owner") return ACCESS_RANK.owner;
  if (role === "admin") return ACCESS_RANK.leadership;
  if (role === "manager") return ACCESS_RANK.managers;
  if (role === "employee") return ACCESS_RANK.all_staff;
  if (role === "accountant") return ACCESS_RANK.managers;
  return ACCESS_RANK.customer_facing;
}

export function canReadMemory(ctx: SessionContext, memory: DbMemory): boolean {
  if (memory.organizationId !== ctx.organizationId) return false;
  return ACCESS_RANK[memory.accessLevel] <= roleAccessCeiling(ctx.role);
}

function kindFromType(type: MemoryType): DbMemory["kind"] {
  if (type === "leadership") return "preference";
  if (type === "employee" || type === "customer") return "person";
  if (type === "project") return "project";
  return "long-term";
}

export function listUnifiedMemories(ctx: SessionContext, query?: string): DbMemory[] {
  const db = database();
  requireOrgMember(db, ctx);
  const q = (query || "").trim().toLowerCase();
  return db.memories
    .filter((row) => row.organizationId === ctx.organizationId && canReadMemory(ctx, row))
    .filter((row) => {
      if (!q) return true;
      return (
        row.content.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q) ||
        row.source.toLowerCase().includes(q) ||
        (row.entityId || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Semantic-ish search: token overlap + structured filters (no external embedding required). */
export function searchUnifiedMemories(
  ctx: SessionContext,
  input: {
    query?: string;
    memoryType?: MemoryType;
    entityType?: string;
    entityId?: string;
    minConfidence?: number;
  },
): DbMemory[] {
  const tokens = (input.query || "")
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2);
  return listUnifiedMemories(ctx, input.query)
    .filter((row) => (input.memoryType ? row.memoryType === input.memoryType : true))
    .filter((row) => (input.entityType ? row.entityType === input.entityType : true))
    .filter((row) => (input.entityId ? row.entityId === input.entityId : true))
    .filter((row) => (input.minConfidence != null ? row.confidence >= input.minConfidence : true))
    .map((row) => {
      if (!tokens.length) return { row, score: row.confidence };
      const hay = `${row.title} ${row.content} ${row.source}`.toLowerCase();
      const hits = tokens.filter((t) => hay.includes(t)).length;
      return { row, score: hits * 10 + row.confidence / 10 };
    })
    .filter((item) => !tokens.length || item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.row);
}

export function rememberBusinessFact(
  ctx: SessionContext,
  input: {
    content: string;
    title?: string;
    memoryType?: MemoryType;
    source?: string;
    authorLabel?: string;
    confidence?: number;
    accessLevel?: MemoryAccess;
    entityType?: string | null;
    entityId?: string | null;
  },
): DbMemory {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "tasks.write");
  const content = input.content.trim();
  if (!content) throw new ValidationError("Memory content is required.");
  if (input.accessLevel === "owner" && ctx.role !== "owner") {
    throw new AuthorizationError("Only the owner can write owner-only memory.");
  }
  const stamp = nowIso();
  const memoryType = input.memoryType || "operational";
  const row: DbMemory = {
    id: newId("mem"),
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    kind: kindFromType(memoryType),
    memoryType,
    title: (input.title || content.slice(0, 48)).trim(),
    content,
    source: input.source || "Atlas Brain",
    authorLabel: input.authorLabel || ctx.role,
    confidence: Math.max(0, Math.min(100, input.confidence ?? 85)),
    accessLevel: input.accessLevel || "all_staff",
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    approved: ctx.role === "owner" || ctx.role === "admin",
    createdAt: stamp,
    updatedAt: stamp,
  };
  saveDatabase({ ...db, memories: [row, ...db.memories] });
  writeAudit(ctx, { action: "remembered business fact", entityType: "memory", entityId: row.id });
  return row;
}

export function updateUnifiedMemory(
  ctx: SessionContext,
  memoryId: string,
  patch: Partial<Pick<DbMemory, "content" | "title" | "confidence" | "accessLevel" | "memoryType" | "approved">>,
): DbMemory {
  const db = database();
  requireOrgMember(db, ctx);
  const existing = db.memories.find((row) => row.id === memoryId && row.organizationId === ctx.organizationId);
  if (!existing) throw new NotFoundError("Memory not found.");
  if (!canReadMemory(ctx, existing)) throw new AuthorizationError("You cannot edit this memory.");
  if (ctx.role === "employee" && existing.userId !== ctx.userId) {
    throw new AuthorizationError("Workers may only correct memories they authored.");
  }
  const next: DbMemory = {
    ...existing,
    ...patch,
    content: patch.content?.trim() || existing.content,
    title: patch.title?.trim() || existing.title,
    updatedAt: nowIso(),
  };
  saveDatabase({
    ...db,
    memories: db.memories.map((row) => (row.id === memoryId ? next : row)),
  });
  writeAudit(ctx, { action: "corrected business memory", entityType: "memory", entityId: memoryId });
  return next;
}

export function deleteUnifiedMemory(ctx: SessionContext, memoryId: string) {
  const db = database();
  requireOrgMember(db, ctx);
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    throw new AuthorizationError("Only owners/admins can delete business memory.");
  }
  const existing = db.memories.find((row) => row.id === memoryId && row.organizationId === ctx.organizationId);
  if (!existing) throw new NotFoundError("Memory not found.");
  saveDatabase({
    ...db,
    memories: db.memories.filter((row) => row.id !== memoryId),
  });
  writeAudit(ctx, { action: "deleted business memory", entityType: "memory", entityId: memoryId });
  return { id: memoryId };
}

export function recordMemoryOutcome(
  ctx: SessionContext,
  input: {
    recommendation: string;
    status: DbMemoryOutcome["status"];
    original?: string;
    edited?: string;
    memoryId?: string | null;
  },
): DbMemoryOutcome {
  const db = database();
  requireOrgMember(db, ctx);
  const row: DbMemoryOutcome = {
    id: newId("mout"),
    organizationId: ctx.organizationId,
    memoryId: input.memoryId ?? null,
    recommendation: input.recommendation.trim(),
    status: input.status,
    original: input.original || input.recommendation,
    edited: input.edited ?? null,
    actorUserId: ctx.userId,
    createdAt: nowIso(),
  };
  saveDatabase({ ...db, memory_outcomes: [row, ...(db.memory_outcomes || [])] });
  writeAudit(ctx, {
    action: `memory outcome ${input.status}`,
    entityType: "memory_outcome",
    entityId: row.id,
  });

  // Soft learning: accepted/successful preferences become leadership memory (never auto-change critical rules).
  if (input.status === "accepted" || input.status === "successful") {
    const content = (input.edited || input.recommendation).trim();
    if (content && !/refund|fire|wire|password|ssn/i.test(content)) {
      rememberBusinessFact(ctx, {
        content: `Preference learned: ${content}`,
        memoryType: "leadership",
        source: "Outcome learning",
        confidence: input.status === "successful" ? 90 : 70,
        accessLevel: "leadership",
      });
    }
  }
  return row;
}

export function listMemoryOutcomes(ctx: SessionContext): DbMemoryOutcome[] {
  const db = database();
  requireOrgMember(db, ctx);
  return (db.memory_outcomes || []).filter((row) => row.organizationId === ctx.organizationId);
}
