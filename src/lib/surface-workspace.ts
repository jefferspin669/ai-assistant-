/** User-owned data for meetings, vision, timeline, CRM, security, and OS apps. */

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
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

/* ─── Meetings ─────────────────────────────────────────────────────────── */

export type MeetingTask = { owner: string; task: string; due: string };
export type MeetingDeadline = { label: string; due: string };

export type UserMeeting = {
  id: string;
  title: string;
  platform: string;
  joinUrl: string;
  attendees: string[];
  recorded: string;
  summary: string;
  notes: string[];
  decisions: string[];
  tasks: MeetingTask[];
  deadlines: MeetingDeadline[];
  recapSent: boolean;
  status: "scheduled" | "live" | "ended";
  createdAt: string;
};

const MEETINGS_KEY = "atlas-user-meetings-v1";

export function loadMeetings(): UserMeeting[] {
  return loadJson(MEETINGS_KEY, []);
}

export function saveMeetings(meetings: UserMeeting[]) {
  saveJson(MEETINGS_KEY, meetings);
}

export function createMeeting(input: {
  title: string;
  platform?: string;
  attendees?: string;
  joinUrl?: string;
}): UserMeeting {
  const title = input.title.trim() || "New meeting";
  const platform = input.platform?.trim() || "Zoom";
  const attendees = (input.attendees || "You")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  return {
    id: newId("meet"),
    title,
    platform,
    joinUrl: input.joinUrl?.trim() || `${platform.toLowerCase().replace(/\s+/g, "")}.app/j/atlas-${Date.now().toString(36)}`,
    attendees: attendees.length ? attendees : ["You"],
    recorded: "Not started",
    summary: "Meeting created. Start it to capture notes, decisions, tasks, and deadlines.",
    notes: [],
    decisions: [],
    tasks: [],
    deadlines: [],
    recapSent: false,
    status: "scheduled",
    createdAt: nowIso(),
  };
}

export function startMeetingCapture(meeting: UserMeeting): UserMeeting {
  return {
    ...meeting,
    status: "live",
    recorded: "Live now",
    summary: `Atlas joined ${meeting.platform} and is capturing the conversation live.`,
    notes:
      meeting.notes.length > 0
        ? meeting.notes
        : [
            "Agenda confirmed with attendees",
            "Key discussion points being captured",
            "Follow-ups will be assigned before hang-up",
          ],
    decisions:
      meeting.decisions.length > 0
        ? meeting.decisions
        : ["Confirm next steps before ending the call"],
    tasks:
      meeting.tasks.length > 0
        ? meeting.tasks
        : [{ owner: meeting.attendees[0] || "You", task: "Send follow-up notes", due: "Today" }],
    deadlines:
      meeting.deadlines.length > 0
        ? meeting.deadlines
        : [{ label: "Recap email", due: "Today" }],
  };
}

export function endMeetingCapture(meeting: UserMeeting): UserMeeting {
  return {
    ...meeting,
    status: "ended",
    recorded: `Ended · ${Math.max(8, meeting.attendees.length * 6)} min`,
    summary:
      meeting.summary.includes("capturing")
        ? `Wrapped ${meeting.title}. Atlas generated notes, decisions, tasks, and deadlines for ${meeting.attendees.join(", ")}.`
        : meeting.summary,
  };
}

/* ─── Vision uploads ───────────────────────────────────────────────────── */

export type VisionUpload = {
  id: string;
  name: string;
  source: "camera" | "file";
  previewUrl: string;
  industry: string;
  result: string;
  detail: string;
  createdAt: string;
};

const VISION_KEY = "atlas-user-vision-v1";

export function loadVisionUploads(): VisionUpload[] {
  return loadJson(VISION_KEY, []);
}

export function saveVisionUploads(items: VisionUpload[]) {
  saveJson(VISION_KEY, items);
}

