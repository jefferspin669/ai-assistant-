import { apiResponse, asRecord, jsonError, readJson } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { consumePasswordReset, cookieHeader, createSession } from "@/lib/auth/session";
import { database } from "@/lib/services/access";
import { AuthenticationError, ValidationError } from "@/lib/domain/errors";

export async function POST(req: Request) {
  try {
    const body = asRecord(await readJson(req));
    const password = String(body.password || "");
    if (password.length < 8) throw new ValidationError("Password must be at least 8 characters.");
    const userId = consumePasswordReset(String(body.token || ""), password);
    const member = database().organization_members.find(
      (row) => row.user_id === userId && row.status === "active",
    );
    if (!member) throw new AuthenticationError("No active organization membership.");
    const session = createSession(userId, member.organization_id);
    return apiResponse(ok({ userId, organizationId: member.organization_id }), {
      "Set-Cookie": cookieHeader(session.token),
    });
  } catch (error) {
    return jsonError(error);
  }
}
