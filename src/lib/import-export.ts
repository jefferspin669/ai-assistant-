import { exportAccountData, getCurrentAccount } from "@/lib/account";
import { customers } from "@/lib/data";
import {
  loadCalendarState,
  saveCalendarState,
  type CalendarEvent,
  type CalendarState,
} from "@/lib/smart-calendar";
import { createTask, loadTasks, saveTasks, type AtlasTask } from "@/lib/tasks";
import {
  createTaxTransaction,
  loadTaxTransactions,
  saveTaxTransactions,
  type TaxTransaction,
} from "@/lib/tax-ledger";
import { pushUndoAction, recordBackup } from "@/lib/recovery";

export type ImportKind =
  | "calendar"
  | "contacts"
  | "bank"
  | "csv"
  | "customers"
  | "tax"
  | "accounting";

export type ExportKind = "pdf" | "csv" | "excel" | "ics" | "accountant";

export type TransferResult = {
  ok: true;
  message: string;
  count?: number;
  content?: string;
  filename?: string;
  mime?: string;
} | { ok: false; error: string };

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === "," && !inQuotes) {
          cells.push(cur.trim());
          cur = "";
          continue;
        }
        cur += ch;
      }
      cells.push(cur.trim());
      return cells;
    });
}

function csvEscape(value: string | number) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: (string | number)[][]) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function parseIcsDate(value: string) {
  // 20260314T150000Z or 20260314
  const m = value.replace(/[^0-9]/g, "");
  if (m.length < 8) return new Date().toISOString();
  const y = Number(m.slice(0, 4));
  const mo = Number(m.slice(4, 6)) - 1;
  const d = Number(m.slice(6, 8));
  const hh = Number(m.slice(8, 10) || "9");
  const mm = Number(m.slice(10, 12) || "0");
  return new Date(Date.UTC(y, mo, d, hh, mm)).toISOString();
}

function importCalendarIcs(text: string): TransferResult {
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  if (!blocks.length) return { ok: false, error: "No VEVENT blocks found in calendar file." };
  const state = loadCalendarState();
  const added: CalendarEvent[] = [];
  for (const block of blocks) {
    const summary = block.match(/SUMMARY:(.+)/)?.[1]?.trim() || "Imported event";
    const description = block.match(/DESCRIPTION:(.+)/)?.[1]?.trim() || "";
    const location = block.match(/LOCATION:(.+)/)?.[1]?.trim() || "";
    const dtStart = block.match(/DTSTART[^:]*:(.+)/)?.[1]?.trim();
    const dtEnd = block.match(/DTEND[^:]*:(.+)/)?.[1]?.trim();
    if (!dtStart) continue;
    const start = parseIcsDate(dtStart);
    const end = dtEnd ? parseIcsDate(dtEnd) : new Date(new Date(start).getTime() + 3600000).toISOString();
    added.push({
      id: `imp_${crypto.randomUUID?.() || Date.now()}`,
      title: summary,
      categoryId: "meetings",
      layerId: "business",
      start,
      end,
      location,
      invitees: [],
      notes: description,
      priority: "normal",
      outdoor: false,
      pinnedDeadline: false,
    });
  }
  const next: CalendarState = { ...state, events: [...added, ...state.events] };
  pushUndoAction({
    label: `Import ${added.length} calendar events`,
    undo: () => saveCalendarState(state),
  });
  saveCalendarState(next);
  recordBackup("calendar", "After calendar import");
  return { ok: true, message: `Imported ${added.length} calendar events.`, count: added.length };
}

function importContactsCsv(text: string): TransferResult {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, error: "CSV needs a header row and at least one contact." };
  const header = rows[0].map((h) => h.toLowerCase());
  const nameIdx = header.findIndex((h) => /name|contact/.test(h));
  const emailIdx = header.findIndex((h) => /email/.test(h));
  const phoneIdx = header.findIndex((h) => /phone|mobile/.test(h));
  const count = rows.length - 1;
  // Demo: store as cloud note listing
  const account = getCurrentAccount();
  const listing = rows
    .slice(1)
    .map((row) => {
      const name = nameIdx >= 0 ? row[nameIdx] : row[0];
      const email = emailIdx >= 0 ? row[emailIdx] : "";
      const phone = phoneIdx >= 0 ? row[phoneIdx] : "";
      return `- ${name}${email ? ` · ${email}` : ""}${phone ? ` · ${phone}` : ""}`;
    })
    .join("\n");
  if (account) {
    // Persist as a generated note via localStorage sidecar
    const key = "atlas-imported-contacts-v1";
    localStorage.setItem(
      key,
      JSON.stringify({ at: new Date().toISOString(), count, listing, accountId: account.id }),
    );
  }
  return {
    ok: true,
    message: `Imported ${count} contacts${account ? " into Atlas contact import tray" : ""}.`,
    count,
  };
}

