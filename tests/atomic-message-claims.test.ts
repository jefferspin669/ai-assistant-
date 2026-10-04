import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const redis = vi.hoisted(() => ({ set: vi.fn(), eval: vi.fn() }));
vi.mock("../src/lib/redis", () => ({ redisConfigured: () => true, getRedis: () => redis }));
import { claimExactOnce, claimCustomerMessage, resetIdempotencyForTests } from "../src/lib/safety/idempotency";
describe("atomic Redis claim contract", () => {
  beforeEach(() => { resetIdempotencyForTests(); vi.clearAllMocks(); });
  afterEach(() => resetIdempotencyForTests());
  it("uses SET NX for competing send reservations", async () => {
    let claimed = false;
    redis.set.mockImplementation(async () => { if (claimed) return null; claimed = true; return "OK"; });
    const result = await Promise.all([claimExactOnce("same-action"), claimExactOnce("same-action")]);
    expect(result.filter((row) => row.allowed)).toHaveLength(1);
    expect(redis.set).toHaveBeenCalledWith("once:same-action", "reserved", "EX", 2592000, "NX");
  });
  it("fails closed when Redis cannot reserve a send", async () => {
    redis.set.mockRejectedValue(new Error("Redis offline"));
    await expect(claimExactOnce("offline-action")).rejects.toThrow("Redis offline");
  });
  it("checks and increments the outreach limit in one Lua call", async () => {
    redis.eval.mockResolvedValue(-3);
    const result = await claimCustomerMessage({ organizationId: "org-a", to: "+15555550123", kind: "follow-up" });
    expect(result.allowed).toBe(false);
    expect(redis.eval).toHaveBeenCalledOnce();
    expect(redis.eval.mock.calls[0][0]).toContain("INCR");
  });
});
