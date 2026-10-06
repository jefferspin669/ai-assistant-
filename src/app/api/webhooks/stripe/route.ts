import { handleStripeWebhook } from "@/lib/integrations/stripe";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { awaitDatabaseWrites } from "@/lib/db/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");
  try {
    await ensureServerDatabase();
    const result = await handleStripeWebhook(raw, signature);
    await awaitDatabaseWrites();
    return Response.json({ ok: true, data: result });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "webhook failed" },
      { status: 400 },
    );
  }
}
