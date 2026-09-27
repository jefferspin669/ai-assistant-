import { PostHog } from "posthog-node";

let client: PostHog | null | undefined;

export function posthogConfigured(): boolean {
  return Boolean(process.env.POSTHOG_KEY?.trim() || process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

function getClient(): PostHog | null {
  if (client !== undefined) return client;
  const key = process.env.POSTHOG_KEY?.trim() || process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) {
    client = null;
    return null;
  }
  client = new PostHog(key, {
    host: process.env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
  });
  return client;
}

export function captureEvent(distinctId: string, event: string, properties?: Record<string, unknown>): void {
  const ph = getClient();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
}
