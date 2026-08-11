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
