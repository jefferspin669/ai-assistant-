export type HubLink = {
  href: string;
  label: string;
  blurb: string;
};

export const moneyHub: HubLink[] = [
  { href: "/app/finance", label: "Banking", blurb: "Cash, forecasts, and the books in one place." },
  { href: "/app/payments", label: "Invoices & payments", blurb: "What customers owe and what you have collected." },
  { href: "/app/tax", label: "Tax", blurb: "Estimates, receipts, and filing — clearly labeled." },
  { href: "/app/accountant", label: "Accountant", blurb: "Packages for your bookkeeper or CPA." },
];

export const memoryHub: HubLink[] = [
  { href: "/app/memory", label: "Business Memory", blurb: "What Atlas should remember about this company." },
  { href: "/app/ceo-memory", label: "CEO Memory", blurb: "Why you made a decision — with the notes attached." },
  { href: "/app/customer-twin", label: "Customer Memory", blurb: "Preferences, history, and how each customer likes to work." },
  { href: "/app/knowledge", label: "Knowledge Base", blurb: "Handbooks, prices, and policies Atlas can quote." },
  { href: "/app/executive-timeline", label: "Timeline", blurb: "The story of the business across months, not chats." },
  { href: "/app/global-memory", label: "Memory Settings", blurb: "Hours, holidays, tax, currency, and local rules." },
];

export const trustHub: HubLink[] = [
  { href: "/app/security-center", label: "Security Center", blurb: "Live defensive monitoring, risk scores, and incident response." },
  { href: "/app/security", label: "Security", blurb: "Threats, devices, 2FA, and vault health." },
  { href: "/app/risk", label: "Risk", blurb: "Cash, burnout, and compliance warnings before they get expensive." },
  { href: "/app/compliance", label: "Compliance", blurb: "Licenses, insurance, and retention rules." },
  { href: "/app/governance", label: "Governance", blurb: "Roles, permissions, and who can approve what." },
  { href: "/app/privacy", label: "Privacy", blurb: "What Atlas stores and what it does not." },
  { href: "/app/access", label: "Audit Log", blurb: "Every sensitive action, recorded." },
];

export const salesHub: HubLink[] = [
  { href: "/app/quotes", label: "Quotes", blurb: "Draft, send, and approve estimates." },
  { href: "/app/sales-coach", label: "Sales coach", blurb: "Talk tracks and follow-ups for open deals." },
  { href: "/app/marketing", label: "Marketing", blurb: "Campaigns, ads, and what actually brought work in." },
  { href: "/app/reviews", label: "Reputation", blurb: "Review requests after finished jobs." },
  { href: "/app/portal", label: "Customer portal", blurb: "Let customers book, pay, and see job status." },
];

export const operationsHub: HubLink[] = [
  { href: "/app/scheduling", label: "Scheduling", blurb: "Fill the day, assign techs, protect drive time." },
  { href: "/app/receptionist", label: "Receptionist", blurb: "Answer the call, recognize the customer, book the job." },
  { href: "/app/missed-calls", label: "Missed calls", blurb: "Recover leads that never reached a person." },
  { href: "/app/routes", label: "Routes", blurb: "Order jobs so the truck wastes less time." },
  { href: "/app/inventory", label: "Inventory", blurb: "Parts on trucks and in the shop." },
  { href: "/app/risk", label: "Risk Center", blurb: "Warn before cash, burnout, or compliance gets expensive." },
  { href: "/app/quality", label: "Quality", blurb: "Callbacks, warranties, and job photos." },
  { href: "/app/compliance", label: "Compliance", blurb: "Licenses, insurance, and retention rules." },
  { href: "/app/training", label: "Training", blurb: "Atlas Academy for the crew." },
];

