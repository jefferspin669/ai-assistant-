/**
 * Detect conflicts between a candidate memory and existing org memories.
 * Does not auto-overwrite — callers surface conflicts to the owner.
 */

import type { OrgRole, SessionContext } from "@/lib/domain/types";
import type { DbMemory } from "@/lib/db/schema";
import { database, requireOrgMember } from "@/lib/services/access";

export type MemoryConflict = {
  id: string;
  title: string;
  content: string;
  confidence: number;
  reason: string;
  overlap: number;
};

const ACCESS_RANK: Record<DbMemory["accessLevel"], number> = {
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

function canRead(ctx: SessionContext, memory: DbMemory): boolean {
  if (memory.organizationId !== ctx.organizationId) return false;
  return ACCESS_RANK[memory.accessLevel] <= roleAccessCeiling(ctx.role);
}

function tokens(value: string) {
  return [
    ...new Set(
      value
        .toLowerCase()
        .replace(/[^\w\s$%-]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 3),
    ),
  ];
}

function negationFlip(a: string, b: string) {
  const neg = /\b(not|never|no longer|don't|dont|isn't|isnt|wasn't|wasnt)\b/i;
  return (neg.test(a) && !neg.test(b)) || (!neg.test(a) && neg.test(b));
}

function numericClash(a: string, b: string) {
  const numsA = a.match(/\$?\d[\d,]*(?:\.\d+)?%?/g) || [];
  const numsB = b.match(/\$?\d[\d,]*(?:\.\d+)?%?/g) || [];
  if (!numsA.length || !numsB.length) return false;
  const setB = new Set(numsB.map((n) => n.replace(/,/g, "")));
  return numsA.some((n) => {
    const clean = n.replace(/,/g, "");
    return ![...setB].some((other) => other === clean);
  });
}

/**
 * Rank existing memories that likely contradict or supersede the candidate.
 * Same entityId boosts conflict score; high token overlap + negation/number clash.
 */
export function findConflictingMemories(
  ctx: SessionContext,
  candidate: string,
  opts: { entityId?: string | null; excludeId?: string | null; limit?: number } = {},
): MemoryConflict[] {
  const db = database();
  requireOrgMember(db, ctx);
  const content = candidate.trim();
  if (content.length < 8) return [];
  const candTokens = tokens(content);
  if (candTokens.length < 2) return [];

  const conflicts: MemoryConflict[] = [];
  const rows = db.memories.filter(
    (row) => row.organizationId === ctx.organizationId && canRead(ctx, row),
  );
  for (const row of rows) {
    if (opts.excludeId && row.id === opts.excludeId) continue;
    const hayTokens = tokens(`${row.title} ${row.content}`);
    const overlap = candTokens.filter((t) => hayTokens.includes(t)).length;
    const ratio = overlap / Math.max(candTokens.length, 1);
    const sameEntity = Boolean(opts.entityId && row.entityId && row.entityId === opts.entityId);
    const flip = negationFlip(content, row.content);
    const numbers = numericClash(content, row.content);
    const strongOverlap = overlap >= 3 && ratio >= 0.45;

    if (!sameEntity && !strongOverlap && !(overlap >= 2 && (flip || numbers))) continue;

    let reason = "Overlapping business fact";
    if (sameEntity && (flip || numbers)) reason = "Same entity with contradictory detail";
    else if (flip) reason = "Negation conflicts with an existing memory";
    else if (numbers) reason = "Numeric values conflict with an existing memory";
    else if (sameEntity) reason = "Same linked entity already has a memory";

    conflicts.push({
      id: row.id,
      title: row.title,
      content: row.content,
      confidence: row.confidence,
      reason,
      overlap,
    });
  }

  return conflicts
    .sort((a, b) => b.overlap - a.overlap || b.confidence - a.confidence)
    .slice(0, opts.limit ?? 5);
}

export function summarizeConflicts(conflicts: MemoryConflict[]): string {
  if (!conflicts.length) return "";
  return conflicts
    .map((c) => `• [${c.id}] ${c.reason}: “${c.content.slice(0, 120)}”`)
    .join("\n");
}
