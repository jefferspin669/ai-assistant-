/**
 * Resend email. Simulation when RESEND_API_KEY is unset.
 */

import { Resend } from "resend";

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  organizationId?: string;
}): Promise<{ ok: true; id?: string; simulated: boolean } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || "Atlas <atlas@example.com>";
  if (!key) {
    return { ok: true, simulated: true };
  }
  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br/>"),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id, simulated: false };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "resend failed" };
  }
}
