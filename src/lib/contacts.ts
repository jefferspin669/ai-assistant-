export type ContactKind =
  | "customer"
  | "employee"
  | "vendor"
  | "family"
  | "accountant"
  | "partner";

export type ContactRecord = {
  id: string;
  kind: ContactKind;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  tags: string[];
  conversations: { id: string; at: string; summary: string }[];
  appointments: { id: string; at: string; title: string }[];
  invoices: { id: string; label: string; amount: number; status: string }[];
  documents: { id: string; title: string; kind: string }[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "atlas-contacts-v1";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `contact_${crypto.randomUUID()}`;
  return `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function daysFromNow(offset: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function seedContacts(): ContactRecord[] {
  const stamp = nowIso();
  return [
    {
      id: newId(),
      kind: "customer",
      name: "Jamie Cole",
      email: "jamie@email.com",
      phone: "(555) 882-1100",
      company: "Cole Residence",
      notes: "Prefers text updates. Signed water heater quote.",
      tags: ["VIP", "HVAC"],
      conversations: [
        { id: newId(), at: daysFromNow(-1, 15), summary: "Confirmed Saturday install window." },
        { id: newId(), at: daysFromNow(-3, 11), summary: "Asked about financing options." },
      ],
      appointments: [{ id: newId(), at: daysFromNow(2, 14), title: "Water heater install" }],
      invoices: [{ id: newId(), label: "Deposit invoice", amount: 450, status: "Paid" }],
      documents: [{ id: newId(), title: "Signed quote Q-2041", kind: "PDF" }],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: newId(),
      kind: "employee",
      name: "Sam Rivera",
      email: "sam@atlas.demo",
      phone: "(555) 220-4400",
      company: "Atlas Crew",
      notes: "Lead tech · on-call Fridays.",
      tags: ["Field", "Payroll"],
      conversations: [{ id: newId(), at: daysFromNow(-2, 9), summary: "Accepted overtime for Saturday." }],
      appointments: [{ id: newId(), at: daysFromNow(0, 9), title: "Route brief" }],
      invoices: [],
      documents: [{ id: newId(), title: "W-4 on file", kind: "HR" }],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: newId(),
      kind: "vendor",
      name: "Apex Supply",
      email: "orders@apexsupply.demo",
      phone: "(555) 901-3300",
      company: "Apex Supply Co.",
      notes: "Net-30 parts vendor. Ask for counter pickup.",
      tags: ["Parts"],
      conversations: [],
      appointments: [],
      invoices: [{ id: newId(), label: "Parts PO-883", amount: 380, status: "Open" }],
      documents: [{ id: newId(), title: "2026 price sheet", kind: "PDF" }],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: newId(),
      kind: "family",
      name: "Morgan Lee",
      email: "morgan@email.com",
      phone: "(555) 118-7700",
      company: "",
      notes: "Shared family calendar layer.",
      tags: ["Personal"],
      conversations: [],
      appointments: [{ id: newId(), at: daysFromNow(1, 18), title: "School pickup" }],
      invoices: [],
      documents: [],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: newId(),
      kind: "accountant",
      name: "Priya Shah, CPA",
      email: "priya@shahcpa.demo",
      phone: "(555) 441-2288",
      company: "Shah CPA",
      notes: "Quarterly estimated tax reviews.",
      tags: ["Tax"],
      conversations: [{ id: newId(), at: daysFromNow(-10, 14), summary: "Asked for Q2 ledger export." }],
      appointments: [{ id: newId(), at: daysFromNow(12, 11), title: "Q2 tax review" }],
      invoices: [],
      documents: [{ id: newId(), title: "Engagement letter", kind: "PDF" }],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: newId(),
      kind: "partner",
      name: "Harbor Dental",
      email: "ops@harbordental.demo",
      phone: "(555) 662-1001",
      company: "Harbor Dental",
      notes: "Commercial maintenance partner.",
      tags: ["B2B"],
      conversations: [],
      appointments: [{ id: newId(), at: daysFromNow(5, 8), title: "Quarterly HVAC check" }],
      invoices: [{ id: newId(), label: "Service retainer", amount: 960, status: "Overdue" }],
      documents: [],
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
}

export function loadContacts(): ContactRecord[] {
  if (typeof window === "undefined") return seedContacts();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedContacts();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as ContactRecord[];
    return Array.isArray(parsed) && parsed.length ? parsed : seedContacts();
  } catch {
    return seedContacts();
  }
}

export function saveContacts(contacts: ContactRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

export function createContact(input: {
  kind: ContactKind;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}): ContactRecord {
  const stamp = nowIso();
  return {
    id: newId(),
    kind: input.kind,
    name: input.name.trim() || "Untitled contact",
    email: (input.email || "").trim(),
    phone: (input.phone || "").trim(),
    company: (input.company || "").trim(),
    notes: (input.notes || "").trim(),
    tags: [],
    conversations: [],
    appointments: [],
    invoices: [],
    documents: [],
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function updateContact(
  contacts: ContactRecord[],
  id: string,
  patch: Partial<ContactRecord>,
): ContactRecord[] {
  return contacts.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: nowIso() } : c));
}

export function removeContact(contacts: ContactRecord[], id: string) {
  return contacts.filter((c) => c.id !== id);
}

export function filterContacts(contacts: ContactRecord[], kind: ContactKind | "all", query: string) {
  const q = query.trim().toLowerCase();
  return contacts.filter((c) => {
    if (kind !== "all" && c.kind !== kind) return false;
    if (!q) return true;
    return `${c.name} ${c.email} ${c.phone} ${c.company} ${c.notes} ${c.tags.join(" ")}`
      .toLowerCase()
      .includes(q);
  });
}

export const CONTACT_KINDS: { id: ContactKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "customer", label: "Customers" },
  { id: "employee", label: "Employees" },
  { id: "vendor", label: "Vendors" },
  { id: "family", label: "Family" },
  { id: "accountant", label: "Accountants" },
  { id: "partner", label: "Partners" },
];