export function analyzeVisionFile(fileName: string, source: "camera" | "file", previewUrl: string): VisionUpload {
  const lower = fileName.toLowerCase();
  let industry = "General";
  let result = "Image captured and understood.";
  let detail = "Atlas stored the photo and drafted a note for CRM and quotes.";

  if (lower.includes("hvac") || lower.includes("cap") || lower.includes("unit") || lower.includes("ac")) {
    industry = "HVAC";
    result = "This capacitor looks damaged.";
    detail = "Matched to a 45/5 on the truck. Drafted customer explanation + parts line.";
  } else if (lower.includes("food") || lower.includes("prep") || lower.includes("kitchen")) {
    industry = "Restaurant";
    result = "Is this food safe?";
    detail = "Hold time may be exceeded. Flagged for discard and logged a safety note.";
  } else if (lower.includes("shelf") || lower.includes("stock") || lower.includes("retail")) {
    industry = "Retail";
    result = "Count the inventory on this shelf.";
    detail = "Shelf count estimated. Reorder suggestion created.";
  } else if (lower.includes("frame") || lower.includes("build") || lower.includes("site")) {
    industry = "Construction";
    result = "Is this framing consistent with the plan?";
    detail = "Framing looks consistent with the uploaded plan. No variance flagged.";
  } else if (source === "camera") {
    industry = "Field";
    result = "Live photo captured.";
    detail = "Camera capture saved. Atlas linked it to the open job and drafted a customer-facing note.";
  }

  return {
    id: newId("vision"),
    name: fileName || "capture.jpg",
    source,
    previewUrl,
    industry,
    result,
    detail,
    createdAt: nowIso(),
  };
}

/* ─── Customer timeline ────────────────────────────────────────────────── */

export type TimelineItem = {
  id: string;
  when: string;
  channel: string;
  text: string;
  customer: string;
  createdAt: string;
};

const TIMELINE_KEY = "atlas-user-timeline-v1";

export function loadTimelineItems(): TimelineItem[] {
  return loadJson(TIMELINE_KEY, []);
}

export function saveTimelineItems(items: TimelineItem[]) {
  saveJson(TIMELINE_KEY, items);
}

export function createTimelineItem(input: {
  when?: string;
  channel: string;
  text: string;
  customer?: string;
}): TimelineItem {
  return {
    id: newId("tl"),
    when: input.when?.trim() || "Just now",
    channel: input.channel.trim() || "Note",
    text: input.text.trim() || "New timeline entry",
    customer: input.customer?.trim() || "Elena Brooks",
    createdAt: nowIso(),
  };
}

/* ─── CRM customers ────────────────────────────────────────────────────── */

export type CrmCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  jobs: number;
  value: string;
  last: string;
  notes: string;
  createdAt: string;
  // Extended (all optional) — manual entry needs only a name or business name.
  firstName?: string;
  lastName?: string;
  businessName?: string;
  mobile?: string;
  workPhone?: string;
  homePhone?: string;
  secondaryEmail?: string;
  address?: string;
  preferredContact?: string;
  customerType?: string;
  tags?: string[];
  assignedEmployee?: string;
  leadSource?: string;
  importantDates?: string;
};

export const CUSTOMER_TYPES = ["Residential", "Commercial", "Government", "Non-profit", "Reseller", "Other"];
export const CONTACT_METHODS = ["Mobile", "Work phone", "Home phone", "Email", "Text message"];

const CRM_KEY = "atlas-user-crm-v1";

export function loadCrmCustomers(): CrmCustomer[] {
  return loadJson(CRM_KEY, []);
}

export function saveCrmCustomers(customers: CrmCustomer[]) {
  saveJson(CRM_KEY, customers);
}

export function createCrmCustomer(input: {
  name?: string;
  phone?: string;
  email?: string;
  jobs?: number;
  value?: string;
  last?: string;
  notes?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  mobile?: string;
  workPhone?: string;
  homePhone?: string;
  secondaryEmail?: string;
  address?: string;
  preferredContact?: string;
  customerType?: string;
  tags?: string[];
  assignedEmployee?: string;
  leadSource?: string;
  importantDates?: string;
}): CrmCustomer {
  const businessName = input.businessName?.trim() || "";
  const firstName = input.firstName?.trim() || "";
  const lastName = input.lastName?.trim() || "";
  const personName = `${firstName} ${lastName}`.trim();
  // Only a name (person or business) is needed; everything else is optional.
  const name = businessName || personName || input.name?.trim() || "New customer";
  const primaryPhone = input.mobile?.trim() || input.workPhone?.trim() || input.homePhone?.trim() || input.phone?.trim() || "";
  return {
    id: newId("crm"),
    name,
    phone: primaryPhone,
    email: input.email?.trim() || "",
    jobs: Number(input.jobs) || 0,
    value: input.value?.trim() || "$0",
    last: input.last?.trim() || "Just added",
    notes: input.notes?.trim() || "",
    createdAt: nowIso(),
    firstName,
    lastName,
    businessName,
    mobile: input.mobile?.trim() || "",
    workPhone: input.workPhone?.trim() || "",
    homePhone: input.homePhone?.trim() || "",
    secondaryEmail: input.secondaryEmail?.trim() || "",
    address: input.address?.trim() || "",
    preferredContact: input.preferredContact?.trim() || "",
    customerType: input.customerType?.trim() || "",
    tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean),
    assignedEmployee: input.assignedEmployee?.trim() || "",
    leadSource: input.leadSource?.trim() || "",
    importantDates: input.importantDates?.trim() || "",
  };
}

