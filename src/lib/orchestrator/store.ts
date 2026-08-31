import { writeJsonFile, readJsonFile } from "@/lib/db/file-persist";
import type { AtlasTrace, OrchestratorRun } from "@/lib/orchestrator/types";

type Store = { runs: OrchestratorRun[]; traces: AtlasTrace[] };

const FILE = "orchestrator.json";

function load(): Store {
  return readJsonFile<Store>(FILE) || { runs: [], traces: [] };
}

function save(store: Store) {
  writeJsonFile(FILE, store);
}

export function resetOrchestratorForTests() {
  save({ runs: [], traces: [] });
}

export function saveRun(run: OrchestratorRun): OrchestratorRun {
  const store = load();
  store.runs = [run, ...store.runs.filter((row) => row.id !== run.id)].slice(0, 200);
  save(store);
  return run;
}

export function getRun(id: string, organizationId?: string) {
  const row = load().runs.find((item) => item.id === id);
  if (!row) return null;
  if (organizationId && row.organizationId !== organizationId) return null;
  return row;
}

export function listRuns(organizationId: string) {
  return load().runs.filter((row) => row.organizationId === organizationId).slice(0, 50);
}

export function dueRuns(now = Date.now()) {
  return load().runs.filter((row) => {
    if (row.status !== "waiting") return false;
    const step = row.steps[row.cursor];
    if (!step?.waitUntil) return true;
    return new Date(step.waitUntil).getTime() <= now;
  });
}

export function saveTrace(trace: AtlasTrace) {
  const store = load();
  store.traces = [trace, ...store.traces.filter((row) => row.id !== trace.id)].slice(0, 200);
  save(store);
  return trace;
}

export function getTrace(id: string, organizationId?: string) {
  const row = load().traces.find((item) => item.id === id);
  if (!row) return null;
  if (organizationId && row.organizationId !== organizationId) return null;
  return row;
}

export function listTraces(organizationId: string) {
  return load().traces.filter((row) => row.organizationId === organizationId).slice(0, 50);
}

export function orchestratorStats() {
  const store = load();
  return {
    runs: store.runs.length,
    waiting: store.runs.filter((row) => row.status === "waiting").length,
    traces: store.traces.length,
  };
}

export function deleteOrgOrchestratorState(organizationId: string) {
  const store = load();
  save({
    runs: store.runs.filter((row) => row.organizationId !== organizationId),
    traces: store.traces.filter((row) => row.organizationId !== organizationId),
  });
}
