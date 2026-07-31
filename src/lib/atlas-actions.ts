export type ActionStepStatus = "pending" | "running" | "done" | "failed";

export type ActionStep = {
  id: string;
  label: string;
  detail: string;
  system: string;
  status: ActionStepStatus;
};

export type AtlasActionPlan = {
  id: string;
  title: string;
  summary: string;
  customer: string;
  amount?: string;
  steps: ActionStep[];
  confirmPrompt: string;
  doneSummary: string;
};

export type ConversationTurn = {
  id: string;
  role: "user" | "atlas";
  text: string;
  device: string;
  when: string;
  planId?: string;
};

export type ContinuityDevice = {
  id: string;
  name: string;
  status: "Active" | "Synced" | "Nearby";
  detail: string;
};

export const actionDevices: ContinuityDevice[] = [
  { id: "phone", name: "Phone", status: "Synced", detail: "Owner line · CarPlay ready" },
  { id: "mobile", name: "Mobile app", status: "Synced", detail: "Push + wake word" },
  { id: "web", name: "Web browser", status: "Active", detail: "This session" },
  { id: "desktop", name: "Desktop app", status: "Synced", detail: "Shop PC" },
  { id: "watch", name: "Smartwatch", status: "Nearby", detail: "Approve on wrist" },
  { id: "speaker", name: "Smart speaker", status: "Synced", detail: "Shop · home" },
  { id: "car", name: "Car", status: "Nearby", detail: "Hands-free while driving" },
];

export const actionExamples = [
  "Atlas, create an invoice for Acme Corp for $1,250, email it, remind them in 7 days if it’s unpaid, and update my books.",
  "Book Elena Brooks Tuesday 10–12 with Sam, text the confirmation, and add a filter reminder in 90 days.",
  "Chase overdue invoices, send polite reminders, and summarize who still owes me by Friday.",
  "Draft a maintenance proposal for Harbor Dental, send it for e-sign, and schedule a follow-up call.",
];

function moneyFrom(text: string): string | undefined {
  const match = text.match(/\$[\d,]+(?:\.\d{2})?/);
  return match?.[0];
}

