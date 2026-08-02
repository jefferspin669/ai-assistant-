import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, readJson } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await readJson(req);
  return apiResponse(
    atlasApi.tasks.update(id, {
      title: body.title != null ? String(body.title) : undefined,
      notes: body.notes != null ? String(body.notes) : undefined,
      status: body.status as "todo" | "doing" | "done" | undefined,
      priority: body.priority as "low" | "normal" | "high" | undefined,
      dueDate:
        body.dueDate === null || body.due_date === null
          ? null
          : body.dueDate != null
            ? String(body.dueDate)
            : body.due_date != null
              ? String(body.due_date)
              : undefined,
      category: body.category != null ? String(body.category) : undefined,
    }),
  );
}
