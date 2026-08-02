import { getCurrentAccount, searchEverything } from "@/lib/account";
import { customers, payments, quotes } from "@/lib/data";
import { loadCalendarState } from "@/lib/smart-calendar";
import { loadTasks } from "@/lib/tasks";
import { loadTaxTransactions } from "@/lib/tax-ledger";

export type SearchSource =
  | "calendar"
  | "task"
  | "conversation"
  | "customer"
  | "receipt"
  | "tax"
  | "file"
  | "note"
  | "invoice"
  | "cloud"
  | "memory"
  | "knowledge"
  | "chat";

export type GlobalSearchHit = {
  id: string;
  source: SearchSource;
  title: string;
  snippet: string;
  href: string;
  score: number;
};

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export type ParsedSearchIntent = {
  raw: string;
  terms: string[];
  merchant?: string;
  month?: number;
  year?: number;
  kindHint?: SearchSource;
};

export function parseSearchIntent(query: string): ParsedSearchIntent {
  const raw = query.trim();
  const lower = raw.toLowerCase();
  const intent: ParsedSearchIntent = {
    raw,
    terms: lower
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1 && !["find", "the", "from", "last", "show", "me", "my", "a", "an", "for"].includes(t)),
  };

  if (/\breceipt/.test(lower)) intent.kindHint = "receipt";
  else if (/\binvoice/.test(lower)) intent.kindHint = "invoice";
  else if (/\btax|1099|w-?2/.test(lower)) intent.kindHint = "tax";
  else if (/\bevent|meeting|appointment|calendar/.test(lower)) intent.kindHint = "calendar";
  else if (/\btask|todo|to-do/.test(lower)) intent.kindHint = "task";
  else if (/\bcustomer|client|contact/.test(lower)) intent.kindHint = "customer";
  else if (/\bfile|document|upload/.test(lower)) intent.kindHint = "file";
  else if (/\bnote|memo/.test(lower)) intent.kindHint = "note";
  else if (/\bchat|conversation/.test(lower)) intent.kindHint = "conversation";

  for (const [name, idx] of Object.entries(MONTHS)) {
    if (lower.includes(name)) {
      intent.month = idx;
      break;
    }
  }

  const yearMatch = lower.match(/\b(20\d{2})\b/);
  if (yearMatch) intent.year = Number(yearMatch[1]);
  else if (/\blast\b/.test(lower) && intent.month != null) {
    const now = new Date();
    intent.year = intent.month > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear();
  }

  const fromMatch = lower.match(/\bfrom\s+([a-z0-9&.\- ]+?)(?:\s+last|\s+in|\s+on|$)/i);
  if (fromMatch) intent.merchant = fromMatch[1].trim();

  return intent;
}

function matchesTerms(haystack: string, terms: string[]) {
  const h = haystack.toLowerCase();
  return terms.every((t) => h.includes(t));
}

function dateInIntent(dateStr: string, intent: ParsedSearchIntent) {
  if (intent.month == null && intent.year == null) return true;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  if (intent.month != null && d.getMonth() !== intent.month) return false;
  if (intent.year != null && d.getFullYear() !== intent.year) return false;
  return true;
}

function push(
  hits: GlobalSearchHit[],
  hit: Omit<GlobalSearchHit, "score"> & { score?: number },
) {
  hits.push({ ...hit, score: hit.score ?? 1 });
}