function importBankOrCsv(text: string, kind: "bank" | "csv" | "accounting"): TransferResult {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, error: "Spreadsheet needs headers and data rows." };
  const header = rows[0].map((h) => h.toLowerCase());
  const dateIdx = header.findIndex((h) => /date/.test(h));
  const labelIdx = header.findIndex((h) => /label|description|memo|payee|name/.test(h));
  const amountIdx = header.findIndex((h) => /amount|value|total/.test(h));
  const typeIdx = header.findIndex((h) => /type|kind|debit|credit/.test(h));
  const categoryIdx = header.findIndex((h) => /category|class/.test(h));

  const before = loadTaxTransactions();
  const added: TaxTransaction[] = [];
  for (const row of rows.slice(1)) {
    const amountRaw = amountIdx >= 0 ? row[amountIdx] : row[row.length - 1];
    const amount = Math.abs(Number(String(amountRaw).replace(/[$,]/g, "")));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const label = (labelIdx >= 0 ? row[labelIdx] : row[1]) || "Imported row";
    const typeCell = (typeIdx >= 0 ? row[typeIdx] : "").toLowerCase();
    const kindTxn =
      typeCell.includes("income") || typeCell.includes("credit") || Number(amountRaw) > 0
        ? amountRaw.toString().includes("-") || typeCell.includes("debit") || typeCell.includes("expense")
          ? "expense"
          : "income"
        : kind === "bank"
          ? "expense"
          : "expense";
    // Prefer sign for bank feeds
    const signed = Number(String(amountRaw).replace(/[$,]/g, ""));
    const finalKind = Number.isFinite(signed) && signed < 0 ? "expense" : kindTxn === "income" ? "income" : "expense";
    added.push(
      createTaxTransaction({
        kind: finalKind,
        label: String(label),
        amount,
        category: (categoryIdx >= 0 ? row[categoryIdx] : kind === "accounting" ? "Accounting import" : "Import") || "Import",
        date: dateIdx >= 0 ? String(row[dateIdx]).slice(0, 10) : new Date().toISOString().slice(0, 10),
        notes: `${kind} import`,
        receiptName: /receipt/i.test(String(label)) ? `${label}.pdf` : null,
      }),
    );
  }
  if (!added.length) return { ok: false, error: "No valid amount rows found." };
  pushUndoAction({
    label: `Import ${added.length} ${kind} rows`,
    undo: () => saveTaxTransactions(before),
  });
  saveTaxTransactions([...added, ...before]);
  recordBackup("tax", `After ${kind} import`);
  return { ok: true, message: `Imported ${added.length} transactions from ${kind} file.`, count: added.length };
}

function importCustomerList(text: string): TransferResult {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, error: "Customer list CSV is empty." };
  const count = rows.length - 1;
  const tasks = loadTasks();
  const followUps = rows.slice(1, 6).map((row) =>
    createTask({
      title: `Follow up with ${row[0] || "imported customer"}`,
      notes: row.slice(1).join(" · "),
      category: "Customers",
      priority: "normal",
    }),
  );
  const before = tasks;
  pushUndoAction({
    label: `Import ${count} customers`,
    undo: () => saveTasks(before),
  });
  saveTasks([...followUps, ...tasks]);
  localStorage.setItem(
    "atlas-imported-customers-v1",
    JSON.stringify({ at: new Date().toISOString(), count, sample: rows.slice(0, 6) }),
  );
  return {
    ok: true,
    message: `Imported ${count} customers and created ${followUps.length} follow-up tasks.`,
    count,
  };
}

function importTaxDocs(text: string): TransferResult {
  // Accept CSV or free-text labels
  if (text.includes(",")) return importBankOrCsv(text, "accounting");
  const before = loadTaxTransactions();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const added = lines.slice(0, 20).map((line) =>
    createTaxTransaction({
      kind: /income|invoice|payment/i.test(line) ? "income" : "expense",
      label: line.slice(0, 80),
      amount: 100,
      category: "Tax document",
      notes: "Imported tax document reference",
      receiptName: `${line.slice(0, 24)}.pdf`,
    }),
  );
  pushUndoAction({
    label: `Import ${added.length} tax documents`,
    undo: () => saveTaxTransactions(before),
  });
  saveTaxTransactions([...added, ...before]);
  return { ok: true, message: `Imported ${added.length} tax document references.`, count: added.length };
}

export function importPayload(kind: ImportKind, text: string): TransferResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Paste or upload file content first." };
  switch (kind) {
    case "calendar":
      return importCalendarIcs(trimmed);
    case "contacts":
      return importContactsCsv(trimmed);
    case "bank":
      return importBankOrCsv(trimmed, "bank");
    case "csv":
      return importBankOrCsv(trimmed, "csv");
    case "customers":
      return importCustomerList(trimmed);
    case "tax":
      return importTaxDocs(trimmed);
    case "accounting":
      return importBankOrCsv(trimmed, "accounting");
    default:
      return { ok: false, error: "Unknown import type." };
  }
}

