const SECRET_ENV = [
  "ATLAS_APP_PASSWORD",
  "ATLAS_LLM_API_KEY",
  "OPENAI_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "TWILIO_AUTH_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "SENTRY_DSN",
  "GOOGLE_CLIENT_SECRET",
  "MICROSOFT_CLIENT_SECRET",
  "CRON_SECRET",
  "DATABASE_URL",
  "REDIS_URL",
];

export function isPublicEnvKey(key: string): boolean {
  return key.startsWith("NEXT_PUBLIC_");
}

export function assertNoClientSecrets(env: NodeJS.ProcessEnv = process.env): string[] {
  const leaked = Object.keys(env).filter((key) => {
    if (!isPublicEnvKey(key)) return false;
    const upper = key.toUpperCase();
    return (
      upper.includes("SECRET") ||
      upper.includes("TOKEN") ||
      upper.includes("PRIVATE") ||
      upper.includes("SERVICE_ROLE") ||
      upper.includes("PASSWORD")
    );
  });
  return leaked;
}

export function redactSecrets(value: string): string {
  let next = value;
  for (const key of SECRET_ENV) {
    const secret = process.env[key]?.trim();
    if (secret && secret.length > 4) next = next.split(secret).join("[redacted]");
  }
  return next;
}

export function publicEnvReport() {
  const leaked = assertNoClientSecrets();
  return { ok: leaked.length === 0, leaked };
}
