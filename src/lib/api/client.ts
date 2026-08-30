import type { ApiResponse } from "@/lib/api/types";
import type { CalendarEvent, Customer, Task, Transaction } from "@/lib/domain/types";
import type { AtlasAction } from "@/lib/domain/schemas";
import type { AtlasActionResult } from "@/lib/domain/actions";

export type { ApiResponse };

function apiPath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    const json = (await res.json()) as {
      success?: boolean;
      ok?: boolean;
      data?: T;
      error?: string;
    };
    const success = json.success === true || json.ok === true;
    if (!res.ok || !success || json.data === undefined) {
      return {
        success: false,
        ok: false,
        error: json.error || `Request failed (${res.status})`,
        status: res.status,
      };
    }
    return { success: true, ok: true, data: json.data };
  } catch {
    return { success: false, ok: false, error: "Invalid JSON from Atlas backend.", status: 500 };
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(apiPath(path), {
      cache: "no-store",
      credentials: "include",
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    });
    return parseResponse<T>(res);
  } catch {
    return { success: false, ok: false, error: "Atlas backend unreachable.", status: 503 };
  }
}

export const atlasClient = {
  customers: {
    list: () => request<Customer[]>("/api/customers", { method: "GET" }),
    create: (input: { name: string; email?: string; phone?: string }) =>
      request<Customer>("/api/customers", { method: "POST", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/api/customers/${id}`, { method: "DELETE" }),
  },
  tasks: {
    list: () => request<Task[]>("/api/tasks", { method: "GET" }),
    create: (input: { title: string; dueDate?: string | null; notes?: string; category?: string }) =>
      request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<Task>) =>
      request<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  },
  calendar: {
    list: () => request<CalendarEvent[]>("/api/calendar/events", { method: "GET" }),
    create: (input: { title: string; startTime: string; endTime: string; customerId?: string }) =>
      request<CalendarEvent>("/api/calendar/events", { method: "POST", body: JSON.stringify(input) }),
  },
  transactions: {
    list: () => request<Transaction[]>("/api/transactions", { method: "GET" }),
    create: (input: { kind: "income" | "expense"; label: string; amount: number; date: string }) =>
      request<Transaction>("/api/transactions", { method: "POST", body: JSON.stringify(input) }),
  },
  dashboard: {
    get: () => request<Record<string, unknown>>("/api/dashboard", { method: "GET" }),
  },
  ai: {
    execute: (action: AtlasAction) =>
      request<AtlasActionResult>("/api/ai/actions", { method: "POST", body: JSON.stringify({ action }) }),
  },
};

/** @deprecated Prefer atlasClient — kept so existing pages keep compiling. */
export { atlasClient as atlasHttp };
