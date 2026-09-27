import { apiResponse, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { runAtlasBrain } from "@/lib/brain";
import { applyAwayMode, appendStandingOrder, getPolicy } from "@/lib/autonomy/policy";
import { hasPermission } from "@/lib/auth/permissions";
import { isAwayPhrase, LEVEL_LABELS } from "@/lib/autonomy";
import { newId, nowIso, loadDatabase, saveDatabase, awaitDatabaseWrites } from "@/lib/db/store";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { clientKey, rateLimitAsync } from "@/lib/auth/rate-limit";
import { looksLikeOrchestratorGoal, orchestrate } from "@/lib/orchestrator";
import { isProduction } from "@/lib/ops/environment";
import { AuthenticationError } from "@/lib/domain/errors";
import type { SessionContext } from "@/lib/domain/types";

export async function POST(req: Request) {
  try {
    await rateLimitAsync(`chat:${clientKey(req)}`, 40, 60_000);
  } catch (error) {
    return jsonError(error);
  }
  await ensureServerDatabase();
  const body = await readJson(req);
  const message = String(body.message || body.text || "");

  let session: SessionContext | undefined;
  try {
    session = await resolveSession(req);
  } catch {
    if (isProduction()) {
      return jsonError(new AuthenticationError("Sign in required to chat with Atlas."));
    }
  }

  const orgId = session?.organizationId;
  const userId = session?.userId;
  const data = loadDatabase();
  const org = orgId ? data.organizations.find((o) => o.id === orgId) : undefined;
  const owner = userId ? data.users.find((u) => u.id === userId) : undefined;
  const storedConversation = session
    ? data.conversations.find((conversation) => conversation.userId === session.userId)
    : undefined;
  const storedHistory = (storedConversation?.messages || []).slice(-12).map((entry) => ({
    role: entry.role === "ai" ? ("assistant" as const) : ("user" as const),
    content: String(entry.text || "").slice(0, 2_000),
  }));
  const clientHistory = Array.isArray(body.history)
    ? body.history
        .filter(
          (m: { role?: string; content?: string }) =>
            m && (m.role === "user" || m.role === "assistant"),
        )
        .slice(-12)
        .map((m: { role: "user" | "assistant"; content: string }) => ({
          role: m.role,
          content: String(m.content || "").slice(0, 2_000),
        }))
    : [];
  const policyRules = orgId ? getPolicy(orgId).standingOrders.slice(0, 12) : [];

  const brain = await runAtlasBrain({
    message,
    businessName: org?.business_name || (body.businessName ? String(body.businessName) : undefined),
    ownerName: owner?.full_name || (body.ownerName ? String(body.ownerName) : undefined),
    dnaRules: session
      ? policyRules
      : Array.isArray(body.dnaRules)
        ? body.dnaRules.map(String).slice(0, 12)
        : undefined,
    history: storedHistory.length ? storedHistory : clientHistory,
    session,
  });

  const stamp = nowIso();
  let awayPolicy = null;
  if (orgId) {
    for (const call of brain.toolCalls || []) {
      if (
        call.name === "remember_standing_order" &&
        session &&
        (session.role === "owner" || session.role === "admin")
      ) {
        const order = String(call.arguments.order || "");
        if (order) appendStandingOrder(orgId, order);
      }
    }
  }
  if (orgId && session && hasPermission(session, "atlas.autonomous") && isAwayPhrase(message)) {
    awayPolicy = applyAwayMode(orgId, message);
    const level = LEVEL_LABELS[awayPolicy.level];
    brain.reply = `${brain.reply}\n\nAutonomy is now Level ${awayPolicy.level} — ${level.name}. ${level.headline} Payments over $${(awayPolicy.autoPaymentLimitCents / 100).toLocaleString()} still need you. Kill switch is off.`;
  }
  if (brain.clarifyingQuestion) {
    brain.reply = `${brain.reply}\n\nClarifying question: ${brain.clarifyingQuestion}`;
  }
  if (brain.citations?.length) {
    const cites = brain.citations
      .slice(0, 6)
      .map((c) => `${c.entityType}:${c.entityId}`)
      .join(", ");
    brain.reply = `${brain.reply}\n\nSources: ${cites}`;
  }
  const goalText =
    (brain.toolCalls || []).find((call) => call.name === "run_business_goal")?.arguments.goal ||
    (looksLikeOrchestratorGoal(message) ? message : "");
  if (
    orgId &&
    userId &&
    session &&
    hasPermission(session, "atlas.autonomous") &&
    typeof goalText === "string" &&
    goalText.trim()
  ) {
    const run = await orchestrate(session, String(goalText));
    const snapshot = run.run.steps
      .map(
        (s) =>
          `${s.status === "done" ? "✓" : s.status === "waiting" ? "⏳" : s.status === "blocked" ? "■" : "○"} ${s.label}`,
      )
      .join("\n");
    const pause =
      run.run.status === "waiting"
        ? `\nPaused — ${String(run.run.steps.find((s) => s.status === "waiting")?.result?.question || "waiting on owner")}`
        : "";
    brain.reply = `${brain.reply}\n\nOrchestrator run ${run.run.id} (${run.run.intent}, ${run.run.status}):\n${snapshot}${pause}`;
  }

  // Persist conversation only for authenticated tenants (no anonymous shared chat).
  let conversation = null as ReturnType<typeof loadDatabase>["conversations"][number] | null;
  if (session) {
    const latest = loadDatabase();
    const existing = latest.conversations.find((c) => c.userId === session.userId);
    conversation = existing || {
      id: newId("chat"),
      userId: session.userId,
      title: message.slice(0, 48) || "Atlas chat",
      preview: brain.reply.slice(0, 80),
      messages: [],
      createdAt: stamp,
      updatedAt: stamp,
    };
    conversation = {
      ...conversation,
      preview: brain.reply.slice(0, 80),
      updatedAt: stamp,
      messages: [
        ...conversation.messages,
        { role: "user", text: message, at: stamp },
        { role: "ai", text: `[${brain.agentLabel}/${brain.mode}] ${brain.reply}`, at: stamp },
      ],
    };
    const conversations = latest.conversations.some((c) => c.id === conversation!.id)
      ? latest.conversations.map((c) => (c.id === conversation!.id ? conversation! : c))
      : [conversation, ...latest.conversations];
    saveDatabase({ ...latest, conversations });
    await awaitDatabaseWrites();
  }

  return apiResponse(
    ok({
      reply: brain.reply,
      agentLabel: brain.agentLabel,
      mode: brain.mode,
      model: brain.model,
      needsConfirm: brain.needsConfirm,
      confirmPrompt: brain.confirmPrompt,
      doneLabel: brain.doneLabel,
      proposedAction: brain.proposedAction,
      toolCalls: brain.toolCalls,
      citations: brain.citations,
      clarifyingQuestion: brain.clarifyingQuestion,
      approvalId: brain.approvalId,
      evidence: brain.evidence,
      gaps: brain.gaps,
      usage: brain.usage,
      grounding: {
        status: brain.evidence?.length
          ? "grounded"
          : brain.toolCalls?.some((call) => call.name === "get_business_brief") ||
              brain.model?.includes("context")
            ? "verified_summary"
            : "ungrounded",
        evidenceCount: brain.evidence?.length || 0,
        gaps: brain.gaps || [],
      },
      conversation,
      autonomy: awayPolicy
        ? { level: awayPolicy.level, killSwitch: awayPolicy.killSwitch }
        : undefined,
    }),
  );
}
