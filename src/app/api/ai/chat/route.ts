import { apiResponse, readJson } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { runAtlasBrain } from "@/lib/brain";
import { newId, nowIso, loadDatabase, saveDatabase } from "@/lib/db/store";

export async function POST(req: Request) {
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
  const userId = data.users[0]?.id || "user_demo";
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
  const conversations = data.conversations.some((c) => c.id === conversation.id)
    ? data.conversations.map((c) => (c.id === conversation.id ? conversation : c))
    : [conversation, ...data.conversations];
  saveDatabase({ ...data, conversations });

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
    }),
  );
}
