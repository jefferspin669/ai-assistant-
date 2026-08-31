export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { ensureServerDatabase } = await import("@/lib/db/ensure");
  await ensureServerDatabase();
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    enabled: true,
  });
}
