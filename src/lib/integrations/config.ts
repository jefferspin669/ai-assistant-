/** Commercial integration config — live when credentials exist, otherwise simulation. */

export type IntegrationId =
  | "supabase"
  | "twilio"
  | "google_calendar"
  | "microsoft_calendar"
  | "stripe"
  | "brain"
  | "postgres"
  | "redis"
  | "resend"
  | "sentry"
  | "posthog"
  | "storage";

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
      configured: Boolean(process.env.ATLAS_LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()),
      mode: Boolean(process.env.ATLAS_LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()) ? "live" : "simulation",
      detail: Boolean(process.env.ATLAS_LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim())
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
    {
      id: "postgres",
      label: "PostgreSQL (Drizzle)",
      configured: present("DATABASE_URL"),
      mode: present("DATABASE_URL") ? "live" : "simulation",
      detail: present("DATABASE_URL")
        ? "Dual-write from JSON store"
        : "Using .data JSON — set DATABASE_URL (local Docker or Supabase)",
    },
    {
      id: "redis",
      label: "Redis / BullMQ",
      configured: present("REDIS_URL"),
      mode: present("REDIS_URL") ? "live" : "simulation",
      detail: present("REDIS_URL")
        ? "Workers drain atlas-jobs"
        : "File job queue — set REDIS_URL and run npm run worker",
    },
    {
      id: "resend",
      label: "Resend email",
      configured: present("RESEND_API_KEY"),
      mode: present("RESEND_API_KEY") ? "live" : "simulation",
      detail: present("RESEND_API_KEY") ? "Transactional email ready" : "Set RESEND_API_KEY",
    },
    {
      id: "storage",
      label: "Object storage",
      configured: present("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_STORAGE_BUCKET") &&
        (present("SUPABASE_SERVICE_ROLE_KEY") || present("SUPABASE_ANON_KEY")),
      mode:
        present("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_STORAGE_BUCKET") &&
        (present("SUPABASE_SERVICE_ROLE_KEY") || present("SUPABASE_ANON_KEY"))
          ? "live"
          : "simulation",
      detail: present("SUPABASE_STORAGE_BUCKET")
        ? "Supabase Storage bucket configured"
        : "File vault stays local — set SUPABASE_STORAGE_BUCKET",
    },
    {
      id: "sentry",
      label: "Sentry",
      configured: present("SENTRY_DSN"),
      mode: present("SENTRY_DSN") ? "live" : "simulation",
      detail: present("SENTRY_DSN") ? "Exception reporting on" : "Set SENTRY_DSN",
    },
    {
      id: "posthog",
      label: "PostHog",
      configured: Boolean(process.env.POSTHOG_KEY?.trim() || process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()),
      mode: Boolean(process.env.POSTHOG_KEY?.trim() || process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim())
        ? "live"
        : "simulation",
      detail: Boolean(process.env.POSTHOG_KEY?.trim() || process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim())
        ? "Product analytics on"
        : "Set POSTHOG_KEY",
    },
  ];
}

export function requireLive(id: IntegrationId): boolean {
  return integrationStatus().find((s) => s.id === id)?.mode === "live";
}