export const agentsHub: HubLink[] = [
  { href: "/app/workforce", label: "Workforce", blurb: "Employees, managers, AI workers, tasks, and messaging." },
  { href: "/app/workforce?tab=ai-workers", label: "AI workers", blurb: "Specialists Atlas routes to — alongside your human team." },
  { href: "/app/receptionist", label: "Receptionist", blurb: "The beachhead: phones, booking, and recognition." },
  { href: "/app/marketplace?tab=agents", label: "Marketplace agents", blurb: "Install Sales, HR, Legal, and industry specialists." },
  { href: "/app/coach", label: "Live coach", blurb: "On-call help during a job or a sales conversation." },
  { href: "/app/voice", label: "Voice", blurb: "Talk to Atlas from the truck or the front desk." },
];

export const automationsHub: HubLink[] = [
  { href: "/app/approvals", label: "Approvals", blurb: "Everything waiting on you — refunds, quotes, overtime." },
  { href: "/app/workflows", label: "Workflows", blurb: "If this happens, Atlas does that." },
  { href: "/app/actions", label: "Atlas Actions", blurb: "End-to-end jobs: create, send, remind, update books." },
  { href: "/app/autonomous", label: "Autonomy rules", blurb: "Observe, suggest, approve, or automate — per action." },
];

export const knowledgeHub: HubLink[] = [
  { href: "/app/knowledge", label: "Knowledge Base", blurb: "Handbooks, prices, and policies Atlas can quote." },
  { href: "/app/memory", label: "Atlas Memory", blurb: "Business, CEO, customer, and timeline memory in one system." },
  { href: "/app/ceo-memory", label: "CEO Memory", blurb: "Why you made a decision — with the notes attached." },
  { href: "/app/documents", label: "Documents", blurb: "Contracts, manuals, and files." },
  { href: "/app/dna", label: "Business DNA", blurb: "Voice, discounts, escalation, and pricing philosophy." },
  { href: "/app/global-memory", label: "Memory Settings", blurb: "Hours, holidays, tax, currency, and local rules." },
];

export const appsHub: HubLink[] = [
  { href: "/app/marketplace", label: "Atlas Marketplace", blurb: "Discover, install, and publish agents, automations, and modules." },
  { href: "/app/connections", label: "Connections", blurb: "Banks, calendars, phones — labeled CONNECTED DATA." },
  { href: "/app/files", label: "Files", blurb: "Uploads Atlas can search." },
  { href: "/app/developers", label: "API", blurb: "Build on Atlas when the core loop is real." },
  { href: "/app/architecture", label: "Architecture", blurb: "How the prototype is wired today." },
];

export const settingsHub: HubLink[] = [
  { href: "/app/account", label: "Account", blurb: "You, your business, and who is on the team." },
  { href: "/app/setup", label: "First-time setup", blurb: "Industry, hours, and how Atlas should greet you." },
  { href: "/app/privacy", label: "Privacy", blurb: "What Atlas stores and what it does not." },
  { href: "/app/security", label: "Security", blurb: "Prototype vault — not production auth yet." },
  { href: "/app/accessibility", label: "Accessibility", blurb: "Type size, motion, and contrast." },
  { href: "/app/flags", label: "Feature flags", blurb: "Labs surfaces that are not in the main sidebar." },
  { href: "/app/admin", label: "Admin", blurb: "Workspace-level controls." },
];

export type Stance = "OBSERVE" | "SUGGEST" | "APPROVE" | "AUTOMATE";

export const actionPolicies: { action: string; stance: Stance; note: string }[] = [
  { action: "Book a routine appointment", stance: "AUTOMATE", note: "Atlas can do this when the slot is free." },
  { action: "Missed-call follow-up text", stance: "SUGGEST", note: "Atlas drafts it; you can let it send." },
  { action: "Refund under $50", stance: "AUTOMATE", note: "Small goodwill refunds do not wait." },
  { action: "Refund $50–$500", stance: "APPROVE", note: "Sits in Approvals until you say yes." },
  { action: "Refund over $500", stance: "OBSERVE", note: "Atlas will never run this automatically." },
  { action: "Send an estimate over $2,500", stance: "APPROVE", note: "Owner confirms price before the customer sees it." },
];