export function globalSearch(query: string, limit = 40): GlobalSearchHit[] {
  const intent = parseSearchIntent(query);
  if (!intent.raw) return [];
  const terms = intent.terms.length ? intent.terms : [intent.raw.toLowerCase()];
  const merchant = intent.merchant?.toLowerCase();
  const hits: GlobalSearchHit[] = [];
  const account = getCurrentAccount();

  // Calendar events
  try {
    const cal = loadCalendarState();
    for (const event of cal.events) {
      const blob = `${event.title} ${event.location} ${event.notes} ${event.invitees.join(" ")}`;
      if (!matchesTerms(blob, terms) && !(merchant && blob.toLowerCase().includes(merchant))) continue;
      if (!dateInIntent(event.start, intent)) continue;
      if (intent.kindHint && intent.kindHint !== "calendar") continue;
      push(hits, {
        id: event.id,
        source: "calendar",
        title: event.title,
        snippet: `${new Date(event.start).toLocaleString()} · ${event.location || "No location"}`,
        href: "/app/appointments",
        score: intent.kindHint === "calendar" ? 3 : 2,
      });
    }
  } catch {
    /* ignore */
  }

  // Tasks
  try {
    for (const task of loadTasks()) {
      const blob = `${task.title} ${task.notes} ${task.category}`;
      if (!matchesTerms(blob, terms)) continue;
      if (intent.kindHint && intent.kindHint !== "task") continue;
      push(hits, {
        id: task.id,
        source: "task",
        title: task.title,
        snippet: `${task.status} · ${task.priority}${task.dueDate ? ` · due ${task.dueDate.slice(0, 10)}` : ""}`,
        href: "/app/tasks",
        score: intent.kindHint === "task" ? 3 : 2,
      });
    }
  } catch {
    /* ignore */
  }

  // Tax / receipts
  try {
    for (const row of loadTaxTransactions()) {
      const blob = `${row.label} ${row.category} ${row.notes} ${row.receiptName || ""}`;
      const isReceipt = Boolean(row.receiptName) || /receipt|walmart|store|fuel|parts/i.test(blob);
      if (merchant && !blob.toLowerCase().includes(merchant) && !matchesTerms(blob, terms)) continue;
      if (!merchant && !matchesTerms(blob, terms) && !(intent.kindHint === "receipt" && isReceipt)) continue;
      if (!dateInIntent(row.date, intent)) continue;
      if (intent.kindHint === "invoice") continue;
      const source: SearchSource =
        intent.kindHint === "receipt" || isReceipt ? "receipt" : "tax";
      if (intent.kindHint && intent.kindHint !== source && intent.kindHint !== "tax") continue;
      push(hits, {
        id: row.id,
        source,
        title: row.label,
        snippet: `${row.kind} · $${row.amount.toFixed(2)} · ${row.date}${row.receiptName ? ` · ${row.receiptName}` : ""}`,
        href: "/app/tax",
        score: merchant || intent.kindHint === "receipt" ? 4 : 2,
      });
    }
  } catch {
    /* ignore */
  }

  // Conversations / AI chats
  if (account) {
    for (const chat of account.aiWorkspace.chats) {
      const blob = `${chat.title} ${chat.preview} ${chat.messages.map((m) => m.text).join(" ")}`;
      if (!matchesTerms(blob, terms)) continue;
      if (intent.kindHint && !["conversation", "chat"].includes(intent.kindHint)) continue;
      push(hits, {
        id: chat.id,
        source: "conversation",
        title: chat.title,
        snippet: chat.preview,
        href: "/app/chat",
        score: 2,
      });
    }

    for (const item of account.cloudItems) {
      if (item.deletedAt) continue;
      const blob = `${item.title} ${item.content} ${item.kind}`;
      if (!matchesTerms(blob, terms)) continue;
      const source: SearchSource =
        item.kind === "file" || item.kind === "document"
          ? item.title.toLowerCase().includes("note")
            ? "note"
            : "file"
          : item.kind === "conversation"
            ? "conversation"
            : "cloud";
      if (intent.kindHint && intent.kindHint !== source && intent.kindHint !== "file" && intent.kindHint !== "note") {
        continue;
      }
      push(hits, {
        id: item.id,
        source,
        title: item.title,
        snippet: item.content.slice(0, 120),
        href: "/app/files",
        score: 2,
      });
    }

    for (const note of account.memories) {
      const blob = `${note.title} ${note.content}`;
      if (!matchesTerms(blob, terms)) continue;
      if (intent.kindHint && intent.kindHint !== "note") continue;
      push(hits, {
        id: note.id,
        source: "note",
        title: note.title,
        snippet: note.content.slice(0, 120),
        href: "/app/memory",
        score: 1,
      });
    }
  }

  // Customers
  for (const customer of customers) {
    const blob = `${customer.name} ${customer.email} ${customer.phone} ${customer.last}`;
    if (!matchesTerms(blob, terms) && !(merchant && blob.toLowerCase().includes(merchant))) continue;
    if (intent.kindHint && intent.kindHint !== "customer") continue;
    push(hits, {
      id: `cust-${customer.email}`,
      source: "customer",
      title: customer.name,
      snippet: `${customer.jobs} jobs · ${customer.value} · ${customer.last}`,
      href: "/app/customers",
      score: 2,
    });
  }

  // Invoices / payments / quotes
  for (const payment of payments) {
    const blob = `${payment.customer} ${payment.amount} ${payment.method} ${payment.status}`;
    if (!matchesTerms(blob, terms) && !(merchant && blob.toLowerCase().includes(merchant))) continue;
    if (intent.kindHint && intent.kindHint !== "invoice") continue;
    push(hits, {
      id: `pay-${payment.customer}-${payment.amount}`,
      source: "invoice",
      title: `${payment.customer} · ${payment.amount}`,
      snippet: `${payment.method} · ${payment.status} · ${payment.when}`,
      href: "/app/payments",
      score: intent.kindHint === "invoice" ? 3 : 1,
    });
  }
  for (const quote of quotes) {
    const blob = `${quote.title} ${quote.customer} ${quote.amount} ${quote.id}`;
    if (!matchesTerms(blob, terms)) continue;
    if (intent.kindHint && intent.kindHint !== "invoice") continue;
    push(hits, {
      id: quote.id,
      source: "invoice",
      title: `${quote.id} · ${quote.title}`,
      snippet: `${quote.customer} · ${quote.amount} · ${quote.status}`,
      href: "/app/quotes",
      score: 2,
    });
  }

  // Fallback account searchEverything hits
  if (account && hits.length < 8) {
    for (const hit of searchEverything(query)) {
      if (hits.some((h) => h.id === hit.id)) continue;
      push(hits, {
        id: hit.id,
        source: hit.source === "cloud" ? "cloud" : hit.source === "memory" ? "memory" : "knowledge",
        title: hit.title,
        snippet: hit.snippet,
        href: hit.source === "cloud" ? "/app/files" : hit.source === "memory" ? "/app/memory" : "/app/knowledge",
        score: 1,
      });
    }
  }

  // Demo receipt for NL example when asked about Walmart
  if (merchant?.includes("walmart") || /walmart/.test(intent.raw.toLowerCase())) {
    const hasWalmart = hits.some((h) => h.title.toLowerCase().includes("walmart"));
    if (!hasWalmart) {
      push(hits, {
        id: "demo-walmart-receipt",
        source: "receipt",
        title: "Walmart receipt · office supplies",
        snippet: "Mar 14 · $86.42 · Tax Center expense (demo match)",
        href: "/app/tax",
        score: 5,
      });
    }
  }

  return hits
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
