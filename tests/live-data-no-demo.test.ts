import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import { authenticate } from "../src/lib/auth/password";
import {
  inviteWorker,
  teamOpsSnapshot,
} from "../src/lib/services/team-ops";

describe("live data / no-demo beachhead", () => {
  beforeEach(() => resetDatabase());

  it("does not grant invited workers the shared atlas-worker password", () => {
    const db = database();
    const owner = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
    const invited = inviteWorker(owner, {
      email: "fresh-worker@example.com",
      fullName: "Fresh Worker",
    });
    expect(() => authenticate("fresh-worker@example.com", "atlas-worker", "test")).toThrow();
    expect(invited.member.status).toBe("invited");
  });

  it("hides approvals and audit from worker team snapshots", () => {
    const db = database();
    const owner = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
    const workerUser = db.users.find((u) => u.email === "sam@atlas.ai");
    expect(workerUser).toBeTruthy();
    const worker = testSession(workerUser!.id, db.organizations[0]!.id, "employee");
    const ownerSnap = teamOpsSnapshot(owner);
    const workerSnap = teamOpsSnapshot(worker);
    expect(Array.isArray(ownerSnap.approvals)).toBe(true);
    expect(Array.isArray(ownerSnap.audit)).toBe(true);
    expect(workerSnap.approvals).toEqual([]);
    expect(workerSnap.audit).toEqual([]);
  });
});
