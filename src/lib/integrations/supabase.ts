import { requireLive } from "@/lib/integrations/config";
import { loadDatabase, newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { DbMemory } from "@/lib/db/schema";

type RestResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

function supabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "",
  };
}

async function supabaseRest<T>(
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<RestResult<T>> {
  const { url, serviceKey } = supabaseEnv();
  if (!url || !serviceKey) {
    return { ok: false, error: "Supabase not configured", status: 503 };
  }
  const headers: Record<string, string> = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.prefer) headers.Prefer = init.prefer;
  const res = await fetch(`${url}/rest/v1/${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text.slice(0, 400), status: res.status };
  }
  if (res.status === 204) return { ok: true, data: null as T };
  return { ok: true, data: (await res.json()) as T };
}

export const atlasStore = {
  mode(): "live" | "simulation" {
    return requireLive("supabase") ? "live" : "simulation";
  },

  defaultOrgId() {
    return loadDatabase().organizations[0]?.id || "org_demo";
  },

  async listCustomers(organizationId?: string) {
    if (requireLive("supabase")) {
      const q = organizationId
        ? `customers?organization_id=eq.${organizationId}&select=*&order=created_at.desc`
        : "customers?select=*&order=created_at.desc";
      const result = await supabaseRest<Record<string, unknown>[]>(q);
      if (result.ok) return result;
    }
    const db = loadDatabase();
    return {
      ok: true as const,
      data: db.memories
        .filter((m) => m.kind === "person")
        .map((m) => ({
          id: m.id,
          full_name: m.title,
          notes: m.content,
          organization_id: db.organizations[0]?.id,
          source: "file-db",
        })),
    };
  },

  async upsertCustomer(input: {
    organizationId: string;
    fullName: string;
    phone?: string;
    email?: string;
    notes?: string;
  }) {
    const row = {
      organization_id: input.organizationId,
      full_name: input.fullName,
      phone: input.phone || null,
      email: input.email || null,
      notes: input.notes || null,
    };
    if (requireLive("supabase")) {
      const result = await supabaseRest<Record<string, unknown>[]>("customers", {
        method: "POST",
        body: JSON.stringify(row),
        prefer: "return=representation",
      });
      if (result.ok) return result;
    }
    const db = loadDatabase();
    const id = newId("cust");
    const memory: DbMemory = {
      id,
      userId: db.users[0]?.id || "user_demo",
      kind: "person",
      title: input.fullName,
      content: [input.phone, input.email, input.notes].filter(Boolean).join(" · "),
      approved: true,
      createdAt: nowIso(),
    };
    saveDatabase({ ...db, memories: [memory, ...db.memories] });
    return { ok: true as const, data: [{ id, ...row, source: "file-db" }] };
  },

  async writeAudit(input: {
    organizationId: string;
    actor: string;
    action: string;
    detail?: Record<string, unknown>;
  }) {
    const detail = input.detail || {};
    if (requireLive("supabase")) {
      await supabaseRest("audit_events", {
        method: "POST",
        body: JSON.stringify({
          organization_id: input.organizationId,
          actor: input.actor,
          action: input.action,
          detail,
        }),
        prefer: "return=minimal",
      });
    }
    const db = loadDatabase();
    const memory: DbMemory = {
      id: newId("audit"),
      userId: db.users[0]?.id || "user_demo",
      kind: "long-term",
      title: `Audit · ${input.action}`,
      content: `${input.actor}: ${JSON.stringify(detail)}`,
      approved: true,
      createdAt: nowIso(),
    };
    saveDatabase({ ...db, memories: [memory, ...db.memories] });
    return { ok: true as const };
  },

  async createActionProposal(input: {
    organizationId: string;
    kind: string;
    title: string;
    summary: string;
    payload?: Record<string, unknown>;
  }) {
    const payload = input.payload || {};
    if (requireLive("supabase")) {
      const result = await supabaseRest<Record<string, unknown>[]>("action_proposals", {
        method: "POST",
        body: JSON.stringify({
          organization_id: input.organizationId,
          kind: input.kind,
          title: input.title,
          summary: input.summary,
          payload,
          status: "pending",
          requested_by: "Atlas",
        }),
        prefer: "return=representation",
      });
      if (result.ok) return result;
    }
    return {
      ok: true as const,
      data: [
        {
          id: newId("proposal"),
          organization_id: input.organizationId,
          kind: input.kind,
          title: input.title,
          summary: input.summary,
          payload,
          status: "pending",
          source: "file-db",
        },
      ],
    };
  },

  async createAppointment(input: {
    organizationId: string;
    title: string;
    startsAt: string;
    endsAt: string;
    customerId?: string;
    source?: string;
  }) {
    if (requireLive("supabase")) {
      const result = await supabaseRest<Record<string, unknown>[]>("appointments", {
        method: "POST",
        body: JSON.stringify({
          organization_id: input.organizationId,
          customer_id: input.customerId || null,
          title: input.title,
          starts_at: input.startsAt,
          ends_at: input.endsAt,
          status: "scheduled",
          source: input.source || "atlas",
        }),
        prefer: "return=representation",
      });
      if (result.ok) return result;
    }
    const db = loadDatabase();
    const id = newId("evt");
    const stamp = nowIso();
    const event = {
      id,
      user_id: db.users[0]?.id || "user_demo",
      organization_id: input.organizationId,
      title: input.title,
      description: input.source || "atlas",
      start_time: input.startsAt,
      end_time: input.endsAt,
      timezone: "America/Phoenix",
      category_id: db.calendar_categories[0]?.id || "",
      location: "",
      priority: "normal" as const,
      reminder_time: null,
      recurring_rule: null,
      external_calendar_id: null,
      created_at: stamp,
    };
    saveDatabase({ ...db, calendar_events: [event, ...db.calendar_events] });
    return { ok: true as const, data: [event] };
  },
};

export { supabaseRest, supabaseEnv };
