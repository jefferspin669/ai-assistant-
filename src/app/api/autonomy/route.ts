import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { requirePermission } from "@/lib/auth/permissions";
import {
  ALL_KINDS,
  LEVEL_LABELS,
  OPERATIONAL_KINDS,
  RESTRICTED_KINDS,
  ROUTINE_KINDS,
  applyAwayMode,
  formatUsd,
  getPolicy,
  patchPolicy,
  pendingAutonomyCards,
} from "@/lib/autonomy";
import type { AutonomyLevel, AutonomyPolicy } from "@/lib/autonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicPolicy(policy: AutonomyPolicy) {
  const meta = LEVEL_LABELS[policy.level];
  return {
    ...policy,
    levelName: meta.name,
    headline: meta.headline,
    autoPaymentLimit: formatUsd(policy.autoPaymentLimitCents),
    refundLimit: formatUsd(policy.refundLimitCents),
    marketingBudget: formatUsd(policy.marketingBudgetCents),
  };
}

function asLevel(value: unknown): AutonomyLevel | undefined {
  const n = Number(value);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
  return undefined;
}

function asCents(cents: unknown, dollars: unknown): number | undefined {
  if (typeof cents === "number" && Number.isFinite(cents)) return Math.round(cents);
  if (typeof dollars === "number" && Number.isFinite(dollars)) return Math.round(dollars * 100);
  if (typeof cents === "string" && cents.trim()) {
    const n = Number(cents);
    if (Number.isFinite(n)) return Math.round(n);
  }
  if (typeof dollars === "string" && dollars.trim()) {
    const n = Number(dollars);
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return undefined;
}

export async function GET(req: Request) {
  try {
    const ctx = resolveSession(req);
    const policy = getPolicy(ctx.organizationId);
    return apiResponse(
      ok({
        policy: publicPolicy(policy),
        pending: pendingAutonomyCards(ctx.organizationId),
        levels: LEVEL_LABELS,
        catalog: {
          routine: ROUTINE_KINDS,
          operational: OPERATIONAL_KINDS,
          restricted: RESTRICTED_KINDS,
          all: ALL_KINDS,
        },
        slogan: "Atlas runs the routine company. Humans handle the exceptions.",
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const ctx = resolveSession(req);
    requirePermission(ctx, "atlas.autonomous");
    const body = asRecord(await readJson(req));

    if (typeof body.awayMessage === "string" && body.awayMessage.trim()) {
      const policy = applyAwayMode(ctx.organizationId, body.awayMessage);
      return apiResponse(ok({ policy: publicPolicy(policy), pending: pendingAutonomyCards(ctx.organizationId) }));
    }

    const patch: Partial<Omit<AutonomyPolicy, "organizationId">> = {};
    const level = asLevel(body.level);
    if (level) patch.level = level;
    if (typeof body.killSwitch === "boolean") patch.killSwitch = body.killSwitch;
    if (typeof body.wakeOnlyEmergencies === "boolean") patch.wakeOnlyEmergencies = body.wakeOnlyEmergencies;
    const pay = asCents(body.autoPaymentLimitCents, body.autoPaymentLimitDollars);
    if (pay != null) patch.autoPaymentLimitCents = pay;
    const refund = asCents(body.refundLimitCents, body.refundLimitDollars);
    if (refund != null) patch.refundLimitCents = refund;
    const marketing = asCents(body.marketingBudgetCents, body.marketingBudgetDollars);
    if (marketing != null) patch.marketingBudgetCents = marketing;
    if (typeof body.discountCapPercent === "number") patch.discountCapPercent = body.discountCapPercent;
    if (typeof body.earliestScheduleHour === "number") patch.earliestScheduleHour = body.earliestScheduleHour;
    if (Array.isArray(body.standingOrders)) patch.standingOrders = body.standingOrders.map(String);

    const policy = patchPolicy(ctx.organizationId, patch);
    return apiResponse(ok({ policy: publicPolicy(policy), pending: pendingAutonomyCards(ctx.organizationId) }));
  } catch (error) {
    return jsonError(error);
  }
}