export function sampleImport(kind: ImportKind): string {
  switch (kind) {
    case "calendar":
      return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Imported vendor call
DTSTART:20260810T150000Z
DTEND:20260810T160000Z
LOCATION:Zoom
DESCRIPTION:Brought over from another calendar
END:VEVENT
END:VCALENDAR`;
    case "contacts":
      return `name,email,phone
Alex Rivera,alex@example.com,(555) 100-2000
Sam Patel,sam@example.com,(555) 100-2001`;
    case "customers":
      return `name,email,value
Jordan Lee,jordan@email.com,$1200
Casey Ng,casey@email.com,$640`;
    case "tax":
      return `Walmart office supplies receipt
Q1 estimated tax voucher
1099 from Apex Supply`;
    case "bank":
    case "csv":
    case "accounting":
    default:
      return `date,description,amount,type,category
2026-03-14,Walmart office supplies,-86.42,expense,Supplies
2026-03-18,Johnson Construction invoice,4200,income,Service income
2026-03-20,Fuel,-54.10,expense,Vehicle`;
  }
}

function downloadable(
  content: string,
  filename: string,
  mime: string,
  message: string,
): TransferResult {
  return { ok: true, message, content, filename, mime };
}

export function exportPayload(kind: ExportKind): TransferResult {
  const account = getCurrentAccount();
  const cal = typeof window !== "undefined" ? loadCalendarState() : null;
  const tasks = typeof window !== "undefined" ? loadTasks() : [];
  const tax = typeof window !== "undefined" ? loadTaxTransactions() : [];

  if (kind === "ics") {
    if (!cal) return { ok: false, error: "Calendar unavailable." };
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Atlas AI//EN",
      ...cal.events.flatMap((event) => [
        "BEGIN:VEVENT",
        `UID:${event.id}@atlas`,
        `SUMMARY:${event.title}`,
        `DTSTART:${event.start.replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
        `DTEND:${event.end.replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
        `LOCATION:${event.location || ""}`,
        `DESCRIPTION:${event.notes || ""}`,
        "END:VEVENT",
      ]),
      "END:VCALENDAR",
    ].join("\n");
    return downloadable(body, `atlas-calendar-${nowStamp()}.ics`, "text/calendar", `Exported ${cal.events.length} events.`);
  }

  if (kind === "csv") {
    const rows: (string | number)[][] = [
      ["type", "title", "amount", "date", "category", "notes"],
      ...tax.map((t) => [t.kind, t.label, t.amount, t.date, t.category, t.notes]),
      ...tasks.map((t: AtlasTask) => ["task", t.title, "", t.dueDate || "", t.category, t.notes]),
      ...customers.map((c) => ["customer", c.name, c.value, "", "CRM", c.last]),
    ];
    return downloadable(toCsv(rows), `atlas-export-${nowStamp()}.csv`, "text/csv", "Exported CSV workbook of tax, tasks, and customers.");
  }

  if (kind === "excel") {
    // TSV that Excel opens cleanly
    const rows: (string | number)[][] = [
      ["Section", "Title", "Amount", "Date", "Meta"],
      ...tax.map((t) => ["Tax", t.label, t.amount, t.date, t.kind]),
      ...tasks.map((t) => ["Task", t.title, "", t.dueDate || "", t.status]),
    ];
    const tsv = rows.map((r) => r.join("\t")).join("\n");
    return downloadable(tsv, `atlas-export-${nowStamp()}.xls`, "application/vnd.ms-excel", "Exported Excel-friendly spreadsheet.");
  }

  if (kind === "pdf") {
    const lines = [
      "Atlas AI export",
      `Generated: ${new Date().toLocaleString()}`,
      account ? `Account: ${account.personal.fullName} · ${account.email}` : "Guest export",
      "",
      "Tax ledger",
      ...tax.slice(0, 30).map((t) => `- ${t.date} ${t.kind} ${t.label} $${t.amount.toFixed(2)}`),
      "",
      "Tasks",
      ...tasks.slice(0, 20).map((t) => `- [${t.status}] ${t.title}`),
      "",
      "Calendar",
      ...(cal?.events.slice(0, 20).map((e) => `- ${e.start.slice(0, 16)} ${e.title}`) || []),
    ];
    return downloadable(lines.join("\n"), `atlas-report-${nowStamp()}.txt`, "text/plain", "Exported printable report (text/PDF stand-in).");
  }

  // accountant pack
  const income = tax.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = tax.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
  const pack = {
    generatedAt: new Date().toISOString(),
    account: account
      ? {
          name: account.personal.fullName,
          email: account.email,
          business: account.businesses.find((b) => b.id === account.activeBusinessId)?.name,
          taxState: account.setup?.taxState || "TX",
        }
      : null,
    summary: { income, expenses, profit: income - expenses, transactionCount: tax.length },
    transactions: tax,
    customers,
  };
  return downloadable(
    JSON.stringify(pack, null, 2),
    `atlas-accountant-pack-${nowStamp()}.json`,
    "application/json",
    "Exported accountant-ready pack.",
  );
}

export function exportFullAccountJson(): TransferResult {
  const result = exportAccountData();
  if (!result.ok) return result;
  return downloadable(result.json, `atlas-account-${nowStamp()}.json`, "application/json", "Exported full account JSON.");
}

export function triggerDownload(content: string, filename: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
