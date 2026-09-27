import { describe, expect, it } from "vitest";
import { parseNaturalAssignCommand, seedDemoTeamIfEmpty, loadTeamMembers } from "../src/lib/user-workspace";

describe("work commands", () => {
  it("parses assign commands for Atlas Assistant", () => {
    seedDemoTeamIfEmpty();
    const members = loadTeamMembers();
    const mike = members.find((m) => m.name.toLowerCase().includes("alex")) ?? members[0];
    if (!mike) return;
    const first = mike.name.split(" ")[0];
    const result = parseNaturalAssignCommand(
      `Assign ${first} the website redesign and make it due Friday`,
      members,
    );
    expect(result?.assigneeId).toBe(mike.id);
    expect(result?.title.toLowerCase()).toContain("website");
  });
});