/* ─── Contacts permissions ─────────────────────────────────────────────── */

export type ContactsAbility = "view" | "add" | "edit" | "export" | "delete";
export const CONTACTS_ABILITIES: { id: ContactsAbility; label: string }[] = [
  { id: "view", label: "View" },
  { id: "add", label: "Add" },
  { id: "edit", label: "Edit" },
  { id: "export", label: "Export" },
  { id: "delete", label: "Delete" },
];
export type ContactsPerm = { memberId: string; view: boolean; add: boolean; edit: boolean; export: boolean; delete: boolean };

const CONTACTS_PERM_KEY = "atlas-contacts-perms-v1";
export function loadContactsPerms(): ContactsPerm[] {
  return loadJson<ContactsPerm[]>(CONTACTS_PERM_KEY, []);
}
export function saveContactsPerms(list: ContactsPerm[]) {
  saveJson(CONTACTS_PERM_KEY, list);
}

type PermMember = { id: string; role?: string; department?: string };
/** Sensible role-based defaults when a company hasn't set an explicit policy. */
export function defaultContactsPerm(member: PermMember): ContactsPerm {
  const role = (member.role || "").toLowerCase();
  const dept = member.department || "";
  const isManager = role.includes("manager") || role.includes("lead") || role.includes("owner") || dept === "Management";
  return {
    memberId: member.id,
    view: true,
    add: true,
    edit: true,
    export: isManager,
    delete: isManager,
  };
}
/** Effective permissions for a member: an explicit record if set, else defaults. */
export function contactsPermFor(member: PermMember): ContactsPerm {
  const explicit = loadContactsPerms().find((p) => p.memberId === member.id);
  return explicit ?? defaultContactsPerm(member);
}
/** Upsert a single ability for a member and return the full list. */
export function setContactsPerm(member: PermMember, ability: ContactsAbility, value: boolean): ContactsPerm[] {
  const list = loadContactsPerms();
  const idx = list.findIndex((p) => p.memberId === member.id);
  const base = idx >= 0 ? list[idx] : defaultContactsPerm(member);
  const next: ContactsPerm = { ...base, [ability]: value };
  const result = idx >= 0 ? list.map((p) => (p.memberId === member.id ? next : p)) : [...list, next];
  saveContactsPerms(result);
  return result;
}

/* ─── Control Center: leveled permissions, rules, approval chains ──────── */

export type PermLevel = "none" | "view" | "edit" | "approval" | "auto" | "full";
export const PERM_LEVELS: { id: PermLevel; label: string; blurb: string }[] = [
  { id: "none", label: "No Access", blurb: "Cannot see or use it." },
  { id: "view", label: "View Only", blurb: "Can see, but can't change anything." },
  { id: "edit", label: "Edit", blurb: "Can make changes." },
  { id: "approval", label: "Approval Required", blurb: "Can request; someone higher up must approve." },
  { id: "auto", label: "Automatic Approval", blurb: "Atlas approves automatically within your rules." },
  { id: "full", label: "Full Control", blurb: "View, create, edit, delete, approve, and configure." },
];

