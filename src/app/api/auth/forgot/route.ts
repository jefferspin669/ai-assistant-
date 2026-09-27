import { apiResponse, asRecord, jsonError, readJson } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { createPasswordReset } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { database } from "@/lib/services/access";
import { getAppUrl } from "@/lib/integrations/config";
import { sendEmail } from "@/lib/integrations/resend";
import { isProduction } from "@/lib/ops/environment";
import { ensureServerDatabase } from "@/lib/db/ensure";

export async function POST(req: Request) {
  try {
    rateLimit(`forgot:${clientKey(req)}`, 8);
    await ensureServerDatabase();
    const body = asRecord(await readJson(req));
    const email = String(body.email || "").trim().toLowerCase();
    const user = database().users.find((row) => row.email === email);
    const token = user ? createPasswordReset(user.id) : null;

    if (token) {
      const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
      await sendEmail({
        to: email,
        subject: "Reset your Atlas password",
        text: [
          "We received a request to reset your Atlas password.",
          "",
          `Reset link: ${resetUrl}`,
          "",
          "This link expires in 1 hour. If you did not request a reset, ignore this email.",
        ].join("\n"),
      });
    }

    return apiResponse(
      ok({
        sent: true,
        /** Dev convenience only — production never returns the raw token. */
        resetToken: isProduction() ? undefined : token || undefined,
        resetUrl:
          !isProduction() && token
            ? `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`
            : undefined,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
