/** Commercial integration config — live when credentials exist, otherwise simulation. */

export type IntegrationId =
  | "supabase"
  | "twilio"
  | "google_calendar"
  | "microsoft_calendar"
  | "stripe"
  | "brain";

export type IntegrationStatus = {
  id: IntegrationId;
  label: string;
  configured: boolean;
  mode: "live" | "simulation";
  detail: string;
};

function present(...keys: string[]) {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000"
  );
}

export function integrationStatus(): IntegrationStatus[] {
  return [
    {
      id: "brain",
      label: "Atlas Brain (LLM)",
      configured: present("ATLAS_LLM_API_KEY"),
      mode: present("ATLAS_LLM_API_KEY") ? "live" : "simulation",
      detail: present("ATLAS_LLM_API_KEY")
        ? `Model ${process.env.ATLAS_LLM_MODEL || "gpt-4o-mini"}`
        : "Keyword fallback — set ATLAS_LLM_API_KEY",
    },
    {
      id: "supabase",
      label: "Supabase / Postgres",
      configured: present("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"),
      mode: present("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") ? "live" : "simulation",
      detail: present("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
        ? "Service role client ready — multi-device truth"
        : "Using .data JSON files — set Supabase URL + service role",
    },
    {
      id: "twilio",
      label: "Twilio voice / SMS",
      configured: present("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"),
      mode: present("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER")
        ? "live"
        : "simulation",
      detail: present("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER")
        ? `From ${process.env.TWILIO_PHONE_NUMBER}`
        : "Receptionist webhooks simulate — set Twilio credentials",
    },
    {
      id: "google_calendar",
      label: "Google Calendar",
      configured: present("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
      mode: present("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET") ? "live" : "simulation",
      detail: present("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")
        ? "OAuth ready"
        : "Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET",
    },
    {
      id: "microsoft_calendar",
      label: "Microsoft Calendar",
      configured: present("MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"),
      mode: present("MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET") ? "live" : "simulation",
      detail: present("MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET")
        ? "OAuth ready"
        : "Set MICROSOFT_CLIENT_ID + MICROSOFT_CLIENT_SECRET",
    },
    {
      id: "stripe",
      label: "Stripe subscriptions",
      configured: present("STRIPE_SECRET_KEY"),
      mode: present("STRIPE_SECRET_KEY") ? "live" : "simulation",
      detail: present("STRIPE_SECRET_KEY")
        ? "Checkout + portal ready"
        : "Set STRIPE_SECRET_KEY (+ optional price IDs)",
    },
  ];
}

export function requireLive(id: IntegrationId): boolean {
  return integrationStatus().find((s) => s.id === id)?.mode === "live";
}
