import { z } from "zod";
import { apiSuccess, parseBody, withWorkspace } from "@/lib/api/http";
import {
  correctBusinessMemory,
  deleteUnifiedMemory,
  listMemoryOutcomes,
  listUnifiedMemories,
  previewMemoryConflicts,
  recordMemoryOutcome,
  rememberBusinessFactChecked,
  searchUnifiedMemories,
  updateUnifiedMemory,
} from "@/lib/memory/unified";

const rememberSchema = z.object({
  content: z.string().trim().min(1),
  title: z.string().optional(),
  memoryType: z
    .enum(["company", "leadership", "employee", "customer", "operational", "project"])
    .optional(),
  source: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
  accessLevel: z
    .enum(["owner", "leadership", "managers", "all_staff", "customer_facing"])
    .optional(),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  force: z.boolean().optional(),
});

const outcomeSchema = z.object({
  recommendation: z.string().trim().min(1),
  status: z.enum(["accepted", "rejected", "edited", "successful"]),
  original: z.string().optional(),
  edited: z.string().optional(),
  memoryId: z.string().nullable().optional(),
});

const correctSchema = z.object({
  id: z.string().min(1),
  content: z.string().trim().min(1),
  title: z.string().optional(),
  note: z.string().optional(),
});

export const GET = withWorkspace(async ({ workspace, req }) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const outcomes = url.searchParams.get("outcomes") === "1";
  const conflictsFor = url.searchParams.get("conflictsFor");
  if (conflictsFor) {
    return apiSuccess({
      conflicts: previewMemoryConflicts(workspace, conflictsFor, {
        entityId: url.searchParams.get("entityId"),
      }),
    });
  }
  if (outcomes) return apiSuccess(listMemoryOutcomes(workspace));
  if (q) return apiSuccess(searchUnifiedMemories(workspace, { query: q }));
  return apiSuccess(listUnifiedMemories(workspace));
});

export const POST = withWorkspace(async ({ workspace, body }) => {
  const action = String(body.action || "remember");
  if (action === "outcome") {
    return apiSuccess(recordMemoryOutcome(workspace, parseBody(outcomeSchema, body)));
  }
  if (action === "correct") {
    const parsed = parseBody(correctSchema, body);
    return apiSuccess(correctBusinessMemory(workspace, parsed.id, parsed));
  }
  if (action === "update") {
    const id = String(body.id || "");
    return apiSuccess(
      updateUnifiedMemory(workspace, id, {
        content: body.content ? String(body.content) : undefined,
        title: body.title ? String(body.title) : undefined,
        confidence: typeof body.confidence === "number" ? body.confidence : undefined,
        approved: typeof body.approved === "boolean" ? body.approved : undefined,
      }),
    );
  }
  if (action === "delete") {
    return apiSuccess(deleteUnifiedMemory(workspace, String(body.id || "")));
  }
  if (action === "preview_conflicts") {
    return apiSuccess({
      conflicts: previewMemoryConflicts(workspace, String(body.content || ""), {
        entityId: body.entityId ? String(body.entityId) : null,
      }),
    });
  }
  const parsed = parseBody(rememberSchema, body);
  const result = rememberBusinessFactChecked(workspace, parsed);
  return apiSuccess(result);
});
