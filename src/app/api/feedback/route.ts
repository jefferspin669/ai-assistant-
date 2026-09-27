import { z } from "zod";
import { apiSuccess, parseBody, withWorkspace } from "@/lib/api/http";
import { recordMemoryOutcome, listMemoryOutcomes } from "@/lib/memory/unified";

const feedbackSchema = z.object({
  kind: z.enum([
    "helpful",
    "incorrect",
    "wrong_category",
    "undo_action",
    "report_problem",
    "suggest_better",
  ]),
  target: z.string().trim().min(1).max(2_000),
  note: z.string().max(4_000).optional(),
  replyId: z.string().optional(),
  conversationId: z.string().optional(),
});

function statusForKind(kind: z.infer<typeof feedbackSchema>["kind"]): "accepted" | "rejected" | "edited" {
  if (kind === "helpful") return "accepted";
  if (kind === "suggest_better") return "edited";
  return "rejected";
}

export const GET = withWorkspace(async ({ workspace }) => {
  return apiSuccess({
    outcomes: listMemoryOutcomes(workspace).slice(0, 50),
  });
});

export const POST = withWorkspace(async ({ workspace, body }) => {
  const parsed = parseBody(feedbackSchema, body);
  const recommendation = parsed.target;
  const outcome = recordMemoryOutcome(workspace, {
    recommendation,
    status: statusForKind(parsed.kind),
    original: recommendation,
    edited: parsed.kind === "suggest_better" ? parsed.note || undefined : undefined,
    memoryId: null,
  });
  return apiSuccess({
    ok: true,
    outcome,
    kind: parsed.kind,
    message:
      parsed.kind === "helpful"
        ? "Thanks — Atlas recorded this as an accepted answer."
        : parsed.kind === "suggest_better"
          ? "Correction saved — Atlas will prefer this phrasing when similar."
          : "Feedback recorded — Atlas will be more careful next time.",
  });
});
