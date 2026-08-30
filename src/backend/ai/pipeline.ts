import { runAtlasBrain } from "@/lib/brain";
import type { BrainChatInput, BrainResult } from "@/lib/brain/types";
import { writeAudit } from "@/lib/services/audit";
import { emitEvent } from "@/backend/events/bus";
import { authorizeAction } from "@/backend/permissions/engine";

const KIND_TO_POLICY: Record<string, string> = {
  send_money: "vendor_payment",
  discount_over_cap: "discount",
  file_taxes: "file_taxes",
  mass_sms: "send_message",
  book_after_hours: "book_appointment",
  issue_refund: "refund",
  refund: "refund",
};

export const BRAIN_STEPS = [
  "load_context",
  "determine_intent",
  "select_tools",
  "check_permission",
  "execute",
  "store_result",
] as const;

/**
 * Every AI request goes through this service — never from the React client to the model.
 */
export async function runBrainPipeline(
  input: BrainChatInput & { organizationId?: string; userId?: string },
): Promise<BrainResult & { pipeline: typeof BRAIN_STEPS; permission?: ReturnType<typeof authorizeAction> }> {
  const brain = await runAtlasBrain(input);
  let permission: ReturnType<typeof authorizeAction> | undefined;

  if (brain.proposedAction) {
    const kind = brain.proposedAction.kind;
    const action = KIND_TO_POLICY[kind] || kind;
    permission = authorizeAction({
      action,
      discountPercent: action === "discount" ? 11 : undefined,
    });
    if (permission.permission === "OWNER_APPROVAL_REQUIRED") {
      brain.needsConfirm = true;
      brain.confirmPrompt = brain.confirmPrompt || permission.reason;
    }
  }

  const organizationId = input.organizationId;
  if (organizationId) {
    writeAudit(
      {
        userId: input.userId || "atlas",
        organizationId,
        role: "owner",
        sessionId: "brain",
      },
      {
        action: `brain:${brain.mode}:${input.message.slice(0, 80)}`,
        entityType: "brain",
        actorLabel: "Atlas Brain",
      },
    );
    emitEvent({
      type: "brain.completed",
      organizationId,
      actorId: input.userId,
      actorLabel: "Atlas Brain",
      payload: { mode: brain.mode, model: brain.model, needsConfirm: brain.needsConfirm },
    });
  }

  return { ...brain, pipeline: BRAIN_STEPS, permission };
}