export type PermUnit = "percent" | "dollar";
export type PermCategoryDef = { id: string; label: string; kind: "view" | "action"; unit?: PermUnit };
export const PERM_CATEGORIES: PermCategoryDef[] = [
  { id: "view_customers", label: "View customers", kind: "view" },
  { id: "add_customers", label: "Add customers", kind: "action" },
  { id: "edit_customers", label: "Edit customers", kind: "action" },
  { id: "delete_customers", label: "Delete customers", kind: "action" },
  { id: "export_customers", label: "Export customer list", kind: "action" },
  { id: "view_pricing", label: "View pricing", kind: "view" },
  { id: "change_pricing", label: "Change pricing", kind: "action" },
  { id: "issue_discounts", label: "Issue discounts", kind: "action", unit: "percent" },
  { id: "refund_customers", label: "Refund customers", kind: "action", unit: "dollar" },
  { id: "create_invoices", label: "Create invoices", kind: "action" },
  { id: "approve_invoices", label: "Approve invoices", kind: "action" },
  { id: "view_payroll", label: "View payroll", kind: "view" },
  { id: "view_performance", label: "View employee performance", kind: "view" },
  { id: "assign_tasks", label: "Assign tasks", kind: "action" },
  { id: "edit_settings", label: "Edit company settings", kind: "action" },
];

export type CategoryPerm = { level: PermLevel; limit?: number };
export type EmployeePermissions = { memberId: string; categories: Record<string, CategoryPerm> };

const CONTROL_KEY = "atlas-control-perms-v1";
function loadAllPermissions(): EmployeePermissions[] {
  return loadJson<EmployeePermissions[]>(CONTROL_KEY, []);
}
function saveAllPermissions(list: EmployeePermissions[]) {
  saveJson(CONTROL_KEY, list);
}

type PermMemberCC = { id: string; role?: string; department?: string };
function isManagerRole(member: PermMemberCC): boolean {
  const role = (member.role || "").toLowerCase();
  return role.includes("manager") || role.includes("lead") || role.includes("owner") || role.includes("director") || (member.department || "") === "Management";
}
/** Role-based default policy — matches the CEO's example for a sales manager. */
export function defaultPermissions(member: PermMemberCC): Record<string, CategoryPerm> {
  const mgr = isManagerRole(member);
  const d: Record<string, CategoryPerm> = {
    view_customers: { level: mgr ? "full" : "view" },
    add_customers: { level: mgr ? "full" : "edit" },
    edit_customers: { level: mgr ? "full" : "edit" },
    delete_customers: { level: "none" },
    export_customers: { level: mgr ? "edit" : "none" },
    view_pricing: { level: "view" },
    change_pricing: { level: mgr ? "approval" : "none" },
    issue_discounts: mgr ? { level: "auto", limit: 10 } : { level: "approval" },
    refund_customers: mgr ? { level: "auto", limit: 500 } : { level: "approval" },
    create_invoices: { level: mgr ? "full" : "none" },
    approve_invoices: { level: "none" },
    view_payroll: { level: "none" },
    view_performance: { level: mgr ? "view" : "none" },
    assign_tasks: { level: mgr ? "full" : "none" },
    edit_settings: { level: "none" },
  };
  return d;
}
export function permissionsFor(member: PermMemberCC): EmployeePermissions {
  const explicit = loadAllPermissions().find((p) => p.memberId === member.id);
  if (explicit) {
    // Merge in any newly-added categories with defaults.
    const base = defaultPermissions(member);
    return { memberId: member.id, categories: { ...base, ...explicit.categories } };
  }
  return { memberId: member.id, categories: defaultPermissions(member) };
}
export function setCategoryPerm(member: PermMemberCC, categoryId: string, level: PermLevel, limit?: number): EmployeePermissions {
  const list = loadAllPermissions();
  const current = permissionsFor(member).categories;
  const nextCat: CategoryPerm = { level, ...(limit !== undefined ? { limit } : {}) };
  // Preserve an existing limit when a category still supports one.
  if (limit === undefined && current[categoryId]?.limit !== undefined) nextCat.limit = current[categoryId].limit;
  const updated: EmployeePermissions = { memberId: member.id, categories: { ...current, [categoryId]: nextCat } };
  const idx = list.findIndex((p) => p.memberId === member.id);
  const result = idx >= 0 ? list.map((p) => (p.memberId === member.id ? updated : p)) : [...list, updated];
  saveAllPermissions(result);
  return updated;
}

export function formatLimit(cat: PermCategoryDef, limit?: number): string {
  if (limit === undefined) return "";
  return cat.unit === "percent" ? `${limit}%` : `$${limit.toLocaleString()}`;
}

