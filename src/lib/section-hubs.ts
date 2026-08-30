export type HubLink = {
  href: string;
  label: string;
  blurb: string;
};

export const moneyHub: HubLink[] = [
  { href: "/app/finance", label: "Financial command", blurb: "Revenue, expenses, and cash in one place." },
  { href: "/app/payments", label: "Invoices & payments", blurb: "What customers owe and what you have collected." },
  { href: "/app/tax", label: "Tax Center", blurb: "Estimates, receipts, and filing — clearly labeled." },
  { href: "/app/accountant", label: "Accountant helper", blurb: "Packages for your bookkeeper or CPA." },
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
  { href: "/app/digital-employees", label: "Digital employees", blurb: "Specialists Atlas routes to — you still talk to Atlas." },
  { href: "/app/receptionist", label: "Receptionist", blurb: "The beachhead: phones, booking, and recognition." },
  { href: "/app/employees", label: "AI agents", blurb: "Roles and permissions for each specialist." },
  { href: "/app/workforce", label: "Workforce", blurb: "How the whole team of agents works together." },
  { href: "/app/coach", label: "Live coach", blurb: "On-call help during a job or a sales conversation." },
  { href: "/app/voice", label: "Voice", blurb: "Talk to Atlas from the truck or the front desk." },
];

export const automationsHub: HubLink[] = [
  { href: "/app/approvals", label: "Approvals", blurb: "Everything waiting on you — refunds, quotes, overtime." },
  { href: "/app/workflows", label: "Workflows", blurb: "If this happens, Atlas does that." },
  { href: "/app/actions", label: "Atlas Actions", blurb: "End-to-end jobs: create, send, remind, update books." },
  { href: "/app/autonomous", label: "Autonomy rules", blurb: "Observe, suggest, approve, or automate — per action." },
  { href: "/app/command-language", label: "Command language", blurb: "Plain English compiled into a guarded automation." },
];

export const knowledgeHub: HubLink[] = [
  { href: "/app/knowledge", label: "Knowledge brain", blurb: "Handbooks, prices, and policies Atlas can quote." },
  { href: "/app/memory", label: "Memory", blurb: "What Atlas should remember about your business." },
  { href: "/app/ceo-memory", label: "Executive memory", blurb: "Why you made a decision — with the notes attached." },
  { href: "/app/documents", label: "Documents", blurb: "Contracts, manuals, and files." },
  { href: "/app/dna", label: "Business DNA", blurb: "Voice, discounts, escalation, and pricing philosophy." },
  { href: "/app/global-memory", label: "Global memory", blurb: "Hours, holidays, tax, currency, and local rules." },
];

export const appsHub: HubLink[] = [
  { href: "/app/marketplace", label: "Marketplace", blurb: "Install agents, dashboards, and templates." },
  { href: "/app/app-store", label: "App Store", blurb: "Packaged tools for this workspace." },
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
