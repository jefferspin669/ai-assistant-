import type { OrchestratorRun, RunStep } from "@/lib/orchestrator/types";
import { saveRun } from "@/lib/orchestrator/store";

/** Keep multi-system operations consistent. Not the UI Recovery trash/undo store. */
export function compensateRun(run: OrchestratorRun): OrchestratorRun {
  const undone: string[] = [];
  for (let i = run.cursor; i >= 0; i -= 1) {
    const step = run.steps[i];
    if (!step || step.status !== "done") continue;
    if (!step.compensate) continue;
    step.status = "skipped";
    step.result = { ...(step.result || {}), compensated: true, via: step.compensate };
    undone.push(step.id);
  }
  run.saga = { compensated: true, undone };
  run.status = "failed";
  run.updatedAt = new Date().toISOString();
  return saveRun(run);
}

export function shouldCompensate(step: RunStep, policy: "retry" | "undo") {
  if (step.status !== "failed") return false;
  return policy === "undo" && Boolean(step.compensate);
}
