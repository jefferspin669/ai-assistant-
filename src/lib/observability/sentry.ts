export function sentryDsn(): string | undefined {
  return process.env.SENTRY_DSN?.trim() || undefined;
}