export type ActionDecision = { outcome: "auto" | "needs_approval" | "denied" | "allowed"; message: string; chain?: string[] };
/** Evaluate whether a member can perform a category action, honoring limits. */
export function evaluateAction(member: PermMemberCC, categoryId: string, amount?: number): ActionDecision {
  const cat = PERM_CATEGORIES.find((c) => c.id === categoryId);
  const perm = permissionsFor(member).categories[categoryId] ?? { level: "none" as PermLevel };
  const label = cat?.label ?? categoryId;
  switch (perm.level) {
    case "none":
      return { outcome: "denied", message: `You don't have access to ${label.toLowerCase()}.` };
    case "view":
      if (cat?.kind === "view") return { outcome: "allowed", message: `View access to ${label.toLowerCase()}.` };
      return { outcome: "denied", message: `You have view-only access to ${label.toLowerCase()} and can't make changes.` };
    case "edit":
    case "full":
      return { outcome: "allowed", message: `Allowed — ${PERM_LEVELS.find((l) => l.id === perm.level)!.label}.` };
    case "approval":
      return { outcome: "needs_approval", message: `This requires manager approval.` };
    case "auto": {
      if (amount === undefined || perm.limit === undefined) return { outcome: "auto", message: "Automatically approved." };
      const lim = formatLimit(cat!, perm.limit);
      if (amount <= perm.limit) return { outcome: "auto", message: `✅ Automatically approved (within your ${lim} limit).` };
      return { outcome: "needs_approval", message: `This exceeds your ${lim} approval limit.` };
    }
    default:
      return { outcome: "denied", message: "No access." };
  }
}

/** Escalating purchase-approval chain based on amount thresholds. */
export function purchaseChain(amount: number): string[] {
  const chain: string[] = [];
  if (amount >= 1000) chain.push("Department Manager");
  if (amount >= 10000) chain.push("Finance Director");
  if (amount >= 50000) chain.push("CFO");
  if (amount >= 100000) chain.push("CEO");
  return chain;
}

/* ─── Security center ──────────────────────────────────────────────────── */

export type SecurityItem = {
  id: string;
  category: string;
  event: string;
  detail: string;
  status: string;
  when: string;
  risk: string;
  note: string;
  sensitive: boolean;
  createdAt: string;
};

const SECURITY_KEY = "atlas-user-security-v1";
const SECURITY_LOCK_KEY = "atlas-user-security-lock-v1";

export function loadSecurityItems(): SecurityItem[] {
  return loadJson(SECURITY_KEY, []);
}

export function saveSecurityItems(items: SecurityItem[]) {
  saveJson(SECURITY_KEY, items);
}

export function loadSensitiveLocked(): boolean {
  return loadJson(SECURITY_LOCK_KEY, false);
}

export function saveSensitiveLocked(locked: boolean) {
  saveJson(SECURITY_LOCK_KEY, locked);
}

export function createSecurityItem(input: {
  category: string;
  event: string;
  detail?: string;
  risk?: string;
  note?: string;
  sensitive?: boolean;
}): SecurityItem {
  return {
    id: newId("sec"),
    category: input.category.trim() || "Logins",
    event: input.event.trim() || "New security item",
    detail: input.detail?.trim() || "Added by owner",
    status: input.sensitive ? "Needs approval" : "Allowed",
    when: "Just now",
    risk: input.risk?.trim() || "Medium",
    note: input.note?.trim() || "Owner-added security watch item.",
    sensitive: Boolean(input.sensitive),
    createdAt: nowIso(),
  };
}

/* ─── AI Operating System apps ─────────────────────────────────────────── */

export type OsApp = {
  id: string;
  name: string;
  href: string;
  detail: string;
  createdAt: string;
};

const OS_KEY = "atlas-user-os-apps-v1";

export function loadOsApps(): OsApp[] {
  return loadJson(OS_KEY, []);
}

export function saveOsApps(apps: OsApp[]) {
  saveJson(OS_KEY, apps);
}

export function createOsApp(input: { name: string; href?: string; detail?: string }): OsApp {
  const name = input.name.trim() || "Custom app";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app";
  return {
    id: newId("os"),
    name,
    href: input.href?.trim() || `/app/${slug}`,
    detail: input.detail?.trim() || "Custom workspace app",
    createdAt: nowIso(),
  };
}
