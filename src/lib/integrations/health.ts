import OpenAI from "openai";
import Stripe from "stripe";
import twilio from "twilio";
import { brainConfig } from "@/lib/brain/types";
import { getConnectedProviders } from "@/lib/integrations/calendar";

export type VerifiableIntegration =
  | "brain"
  | "stripe"
  | "twilio"
  | "google_calendar"
  | "microsoft_calendar"
  | "resend";

export type VerificationResult = {
  id: VerifiableIntegration;
  ok: boolean;
  checkedAt: string;
  detail: string;
  latencyMs: number;
  /** true when credentials exist but no outbound API call was made */
  dryRun?: boolean;
};

async function timed(
  id: VerifiableIntegration,
  check: () => Promise<{ detail: string; dryRun?: boolean }>,
): Promise<VerificationResult> {
  const started = Date.now();
  try {
    const result = await check();
    return {
      id,
      ok: true,
      checkedAt: new Date().toISOString(),
      detail: result.detail,
      latencyMs: Date.now() - started,
      dryRun: result.dryRun,
    };
  } catch (error) {
    return {
      id,
      ok: false,
      checkedAt: new Date().toISOString(),
      detail: error instanceof Error ? error.message : "Connection check failed",
      latencyMs: Date.now() - started,
    };
  }
}

/**
 * Live credential probe for commercial integrations.
 * Pass `{ dryRun: true }` to validate config presence without outbound calls (tests / CI).
 */
export async function verifyIntegration(
  id: VerifiableIntegration,
  organizationId: string,
  options?: { dryRun?: boolean },
): Promise<VerificationResult> {
  const dryRun = Boolean(options?.dryRun || process.env.ATLAS_INTEGRATION_VERIFY_DRY_RUN === "1");

  return timed(id, async () => {
    if (id === "brain") {
      const config = brainConfig();
      if (!config.apiKey) throw new Error("LLM API key is not configured.");
      if (dryRun) return { detail: `Model ${config.model} credentials present.`, dryRun: true };
      const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl });
      await client.models.retrieve(config.model);
      return { detail: `Model ${config.model} is reachable.` };
    }

    if (id === "stripe") {
      const key = process.env.STRIPE_SECRET_KEY?.trim();
      if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
      if (dryRun) return { detail: "Stripe credentials present.", dryRun: true };
      await new Stripe(key).balance.retrieve();
      return { detail: "Stripe account authenticated." };
    }

    if (id === "twilio") {
      const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
      const token = process.env.TWILIO_AUTH_TOKEN?.trim();
      if (!sid || !token) throw new Error("Twilio credentials are incomplete.");
      if (dryRun) return { detail: "Twilio credentials present.", dryRun: true };
      await twilio(sid, token).api.accounts(sid).fetch();
      return { detail: "Twilio account authenticated." };
    }

    if (id === "resend") {
      const key = process.env.RESEND_API_KEY?.trim();
      if (!key) throw new Error("RESEND_API_KEY is not configured.");
      if (dryRun) return { detail: "Resend credentials present.", dryRun: true };
      const response = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!response.ok) throw new Error(`Resend rejected the credentials (${response.status}).`);
      return { detail: "Resend account authenticated." };
    }

    const provider = id === "google_calendar" ? "google" : "microsoft";
    void organizationId;
    if (!getConnectedProviders().includes(provider)) {
      throw new Error(`${provider} calendar is not connected for this organization.`);
    }
    return { detail: `${provider} calendar has an OAuth connection on this server.` };
  });
}

export const VERIFIABLE_INTEGRATIONS: VerifiableIntegration[] = [
  "brain",
  "stripe",
  "twilio",
  "google_calendar",
  "microsoft_calendar",
  "resend",
];
