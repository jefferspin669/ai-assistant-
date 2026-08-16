import { getAppUrl, requireLive } from "@/lib/integrations/config";
import { writeJsonFile, readJsonFile } from "@/lib/db/file-persist";
import { atlasStore } from "@/lib/integrations/supabase";

export type CalendarProvider = "google" | "microsoft";

type TokenRecord = {
  provider: CalendarProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  email?: string;
};

type TokenStore = { tokens: TokenRecord[] };

function loadTokens(): TokenStore {
  return readJsonFile<TokenStore>("calendar-tokens.json") || { tokens: [] };
}

function saveTokens(store: TokenStore) {
  writeJsonFile("calendar-tokens.json", store);
}

export function calendarOAuthConfigured(provider: CalendarProvider) {
  return provider === "google"
    ? requireLive("google_calendar")
    : requireLive("microsoft_calendar");
}

export function getAuthorizeUrl(provider: CalendarProvider, state: string) {
  const redirectUri = `${getAppUrl()}/api/calendar/oauth/${provider}/callback`;
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.events");
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&access_type=offline&prompt=consent&scope=${scope}&state=${encodeURIComponent(state)}`;
  }
  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const scope = encodeURIComponent("offline_access Calendars.ReadWrite");
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${scope}&state=${encodeURIComponent(state)}`;
}

export async function exchangeCode(provider: CalendarProvider, code: string) {
  const redirectUri = `${getAppUrl()}/api/calendar/oauth/${provider}/callback`;
  if (provider === "google") {
    const body = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };
    if (!res.ok || !json.access_token) {
      throw new Error(json.error || `Google token exchange failed (${res.status})`);
    }
    const store = loadTokens();
    store.tokens = [
      {
        provider: "google",
        accessToken: json.access_token,
        refreshToken: json.refresh_token,
        expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
      },
      ...store.tokens.filter((t) => t.provider !== "google"),
    ];
    saveTokens(store);
    await atlasStore.writeAudit({
      organizationId: atlasStore.defaultOrgId(),
      actor: "Calendar",
      action: "google.connected",
      detail: {},
    });
    return store.tokens[0];
  }

  const body = new URLSearchParams({
    code,
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error || `Microsoft token exchange failed (${res.status})`);
  }
  const store = loadTokens();
  store.tokens = [
    {
      provider: "microsoft",
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
    },
    ...store.tokens.filter((t) => t.provider !== "microsoft"),
  ];
  saveTokens(store);
  await atlasStore.writeAudit({
    organizationId: atlasStore.defaultOrgId(),
    actor: "Calendar",
    action: "microsoft.connected",
    detail: {},
  });
  return store.tokens[0];
}

export function getConnectedProviders() {
  return loadTokens().tokens.map((t) => t.provider);
}

export async function createExternalEvent(input: {
  provider?: CalendarProvider;
  title: string;
  startsAt: string;
  endsAt: string;
  description?: string;
}) {
  const store = loadTokens();
  const provider =
    input.provider ||
    (store.tokens.find((t) => t.provider === "google")?.provider as CalendarProvider | undefined) ||
    (store.tokens.find((t) => t.provider === "microsoft")?.provider as CalendarProvider | undefined);

  if (!provider) {
    const local = await atlasStore.createAppointment({
      organizationId: atlasStore.defaultOrgId(),
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      source: "local-calendar",
    });
    return { mode: "simulation" as const, provider: null, result: local };
  }

  const token = store.tokens.find((t) => t.provider === provider)!;

  if (provider === "google") {
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        description: input.description || "Created by Atlas",
        start: { dateTime: input.startsAt },
        end: { dateTime: input.endsAt },
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(`Google Calendar error: ${JSON.stringify(json).slice(0, 200)}`);
    }
    await atlasStore.createAppointment({
      organizationId: atlasStore.defaultOrgId(),
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      source: "google",
    });
    return { mode: "live" as const, provider, result: json };
  }

  const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: input.title,
      body: { contentType: "Text", content: input.description || "Created by Atlas" },
      start: { dateTime: input.startsAt.replace("Z", ""), timeZone: "UTC" },
      end: { dateTime: input.endsAt.replace("Z", ""), timeZone: "UTC" },
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Microsoft Calendar error: ${JSON.stringify(json).slice(0, 200)}`);
  }
  await atlasStore.createAppointment({
    organizationId: atlasStore.defaultOrgId(),
    title: input.title,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    source: "microsoft",
  });
  return { mode: "live" as const, provider, result: json };
}