function customerFrom(text: string): string {
  const forMatch = text.match(/for\s+([A-Za-z0-9 &.'-]+?)(?:\s+for\s+\$|\s+for\s+\d|,|\.|$)/i);
  if (forMatch?.[1] && !forMatch[1].toLowerCase().includes("invoice")) {
    return forMatch[1].trim().replace(/\s+for$/i, "");
  }
  if (/acme/i.test(text)) return "Acme Corp";
  if (/elena/i.test(text)) return "Elena Brooks";
  if (/harbor/i.test(text)) return "Harbor Dental";
  if (/johnson/i.test(text)) return "Johnson Construction";
  return "the customer";
}

function step(
  id: string,
  label: string,
  detail: string,
  system: string,
): ActionStep {
  return { id, label, detail, system, status: "pending" };
}

export function parseAtlasAction(input: string): AtlasActionPlan {
  const q = input.toLowerCase().trim();
  const customer = customerFrom(input);
  const amount = moneyFrom(input) ?? "$1,250";

  if (
    q.includes("invoice") ||
    (q.includes("create") && q.includes("email") && (q.includes("remind") || q.includes("books")))
  ) {
    return {
      id: "invoice-acme",
      title: `Invoice · ${customer}`,
      summary: `create a ${amount} invoice for ${customer}, email it, remind them in 7 days if unpaid, and update the books`,
      customer,
      amount,
      confirmPrompt: `Create and send a ${amount} invoice to ${customer}, schedule a 7-day unpaid reminder, and post it to your books?`,
      doneSummary: `${amount} invoice sent to ${customer}. Reminder armed for day 7. Ledger updated.`,
      steps: [
        step("draft", "Create invoice", `${amount} · net 15 · ${customer}`, "Invoices"),
        step("email", "Email invoice", `Send PDF + pay link to accounts@${customer.toLowerCase().replace(/\s+/g, "")}.com`, "Email"),
        step("remind", "Schedule reminder", "If unpaid in 7 days → polite follow-up", "Automations"),
        step("books", "Update books", "Post AR entry and sync Financial Command", "Accounting"),
      ],
    };
  }

  if (q.includes("book") || q.includes("appointment") || q.includes("tuesday")) {
    return {
      id: "book-elena",
      title: `Book · ${customer}`,
      summary: "Schedule the visit, confirm by text, and set the follow-up reminder.",
      customer,
      confirmPrompt: `Book ${customer} Tuesday 10–12 with Sam, text confirmation, and set a 90-day filter reminder?`,
      doneSummary: `${customer} booked Tuesday 10–12 with Sam. Confirmation text sent. Filter reminder set.`,
      steps: [
        step("slot", "Hold calendar slot", "Tue 10–12 · Sam · travel buffer on", "Calendar"),
        step("assign", "Assign technician", "Sam preferred · Van 2 routed", "Scheduling"),
        step("text", "Text confirmation", "Customer prefers mornings · text first", "SMS"),
        step("follow", "Set reminder", "Filter check-in in 90 days", "CRM"),
      ],
    };
  }

  if (q.includes("overdue") || q.includes("chase") || q.includes("who still owes")) {
    return {
      id: "chase-overdue",
      title: "Chase overdue invoices",
      summary: "Send reminders and deliver a Friday ownership summary.",
      customer: "Accounts receivable",
      confirmPrompt: "Send polite reminders on all overdue invoices and prepare a Friday owed summary?",
      doneSummary: "Reminders sent to 3 customers. Friday owed summary queued for Jeff.",
      steps: [
        step("scan", "Scan AR", "3 overdue · $2,310 total", "Finance"),
        step("tone", "Draft reminders", "Neighborly expert tone from Business DNA", "Writing"),
        step("send", "Send reminders", "Email + SMS where preferred", "Outreach"),
        step("summary", "Queue Friday summary", "Who paid · who owes · next actions", "Executive"),
      ],
    };
  }

  if (q.includes("proposal") || q.includes("maintenance") || q.includes("e-sign")) {
    return {
      id: "proposal-harbor",
      title: `Proposal · ${customer}`,
      summary: "Draft maintenance proposal, request e-sign, schedule follow-up.",
      customer,
      confirmPrompt: `Draft and send a maintenance proposal to ${customer} for e-sign, then schedule a follow-up call?`,
      doneSummary: `Proposal sent to ${customer}. E-sign link live. Follow-up call scheduled.`,
      steps: [
        step("draft", "Draft proposal", "Quarterly PM package from rate card", "Documents"),
        step("price", "Apply pricing", "Contract rate · no emergency markup", "Pricing"),
        step("sign", "Send for e-sign", "Portal + email", "Customer Portal"),
        step("call", "Schedule follow-up", "Call in 3 business days if unsigned", "Calendar"),
      ],
    };
  }

  return {
    id: "generic-action",
    title: "Atlas Action",
    summary: "Break the request into executable business steps and run them end-to-end.",
    customer,
    confirmPrompt: "Run this Atlas Action across the connected systems?",
    doneSummary: "Action complete. Conversation synced to every device.",
    steps: [
      step("understand", "Understand intent", input.slice(0, 80), "Atlas Brain"),
      step("plan", "Plan steps", "Choose systems and safeguards", "Actions"),
      step("execute", "Execute", "Run with audit trail", "Operations"),
      step("sync", "Sync conversation", "Continue on any device", "Voice Everywhere"),
    ],
  };
}

export const seedConversation: ConversationTurn[] = [
  {
    id: "t0",
    role: "atlas",
    text: "Don’t ask how — just tell me what to do. I’ll create, send, remind, and update the books.",
    device: "web",
    when: "Just now",
  },
  {
    id: "t1",
    role: "user",
    text: "How do I create an invoice?",
    device: "mobile",
    when: "Earlier on mobile",
  },
  {
    id: "t2",
    role: "atlas",
    text: "You don’t have to. Say what you want done — for example: create an invoice for Acme Corp for $1,250, email it, remind them in 7 days if unpaid, and update my books.",
    device: "mobile",
    when: "Earlier on mobile",
  },
];
