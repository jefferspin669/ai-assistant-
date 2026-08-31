import { apiResponse, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { runAtlasBrain } from "@/lib/brain";
import { applyAwayMode, appendStandingOrder } from "@/lib/autonomy/policy";
import { isAwayPhrase, LEVEL_LABELS } from "@/lib/autonomy";
import { newId, nowIso, loadDatabase, saveDatabase } from "@/lib/db/store";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { looksLikeOrchestratorGoal, orchestrate } from "@/lib/orchestrator";

export async function POST(req: Request) {
  try {
    rateLimit(`chat:${clientKey(req)}`, 40, 60_000);
  } catch (error) {
    return jsonError(error);
  }
  await ensureServerDatabase();
  const body = await readJson(req);
  const message = String(body.message || body.text || "");
  const brain = await runAtlasBrain({
    message,
    businessName: body.businessName ? String(body.businessName) : undefined,
    ownerName: body.ownerName ? String(body.ownerName) : undefined,
    dnaRules: Array.isArray(body.dnaRules) ? body.dnaRules.map(String) : undefined,
    history: Array.isArray(body.history)
      ? body.history
          .filter(
            (m: { role?: string; content?: string }) =>
              m && (m.role === "user" || m.role === "assistant"),
          )
          .map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role,
            content: String(m.content || ""),
          }))
      : undefined,
  });

  const data = loadDatabase();
  const stamp = nowIso();
  let orgId = data.organizations[0]?.id;
  let userId = data.users[0]?.id || "user_demo";
  try {
    const ctx = await resolveSession(req);
    orgId = ctx.organizationId;
    userId = ctx.userId;
  } catch {
    /* demo chat still works without a cookie */
  }
  let awayPolicy = null;
  if (orgId) {
    for (const call of brain.toolCalls || []) {
      if (call.name === "remember_standing_order") {
        const order = String(call.arguments.order || "");
        if (order) appendStandingOrder(orgId, order);
      }
    }
  }
  if (orgId && isAwayPhrase(message)) {
    awayPolicy = applyAwayMode(orgId, message);
    const level = LEVEL_LABELS[awayPolicy.level];
    brain.reply = `${brain.reply}\n\nAutonomy is now Level ${awayPolicy.level} — ${level.name}. ${level.headline} Payments over $${(awayPolicy.autoPaymentLimitCents / 100).toLocaleString()} still need you. Kill switch is off.`;
  }
  const goalText =
    (brain.toolCalls || []).find((call) => call.name === "run_business_goal")?.arguments.goal ||
    (looksLikeOrchestratorGoal(message) ? message : "");
  if (orgId && typeof goalText === "string" && goalText.trim()) {
    const member = data.organization_members.find(
      (row) => row.organization_id === orgId && row.user_id === userId && row.status === "active",
    );
    const run = await orchestrate(
      {
        userId,
        organizationId: orgId,
        role: member?.role || "owner",
        sessionId: "chat",
      },
      String(goalText),
    );
    const snapshot = run.run.steps.map((s) => `${s.status === "done" ? "✓" : s.status === "waiting" ? "⏳" : s.status === "blocked" ? "■" : "○"} ${s.label}`).join("\n");
    brain.reply = `${brain.reply}\n\nOrchestrator run ${run.run.id} (${run.run.intent}, ${run.run.status}):\n${snapshot}`;
  }
  let conversation = data.conversations[0];
  if (!conversation) {
    conversation = {
      id: newId("chat"),
      userId,
      title: message.slice(0, 48) || "Atlas chat",
      preview: brain.reply.slice(0, 80),
      messages: [],
      createdAt: stamp,
      updatedAt: stamp,
    };
  }
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
  const latest = loadDatabase();
  const conversations = latest.conversations.some((c) => c.id === conversation.id)
    ? latest.conversations.map((c) => (c.id === conversation.id ? conversation : c))
    : [conversation, ...latest.conversations];
  saveDatabase({ ...latest, conversations });

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
      conversation,
      autonomy: awayPolicy
        ? { level: awayPolicy.level, killSwitch: awayPolicy.killSwitch }
        : undefined,
    }),
  );
}
