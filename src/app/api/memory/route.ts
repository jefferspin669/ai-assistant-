import { z } from "zod";
import { apiSuccess, parseBody, withWorkspace } from "@/lib/api/http";
import {
  deleteUnifiedMemory,
  listMemoryOutcomes,
  listUnifiedMemories,
  recordMemoryOutcome,
  rememberBusinessFact,
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
});

const outcomeSchema = z.object({
  recommendation: z.string().trim().min(1),
  status: z.enum(["accepted", "rejected", "edited", "successful"]),
  original: z.string().optional(),
  edited: z.string().optional(),
  memoryId: z.string().nullable().optional(),
});

export const GET = withWorkspace(async ({ workspace, req }) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const outcomes = url.searchParams.get("outcomes") === "1";
  if (outcomes) return apiSuccess(listMemoryOutcomes(workspace));
  if (q) return apiSuccess(searchUnifiedMemories(workspace, { query: q }));
  return apiSuccess(listUnifiedMemories(workspace));
});

export const POST = withWorkspace(async ({ workspace, body }) => {
  const action = String(body.action || "remember");
  if (action === "outcome") {
    return apiSuccess(recordMemoryOutcome(workspace, parseBody(outcomeSchema, body)));
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
  return apiSuccess(rememberBusinessFact(workspace, parseBody(rememberSchema, body)));
});
