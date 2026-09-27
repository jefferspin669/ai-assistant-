/** AI Document Builder — drafts with Atlas customer context. */

import { customers as seedCustomers } from "./data";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const DOCUMENT_KINDS = [
  "Proposal",
  "Contract",
  "Report",
  "Letter",
  "Invoice",
  "Policy",
  "Meeting Notes",
  "Business Plan",
  "Custom Document",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export type UserDocument = {
  id: string;
  kind: DocumentKind;
  title: string;
  body: string;
  customerName?: string;
  status: "draft" | "ready" | "shared";
  createdAt: string;
  updatedAt: string;
};

const DOCS_KEY = "atlas-user-documents-v1";

export function loadUserDocuments(): UserDocument[] {
  return loadJson(DOCS_KEY, []);
}

export function saveUserDocuments(docs: UserDocument[]) {
  saveJson(DOCS_KEY, docs);
}

function findCustomer(name: string) {
  const q = name.toLowerCase();
  return seedCustomers.find((c) => c.name.toLowerCase().includes(q));
}

export function generateDocumentBody(kind: DocumentKind, description: string, customerName?: string): string {
  const customer = customerName ? findCustomer(customerName) : null;
  const header = customer
    ? `${customer.name}\n${customer.phone || "Contact on file"}\n${customer.email || ""}\n\n`
    : "";
  const amountMatch = description.match(/\$[\d,]+(?:\.\d{2})?/);
  const amount = amountMatch?.[0] || "$7,500";

  switch (kind) {
    case "Proposal":
      return `${header}PROPOSAL — ${description}\n\nScope:\n• Discovery and requirements review\n• Design and implementation\n• Testing and launch support\n\nTotal: ${amount}\nValid 30 days.\n\nPrepared by Atlas with customer history and pricing from your workspace.`;
    case "Contract":
      return `${header}SERVICE AGREEMENT\n\n${description}\n\nTerms: Net 15 · Warranty 90 days · Owner approval over ${amount}.\n\nAtlas pulled contact details and prior job notes into this draft.`;
    case "Invoice":
      return `${header}INVOICE\n\n${description}\n\nAmount due: ${amount}\nDue upon receipt.\n\nLine items generated from Atlas Money and job records.`;
    case "Meeting Notes":
      return `MEETING NOTES\n\n${description}\n\nDecisions:\n• Timeline confirmed\n• Owners assigned\n\nAction items captured for Project Manager.`;
    default:
      return `${header}${kind.toUpperCase()}\n\n${description}\n\n— Drafted by Atlas Document Builder with business context.`;
  }
}

export function createDocumentFromPrompt(kind: DocumentKind, description: string): UserDocument {
  const customerMatch = description.match(/for\s+([A-Za-z][\w\s]+?)(?:\s+for|\s*$)/i);
  const customerName = customerMatch?.[1]?.trim();
  const doc: UserDocument = {
    id: newId("doc"),
    kind,
    title: description.slice(0, 60) || `${kind} draft`,
    body: generateDocumentBody(kind, description, customerName),
    customerName,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  saveUserDocuments([doc, ...loadUserDocuments()]);
  return doc;
}

export function rewriteDocumentBody(body: string, mode: "professional" | "shorten" | "rewrite"): string {
  if (mode === "shorten") return body.split("\n").slice(0, 6).join("\n") + "\n\n[Shortened by Atlas]";
  if (mode === "professional")
    return body.replace(/\n\n/g, "\n\n").replace(/^/m, "Dear Client,\n\n") + "\n\nRespectfully,\nAtlas on behalf of your team";
  return body + "\n\n[Rewritten for clarity by Atlas]";
}

export function updateUserDocument(id: string, patch: Partial<UserDocument>): UserDocument | null {
  const docs = loadUserDocuments();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx < 0) return null;
  docs[idx] = { ...docs[idx], ...patch, updatedAt: nowIso() };
  saveUserDocuments(docs);
  return docs[idx];
}
