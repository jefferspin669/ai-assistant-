import { beforeEach, describe, expect, it } from "vitest";
import {
  resetDatabase,
  flushDatabaseWrites,
  __setLastPersistErrorForTests,
} from "../src/lib/db/store";
import { PersistenceError } from "../src/lib/domain/errors";
import { resetEnsureCache } from "../src/lib/db/ensure";
import { jsonError } from "../src/lib/api/http";

describe("persistence: failed writes are visible", () => {
  beforeEach(() => {
    resetDatabase();
    resetEnsureCache();
    __setLastPersistErrorForTests(null);
    delete process.env.ATLAS_ALLOW_JSON_FALLBACK;
    delete process.env.ATLAS_SEED_EMPTY_PG;
  });

  it("flushDatabaseWrites throws PersistenceError (503) when a PG write failed", async () => {
    __setLastPersistErrorForTests(new Error("connection refused"));
    await expect(flushDatabaseWrites()).rejects.toBeInstanceOf(PersistenceError);
    try {
      __setLastPersistErrorForTests(new Error("disk full"));
      await flushDatabaseWrites();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).status).toBe(503);
      expect((error as PersistenceError).code).toBe("PERSISTENCE");
      expect((error as PersistenceError).message).toContain("disk full");
    }
  });

  it("jsonError maps PersistenceError to HTTP 503 body", async () => {
    const response = jsonError(new PersistenceError("mirror write failed"));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("mirror write failed");
  });

  it("clears the sticky error after one flush throw so the next flush can succeed", async () => {
    __setLastPersistErrorForTests(new Error("transient"));
    await expect(flushDatabaseWrites()).rejects.toBeInstanceOf(PersistenceError);
    await expect(flushDatabaseWrites()).resolves.toBeUndefined();
  });
});
