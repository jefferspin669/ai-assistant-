import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, loadDatabase } from "../src/lib/db/store";
import { persistAtlasDatabase, hasPostgres } from "../src/lib/db/postgres";
import { queueDriver } from "../src/lib/queue/env";
import { routeEvent } from "../src/lib/events/router";
import { sendEmail } from "../src/lib/integrations/resend";
import { openaiConfigured } from "../src/lib/integrations/openai";
import { objectStoreConfigured } from "../src/lib/storage/object-store";
import { supabaseAuthConfigured } from "../src/lib/auth/supabase-auth";
import { handleQueuedWork } from "../src/lib/queue/handlers";

const saved = {
  redis: process.env.REDIS_URL,
  database: process.env.DATABASE_URL,
};

beforeEach(() => {
  delete process.env.REDIS_URL;
  delete process.env.DATABASE_URL;
  resetDatabase();
});

afterEach(() => {
  if (saved.redis) process.env.REDIS_URL = saved.redis;
  else delete process.env.REDIS_URL;
  if (saved.database) process.env.DATABASE_URL = saved.database;
  else delete process.env.DATABASE_URL;
});

describe("Backend V1 queue + events", () => {
  it("uses the file queue when REDIS_URL is unset", () => {
    expect(queueDriver()).toBe("file");
  });

  it("switches to BullMQ when REDIS_URL is set", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    expect(queueDriver()).toBe("bullmq");
  });

  it("queues waitlist contact when an appointment is cancelled within 72 hours", async () => {
    const orgId = loadDatabase().organizations[0]!.id;
    const startTime = new Date(Date.now() + 24 * 36e5).toISOString();
    await routeEvent({
      id: "evtbus_test_near",
      type: "appointment.cancelled",
      organizationId: orgId,
      payload: { id: "evt_1", title: "AC tune-up", startTime },
      createdAt: new Date().toISOString(),
    });
    expect(loadDatabase().jobs[0]?.kind).toBe("waitlist-contact");
  });

  it("logs cancellations further than 72 hours out", async () => {
    const orgId = loadDatabase().organizations[0]!.id;
    const startTime = new Date(Date.now() + 200 * 36e5).toISOString();
    await routeEvent({
      id: "evtbus_test_far",
      type: "appointment.cancelled",
      organizationId: orgId,
      payload: { id: "evt_2", title: "Install", startTime },
      createdAt: new Date().toISOString(),
    });
    expect(loadDatabase().jobs[0]?.kind).toBe("cancellation-logged");
  });

  it("routes missed calls onto the receptionist follow-up job", async () => {
    const orgId = loadDatabase().organizations[0]!.id;
    await routeEvent({
      id: "evtbus_missed",
      type: "call.missed",
      organizationId: orgId,
      payload: { from: "+15555550123", phone: "+15555550123" },
      createdAt: new Date().toISOString(),
    });
    expect(loadDatabase().jobs[0]?.kind).toBe("missed-call-follow-up");
  });

  it("does not connect to Postgres when DATABASE_URL is unset", async () => {
    expect(hasPostgres()).toBe(false);
    await expect(persistAtlasDatabase(loadDatabase())).resolves.toBeUndefined();
  });
});

describe("SDK simulation fallbacks", () => {
  it("simulates email without RESEND_API_KEY", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail({ to: "owner@example.com", subject: "Hi", text: "Hello" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.simulated).toBe(true);
  });

  it("reports OpenAI / storage / Supabase Auth as unconfigured without keys", () => {
    delete process.env.ATLAS_LLM_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_STORAGE_BUCKET;
    expect(openaiConfigured()).toBe(false);
    expect(objectStoreConfigured()).toBe(false);
    expect(supabaseAuthConfigured()).toBe(false);
  });

  it("worker handlers audit even when no phone/email is present", async () => {
    const orgId = loadDatabase().organizations[0]!.id;
    const userId = loadDatabase().users[0]!.id;
    const result = await handleQueuedWork("file-indexed", {
      jobId: "job_test",
      organizationId: orgId,
      userId,
      payload: {},
    });
    expect(result.ok).toBe(true);
    expect(loadDatabase().audit_logs.some((row) => row.action.includes("worker:file-indexed"))).toBe(true);
  });
});
