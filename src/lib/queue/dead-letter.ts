import { writeJsonFile, readJsonFile } from "@/lib/db/file-persist";
import { nowIso } from "@/lib/db/store";

export type DeadLetterRecord = {
  id: string;
  jobId: string;
  kind: string;
  organizationId: string;
  error: string;
  attempts: number;
  createdAt: string;
};

type Store = { items: DeadLetterRecord[] };

function load(): Store {
  return readJsonFile<Store>("dead-letters.json") || { items: [] };
}

function save(store: Store) {
  writeJsonFile("dead-letters.json", store);
}

export function recordDeadLetter(input: Omit<DeadLetterRecord, "id" | "createdAt">): DeadLetterRecord {
  const row: DeadLetterRecord = {
    id: `dlq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: nowIso(),
    ...input,
  };
  const store = load();
  store.items = [row, ...store.items].slice(0, 200);
  save(store);
  return row;
}

export function listDeadLetters(organizationId?: string) {
  const items = load().items;
  if (!organizationId) return items;
  return items.filter((row) => row.organizationId === organizationId);
}

export function resetDeadLettersForTests() {
  save({ items: [] });
}
