import { createHmac, randomBytes } from "crypto";
import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { database } from "@/lib/services/access";
import {
  MFA_COOKIE,
  clearMfaCookieHeader,
  completeMfaLogin,
  cookieHeader,
  enableMfa,
  mfaChallengeFromToken,
  readCookie,
} from "@/lib/auth/session";
import { AuthenticationError } from "@/lib/domain/errors";

function totp(secret: string, step = Math.floor(Date.now() / 30000)) {
  const key = Buffer.from(secret, "hex");
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(step / 0x100000000), 0);
  buf.writeUInt32BE(step & 0xffffffff, 4);
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    (hmac[offset + 1]! << 16) |
    (hmac[offset + 2]! << 8) |
    hmac[offset + 3]!;
  return String(code % 1_000_000).padStart(6, "0");
}

export async function POST(req: Request) {
  try {
    const body = asRecord(await readJson(req));

    // Setup still requires a real logged-in session (post-MFA).
    if (body.action === "setup") {
      const ctx = await resolveSession(req);
      const secret = randomBytes(20).toString("hex");
      enableMfa(ctx.userId, secret);
      return apiResponse(ok({ secret, preview: totp(secret) }));
    }

    // Login verification uses the restricted MFA challenge cookie — not a full session.
    const challengeToken =
      readCookie(req, MFA_COOKIE) ||
      (body.challengeToken ? String(body.challengeToken) : null);
    const challenge = mfaChallengeFromToken(challengeToken);
    const credential = database().user_credentials.find((row) => row.user_id === challenge.user_id);
    if (!credential?.mfa_secret || !credential.mfa_enabled) {
      throw new AuthenticationError("MFA is not enabled.");
    }
    const code = String(body.code || "");
    const valid =
      code === totp(credential.mfa_secret) ||
      code === totp(credential.mfa_secret, Math.floor(Date.now() / 30000) - 1);
    if (!valid) throw new AuthenticationError("Invalid MFA code.");

    const session = completeMfaLogin(challenge.token);
    const headers = new Headers();
    headers.append("Set-Cookie", cookieHeader(session.token));
    headers.append("Set-Cookie", clearMfaCookieHeader());
    return apiResponse(
      ok({
        verified: true,
        userId: session.user.id,
        organizationId: session.organizationId,
        role: session.role,
        sessionId: session.sessionId,
        full_name: session.user.full_name,
      }),
      headers,
    );
  } catch (error) {
    return jsonError(error);
  }
}
