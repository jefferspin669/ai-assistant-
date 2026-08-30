import type { WorkspaceDomain } from "@/lib/backend/domains";

export type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: string };

function apiPath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

async function parseJson<T>(res: Response): Promise<ApiEnvelope<T>> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { ok: false, error: "Invalid JSON from Atlas backend." };
  }
  try {
    const json = (await res.json()) as ApiEnvelope<T> & { success?: boolean; error?: string };
    const failed = !res.ok || json.ok === false || json.success === false;
    if (failed) {
      return { ok: false, error: json.error || `Request failed (${res.status})` };
    }
    return { ok: true, data: (json as { data: T }).data };
  } catch {
    return { ok: false, error: "Invalid JSON from Atlas backend." };
  }
}

export async function apiGet<T>(path: string): Promise<ApiEnvelope<T>> {
  try {
    const res = await fetch(apiPath(path), { cache: "no-store" });
    return parseJson<T>(res);
  } catch {
    return { ok: false, error: "Atlas backend unreachable." };
  }
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<ApiEnvelope<T>> {
  try {
    const res = await fetch(apiPath(path), {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return parseJson<T>(res);
  } catch {
    return { ok: false, error: "Atlas backend unreachable." };
  }
}

/** Fire-and-forget workspace push (keeps UI snappy). */
export function pushWorkspace(domain: WorkspaceDomain, data: unknown) {
  if (typeof window === "undefined") return;
  void apiSend(`/api/workspace/${domain}`, "PUT", { data });
}

export async function pullWorkspace<T>(domain: WorkspaceDomain): Promise<T | null> {
  if (typeof window === "undefined") return null;
  const result = await apiGet<{ domain: string; data: T | null }>(`/api/workspace/${domain}`);
  if (!result.ok) return null;
  return result.data.data;
}

export async function fetchBackendHealth() {
  return apiGet<{
    status: string;
    engine: string;
    persistence: string;
    workspace: unknown;
    stats: Record<string, number>;
  }>("/api/health");
}
