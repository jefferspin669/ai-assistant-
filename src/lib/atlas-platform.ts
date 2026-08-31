export type NavItem = { href: string; label: string; exact?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

/**
 * Product information architecture.
 * Dashboard = current business status. Mission Control = live Atlas ops.
 * Executive = strategic reports. Board Advisor = strategic AI. Mission = company goals.
 * Duplicate routes (/app/confirmations, /app/app-store, /app/chat, /app/apps) redirect
 * to the kept destination — do not add them back to nav.
 */
export const navGroups: NavGroup[] = [
  {
    label: "Frontend",
    items: [
      { href: "/app", label: "Dashboard", exact: true },
      { href: "/app/appointments", label: "Atlas Calendar" },
      { href: "/app/ask", label: "Talk to Atlas" },
      { href: "/app/workforce", label: "Workforce" },
      { href: "/app/marketplace", label: "Atlas Marketplace" },
      { href: "/app/files", label: "Files" },
      { href: "/app/settings", label: "Settings" },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/app/money", label: "Overview" },
      { href: "/app/finance", label: "Banking" },
      { href: "/app/payments", label: "Invoices & payments" },
      { href: "/app/tax", label: "Tax" },
      { href: "/app/accountant", label: "Accountant" },
    ],
  },
  {
    label: "Atlas Memory",
    items: [
      { href: "/app/memory", label: "Business Memory" },
      { href: "/app/ceo-memory", label: "CEO Memory" },
      { href: "/app/customer-twin", label: "Customer Memory" },
      { href: "/app/knowledge", label: "Knowledge Base" },
      { href: "/app/executive-timeline", label: "Timeline" },
      { href: "/app/global-memory", label: "Memory Settings" },
      { href: "/app/digital-twin", label: "Digital Twin" },
    ],
  },
  {
    label: "Trust & Governance",
    items: [
      { href: "/app/security", label: "Security" },
      { href: "/app/risk", label: "Risk" },
      { href: "/app/compliance", label: "Compliance" },
      { href: "/app/governance", label: "Governance" },
      { href: "/app/privacy", label: "Privacy" },
      { href: "/app/access", label: "Audit Log" },
      { href: "/app/control-center", label: "Roles & Permissions" },
      { href: "/app/permission-simulator", label: "Permission Simulator" },
      { href: "/app/approvals", label: "Approvals" },
    ],
  },
  {
    label: "Command",
    items: [
      { href: "/app/mission-control", label: "Mission Control" },
      { href: "/app/autonomous", label: "Autonomous Mode" },
      { href: "/app/mission", label: "Mission" },
      { href: "/app/executive", label: "Executive" },
      { href: "/app/board", label: "Board Advisor" },
      { href: "/app/os", label: "AI Operating System" },
      { href: "/app/computer", label: "AI Computer Control" },
      { href: "/app/brain", label: "Atlas Brain" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/app/setup", label: "First-time setup" },
      { href: "/app/accessibility", label: "Accessibility" },
      { href: "/app/testing", label: "Testing system" },
      { href: "/app/flags", label: "Feature flags" },
      { href: "/app/feedback", label: "Feedback" },
      { href: "/app/sync", label: "Status & sync" },
      { href: "/app/offline", label: "Offline" },
      { href: "/app/support", label: "Support center" },
      { href: "/app/admin", label: "Admin panel" },
      { href: "/app/connections", label: "Connection center" },
      { href: "/app/contacts", label: "Contacts" },
      { href: "/app/notes", label: "Quick capture" },
      { href: "/app/data", label: "Import & export" },
      { href: "/app/recovery", label: "Undo & recovery" },
      { href: "/app/tasks", label: "Tasks" },
      { href: "/app/architecture", label: "Architecture" },
      { href: "/app/backend", label: "Backend" },
      { href: "/app/commercial", label: "Commercial" },
      { href: "/app/account", label: "Account Center" },
      { href: "/app/actions", label: "Atlas Actions" },
      { href: "/app/workflows", label: "Automation Builder" },
      { href: "/app/voice", label: "Voice Everywhere" },
    ],
  },
  {
    label: "Front desk",
    items: [
      { href: "/app/receptionist", label: "Voice Receptionist" },
      { href: "/app/phone", label: "Phone System" },
      { href: "/app/call-summaries", label: "Call Summaries" },
      { href: "/app/missed-calls", label: "Missed Calls" },
      { href: "/app/chatbot", label: "Customer Chatbot" },
      { href: "/app/portal", label: "Customer Portal" },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/app/customers", label: "AI CRM" },
      { href: "/app/timeline", label: "Customer Timeline" },
      { href: "/app/reviews", label: "Reputation" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { href: "/app/quotes", label: "Sales AI" },
      { href: "/app/sales-coach", label: "AI Sales Coach" },
      { href: "/app/marketing", label: "Marketing AI" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/app/messages", label: "Messages" },
      { href: "/app/workforce", label: "Workforce" },
      { href: "/app/purchasing", label: "Expenses & Purchases" },
      { href: "/app/inventory", label: "Inventory" },
      { href: "/app/quality", label: "Quality" },
      { href: "/app/routes", label: "Route Optimization" },
      { href: "/app/workforce-status", label: "Workforce Status" },
      { href: "/app/goals", label: "Employee Goals" },
      { href: "/app/shifts", label: "Scheduling" },
      { href: "/app/timesheets", label: "Timesheets" },
      { href: "/app/performance", label: "Performance" },
      { href: "/app/team-training", label: "Training & Certs" },
      { href: "/app/suggestions", label: "Suggestions" },
      { href: "/app/time-off", label: "Time-Off" },
      { href: "/app/training", label: "Atlas Academy" },
    ],
  },
  {
    label: "Atlas Assistant",
    items: [
      { href: "/app/ask", label: "Talk to Atlas" },
    ],
  },
  {
    label: "Atlas Platform",
    items: [
      { href: "/app/platform", label: "Platform & Integrations" },
    ],
  },
  {
    label: "Intelligence",
    items: [{ href: "/app/analytics", label: "AI Dashboard" }],
  },
  {
    label: "Executive Suite",
    items: [
      { href: "/app/capital", label: "Capital Allocation" },
      { href: "/app/ma-intelligence", label: "M&A Intelligence" },
      { href: "/app/boardroom", label: "Boardroom Mode" },
      { href: "/app/risk-radar", label: "Global Risk Radar" },
      { href: "/app/talent-map", label: "Executive Talent Map" },
      { href: "/app/reputation-command", label: "Reputation Command" },
      { href: "/app/intel-room", label: "Private Intelligence Room" },
      { href: "/app/succession", label: "Succession Planner" },
      { href: "/app/legacy", label: "Legacy & Long-Term" },
      { href: "/app/deal-rooms", label: "Confidential Deal Rooms" },
      { href: "/app/negotiation", label: "Negotiation War Room" },
    ],
  },
  {
    label: "Create & automate",
    items: [
      { href: "/app/documents", label: "Document Builder" },
      { href: "/app/builder", label: "Business Builder" },
      { href: "/app/vision", label: "Atlas Vision" },
      { href: "/app/meetings", label: "Meeting Intelligence" },
      { href: "/app/projects", label: "Project Manager" },
      { href: "/app/workflows", label: "Automation Builder" },
      { href: "/app/coach", label: "Live AI Coach" },
    ],
  },
  {
    label: "Extensions",
    items: [
      { href: "/app/marketplace", label: "Atlas Marketplace" },
      { href: "/app/employees", label: "AI Agents" },
      { href: "/app/dna", label: "Business DNA" },
      { href: "/app/developers", label: "Atlas API" },
      { href: "/app/teams", label: "Teams" },
      { href: "/app/workforce-map", label: "Workforce Map" },
    ],
  },
];

/** Flat list kept for any callers that still map a single nav array. */
export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);

export const brainDomains = [
  { label: "Customers", detail: "Preferences, history, notes, sentiment" },
  { label: "Employees", detail: "Skills, schedules, certifications, PTO" },
  { label: "Business hours", detail: "Open/close, holidays, after-hours rules" },
  { label: "Services", detail: "Catalog, durations, prerequisites" },
  { label: "Inventory", detail: "Parts on trucks, warehouse, reorder points" },
  { label: "Appointments", detail: "Bookings, travel buffers, no-shows" },
  { label: "Conversations", detail: "Calls, texts, emails, chat threads" },
  { label: "Company policies", detail: "Refunds, warranties, safety rules" },
  { label: "Pricing", detail: "Rate cards, floors, seasonal promos" },
  { label: "Documents", detail: "Contracts, manuals, handbooks, PDFs" },
  { label: "Past jobs", detail: "Photos, parts used, outcomes" },
  { label: "Equipment", detail: "Tools, trucks, warranties, service dates" },
  { label: "Suppliers", detail: "Lead times, pricing, delivery history" },
];

export const memoryReplay = {
  customer: "John Hale",
  monthsAgo: "Six months ago",
  past: "John likes text messages.",
  now: "Can I book next Tuesday?",
  atlas: "Welcome back John. Last time you requested text reminders. Would you like another morning appointment?",
};

export const knowledgeUploads = [
  { name: "Employee handbook.pdf", type: "PDF", status: "Learned", pages: 42 },
  { name: "2026 price sheet.xlsx", type: "Price sheet", status: "Learned", pages: 6 },
  { name: "Service contracts.zip", type: "Contracts", status: "Learning", pages: 18 },
  { name: "Safety policies.docx", type: "Policies", status: "Learned", pages: 11 },
  { name: "Compressor rebuild manual.pdf", type: "Manual", status: "Learned", pages: 64 },
  { name: "Truck loadout floor plan.png", type: "Floor plan", status: "Learned", pages: 1 },
  { name: "New hire orientation.mp4", type: "Video", status: "Queued", pages: 1 },
  { name: "Job site photos", type: "Images", status: "Learned", pages: 128 },
  { name: "Return & warranty policy.pdf", type: "Policies", status: "Learned", pages: 4 },
  { name: "Customer email archive · Q1", type: "Emails", status: "Learned", pages: 842 },
  { name: "Ops standup notes · Mar", type: "Meeting notes", status: "Learned", pages: 12 },
  { name: "atlas-hvac.com/support", type: "Website", status: "Learning", pages: 28 },
];

export const knowledgeQa = [
  {
    q: "What’s our return policy?",
    a: "Parts unused and in original packaging may be returned within 30 days with receipt. Installed equipment follows the manufacturer warranty; labor is covered for 90 days on the original job.",
    source: "Return & warranty policy.pdf · p. 1–2",
  },
  {
    q: "What’s our refund window on water heaters?",
    a: "Full refund within 14 days if unused; after install, manufacturer warranty applies and Atlas drafts the claim packet.",
    source: "Employee handbook.pdf · Refunds",
  },
  {
    q: "What’s the after-hours emergency rate?",
    a: "$189 trip fee plus standard labor after 6pm and weekends. Commercial contracts may waive the trip fee.",
    source: "2026 price sheet.xlsx · After-hours",
  },
];

export const phoneCapabilities = [
  "Understand callers in natural language",
  "Route calls to the right person or AI",
  "Schedule appointments while on the line",
  "Take payments securely",
  "Transfer to a live technician",
  "Leave voicemail summaries for the owner",
  "Detect emergencies and escalate",
  "Recognize repeat customers by caller ID",
];

export const callSummaries = [
  {
    caller: "Elena Brooks",
    when: "Today · 7:42 AM",
    summary: "AC blowing warm air. Booked 10–12 window with John. Photos collected.",
    actions: ["Book appointment", "Create estimate draft", "Text confirmation"],
    sentiment: "Concerned → Relieved",
    mood: "Anxious about heat",
    notes: "Prefers mornings · three dogs · gated driveway",
  },
  {
    caller: "Marcus Nguyen",
    when: "Yesterday · 9:18 PM",
    summary: "Missed call recovered by text. Kitchen sink leak under cabinet.",
    actions: ["Create lead", "Request photos", "Offer morning slot"],
    sentiment: "Frustrated → Trusting",
    mood: "Urgent but polite",
    notes: "First-time customer · Oak Ave",
  },
  {
    caller: "Johnson Construction",
    when: "Yesterday · 2:05 PM",
    summary: "Asked about remodel quote status and payment schedule.",
    actions: ["Share estimate status", "Flag owner approval"],
    sentiment: "Neutral → Positive",
    mood: "Businesslike",
    notes: "$18,400 pending owner approval",
  },
];

export const coachExamples = [
  {
    q: "How do I refund this customer?",
    a: "For jobs under $500 within 14 days, issue a full refund from Payments → Refund. Over $500 needs owner approval. Atlas drafted the note and SMS.",
  },
  {
    q: "How do I reset this machine?",
    a: "Per the compressor rebuild manual (p. 18): power off 60 seconds, hold reset 5 seconds, verify green LED. Want me to walk you through voice mode?",
  },
  {
    q: "What do I say if they’re upset about wait time?",
    a: "Acknowledge the delay, offer the next guaranteed window, and a 10% goodwill credit if wait exceeded 45 minutes. Script is ready to read aloud.",
  },
];

export const schedulingFactors = [
  { label: "Experience", detail: "John has 40+ similar AC recoveries" },
  { label: "Certifications", detail: "EPA 608 current · expires in 11 months" },
  { label: "Distance", detail: "12 minutes from Elena’s address" },
  { label: "Workload", detail: "2 jobs today · capacity for one more" },
  { label: "Customer preference", detail: "Elena always requests John" },
  { label: "Overtime", detail: "Would finish inside regular hours" },
  { label: "Vehicle capacity", detail: "Capacitor + gauge set already on truck" },
];

export const routePlan = [
  { stop: 1, job: "Elena Brooks · Drain clearing", eta: "9:00 AM", drive: "—" },
  { stop: 2, job: "Chris Park · Estimate", eta: "11:10 AM", drive: "14 min · light traffic" },
  { stop: 3, job: "Nina Alvarez · Faucet", eta: "1:40 PM", drive: "9 min · avoid Main St" },
  { stop: 4, job: "Parts drop · Supply House", eta: "3:20 PM", drive: "11 min" },
];

export const crmPredictions = [
  {
    customer: "Jamie Cole",
    signal: "No visit in 11 months",
    action: "Yearly maintenance reminder drafted",
    message: "We noticed it’s almost time for your yearly maintenance. Want next Tuesday morning?",
  },
  {
    customer: "Chris Park",
    signal: "Quote viewed 3×, not signed",
    action: "Sales follow-up scheduled",
    message: "Happy to answer questions on the camera inspection — still good for this week?",
  },
  {
    customer: "Nina Alvarez",
    signal: "Reschedule requested twice",
    action: "Offer flexible window + review ask",
    message: "We can hold Friday 3–5 or Saturday morning. Which is easier?",
  },
];

export const marketingAssets = [
  { channel: "Facebook", item: "Spring AC tune-up post", status: "Ready" },
  { channel: "Instagram", item: "Before/after reel script", status: "Ready" },
  { channel: "Email", item: "Seasonal reminder sequence", status: "Scheduled" },
  { channel: "SMS", item: "Holiday open-hours blast", status: "Draft" },
  { channel: "Flyer", item: "Neighborhood coupon PDF", status: "Ready" },
  { channel: "Promo", item: "Referral $50 credit", status: "Active" },
];

export const salesInsights = [
  { metric: "Lead source", value: "Google Ads", detail: "43% more revenue this month" },
  { metric: "Conversion rate", value: "46%", detail: "+4 pts vs last month" },
  { metric: "Lost sales", value: "7", detail: "Mostly price objections after 6 PM" },
  { metric: "Close percentage", value: "61%", detail: "Highest with morning estimates" },
  { metric: "Revenue", value: "$64,210", detail: "Month to date" },
];

export const predictiveAlerts = [
  {
    title: "February slowdown",
    body: "Sales drop every February. Atlas recommends pre-selling maintenance packages in December.",
  },
  {
    title: "Filter shortage risk",
    body: "At current job volume you’ll run low on 16×25 filters in five days.",
  },
  {
    title: "Review velocity",
    body: "Five customers mentioned “long wait” this week. Quality Control opened an alert.",
  },
];

export const accountantTasks = [
  { task: "Expense tracking", detail: "94 receipts categorized overnight" },
  { task: "Receipt scanning", detail: "12 new photos matched to vendors" },
  { task: "Profit estimate", detail: "Month projected $18.4k net" },
  { task: "Tax reminder", detail: "Quarterly estimate due in 18 days" },
  { task: "Invoice matching", detail: "3 supplier invoices reconciled" },
  { task: "Payroll summary", detail: "Ready for Friday approve" },
  { task: "Cash flow forecast", detail: "Healthy for next 6 weeks" },
];

export const taxIncomeSources = [
  { id: "biz-bank", name: "Chase Business Checking", kind: "Business bank", status: "Connected" as const, lastSync: "2 min ago" },
  { id: "pers-bank", name: "Ally Personal Checking", kind: "Personal bank", status: "Connected" as const, lastSync: "1 hr ago" },
  { id: "payroll", name: "Gusto Payroll", kind: "Payroll", status: "Connected" as const, lastSync: "Today" },
  { id: "stripe", name: "Stripe", kind: "Payments", status: "Connected" as const, lastSync: "5 min ago" },
  { id: "square", name: "Square", kind: "Payments", status: "Connected" as const, lastSync: "12 min ago" },
  { id: "paypal", name: "PayPal", kind: "Payments", status: "Needs auth" as const, lastSync: "—" },
  { id: "venmo", name: "Venmo", kind: "Payments", status: "Connected" as const, lastSync: "Today" },
  { id: "cashapp", name: "Cash App", kind: "Payments", status: "Connected" as const, lastSync: "3 hr ago" },
  { id: "qb", name: "QuickBooks Online", kind: "Accounting", status: "Connected" as const, lastSync: "30 min ago" },
  { id: "atlas-inv", name: "Atlas Invoices", kind: "Atlas", status: "Connected" as const, lastSync: "Live" },
] as const;

export const taxIncomeEntries = [
  {
    id: "inc-1",
    amount: "$4,850.00",
    date: "Mar 18",
    source: "Atlas Invoices",
    business: "Desert Air HVAC",
    job: "Harbor Dental RTU repair",
    client: "Harbor Dental",
    incomeType: "Invoice",
    status: "Categorized" as const,
  },
  {
    id: "inc-2",
    amount: "$1,240.00",
    date: "Mar 17",
    source: "Stripe",
    business: "Desert Air HVAC",
    job: "Online deposit — Martinez",
    client: "Elena Martinez",
    incomeType: "Card payment",
    status: "Categorized" as const,
  },
  {
    id: "inc-3",
    amount: "$2,100.00",
    date: "Mar 15",
    source: "Chase Business Checking",
    business: "Desert Air HVAC",
    job: "Side contract — duct clean",
    client: "Rivera Properties",
    incomeType: "1099 / contractor",
    status: "Categorized" as const,
  },
  {
    id: "inc-4",
    amount: "$620.00",
    date: "Mar 14",
    source: "Square",
    business: "Desert Air HVAC",
    job: "Same-day service call",
    client: "Walk-in / Square",
    incomeType: "Card payment",
    status: "Categorized" as const,
  },
  {
    id: "inc-5",
    amount: "$3,400.00",
    date: "Mar 12",
    source: "Gusto Payroll",
    business: "Personal",
    job: "W-2 wages — Mar 1–15",
    client: "—",
    incomeType: "W-2",
    status: "User entered" as const,
  },
  {
    id: "inc-6",
    amount: "$180.00",
    date: "Mar 11",
    source: "Venmo",
    business: "Desert Air HVAC",
    job: "Filter drop-off",
    client: "Nina Alvarez",
    incomeType: "P2P payment",
    status: "Needs Review" as const,
  },
  {
    id: "inc-7",
    amount: "$95.00",
    date: "Mar 10",
    source: "Cash App",
    business: "Desert Air HVAC",
    job: "Diagnostic fee",
    client: "Tom Chen",
    incomeType: "P2P payment",
    status: "Categorized" as const,
  },
  {
    id: "inc-8",
    amount: "$8,200.00",
    date: "Mar 8",
    source: "QuickBooks Online",
    business: "Desert Air HVAC",
    job: "Q1 retainer — Harbor",
    client: "Harbor Dental",
    incomeType: "Accounting sync",
    status: "Categorized" as const,
  },
] as const;

export const taxDeductionHints = [
  "Business mileage",
  "Fuel",
  "Equipment",
  "Software subscriptions",
  "Advertising",
  "Office supplies",
  "Phone and internet",
  "Business insurance",
  "Professional services",
  "Education and training",
  "Home-office expenses",
] as const;

export const taxExpenses = [
  {
    id: "exp-1",
    merchant: "Shell #4421",
    date: "Mar 18",
    amount: "$68.40",
    salesTax: "$5.12",
    category: "Fuel",
    businessPurpose: "Truck fuel — job route day",
    paymentMethod: "Business debit",
    deduction: "Fuel",
    status: "Categorized" as const,
    confidence: 94,
    receipt: "Photo · 9:14 AM",
  },
  {
    id: "exp-2",
    merchant: "Home Depot",
    date: "Mar 17",
    amount: "$214.88",
    salesTax: "$16.11",
    category: "Equipment",
    businessPurpose: "Capacitors + fittings for truck stock",
    paymentMethod: "Business card",
    deduction: "Equipment",
    status: "Categorized" as const,
    confidence: 91,
    receipt: "Photo · 4:02 PM",
  },
  {
    id: "exp-3",
    merchant: "Adobe Creative Cloud",
    date: "Mar 16",
    amount: "$59.99",
    salesTax: "$0.00",
    category: "Software",
    businessPurpose: "Marketing creatives subscription",
    paymentMethod: "Card on file",
    deduction: "Software subscriptions",
    status: "Categorized" as const,
    confidence: 97,
    receipt: "Email receipt",
  },
  {
    id: "exp-4",
    merchant: "Facebook Ads",
    date: "Mar 15",
    amount: "$320.00",
    salesTax: "$0.00",
    category: "Advertising",
    businessPurpose: "Spring tune-up campaign",
    paymentMethod: "Stripe card",
    deduction: "Advertising",
    status: "Categorized" as const,
    confidence: 96,
    receipt: "Platform export",
  },
  {
    id: "exp-5",
    merchant: "Staples",
    date: "Mar 14",
    amount: "$47.22",
    salesTax: "$3.54",
    category: "Office supplies",
    businessPurpose: "Invoices, folders, toner",
    paymentMethod: "Business debit",
    deduction: "Office supplies",
    status: "Categorized" as const,
    confidence: 88,
    receipt: "Upload · PDF",
  },
  {
    id: "exp-6",
    merchant: "Verizon Wireless",
    date: "Mar 12",
    amount: "$142.18",
    salesTax: "$10.66",
    category: "Phone & internet",
    businessPurpose: "Field phones + hotspot",
    paymentMethod: "Auto-pay",
    deduction: "Phone and internet",
    status: "Needs Review" as const,
    confidence: 62,
    receipt: "Bank match",
  },
  {
    id: "exp-7",
    merchant: "Hiscox Insurance",
    date: "Mar 10",
    amount: "$286.00",
    salesTax: "$0.00",
    category: "Insurance",
    businessPurpose: "GL policy installment",
    paymentMethod: "ACH",
    deduction: "Business insurance",
    status: "Categorized" as const,
    confidence: 99,
    receipt: "Accounting sync",
  },
  {
    id: "exp-8",
    merchant: "Rivera CPA",
    date: "Mar 9",
    amount: "$450.00",
    salesTax: "$0.00",
    category: "Professional services",
    businessPurpose: "Q1 bookkeeping consult",
    paymentMethod: "Business check",
    deduction: "Professional services",
    status: "Categorized" as const,
    confidence: 98,
    receipt: "Invoice PDF",
  },
  {
    id: "exp-9",
    merchant: "HVAC Excellence Course",
    date: "Mar 7",
    amount: "$199.00",
    salesTax: "$0.00",
    category: "Education",
    businessPurpose: "EPA refresher for Sam",
    paymentMethod: "Card",
    deduction: "Education and training",
    status: "Categorized" as const,
    confidence: 93,
    receipt: "Email receipt",
  },
  {
    id: "exp-10",
    merchant: "MileIQ · Mar week 2",
    date: "Mar 16",
    amount: "$186.40",
    salesTax: "$0.00",
    category: "Mileage",
    businessPurpose: "248 business miles @ IRS rate",
    paymentMethod: "Tracked",
    deduction: "Business mileage",
    status: "Categorized" as const,
    confidence: 90,
    receipt: "Mileage log",
  },
  {
    id: "exp-11",
    merchant: "Target",
    date: "Mar 13",
    amount: "$87.45",
    salesTax: "$6.55",
    category: "Unclear",
    businessPurpose: "Mixed cart — possible home office",
    paymentMethod: "Personal card",
    deduction: "Home-office expenses",
    status: "Needs Review" as const,
    confidence: 41,
    receipt: "Photo · blurry",
  },
  {
    id: "exp-12",
    merchant: "Amazon",
    date: "Mar 11",
    amount: "$129.99",
    salesTax: "$9.75",
    category: "Unclear",
    businessPurpose: "Possible desk chair — home office?",
    paymentMethod: "Personal card",
    deduction: "Home-office expenses",
    status: "Needs Review" as const,
    confidence: 48,
    receipt: "Email receipt",
  },
] as const;

export type TaxExpenseStatus = (typeof taxExpenses)[number]["status"] | "Approved" | "Rejected";

export const taxEstimate = {
  totalIncome: "$186,400",
  businessExpenses: "$42,180",
  taxableProfit: "$144,220",
  federalTax: "$5,120",
  stateTax: "$1,840",
  selfEmploymentTax: "$2,040",
  taxCredits: "$550",
  taxesPaid: "$6,200",
  estimatedOwed: "$8,450",
  alreadySaved: "$6,200",
  remainingBalance: "$2,250",
  recommendedSave: "$2,250",
  autosavePercent: 25,
  taxSavingsAccount: "Ally Tax Savings · ••4821",
  lastRecalc: "Today · after Harbor Dental invoice",
} as const;

export const taxProfile = {
  taxYear: "2026",
  filingStatus: "Married filing jointly",
  businessStructure: "Single-member LLC (Schedule C)",
  state: "Arizona",
  rulesVersion: "IRS + AZ TY2026 rules · refreshed Mar 1, 2026",
  disclaimer:
    "Estimates are planning tools only. They are not a filed return. Figures are not final until reviewed or filed through an authorized tax professional or filing provider.",
} as const;

export const taxSafetyLayers = [
  {
    id: "estimated",
    label: "Estimated",
    meaning: "Atlas calculations using your profile, income, and current tax rules — planning only.",
  },
  {
    id: "suggestion",
    label: "AI suggestion",
    meaning: "Model recommendations (deductions, splits, flags). Never claimed until you or a pro confirm.",
  },
  {
    id: "accountant",
    label: "Accountant-reviewed",
    meaning: "Corrected or approved by an invited tax professional in the Portal.",
  },
  {
    id: "filed",
    label: "Officially filed",
    meaning: "Submitted through an authorized filing provider or your professional — with your authorization.",
  },
] as const;

export const taxInformationLedger = [
  {
    id: "led-1",
    item: "Federal tax $5,120",
    layer: "Estimated" as const,
    detail: "TY2026 · MFJ · AZ · Schedule C rules",
  },
  {
    id: "led-2",
    item: "Home-office possible",
    layer: "AI suggestion" as const,
    detail: "Interview + Target/Amazon receipts — Needs Review",
  },
  {
    id: "led-3",
    item: "Verizon 80/20 split",
    layer: "Accountant-reviewed" as const,
    detail: "Maya Rivera, CPA corrected category",
  },
  {
    id: "led-4",
    item: "Q1 estimate payment $1,800",
    layer: "Officially filed" as const,
    detail: "IRS Direct Pay confirmation IRS-Q1-88421",
  },
] as const;

export const taxProductTiers = [
  {
    id: "personal",
    name: "Atlas Personal Tax",
    audience: "W-2 workers, students, homeowners, and families",
    includes: [
      "W-2 & personal income tracking",
      "Mortgage, student loan, and health forms",
      "Estimate dashboard + Smart Alerts",
      "Tax Interview for credits & deductions",
      "Tax Preparation Package export",
    ],
    price: "Included with Personal AI",
  },
  {
    id: "freelancer",
    name: "Atlas Freelancer Tax",
    audience: "Contractors, creators, delivery drivers, and 1099 workers",
    includes: [
      "Everything in Personal",
      "1099 / processor income sync",
      "Mileage tracker & vehicle expense",
      "Quarterly estimated tax assistant",
      "Receipt deductions with Needs Review",
    ],
    price: "Freelancer plan",
  },
  {
    id: "business",
    name: "Atlas Business Tax",
    audience: "LLCs, small businesses, payroll, sales tax, and accountant collaboration",
    includes: [
      "Everything in Freelancer",
      "Multi-source business income",
      "Payroll & Tax add-on hooks",
      "Sales tax collected / due",
      "Tax Professional Portal",
    ],
    price: "Business plan",
  },
  {
    id: "pro",
    name: "Atlas Tax Pro",
    audience: "Accountants managing multiple Atlas customers",
    includes: [
      "Multi-client dashboard",
      "Review queues across customers",
      "Document requests at scale",
      "Package downloads & audit trails",
      "Never file without client authorization",
    ],
    price: "Pro / firm seat",
  },
] as const;

export const taxProClients = [
  {
    id: "cli-1",
    business: "Desert Air HVAC",
    tier: "Business",
    status: "Needs review" as const,
    openItems: 5,
    package: "Staged",
    lastActive: "2 hr ago",
  },
  {
    id: "cli-2",
    business: "Elena Brooks · Freelancer",
    tier: "Freelancer",
    status: "Interview open" as const,
    openItems: 2,
    package: "Not started",
    lastActive: "Yesterday",
  },
  {
    id: "cli-3",
    business: "Harbor Dental LLC",
    tier: "Business",
    status: "Pro approved" as const,
    openItems: 0,
    package: "Ready · awaiting client auth",
    lastActive: "Today",
  },
  {
    id: "cli-4",
    business: "Jordan Lee · W-2",
    tier: "Personal",
    status: "Docs missing" as const,
    openItems: 3,
    package: "Blocked",
    lastActive: "3 days ago",
  },
] as const;

export const taxQuarterlyPayments = [
  {
    id: "q1",
    quarter: "Q1 2026",
    due: "Apr 15, 2026",
    originalEstimate: "$1,800",
    revisedEstimate: "$2,250",
    paid: "$1,800",
    status: "Needs top-up" as const,
    confirmation: "IRS-Q1-88421",
    receipt: "Saved · Mar 12",
    alert:
      "Your income increased this quarter. Your estimated payment may need to increase from $1,800 to $2,250.",
    instructions: "Pay $450 remaining via IRS Direct Pay → Estimated Tax → 1040-ES → Q1.",
  },
  {
    id: "q2",
    quarter: "Q2 2026",
    due: "Jun 15, 2026",
    originalEstimate: "$2,100",
    revisedEstimate: "$2,100",
    paid: "$0",
    status: "Upcoming" as const,
    confirmation: "—",
    receipt: "—",
    alert: "Deadline in 48 days. Atlas will nudge 14 days and 3 days before.",
    instructions: "Schedule $2,100 from Ally Tax Savings on Jun 12 via IRS Direct Pay.",
  },
  {
    id: "q3",
    quarter: "Q3 2026",
    due: "Sep 15, 2026",
    originalEstimate: "$2,100",
    revisedEstimate: "$2,100",
    paid: "$0",
    status: "Planned" as const,
    confirmation: "—",
    receipt: "—",
    alert: "Estimate locked until mid-quarter income review.",
    instructions: "Hold in tax savings; Atlas recalculates if revenue shifts >10%.",
  },
  {
    id: "q4",
    quarter: "Q4 2026",
    due: "Jan 15, 2027",
    originalEstimate: "$2,100",
    revisedEstimate: "$2,100",
    paid: "$0",
    status: "Planned" as const,
    confirmation: "—",
    receipt: "—",
    alert: "Final estimated payment before filing season.",
    instructions: "Pay from tax savings; apply overpayment to next year if any.",
  },
] as const;

export const taxMileageTrips = [
  {
    id: "trip-1",
    date: "Mar 18",
    from: "Shop · Phoenix",
    to: "Harbor Dental · Scottsdale",
    purpose: "RTU repair job",
    miles: 28.4,
    classification: "Business" as const,
    vehicle: "Ford Transit · HVAC-1",
    expense: "$19.88",
    detection: "Auto-detected",
  },
  {
    id: "trip-2",
    date: "Mar 17",
    from: "Home · Tempe",
    to: "Chicago · O’Hare area",
    purpose: "Industry conference — unconfirmed",
    miles: 412.0,
    classification: "Needs Review" as const,
    vehicle: "Personal · Camry",
    expense: "$288.40",
    detection: "Auto-detected · yesterday",
  },
  {
    id: "trip-3",
    date: "Mar 16",
    from: "Shop · Phoenix",
    to: "Rivera Properties",
    purpose: "Duct clean contract",
    miles: 16.2,
    classification: "Business" as const,
    vehicle: "Ford Transit · HVAC-1",
    expense: "$11.34",
    detection: "Auto-detected",
  },
  {
    id: "trip-4",
    date: "Mar 15",
    from: "Home · Tempe",
    to: "Grocery · Whole Foods",
    purpose: "Personal errand",
    miles: 4.1,
    classification: "Personal" as const,
    vehicle: "Personal · Camry",
    expense: "$0.00",
    detection: "Auto-detected",
  },
  {
    id: "trip-5",
    date: "Mar 14",
    from: "Shop · Phoenix",
    to: "Supply House West",
    purpose: "Parts run",
    miles: 11.8,
    classification: "Business" as const,
    vehicle: "Ford Transit · HVAC-1",
    expense: "$8.26",
    detection: "Auto-detected",
  },
  {
    id: "trip-6",
    date: "Mar 12",
    from: "Shop · Phoenix",
    to: "Elena Martinez · Mesa",
    purpose: "Filter drop-off",
    miles: 22.0,
    classification: "Business" as const,
    vehicle: "Ford Transit · HVAC-1",
    expense: "$15.40",
    detection: "Manual log",
  },
] as const;

export const taxFilingChecklist = [
  {
    id: "file-1",
    task: "Review Needs Review expenses",
    detail: "Approve, split, or reject uncertain deductions before export",
    status: "In progress" as const,
  },
  {
    id: "file-2",
    task: "Confirm income by source",
    detail: "Banks, processors, 1099s, W-2, and Atlas invoices reconciled",
    status: "Done" as const,
  },
  {
    id: "file-3",
    task: "Export mileage report",
    detail: "Business miles YTD with start/end, purpose, and vehicle",
    status: "Not started" as const,
  },
  {
    id: "file-4",
    task: "Attach quarterly payment receipts",
    detail: "Confirmation numbers and IRS Direct Pay proofs",
    status: "In progress" as const,
  },
  {
    id: "file-5",
    task: "Home-office worksheet",
    detail: "Square footage and exclusive-use confirmation",
    status: "Not started" as const,
  },
  {
    id: "file-6",
    task: "Generate CPA / tax-software package",
    detail: "Schedule C summary, deductions, mileage, and estimated payments",
    status: "Not started" as const,
  },
  {
    id: "file-7",
    task: "File or hand off to accountant",
    detail: "Atlas stages e-file packet; human signs and submits",
    status: "Not started" as const,
  },
] as const;

export const taxDocuments = [
  { id: "doc-w2", name: "W-2 — Gusto wages", kind: "W-2", status: "Collected" as const, detail: "Mar 1–15 · Personal" },
  { id: "doc-1099a", name: "1099-NEC — Rivera Properties", kind: "1099", status: "Collected" as const, detail: "$2,100 contractor income" },
  { id: "doc-1099b", name: "1099-K — Stripe / Square", kind: "1099", status: "Missing" as const, detail: "Request from processors" },
  { id: "doc-biz", name: "Business income report YTD", kind: "Business income", status: "Collected" as const, detail: "Atlas + QuickBooks sync" },
  { id: "doc-mort", name: "Mortgage interest Form 1098", kind: "Mortgage", status: "Missing" as const, detail: "Home-office allocation may apply" },
  { id: "doc-loan", name: "Student loan interest Form 1098-E", kind: "Student loan", status: "Collected" as const, detail: "Uploaded Jan 12" },
  { id: "doc-health", name: "Form 1095-A / health insurance", kind: "Health insurance", status: "Missing" as const, detail: "Marketplace or employer copy" },
  { id: "doc-veh", name: "Vehicle info — Transit + Camry", kind: "Vehicle", status: "Collected" as const, detail: "Business % · mileage logs linked" },
  { id: "doc-est", name: "Estimated tax payments Q1–Q4", kind: "Estimated taxes", status: "Partial" as const, detail: "Q1 confirmation saved; Q2–Q4 pending" },
  { id: "doc-recv", name: "Receipts & deductions pack", kind: "Receipts", status: "Partial" as const, detail: "3 expenses still Needs Review" },
  { id: "doc-prior", name: "Prior-year tax return (2025)", kind: "Prior return", status: "Collected" as const, detail: "PDF from Rivera CPA" },
] as const;

export const taxPrepPackageParts = [
  { id: "pkg-inc", title: "Income summary", detail: "W-2, 1099, invoices, processors — by business & type" },
  { id: "pkg-exp", title: "Expense summary", detail: "Categorized business expenses with sales tax" },
  { id: "pkg-ded", title: "Deduction report", detail: "Approved deductions; Needs Review excluded" },
  { id: "pkg-mi", title: "Mileage report", detail: "Business miles, purpose, start/end, vehicle expense" },
  { id: "pkg-q", title: "Quarterly payment history", detail: "Estimates, paid amounts, confirmations, receipts" },
  { id: "pkg-miss", title: "Missing-document checklist", detail: "1099-K, 1098, 1095-A, and open reviews" },
  { id: "pkg-pdf", title: "Accountant-ready PDF", detail: "Printable package for CPA handoff" },
  { id: "pkg-xls", title: "Spreadsheet export", detail: "CSV / XLSX transaction & mileage workbooks" },
] as const;

export const taxInterviewQuestions = [
  {
    id: "iq-equip",
    question: "Did you purchase any equipment for your business this year?",
    hint: "Tools, truck stock, computers, or major gear",
    yesFlag: "Equipment purchases flagged — link receipts and asset list",
    noFlag: "No equipment purchases noted for this year",
  },
  {
    id: "iq-home",
    question: "Did you work from a dedicated area of your home?",
    hint: "Exclusive-use space for home-office deduction",
    yesFlag: "Home-office worksheet opened — need sq ft and exclusive use",
    noFlag: "Home-office deduction not claimed",
  },
  {
    id: "iq-qtr",
    question: "Did you make any quarterly estimated payments?",
    hint: "1040-ES or state estimates",
    yesFlag: "Quarterly assistant linked — confirm Q1 top-up and upcoming dues",
    noFlag: "No estimated payments recorded — underpayment risk flagged",
  },
  {
    id: "iq-veh",
    question: "Was this vehicle used for both personal and business travel?",
    hint: "Camry and Transit mixed-use classification",
    yesFlag: "Mixed-use vehicle — keep mileage logs split by purpose",
    noFlag: "Vehicle marked business-only for deduction tracking",
  },
] as const;

export const taxPortalPro = {
  name: "Maya Rivera, CPA",
  firm: "Rivera Tax Advisors",
  email: "maya@riveratax.example",
  access: "Review · correct · request docs · notes · approve",
  invited: true,
} as const;

export const taxPortalTransactions = [
  {
    id: "ptx-1",
    merchant: "Verizon Wireless",
    amount: "$142.18",
    category: "Phone & internet",
    note: "Suggest 80/20 business split",
    status: "Needs correction" as const,
  },
  {
    id: "ptx-2",
    merchant: "Home Depot",
    amount: "$214.88",
    category: "Equipment",
    note: "OK — job stock",
    status: "Approved" as const,
  },
  {
    id: "ptx-3",
    merchant: "Target",
    amount: "$87.45",
    category: "Unclear",
    note: "Request itemized receipt",
    status: "Docs requested" as const,
  },
] as const;

export const taxPortalAudit = [
  { id: "aud-1", when: "Mar 18 · 4:12 PM", actor: "Maya Rivera, CPA", action: "Requested document", detail: "Target itemized receipt" },
  { id: "aud-2", when: "Mar 18 · 3:55 PM", actor: "Maya Rivera, CPA", action: "Corrected category", detail: "Verizon → Phone & internet (split)" },
  { id: "aud-3", when: "Mar 17 · 9:02 AM", actor: "You", action: "Invited professional", detail: "maya@riveratax.example · view + edit" },
  { id: "aud-4", when: "Mar 16 · 2:20 PM", actor: "Atlas", action: "Package staged", detail: "Draft Tax Preparation Package — awaiting your authorization" },
] as const;

export const taxPayroll = {
  addon: "Atlas Payroll & Tax",
  blurb: "Paid add-on for employee wages, withholding, employer taxes, contractors, filings, and sales tax.",
  wagesYtd: "$128,400",
  withholdingYtd: "$31,220",
  employerTaxes: "$9,840",
  contractorPayments: "$18,650",
  salesTaxCollected: "$4,912",
  salesTaxDue: "$1,280",
  nextDeadline: "Apr 15 · Form 941",
} as const;

export const taxPayrollItems = [
  { id: "pay-1", label: "Employee wages", value: "$128,400 YTD", status: "Tracked" as const, detail: "3 employees · Gusto sync" },
  { id: "pay-2", label: "Payroll withholding", value: "$31,220", status: "Tracked" as const, detail: "Federal + state + FICA" },
  { id: "pay-3", label: "Employer payroll taxes", value: "$9,840", status: "Due soon" as const, detail: "Next deposit Apr 15" },
  { id: "pay-4", label: "Contractor payments", value: "$18,650", status: "Tracked" as const, detail: "1099 prep queue · 4 vendors" },
  { id: "pay-5", label: "W-2 preparation", value: "Draft ready", status: "In progress" as const, detail: "Year-end packet staged" },
  { id: "pay-6", label: "1099 preparation", value: "4 drafts", status: "In progress" as const, detail: "NEC + K matching" },
  { id: "pay-7", label: "Payroll filing deadlines", value: "Apr 15 · 941", status: "Upcoming" as const, detail: "Atlas will warn 14 and 3 days prior" },
  { id: "pay-8", label: "Sales tax collected", value: "$4,912", status: "Tracked" as const, detail: "AZ TPT on taxable services" },
  { id: "pay-9", label: "Sales-tax payment due", value: "$1,280", status: "Due soon" as const, detail: "State + city add-ons" },
] as const;

export const taxSmartAlerts = [
  {
    id: "al-1",
    title: "You received a new tax document.",
    detail: "1099-NEC from Rivera Properties landed in Documents.",
    severity: "Info" as const,
  },
  {
    id: "al-2",
    title: "Your quarterly payment deadline is approaching.",
    detail: "Q2 estimated tax due Jun 15 — $2,100 from tax savings.",
    severity: "Warn" as const,
  },
  {
    id: "al-3",
    title: "This transaction may be deductible.",
    detail: "Office Depot $54.18 — office supplies · Needs Review.",
    severity: "Info" as const,
  },
  {
    id: "al-4",
    title: "Your tax savings balance is below the recommended amount.",
    detail: "Saved $6,200 · recommend $8,450 · shortfall $2,250.",
    severity: "Warn" as const,
  },
  {
    id: "al-5",
    title: "Your business mileage has not been updated recently.",
    detail: "Last auto-detect Mar 18 — confirm Chicago trip classification.",
    severity: "Warn" as const,
  },
  {
    id: "al-6",
    title: "Your income is significantly higher than last quarter.",
    detail: "Q1 estimate may need to rise from $1,800 to $2,250.",
    severity: "Warn" as const,
  },
  {
    id: "al-7",
    title: "Three transactions still need categorization.",
    detail: "Verizon, Target, and Amazon are in Needs Review.",
    severity: "Warn" as const,
  },
  {
    id: "al-8",
    title: "Your accountant requested another document.",
    detail: "Maya Rivera, CPA asked for the Target itemized receipt.",
    severity: "Action" as const,
  },
] as const;

export function taxCenterReply(prompt: string): string {
  const q = prompt.toLowerCase();
  if (q.includes("personal tax") || q.includes("freelancer tax") || q.includes("business tax") || q.includes("tax pro") || q.includes("product tier")) {
    return "Atlas Tax tiers: Personal (W-2 & families), Freelancer (1099 & mileage), Business (LLC, payroll, CPA portal), and Tax Pro (accountants managing many Atlas customers). Open Tiers to compare.";
  }
  if (q.includes("disclaimer") || q.includes("planning tool") || q.includes("estimated") || q.includes("safety")) {
    return "Atlas separates Estimated, AI suggestion, Accountant-reviewed, and Officially filed data. Estimates use tax year, filing status, structure, state, and current rules — planning tools until reviewed or filed through an authorized professional.";
  }
  if (
    (q.includes("chicago") || q.includes("trip")) &&
    (q.includes("business") || q.includes("mileage") || q.includes("mark"))
  ) {
    return "Marked yesterday’s trip to Chicago as business mileage (412.0 mi · Personal Camry). Added to your mileage report and estimated deduction at the current IRS rate.";
  }
  if (
    q.includes("interview") ||
    q.includes("equipment") ||
    (q.includes("home") && q.includes("work")) ||
    q.includes("dedicated")
  ) {
    return "Tax Interview updates your estimate from conversational answers — equipment, home office, quarterly payments, and mixed-use vehicles. Open Interview to continue.";
  }
  if (q.includes("accountant") || q.includes("preparer") || q.includes("portal") || q.includes("invite")) {
    return "Tax Professional Portal lets you invite your CPA securely. They can review transactions, request docs, leave notes, and approve reports — Atlas never files without your authorization.";
  }
  if (
    q.includes("payroll") ||
    q.includes("withholding") ||
    q.includes("sales tax") ||
    (q.includes("w-2") && q.includes("prep"))
  ) {
    return "Atlas Payroll & Tax (paid add-on) tracks wages, withholding, employer taxes, contractors, W-2/1099 prep, filing deadlines, and sales tax obligations.";
  }
  if (q.includes("package") || q.includes("export") || q.includes("pdf") || q.includes("spreadsheet")) {
    return "Tax Preparation Package includes income, expense, deduction, mileage, and quarterly summaries plus a missing-document checklist — export PDF and spreadsheet when you’re ready. You must authorize before any filing.";
  }
  if (q.includes("alert") || q.includes("deadline") || q.includes("document.")) {
    return "Smart Tax Alerts watch documents, quarterly deadlines, deductible transactions, tax savings balance, mileage gaps, income spikes, uncategorized items, and accountant requests.";
  }
  if (q.includes("quarterly") || q.includes("estimated payment") || q.includes("1040-es")) {
    return "Q1 may need a top-up: income rose, so the estimate moved from $1,800 to $2,250 ($450 remaining). Q2 is due Jun 15 — Atlas will warn before the deadline.";
  }
  if (q.includes("estimate") || q.includes("owed") || q.includes("save for tax") || q.includes("remaining")) {
    return "Estimated taxes owed: $8,450. Already saved: $6,200. Additional amount recommended: $2,250. Atlas can auto-move 25% of each payment into Ally Tax Savings.";
  }
  if (q.includes("filing") || q.includes("tax-time") || q.includes("tax time") || q.includes("checklist")) {
    return "Tax-Time Mode is on a structured checklist — income confirmed, Needs Review still open, mileage export and CPA package not started yet. Open Filing to work the list.";
  }
  if (q.includes("mileage") || q.includes("miles") || q.includes("trip")) {
    return "Mileage Tracker auto-detects trips, classifies business vs personal, and logs start/end, purpose, miles, and vehicle expense. Say “mark yesterday’s trip to Chicago as business mileage” anytime.";
  }
  if (q.includes("review") || q.includes("uncertain")) {
    return "Three expenses are marked Needs Review — Verizon (personal vs business split), Target, and Amazon. Atlas will not claim them until you approve.";
  }
  if (q.includes("income") || q.includes("stripe") || q.includes("1099")) {
    return "Income is synced from banks, payroll, Stripe, Square, Venmo, Cash App, QuickBooks, and Atlas invoices — organized by business, job, client, and type. PayPal still needs re-auth.";
  }
  if (q.includes("receipt") || q.includes("upload") || q.includes("photo")) {
    return "Snap or upload a receipt and I’ll extract merchant, date, amount, sales tax, category, purpose, and payment method — then flag anything uncertain for review.";
  }
  if (q.includes("deduct") || q.includes("fuel")) {
    return "Likely deductions this month include fuel, mileage, equipment, software, ads, office supplies, insurance, CPA fees, and training. Home-office items stay in Needs Review.";
  }
  return "Tax Center separates estimates, AI suggestions, accountant-reviewed, and filed data across Personal, Freelancer, Business, and Tax Pro tiers — Atlas never submits a return without your review and authorization.";
}

export const inventoryItems = [
  { sku: "FLT-1625", name: "16×25 filters", onHand: 14, daysLeft: 5, action: "Order in 5 days" },
  { sku: "CAP-45", name: "45/5 capacitors", onHand: 6, daysLeft: 9, action: "Watch" },
  { sku: "REF-410A", name: "R-410A", onHand: 3, daysLeft: 12, action: "OK" },
  { sku: "THM-NEST", name: "Thermostats", onHand: 2, daysLeft: 4, action: "Reorder now" },
];

export const purchasingCompares = [
  { part: "16×25 filters (case)", supplier: "Supply House A", price: "$84", eta: "1 day", pick: true },
  { part: "16×25 filters (case)", supplier: "Supply House B", price: "$91", eta: "Same day", pick: false },
  { part: "Nest thermostats", supplier: "Distributor West", price: "$148", eta: "2 days", pick: true },
  { part: "Nest thermostats", supplier: "Online Bulk", price: "$139", eta: "5 days", pick: false },
];

export const trainingModules = [
  {
    id: "greeting",
    title: "Phone greeting + empathy",
    type: "Voice practice",
    progress: 100,
    learner: "Alex Rivera",
    duration: "12 min",
  },
  {
    id: "refund",
    title: "Refund policy roleplay",
    type: "Roleplay",
    progress: 80,
    learner: "Alex Rivera",
    duration: "18 min",
  },
  {
    id: "safety",
    title: "Safety quiz · ladder & PPE",
    type: "Quiz",
    progress: 100,
    learner: "Alex Rivera",
    duration: "8 min",
  },
  {
    id: "capacitor",
    title: "Capacitor diagnosis",
    type: "Interactive lesson",
    progress: 45,
    learner: "Alex Rivera",
    duration: "22 min",
  },
] as const;

export const trainingLearners = [
  { name: "Alex Rivera", role: "New hire · Tech", overall: 81, modulesDone: 2, modulesTotal: 4, certs: 1 },
  { name: "Sam Ortiz", role: "Tech", overall: 94, modulesDone: 4, modulesTotal: 4, certs: 3 },
  { name: "Jordan Lee", role: "Apprentice", overall: 36, modulesDone: 1, modulesTotal: 4, certs: 0 },
];

export const academyCertifications = [
  {
    id: "safety",
    title: "Field Safety Certified",
    holder: "Sam Ortiz",
    status: "Active",
    expires: "Jan 2027",
  },
  {
    id: "phone",
    title: "Front Desk Voice Pro",
    holder: "Alex Rivera",
    status: "Active",
    expires: "Aug 2026",
  },
  {
    id: "hvac-cap",
    title: "HVAC Capacitor Diagnosis",
    holder: "Sam Ortiz",
    status: "Active",
    expires: "Mar 2027",
  },
  {
    id: "refund",
    title: "Customer Recovery Roleplay",
    holder: "Jordan Lee",
    status: "In progress",
    expires: "—",
  },
] as const;

export const trainingLesson = {
  id: "capacitor",
  title: "Capacitor diagnosis",
  steps: [
    {
      title: "Spot the symptoms",
      body: "Customer says the outdoor unit hums but won’t start. Warm air inside. Atlas pulls similar past jobs from Brain.",
    },
    {
      title: "Safety first",
      body: "Power off at the disconnect. Discharge the capacitor with an insulated screwdriver before testing.",
    },
    {
      title: "Read the label",
      body: "Match µF rating and voltage. A 45/5 dual run is common on this unit family in Summit’s inventory.",
    },
    {
      title: "Test and decide",
      body: "If reading is more than 10% off spec, replace. Photograph the old part for the customer timeline.",
    },
  ],
};

export const trainingQuiz = {
  title: "Safety quiz · ladder & PPE",
  passScore: 80,
  questions: [
    {
      prompt: "Before climbing, you should:",
      choices: [
        "Set the ladder on soft soil for cushion",
        "Check level ground, angle, and secure footing",
        "Have a customer hold the base every time",
      ],
      answer: 1,
      explain: "Stable footing and correct angle prevent most ladder incidents.",
    },
    {
      prompt: "Minimum PPE on a residential electrical panel job:",
      choices: [
        "Safety glasses and gloves rated for the task",
        "Company shirt only",
        "Ear plugs only when the compressor runs",
      ],
      answer: 0,
      explain: "Eye protection and appropriate gloves are required before panel work.",
    },
    {
      prompt: "If a customer asks you to skip lockout to “save time”:",
      choices: [
        "Skip once if they’re watching",
        "Explain the policy and keep lockout in place",
        "Ask them to sign a waiver on your phone",
      ],
      answer: 1,
      explain: "Atlas coaches: never override safety for speed — document and continue correctly.",
    },
  ],
};

export const trainingVoiceScenario = {
  title: "Late arrival empathy",
  prompt: "A customer says the tech was late. Practice your response out loud or type it.",
  tips: ["Acknowledge the delay", "Explain briefly", "Offer a concrete make-good"],
  goodPhrases: ["sorry", "wait", "traffic", "morning", "window", "make"],
  coachPass:
    "Strong. You acknowledged, explained, and offered a fix. Score 92 — add the goodwill credit script if wait exceeded 45 minutes.",
  coachRetry:
    "Close. Include an apology, a short reason, and a clear next window. Try again — Atlas is listening.",
};

export const trainingRoleplay = {
  title: "Refund policy roleplay",
  customerOpener:
    "This water heater install was two weeks ago and I’m not happy. I want a full refund today.",
  hints: [
    "Jobs under $500 within 14 days can be refunded in Payments.",
    "Over $500 needs owner approval — Atlas can draft the note.",
    "Stay calm, confirm details, don’t promise what policy forbids.",
  ],
  replies: [
    {
      match: ["refund", "money", "full"],
      say: "I hear you. For installs over $500, I can start the refund request for the owner and get you an answer today. Can I confirm the job address and invoice number?",
    },
    {
      match: ["unhappy", "not happy", "angry", "upset"],
      say: "I’m sorry this didn’t meet expectations. Tell me what went wrong — I’ll log it on your timeline and escalate with options.",
    },
    {
      match: ["today", "now", "immediately"],
      say: "I can’t issue that amount on my own, but Atlas already drafted the owner approval with your notes. You’ll get a text as soon as Jeff decides.",
    },
  ],
  fallback:
    "Got it — I’m capturing that. Want me to review the warranty language from the knowledge base while we talk?",
};

export const hubEmployees = [
  {
    id: "alex",
    name: "Alex Rivera",
    role: "Lead tech",
    status: "On route",
    rating: "4.9",
    jobsThisWeek: 12,
  },
  {
    id: "sam",
    name: "Sam Ortiz",
    role: "Tech",
    status: "Available",
    rating: "4.8",
    jobsThisWeek: 9,
  },
  {
    id: "john",
    name: "John Hale",
    role: "Tech",
    status: "On job",
    rating: "5.0",
    jobsThisWeek: 11,
  },
] as const;

export const hubSchedules: Record<string, { time: string; job: string; place: string; status: string }[]> = {
  alex: [
    { time: "9:00 AM", job: "Elena Brooks · Drain clearing", place: "418 Oak Ave", status: "Confirmed" },
    { time: "11:10 AM", job: "Chris Park · Estimate", place: "90 Cedar Ct", status: "En route buffer" },
    { time: "1:40 PM", job: "Nina Alvarez · Faucet", place: "12 Willow St", status: "Confirmed" },
    { time: "3:20 PM", job: "Parts drop · Supply House", place: "Depot", status: "Optional" },
  ],
  sam: [
    { time: "10:30 AM", job: "Jamie Cole · Water heater", place: "77 Pine Rd", status: "Confirmed" },
    { time: "2:00 PM", job: "Maintenance · Filter swap", place: "220 Market", status: "Flexible" },
  ],
  john: [
    { time: "8:30 AM", job: "AC recovery · Marcus", place: "91 Birch Ln", status: "In progress" },
    { time: "12:30 PM", job: "Capacitor follow-up", place: "14 Lakeview", status: "Parts on truck" },
  ],
};

export const hubMessages: Record<string, { from: string; when: string; text: string; unread?: boolean }[]> = {
  alex: [
    { from: "Atlas", when: "7:05 AM", text: "Traffic on Main St — I padded 12 minutes before Chris Park.", unread: true },
    { from: "Jeff", when: "Yesterday", text: "Great review from Elena. Keep the morning buffers." },
    { from: "Sam", when: "Yesterday", text: "Can you cover the 3 PM faucet if I run late?" },
  ],
  sam: [
    { from: "Atlas", when: "6:50 AM", text: "Jamie prefers text updates — confirmation already sent.", unread: true },
    { from: "Alex", when: "Yesterday", text: "Extra 45/5 capacitors are on my truck if you need one." },
  ],
  john: [
    { from: "Atlas", when: "8:10 AM", text: "Customer asked for you by name. Photos are in the job timeline.", unread: true },
    { from: "Office", when: "Mon", text: "EPA card scanned — compliance OK." },
  ],
};

export const hubDocuments: Record<string, { name: string; type: string; updated: string }[]> = {
  alex: [
    { name: "Lead tech checklist.pdf", type: "SOP", updated: "Today" },
    { name: "Truck loadout floor plan.png", type: "Floor plan", updated: "Apr 2" },
    { name: "Safety handbook.pdf", type: "Policy", updated: "Mar 12" },
  ],
  sam: [
    { name: "Water heater install guide.pdf", type: "Manual", updated: "Feb 18" },
    { name: "Customer photo script.docx", type: "Script", updated: "Jan 9" },
  ],
  john: [
    { name: "Capacitor diagnosis lesson", type: "Training", updated: "Today" },
    { name: "EPA 608 certificate.pdf", type: "Cert", updated: "2024" },
  ],
};

export const hubPerformance: Record<
  string,
  { label: string; value: string; detail: string }[]
> = {
  alex: [
    { label: "On-time arrivals", value: "96%", detail: "+3 pts this month" },
    { label: "Jobs completed", value: "12", detail: "This week" },
    { label: "CSAT", value: "4.9", detail: "Last 30 days" },
    { label: "First-time fix", value: "91%", detail: "Parts readiness high" },
  ],
  sam: [
    { label: "On-time arrivals", value: "93%", detail: "Steady" },
    { label: "Jobs completed", value: "9", detail: "This week" },
    { label: "CSAT", value: "4.8", detail: "Last 30 days" },
    { label: "Upsell attach", value: "22%", detail: "Filters + maintenance" },
  ],
  john: [
    { label: "On-time arrivals", value: "98%", detail: "Best on team" },
    { label: "Jobs completed", value: "11", detail: "This week" },
    { label: "CSAT", value: "5.0", detail: "Requested by name" },
    { label: "Callback rate", value: "2%", detail: "Below target" },
  ],
};

export const hubPto: Record<
  string,
  {
    balances: { label: string; days: number }[];
    requests: { dates: string; type: string; status: string }[];
  }
> = {
  alex: {
    balances: [
      { label: "Vacation", days: 8 },
      { label: "Sick", days: 4 },
      { label: "Personal", days: 2 },
    ],
    requests: [
      { dates: "Aug 14–15", type: "Vacation", status: "Pending" },
      { dates: "Jun 3", type: "Personal", status: "Approved" },
    ],
  },
  sam: {
    balances: [
      { label: "Vacation", days: 5 },
      { label: "Sick", days: 3 },
      { label: "Personal", days: 1 },
    ],
    requests: [{ dates: "Sep 2–5", type: "Vacation", status: "Draft" }],
  },
  john: {
    balances: [
      { label: "Vacation", days: 11 },
      { label: "Sick", days: 5 },
      { label: "Personal", days: 3 },
    ],
    requests: [{ dates: "Jul 4", type: "Holiday", status: "Approved" }],
  },
};

export function hubAssistantReply(employeeName: string, question: string) {
  const q = question.toLowerCase();
  if (q.includes("schedule") || q.includes("today") || q.includes("next")) {
    return `${employeeName}, your next confirmed stop is on today’s board. Want me to text the customer your ETA?`;
  }
  if (q.includes("pto") || q.includes("time off") || q.includes("vacation")) {
    return `You have vacation balance remaining. I can draft a PTO request and check coverage against the calendar.`;
  }
  if (q.includes("reset") || q.includes("machine") || q.includes("manual")) {
    return `From the knowledge base: power off 60 seconds, hold reset 5 seconds, verify green LED. I pinned the manual in your Documents.`;
  }
  if (q.includes("refund")) {
    return `For jobs under $500 within 14 days, issue from Payments. Over $500 needs owner approval — I can draft it.`;
  }
  return `I’m your hub assistant. Ask about schedule, training, documents, PTO, or job help — I’ll pull from Atlas Brain.`;
}

export const qualitySignals = [
  {
    id: "long-wait",
    pattern: "Long wait",
    count: 5,
    severity: "High",
    ownerAlert: true,
    trend: "+3 vs last week",
    recommendation: "Tighten ETA texts and protect morning buffers.",
  },
  {
    id: "clear-comms",
    pattern: "Clear communication",
    count: 18,
    severity: "Positive",
    ownerAlert: false,
    trend: "Steady",
    recommendation: "Keep confirmation + photo scripts as default.",
  },
  {
    id: "mess",
    pattern: "Mess left behind",
    count: 2,
    severity: "Medium",
    ownerAlert: true,
    trend: "New",
    recommendation: "Add end-of-job cleanup checklist to Employee Hub.",
  },
];

export const qualityFeedback = [
  {
    id: "f1",
    customer: "Elena Brooks",
    channel: "Review",
    when: "Today · 8:12 AM",
    quote: "Tech was great, but the long wait before arrival was stressful.",
    tags: ["Long wait"],
  },
  {
    id: "f2",
    customer: "Marcus Nguyen",
    channel: "SMS",
    when: "Yesterday · 6:40 PM",
    quote: "Still waiting — any update on the long wait?",
    tags: ["Long wait"],
  },
  {
    id: "f3",
    customer: "Jamie Cole",
    channel: "Call summary",
    when: "Yesterday · 2:15 PM",
    quote: "Appreciate the clear communication on timing and price.",
    tags: ["Clear communication"],
  },
  {
    id: "f4",
    customer: "Chris Park",
    channel: "Review",
    when: "Mon · 9:05 AM",
    quote: "Long wait in the driveway past the window.",
    tags: ["Long wait"],
  },
  {
    id: "f5",
    customer: "Nina Alvarez",
    channel: "Email",
    when: "Mon · 4:22 PM",
    quote: "Left a bit of a mess behind near the water heater closet.",
    tags: ["Mess left behind"],
  },
  {
    id: "f6",
    customer: "Tom Rivera",
    channel: "Review",
    when: "Sun · 7:50 PM",
    quote: "Another long wait after the confirmation text.",
    tags: ["Long wait"],
  },
  {
    id: "f7",
    customer: "Priya Shah",
    channel: "SMS",
    when: "Sat · 11:18 AM",
    quote: "Thanks for explaining every step — clear communication.",
    tags: ["Clear communication"],
  },
  {
    id: "f8",
    customer: "Jordan Miles",
    channel: "Review",
    when: "Fri · 5:30 PM",
    quote: "Long wait again even though the tech was excellent.",
    tags: ["Long wait"],
  },
];

export const qualityAlertCopy = {
  title: "Owner alert · Long wait",
  body: "Five customers mentioned “Long wait.” I opened a Quality alert and drafted a response plan: tighten ETA texts and protect morning buffers.",
  actions: [
    "Send ETA update texts 20 minutes before arrival",
    "Protect 15-minute morning buffers on Smart Calendar",
    "Coach late-arrival empathy in AI Training",
    "Notify affected customers with a goodwill credit offer",
  ],
};

export const complianceItems = [
  {
    id: "biz-license",
    item: "Business license",
    category: "Licenses",
    due: "Nov 12, 2026",
    status: "OK",
    owner: "Jeff",
    note: "City of Summit renewal packet auto-filed last year.",
  },
  {
    id: "contractor-license",
    item: "Contractor license",
    category: "Licenses",
    due: "Jan 30, 2027",
    status: "OK",
    owner: "Jeff",
    note: "State board · Atlas watching renewal window at 90 days.",
  },
  {
    id: "vehicle-inspect",
    item: "Vehicle safety inspections",
    category: "Inspections",
    due: "Sep 1, 2026",
    status: "Scheduled",
    owner: "Alex Rivera",
    note: "Truck 1 & 2 booked at county station.",
  },
  {
    id: "shop-inspect",
    item: "Shop safety walkthrough",
    category: "Inspections",
    due: "Aug 18, 2026",
    status: "Due soon",
    owner: "Sam Ortiz",
    note: "Checklist pinned in Employee Hub Documents.",
  },
  {
    id: "liability",
    item: "Liability insurance",
    category: "Insurance",
    due: "Aug 3, 2026",
    status: "Renew soon",
    owner: "Jeff",
    note: "Broker quote request drafted by Atlas.",
  },
  {
    id: "workers-comp",
    item: "Workers’ compensation",
    category: "Insurance",
    due: "Oct 9, 2026",
    status: "OK",
    owner: "Jeff",
    note: "Policy active · certificates available to send.",
  },
  {
    id: "epa-john",
    item: "EPA 608 · John Hale",
    category: "Certifications",
    due: "Jun 2027",
    status: "OK",
    owner: "John Hale",
    note: "Card scanned into Employee Hub.",
  },
  {
    id: "epa-alex",
    item: "EPA 608 · Alex Rivera",
    category: "Certifications",
    due: "Mar 2027",
    status: "OK",
    owner: "Alex Rivera",
    note: "Universal certification on file.",
  },
  {
    id: "osha-talk",
    item: "OSHA toolbox talk",
    category: "OSHA",
    due: "Every Friday",
    status: "Due Friday",
    owner: "Team",
    note: "Atlas will ping the crew Thursday afternoon.",
  },
  {
    id: "osha-log",
    item: "OSHA injury log review",
    category: "OSHA",
    due: "Monthly",
    status: "OK",
    owner: "Jeff",
    note: "No recordable incidents this month.",
  },
  {
    id: "refrigerant",
    item: "Refrigerant handling rules",
    category: "Regulations",
    due: "Ongoing",
    status: "Monitoring",
    owner: "Ops",
    note: "Industry pack · HVAC regulatory digest subscribed.",
  },
  {
    id: "disposal",
    item: "Hazardous disposal manifests",
    category: "Regulations",
    due: "Sep 15, 2026",
    status: "Due soon",
    owner: "Sam Ortiz",
    note: "Next pickup scheduled with certified hauler.",
  },
] as const;

export const complianceCategories = [
  "All",
  "Licenses",
  "Inspections",
  "Insurance",
  "Certifications",
  "OSHA",
  "Regulations",
] as const;

export const complianceReminders = [
  {
    id: "r1",
    badge: "Soon",
    tone: "warn" as const,
    text: "Liability insurance renews Aug 3",
    detail: "Atlas drafted the broker renewal email.",
  },
  {
    id: "r2",
    badge: "Weekly",
    tone: "" as const,
    text: "OSHA toolbox talk due Friday",
    detail: "Topic queued: ladder angle + PPE.",
  },
  {
    id: "r3",
    badge: "OK",
    tone: "ok" as const,
    text: "EPA 608 for John Hale current",
    detail: "No action needed until 90-day window.",
  },
  {
    id: "r4",
    badge: "Soon",
    tone: "warn" as const,
    text: "Shop safety walkthrough Aug 18",
    detail: "Checklist ready in Documents.",
  },
];

export const securityCategories = [
  "All",
  "Logins",
  "Fraud",
  "Data leaks",
  "Spending",
  "Account changes",
  "Devices",
  "Passwords",
  "Backups",
] as const;

export const securityEvents = [
  {
    id: "login-iphone",
    category: "Logins",
    event: "Login from new device",
    detail: "Owner iPhone · Cupertino",
    status: "Allowed",
    when: "Today · 7:02 AM",
    risk: "Low",
    note: "Matched Jeff’s usual location and Face ID.",
  },
  {
    id: "login-vpn",
    category: "Logins",
    event: "Suspicious login attempt",
    detail: "Unknown VPN · Frankfurt",
    status: "Blocked",
    when: "Yesterday · 11:48 PM",
    risk: "High",
    note: "Password spray blocked. MFA challenge never completed.",
  },
  {
    id: "fraud-refund",
    category: "Fraud",
    event: "Unusual refund attempt",
    detail: "$2,400 after hours",
    status: "Blocked",
    when: "Yesterday · 9:15 PM",
    risk: "High",
    note: "Amount above tech limit and outside business hours.",
  },
  {
    id: "fraud-card",
    category: "Fraud",
    event: "Card testing pattern",
    detail: "4 failed payments · same IP",
    status: "Blocked",
    when: "Mon · 3:22 PM",
    risk: "Medium",
    note: "Payments connector auto-throttled the source.",
  },
  {
    id: "leak-export",
    category: "Data leaks",
    event: "Export of customer list",
    detail: "Requested by Alex",
    status: "Needs approval",
    when: "Today · 8:40 AM",
    risk: "Medium",
    note: "Full CRM CSV · waiting on owner approval.",
  },
  {
    id: "leak-link",
    category: "Data leaks",
    event: "Public share link created",
    detail: "Estimate PDF · external domain",
    status: "Revoked",
    when: "Sun · 4:05 PM",
    risk: "Medium",
    note: "Atlas revoked the link after unusual forwarding.",
  },
  {
    id: "spend-po",
    category: "Spending",
    event: "Unusual purchasing spike",
    detail: "3 POs · $1,180 in 20 min",
    status: "Needs approval",
    when: "Today · 6:55 AM",
    risk: "Medium",
    note: "Above daily purchasing threshold for Sam.",
  },
  {
    id: "spend-refunds",
    category: "Spending",
    event: "Refund velocity alert",
    detail: "3 refunds · same day",
    status: "Monitoring",
    when: "Fri · 2:10 PM",
    risk: "Low",
    note: "Still under weekly cap · watching pattern.",
  },
  {
    id: "acct-role",
    category: "Account changes",
    event: "Role permission change",
    detail: "Alex · Jobs → Jobs + Exports",
    status: "Needs approval",
    when: "Today · 8:38 AM",
    risk: "Medium",
    note: "Tied to customer export request.",
  },
  {
    id: "acct-key",
    category: "Account changes",
    event: "API key rotated",
    detail: "Payments connector",
    status: "Healthy",
    when: "Thu · 1:00 AM",
    risk: "Low",
    note: "Scheduled rotation completed successfully.",
  },
  {
    id: "device-van",
    category: "Devices",
    event: "Tablet enrolled",
    detail: "Van 3 · Android",
    status: "Healthy",
    when: "Wed · 6:12 AM",
    risk: "Low",
    note: "MDM profile applied · disk encryption on.",
  },
  {
    id: "device-lost",
    category: "Devices",
    event: "Device marked missing",
    detail: "Spare iPad · warehouse",
    status: "Needs approval",
    when: "Today · 9:05 AM",
    risk: "Medium",
    note: "Awaiting remote wipe approval from Jeff.",
  },
  {
    id: "pwd-weak",
    category: "Passwords",
    event: "Weak password detected",
    detail: "Alex · shared inbox",
    status: "Needs approval",
    when: "Today · 7:30 AM",
    risk: "Medium",
    note: "Atlas drafted a reset + required 2FA enrollment.",
  },
  {
    id: "pwd-2fa",
    category: "Passwords",
    event: "2FA check passed",
    detail: "Owner + managers",
    status: "Healthy",
    when: "Mon · 1:00 AM",
    risk: "Low",
    note: "All privileged accounts have authenticator apps.",
  },
  {
    id: "backup-nightly",
    category: "Backups",
    event: "Nightly backup verified",
    detail: "CRM · files · configs",
    status: "Healthy",
    when: "Today · 2:10 AM",
    risk: "Low",
    note: "Restore test succeeded in 4m 12s.",
  },
  {
    id: "backup-gap",
    category: "Backups",
    event: "Backup lag warning",
    detail: "Photo archive · 26h",
    status: "Monitoring",
    when: "Yesterday · 4:00 PM",
    risk: "Low",
    note: "Retry queued; primary customer data still current.",
  },
] as const;

export const securityStats = [
  { label: "Threats blocked", value: "3", detail: "Last 7 days" },
  { label: "Pending approvals", value: "5", detail: "Export · spend · role · device · password" },
  { label: "2FA coverage", value: "98%", detail: "Privileged accounts" },
  { label: "Backup health", value: "Green", detail: "Restore tested" },
];

export const securityAuditLog = [
  { when: "Today · 9:05 AM", actor: "Atlas", action: "Flagged missing iPad for wipe approval" },
  { when: "Today · 8:40 AM", actor: "Alex", action: "Requested customer list export" },
  { when: "Today · 7:30 AM", actor: "Atlas", action: "Opened password health ticket for shared inbox" },
  { when: "Yesterday · 11:48 PM", actor: "Atlas", action: "Blocked Frankfurt VPN login" },
  { when: "Thu · 1:00 AM", actor: "System", action: "Rotated payments API key" },
];

export const documentTypes = [
  "Contracts",
  "Quotes",
  "Invoices",
  "Letters",
  "Reports",
  "Policies",
  "Forms",
  "Proposals",
] as const;

export const documentDrafts = [
  {
    id: "maint-contract",
    type: "Contracts",
    title: "HVAC maintenance agreement · Jamie Cole",
    status: "Ready",
    preview:
      "Annual HVAC maintenance, two visits, filter replacements included, $289/year. E-sign ready.",
    prompt: "Create a maintenance agreement for Jamie Cole.",
  },
  {
    id: "water-quote",
    type: "Quotes",
    title: "Water heater replace · Jamie Cole",
    status: "Signed",
    preview: "Replace 50-gal unit, haul-away, same-day install option · $1,850.",
    prompt: "Draft a water heater quote for Jamie.",
  },
  {
    id: "invoice-elena",
    type: "Invoices",
    title: "Invoice · Elena Brooks drain clearing",
    status: "Draft",
    preview: "Service call + parts · $420 due on receipt.",
    prompt: "Invoice Elena for today’s drain clearing.",
  },
  {
    id: "apology-letter",
    type: "Letters",
    title: "Delay apology letter",
    status: "Ready",
    preview: "Owner-voice apology with morning make-good window + goodwill credit offer.",
    prompt: "Write a delay apology letter for long waits.",
  },
  {
    id: "weekly-report",
    type: "Reports",
    title: "Weekly ops report",
    status: "Ready",
    preview: "Revenue, on-time %, quality alerts, and compliance renewals due.",
    prompt: "Build this week’s ops report.",
  },
  {
    id: "refund-policy",
    type: "Policies",
    title: "Refund policy one-pager",
    status: "Ready",
    preview: "Under $500 / 14 days full refund; over $500 needs owner approval.",
    prompt: "Update the refund policy handout.",
  },
  {
    id: "intake-form",
    type: "Forms",
    title: "New customer intake form",
    status: "Ready",
    preview: "Access notes, pets, preferred channel, photo upload consent.",
    prompt: "Create a new customer intake form.",
  },
  {
    id: "second-location",
    type: "Proposals",
    title: "Second location proposal",
    status: "Draft",
    preview: "Cost estimate, permit timeline, equipment list, 6-week owner brief plan.",
    prompt: "Draft a proposal to open a second location.",
  },
] as const;

export function documentBuilderReply(prompt: string) {
  const q = prompt.toLowerCase();
  if (q.includes("maintenance") || (q.includes("jamie") && q.includes("agreement"))) {
    return "Draft ready: annual HVAC maintenance, two visits, filter replacements included, $289/year. Want e-sign sent by text?";
  }
  if (q.includes("quote") || q.includes("estimate")) {
    return "Quote draft ready with parts, labor, and optional haul-away. I can attach it to the CRM timeline.";
  }
  if (q.includes("invoice")) {
    return "Invoice drafted from the completed job + parts used. Send now or schedule for tomorrow 8 AM?";
  }
  if (q.includes("policy")) {
    return "Policy one-pager updated from Knowledge Base. Employees will see it in the Hub Documents tab.";
  }
  if (q.includes("proposal") || q.includes("second location")) {
    return "Proposal outline ready: checklist, cost estimate, permits, equipment, weekly owner updates.";
  }
  return "I can draft contracts, quotes, invoices, letters, reports, policies, forms, or proposals from Atlas Brain. What should I create?";
}

export const visionExamples = [
  {
    id: "hvac",
    industry: "HVAC",
    title: "Outdoor unit photo",
    uploadLabel: "Photo uploaded · outdoor unit",
    result: "This capacitor looks damaged.",
    detail:
      "Matched to a 45/5 on Alex’s truck. Drafted customer explanation + parts line on the estimate.",
  },
  {
    id: "restaurant",
    industry: "Restaurant",
    title: "Prep line photo",
    uploadLabel: "Photo uploaded · prep line",
    result: "Is this food safe?",
    detail: "Hold time may be exceeded. Flagged for discard and logged a safety note.",
  },
  {
    id: "retail",
    industry: "Retail",
    title: "Shelf photo",
    uploadLabel: "Photo uploaded · aisle 4 shelf",
    result: "Count the inventory on this shelf.",
    detail: "Shelf count: 24 units · 3 facing gaps. Reorder suggestion created.",
  },
  {
    id: "construction",
    industry: "Construction",
    title: "Framing photo",
    uploadLabel: "Photo uploaded · framing bay",
    result: "Is this framing consistent with the plan?",
    detail: "Framing looks consistent with the uploaded plan. No variance flagged.",
  },
] as const;

export const meetingNotes = {
  id: "ops-standup",
  title: "Weekly ops standup",
  recorded: "Today · 32 min",
  summary:
    "Covered route delays, approved spring promo budget, and agreed to hire one apprentice while ordering a second recovery machine.",
  notes: [
    "Covered route delays on Main St",
    "Approved spring promo budget",
    "Hiring one apprentice",
  ],
  decisions: [
    "Buy second recovery machine",
    "Move Tuesday marketing blast to Wednesday",
  ],
  tasks: [
    { owner: "Sam", task: "Order recovery machine", due: "Fri" },
    { owner: "Emma", task: "Rewrite promo copy", due: "Wed" },
    { owner: "Jeff", task: "Post apprentice job", due: "Mon" },
  ],
  deadlines: [
    { label: "Promo launch", due: "Wed" },
    { label: "Recovery machine delivery target", due: "Next Fri" },
  ],
};

export const meetingLibrary = [
  {
    ...meetingNotes,
    platform: "Zoom",
    joinUrl: "zoom.us/j/atlas-ops",
    attendees: ["Jeff", "Sam", "Emma", "Alex"],
    recapSent: false,
  },
  {
    id: "owner-brief",
    title: "Owner Friday brief",
    recorded: "Last Fri · 18 min",
    summary: "Reviewed Intelligence Score, quality long-wait alert, and second-location permit risk.",
    notes: ["Score up +3", "Long-wait plan in motion", "Permit delay risk on location #2"],
    decisions: ["Keep Google Ads budget flat", "Escalate permit follow-up Monday"],
    tasks: [
      { owner: "Alex", task: "Tighten ETA texts", due: "Mon" },
      { owner: "Jeff", task: "Call permit office", due: "Mon" },
    ],
    deadlines: [{ label: "Permit check-in", due: "Mon" }],
    platform: "Google Meet",
    joinUrl: "meet.google.com/atlas-brief",
    attendees: ["Jeff", "Atlas"],
    recapSent: true,
  },
] as const;

export const projects = [
  {
    id: "second-location",
    name: "Open second location",
    progress: 38,
    budget: "$120k est.",
    spent: "$46k",
    deadline: "Nov 15",
    team: ["Jeff", "Alex", "Emma"],
    risk: "Permit delay",
    dependencies: ["City permit", "Equipment PO", "Hiring apprentice"],
    next: "Coordinate inspection · order equipment · update owner Friday",
    updates: [
      "Atlas notified the team: permit office follow-up moved to Monday.",
      "Budget still on track at 38% spend vs 38% progress.",
    ],
  },
  {
    id: "spring-campaign",
    name: "Spring maintenance campaign",
    progress: 72,
    budget: "$4.2k",
    spent: "$3.1k",
    deadline: "Wed",
    team: ["Emma", "David", "Jeff"],
    risk: "Low",
    dependencies: ["Promo copy", "SMS list clean", "Facebook creative"],
    next: "Publish Facebook + SMS sequence",
    updates: [
      "Creative approved. Atlas scheduled Wednesday blast.",
      "Waitlist segment attached automatically.",
    ],
  },
  {
    id: "quality-fix",
    name: "Long-wait quality fix",
    progress: 55,
    budget: "$800",
    spent: "$120",
    deadline: "Fri",
    team: ["Alex", "Sam", "Jeff"],
    risk: "Customer churn",
    dependencies: ["ETA text template", "Calendar buffers", "Training coach"],
    next: "Roll ETA texts to all techs today",
    updates: [
      "Quality alert acknowledged. Response plan 2/4 actions complete.",
    ],
  },
] as const;

export const workflowPalette = [
  { kind: "Trigger", label: "Missed call" },
  { kind: "Trigger", label: "Payment received" },
  { kind: "Trigger", label: "Invoice overdue" },
  { kind: "Trigger", label: "Inventory low" },
  { kind: "Trigger", label: "New review" },
  { kind: "Action", label: "Send text" },
  { kind: "Action", label: "Send reminder" },
  { kind: "Action", label: "Create lead" },
  { kind: "Action", label: "Create customer" },
  { kind: "Action", label: "Schedule follow-up" },
  { kind: "Action", label: "Schedule callback" },
  { kind: "Action", label: "Notify owner" },
  { kind: "Action", label: "Request review" },
] as const;

export const workflowSteps = [
  { id: "t1", kind: "Trigger", label: "Missed call" },
  { id: "a1", kind: "Action", label: "Send text" },
  { id: "a2", kind: "Action", label: "Create customer" },
  { id: "a3", kind: "Action", label: "Schedule callback" },
  { id: "a4", kind: "Action", label: "Notify owner" },
] as const;

export const workflowTemplates = [
  {
    id: "missed-call",
    name: "Missed call → text → lead → follow-up",
    steps: [
      { id: "t1", kind: "Trigger", label: "Missed call" },
      { id: "a1", kind: "Action", label: "Send text" },
      { id: "a2", kind: "Action", label: "Create lead" },
      { id: "a3", kind: "Action", label: "Schedule follow-up" },
      { id: "a4", kind: "Action", label: "Notify owner" },
    ],
    blurb: "If a customer misses a call → send a text → create a lead → schedule a follow-up.",
  },
  {
    id: "overdue-invoice",
    name: "Overdue invoice reminders",
    steps: [
      { id: "t4", kind: "Trigger", label: "Invoice overdue" },
      { id: "a9", kind: "Action", label: "Send reminder" },
      { id: "a10", kind: "Action", label: "Schedule follow-up" },
      { id: "a11", kind: "Action", label: "Notify owner" },
    ],
    blurb: "If an invoice is overdue → send reminders every 7 days.",
  },
  {
    id: "inventory-alert",
    name: "Low inventory notify",
    steps: [
      { id: "t5", kind: "Trigger", label: "Inventory low" },
      { id: "a12", kind: "Action", label: "Notify owner" },
      { id: "a13", kind: "Action", label: "Create lead" },
    ],
    blurb: "If inventory drops below 20 → notify the owner.",
  },
  {
    id: "review-ask",
    name: "Review request after payment",
    steps: [
      { id: "t2", kind: "Trigger", label: "Payment received" },
      { id: "a5", kind: "Action", label: "Request review" },
      { id: "a6", kind: "Action", label: "Notify owner" },
    ],
    blurb: "Ask for a Google review once the invoice is paid.",
  },
] as const;

export const appStoreModules = [
  {
    id: "hvac",
    name: "HVAC tools",
    category: "Trades",
    installs: "8.2k",
    blurb: "Model lookups, refrigerant charts, capacitor math.",
  },
  {
    id: "legal",
    name: "Legal intake",
    category: "Professional",
    installs: "3.1k",
    blurb: "Conflict checks and matter opening scripts.",
  },
  {
    id: "dental",
    name: "Dental scheduling",
    category: "Healthcare",
    installs: "5.4k",
    blurb: "Chair-time aware booking.",
  },
  {
    id: "realestate",
    name: "Real estate CRM",
    category: "Professional",
    installs: "9.8k",
    blurb: "Showings, offers, and document packs.",
  },
  {
    id: "restaurant",
    name: "Restaurant ordering",
    category: "Hospitality",
    installs: "12.0k",
    blurb: "Voice takeout + allergy notes.",
  },
  {
    id: "fleet",
    name: "Fleet management",
    category: "Ops",
    installs: "4.6k",
    blurb: "Vehicles, fuel, maintenance.",
  },
  {
    id: "fitness",
    name: "Fitness coaching",
    category: "Personal",
    installs: "18.6k",
    blurb: "Programs, check-ins, form tips.",
  },
] as const;

export const appStoreCategories = [
  "All",
  "Trades",
  "Professional",
  "Healthcare",
  "Hospitality",
  "Ops",
  "Personal",
] as const;

export const apiConnectors = [
  {
    id: "accounting",
    name: "Accounting software",
    examples: "QuickBooks · Xero",
    status: "Connected",
    scope: "Invoices · expenses · payroll summaries",
  },
  {
    id: "payments",
    name: "Payment processors",
    examples: "Stripe · Square",
    status: "Connected",
    scope: "Charges · refunds · payouts",
  },
  {
    id: "calendar",
    name: "Calendar apps",
    examples: "Google · Outlook",
    status: "Connected",
    scope: "Jobs · availability · two-way sync",
  },
  {
    id: "email",
    name: "Email providers",
    examples: "Gmail · Microsoft 365",
    status: "Available",
    scope: "Threads · templates · delivery events",
  },
  {
    id: "sms",
    name: "SMS providers",
    examples: "Twilio · MessageBird",
    status: "Connected",
    scope: "Reminders · campaigns · two-way chat",
  },
  {
    id: "shipping",
    name: "Shipping carriers",
    examples: "UPS · USPS · FedEx",
    status: "Available",
    scope: "Labels · tracking · delivery ETAs",
  },
  {
    id: "ecommerce",
    name: "E-commerce platforms",
    examples: "Shopify · WooCommerce",
    status: "Available",
    scope: "Orders · catalog · fulfillment",
  },
  {
    id: "custom",
    name: "Custom software",
    examples: "REST · webhooks · your stack",
    status: "Available",
    scope: "Scoped API keys · event subscriptions",
  },
] as const;

export const apiSurfaces = [
  { badge: "REST", tone: "ok" as const, text: "Customers, jobs, invoices, messages" },
  { badge: "Webhooks", tone: "ok" as const, text: "Call ended · payment captured · job completed" },
  { badge: "Auth", tone: "" as const, text: "Scoped API keys with least privilege" },
];

export const agentGoals = [
  {
    id: "second-location",
    goal: "Open a second location",
    status: "In progress",
    progress: 38,
    atlas:
      "Checklist created, cost estimate drafted, permits tracked, construction milestones watched, equipment ordered, owner brief every Friday.",
    steps: [
      { label: "Create checklist", done: true },
      { label: "Estimate costs", done: true },
      { label: "Coordinate permits", done: false },
      { label: "Track construction milestones", done: false },
      { label: "Order equipment", done: true },
      { label: "Keep owner updated", done: true },
    ],
  },
  {
    id: "fill-tuesday",
    goal: "Fill next week’s empty Tuesday",
    status: "Ready",
    progress: 100,
    atlas:
      "Waitlist texted, three bookings confirmed, routes rebalanced, John assigned to preferred customers.",
    steps: [
      { label: "Text waitlist", done: true },
      { label: "Confirm bookings", done: true },
      { label: "Rebalance routes", done: true },
      { label: "Assign preferred techs", done: true },
    ],
  },
  {
    id: "quality-fix",
    goal: "Fix long-wait quality issues",
    status: "In progress",
    progress: 55,
    atlas: "ETA texts drafted, calendar buffers protected, training coach assigned, goodwill offers queued.",
    steps: [
      { label: "Draft ETA texts", done: true },
      { label: "Protect morning buffers", done: true },
      { label: "Assign training coach", done: false },
      { label: "Send goodwill offers", done: false },
    ],
  },
] as const;

export const twinLayers = [
  { id: "employees", layer: "Employees", signal: "4 techs · 92% on-time", value: 92 },
  { id: "customers", layer: "Customers", signal: "1,204 active · 46% convert", value: 46 },
  { id: "inventory", layer: "Inventory", signal: "Filters low in 5 days", value: 74 },
  { id: "cash", layer: "Cash flow", signal: "Healthy · 6-week runway", value: 85 },
  { id: "marketing", layer: "Marketing", signal: "Google Ads leading ROI", value: 79 },
  { id: "equipment", layer: "Equipment", signal: "1 recovery machine on order", value: 80 },
  { id: "locations", layer: "Locations", signal: "HQ live · #2 at 38%", value: 38 },
  { id: "performance", layer: "Performance", signal: "Intelligence Score 86", value: 86 },
] as const;

export const twinSimulations = [
  {
    id: "saturdays",
    prompt: "What if we open Saturdays and hire one apprentice?",
    result:
      "Model projects +11% weekly revenue, overtime down 8%, and Intelligence Score to 89 in 6 weeks — if Google Ads budget stays flat.",
    deltas: [
      { label: "Weekly revenue", value: "+11%" },
      { label: "Overtime", value: "-8%" },
      { label: "Intelligence Score", value: "89" },
    ],
  },
  {
    id: "ads-cut",
    prompt: "What if we cut Google Ads 20%?",
    result:
      "Lead volume dips ~9% in 3 weeks. Score falls to 83 unless organic review velocity rises.",
    deltas: [
      { label: "Leads", value: "-9%" },
      { label: "Ad spend", value: "-20%" },
      { label: "Intelligence Score", value: "83" },
    ],
  },
  {
    id: "second-bay",
    prompt: "What if location #2 opens one month early?",
    result:
      "Cash runway shortens to 4 weeks during buildout, then recovers if permit risk stays low.",
    deltas: [
      { label: "Runway", value: "4 wks" },
      { label: "Capacity", value: "+18%" },
      { label: "Risk", value: "Permit" },
    ],
  },
] as const;

export const marketplaceShareTypes = [
  "All",
  "Industry agents",
  "Workflows",
  "Industry packs",
  "Dashboards",
  "Automations",
  "Reports",
  "Integrations",
  "Templates",
] as const;

export const marketplaceShares = [
  {
    id: "sales-agent",
    name: "Sales Agent",
    type: "Industry agents",
    rating: "4.9",
    price: "Free",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Qualifies leads, drafts quotes, and coaches closings in real time.",
  },
  {
    id: "hr-manager",
    name: "HR Manager",
    type: "Industry agents",
    rating: "4.8",
    price: "$29",
    seller: "PeopleStack",
    developer: "peoplestack",
    blurb: "Onboarding, PTO, certifications, and handbook answers for the team.",
  },
  {
    id: "marketing-director",
    name: "Marketing Director",
    type: "Industry agents",
    rating: "4.8",
    price: "$39",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Campaigns, reviews, social posts, and local SEO in one specialist.",
  },
  {
    id: "accountant-agent",
    name: "Accountant",
    type: "Industry agents",
    rating: "4.9",
    price: "$49",
    seller: "LedgerLink",
    developer: "ledgerlink",
    blurb: "Categorize expenses, chase invoices, and prep books for tax season.",
  },
  {
    id: "support-agent",
    name: "Customer Support Agent",
    type: "Industry agents",
    rating: "4.9",
    price: "Free",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Answers FAQs from the Knowledge Brain and opens tickets when needed.",
  },
  {
    id: "legal-assistant",
    name: "Legal Document Assistant",
    type: "Industry agents",
    rating: "4.7",
    price: "$59",
    seller: "ClauseWorks",
    developer: "clauseworks",
    blurb: "Drafts contracts, NDAs, and policy language from your templates.",
  },
  {
    id: "real-estate-assistant",
    name: "Real Estate Assistant",
    type: "Industry agents",
    rating: "4.8",
    price: "$45",
    seller: "PropKits",
    developer: "propkits",
    blurb: "Listings, showings, buyer follow-ups, and document packets.",
  },
  {
    id: "fitness-coach",
    name: "Personal Fitness Coach",
    type: "Industry agents",
    rating: "4.6",
    price: "$19",
    seller: "Wellness Labs",
    developer: "wellness-labs",
    blurb: "Plans, check-ins, and habit reminders for owner wellness programs.",
  },
  {
    id: "hvac-agent",
    name: "HVAC Overnight Receptionist",
    type: "Industry agents",
    rating: "4.9",
    price: "Free",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Industry agent that books emergencies, quotes ranges, and texts techs.",
  },
  {
    id: "dental-agent",
    name: "Dental Chair-Time Agent",
    type: "Industry agents",
    rating: "4.8",
    price: "$29",
    seller: "Clinic Kits",
    developer: "clinic-kits",
    blurb: "Schedules by chair, hygiene recall, and insurance questions.",
  },
  {
    id: "morning-dash",
    name: "Owner Morning Dashboard",
    type: "Dashboards",
    rating: "4.7",
    price: "$29",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Overnight money, jobs, risks, and AI actions at a glance.",
  },
  {
    id: "fleet-dash",
    name: "Fleet Utilization Dashboard",
    type: "Dashboards",
    rating: "4.6",
    price: "$19",
    seller: "RouteForge",
    developer: "routeforge",
    blurb: "Van hours, idle time, and preventive service windows.",
  },
  {
    id: "missed-call",
    name: "Missed-call Recovery Automation",
    type: "Automations",
    rating: "4.9",
    price: "Free",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Text → CRM → callback slot → owner alert in one loop.",
  },
  {
    id: "review-auto",
    name: "Review Request Automation",
    type: "Automations",
    rating: "4.8",
    price: "Free",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Ask for reviews after paid jobs and draft replies.",
  },
  {
    id: "weekly-ops",
    name: "Weekly Ops Health Report",
    type: "Reports",
    rating: "4.6",
    price: "$15",
    seller: "Insight Co",
    developer: "insight-co",
    blurb: "Revenue, on-time %, quality alerts, compliance due.",
  },
  {
    id: "margin-report",
    name: "Job Margin Waterfall Report",
    type: "Reports",
    rating: "4.7",
    price: "$22",
    seller: "Margin Labs",
    developer: "margin-labs",
    blurb: "Parts, labor, and discount leakage by job type.",
  },
  {
    id: "quickbooks-bridge",
    name: "QuickBooks Sync Bridge",
    type: "Integrations",
    rating: "4.8",
    price: "$39",
    seller: "LedgerLink",
    developer: "ledgerlink",
    blurb: "Push invoices, payments, and expense categories bi-directionally.",
  },
  {
    id: "twilio-sms",
    name: "Twilio SMS Connector",
    type: "Integrations",
    rating: "4.9",
    price: "Free",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Two-way texts for confirmations, reminders, and recovery.",
  },
  {
    id: "plumbing-pack",
    name: "Plumbing Starter Template",
    type: "Templates",
    rating: "4.9",
    price: "$49",
    seller: "Trade Kits",
    developer: "trade-kits",
    blurb: "Services, price sheet, intake forms, and policies.",
  },
  {
    id: "salon-template",
    name: "Salon Booking Template",
    type: "Templates",
    rating: "4.7",
    price: "$35",
    seller: "ChairTime",
    developer: "chairtime",
    blurb: "Services, stylist skills, deposit rules, and no-show scripts.",
  },
  {
    id: "inventory-agent",
    name: "Inventory Agent",
    type: "Industry agents",
    rating: "4.8",
    price: "$29",
    seller: "StockPilot",
    developer: "stockpilot",
    blurb: "Reorder alerts, truck stock, and parts usage by job type.",
  },
  {
    id: "bookkeeping-assistant",
    name: "Bookkeeping Assistant",
    type: "Industry agents",
    rating: "4.9",
    price: "$39",
    seller: "LedgerLink",
    developer: "ledgerlink",
    blurb: "Categorize expenses, reconcile accounts, and chase missing receipts.",
  },
  {
    id: "stripe-connect",
    name: "Stripe",
    type: "Integrations",
    rating: "4.9",
    price: "Free",
    seller: "Stripe",
    developer: "stripe",
    blurb: "Payments, subscriptions, and invoice collection in Atlas Money.",
  },
  {
    id: "shopify-connect",
    name: "Shopify",
    type: "Integrations",
    rating: "4.8",
    price: "Free",
    seller: "Shopify",
    developer: "shopify",
    blurb: "Sync orders, inventory, and customer records from your store.",
  },
  {
    id: "gmail-connect",
    name: "Gmail",
    type: "Integrations",
    rating: "4.8",
    price: "Free",
    seller: "Google",
    developer: "google",
    blurb: "Inbox triage, follow-ups, and customer recognition from email.",
  },
  {
    id: "m365-connect",
    name: "Microsoft 365",
    type: "Integrations",
    rating: "4.7",
    price: "Free",
    seller: "Microsoft",
    developer: "microsoft",
    blurb: "Calendar, Outlook, Teams, and SharePoint in one connection.",
  },
  {
    id: "slack-connect",
    name: "Slack",
    type: "Integrations",
    rating: "4.8",
    price: "Free",
    seller: "Slack",
    developer: "slack",
    blurb: "Alerts, approvals, and team messages where your crew already works.",
  },
  {
    id: "hubspot-connect",
    name: "HubSpot",
    type: "Integrations",
    rating: "4.7",
    price: "$29",
    seller: "HubSpot",
    developer: "hubspot",
    blurb: "CRM sync, lead nurturing, and pipeline updates.",
  },
  {
    id: "square-connect",
    name: "Square",
    type: "Integrations",
    rating: "4.8",
    price: "Free",
    seller: "Square",
    developer: "square",
    blurb: "POS payments, invoices, and appointment deposits.",
  },
  {
    id: "onboard-customer",
    name: "New Customer Onboarding",
    type: "Workflows",
    rating: "4.9",
    price: "Free",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Welcome email, portal invite, intake form, and first-job checklist.",
  },
  {
    id: "onboard-employee",
    name: "Employee Onboarding",
    type: "Workflows",
    rating: "4.8",
    price: "Free",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Handbook, training modules, equipment checklist, and manager intro.",
  },
  {
    id: "invoice-collection",
    name: "Invoice Collection",
    type: "Workflows",
    rating: "4.9",
    price: "Free",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Polite reminders, escalation rules, and owner approval over thresholds.",
  },
  {
    id: "lead-nurture",
    name: "Lead Nurturing",
    type: "Workflows",
    rating: "4.7",
    price: "$19",
    seller: "Pipeline Co",
    developer: "pipeline-co",
    blurb: "Follow-up sequences for quotes that haven’t converted yet.",
  },
  {
    id: "appointment-reminders",
    name: "Appointment Reminders",
    type: "Workflows",
    rating: "4.9",
    price: "Free",
    seller: "Atlas Labs",
    developer: "dev@atlas",
    blurb: "Text and email reminders with reschedule links before each job.",
  },
  {
    id: "restaurant-pack",
    name: "Restaurant Pack",
    type: "Industry packs",
    rating: "4.8",
    price: "$59",
    seller: "Hospitality Kits",
    developer: "hospitality-kits",
    blurb: "Menus, reservations, staffing, and health inspection checklists.",
  },
  {
    id: "barber-pack",
    name: "Barber Shop Pack",
    type: "Industry packs",
    rating: "4.7",
    price: "$45",
    seller: "ChairTime",
    developer: "chairtime",
    blurb: "Chair scheduling, walk-ins, retail, and stylist commissions.",
  },
  {
    id: "trucking-pack",
    name: "Trucking Pack",
    type: "Industry packs",
    rating: "4.6",
    price: "$69",
    seller: "FleetForge",
    developer: "fleetforge",
    blurb: "Loads, DOT logs, maintenance, and driver dispatch templates.",
  },
  {
    id: "real-estate-pack",
    name: "Real Estate Pack",
    type: "Industry packs",
    rating: "4.8",
    price: "$55",
    seller: "PropKits",
    developer: "propkits",
    blurb: "Listings, showings, buyer follow-ups, and closing document packets.",
  },
  {
    id: "medical-pack",
    name: "Medical Office Pack",
    type: "Industry packs",
    rating: "4.8",
    price: "$65",
    seller: "Clinic Kits",
    developer: "clinic-kits",
    blurb: "Intake, insurance questions, recall, and chair-time scheduling.",
  },
  {
    id: "contractor-pack",
    name: "Contractor Pack",
    type: "Industry packs",
    rating: "4.9",
    price: "$49",
    seller: "Trade Kits",
    developer: "trade-kits",
    blurb: "Estimates, job costing, permits, and field photo workflows.",
  },
  {
    id: "law-firm-pack",
    name: "Law Firm Pack",
    type: "Industry packs",
    rating: "4.7",
    price: "$79",
    seller: "ClauseWorks",
    developer: "clauseworks",
    blurb: "Matter intake, document templates, deadlines, and client portal.",
  },
] as const;

export const globalBusinessRegions = [
  {
    id: "us-west",
    country: "United States",
    city: "Phoenix, AZ",
    language: "English (US)",
    timezone: "America/Phoenix (MST, no DST)",
    currency: "USD ($)",
    tax: "AZ transaction privilege tax + city add-ons on taxable services",
    hours: "Mon–Fri 7:00–18:00 · Sat 8:00–14:00 local",
    holidays: ["New Year’s Day", "Independence Day", "Thanksgiving", "Christmas"],
    regulations: "Contractor license + EPA 608 for refrigerant handling",
    humanReview: false,
  },
  {
    id: "ca-on",
    country: "Canada",
    city: "Toronto, ON",
    language: "English (CA) · French available",
    timezone: "America/Toronto (ET)",
    currency: "CAD (C$)",
    tax: "HST 13% on most services — show tax-inclusive quotes where required",
    hours: "Mon–Fri 8:00–17:00 ET · closed statutory holidays",
    holidays: ["Canada Day", "Labour Day", "Thanksgiving (CA)", "Boxing Day"],
    regulations: "Provincial trade certification; WSIB coverage checks",
    humanReview: true,
  },
  {
    id: "uk-lon",
    country: "United Kingdom",
    city: "London",
    language: "English (UK)",
    timezone: "Europe/London (GMT/BST)",
    currency: "GBP (£)",
    tax: "VAT 20% — reverse charge rules may apply for B2B",
    hours: "Mon–Fri 08:00–17:30 · bank holidays closed",
    holidays: ["New Year’s Day", "Good Friday", "Christmas Day", "Boxing Day"],
    regulations: "Gas Safe / Part P electrical where applicable — human review before advice",
    humanReview: true,
  },
  {
    id: "mx-cdmx",
    country: "Mexico",
    city: "Mexico City",
    language: "Spanish (MX)",
    timezone: "America/Mexico_City (CST)",
    currency: "MXN ($)",
    tax: "IVA 16% — CFDI invoicing requirements",
    hours: "Lun–Vie 9:00–18:00 · sábados bajo demanda",
    holidays: ["Año Nuevo", "Día del Trabajo", "Independencia", "Navidad"],
    regulations: "RFC + factura electrónica; local permit checks need human review",
    humanReview: true,
  },
  {
    id: "au-syd",
    country: "Australia",
    city: "Sydney, NSW",
    language: "English (AU)",
    timezone: "Australia/Sydney (AEST/AEDT)",
    currency: "AUD (A$)",
    tax: "GST 10% — display tax-inclusive consumer prices",
    hours: "Mon–Fri 7:30–17:00 AEST · public holidays closed",
    holidays: ["Australia Day", "ANZAC Day", "Christmas Day", "Boxing Day"],
    regulations: "Licensed trades + SafeWork NSW guidance — escalate contested advice",
    humanReview: true,
  },
] as const;

export const explainableRecommendations = [
  {
    id: "raise-prices",
    blunt: "Raise prices.",
    title: "Raise service rates 6%",
    why: "Parts inflation (+11%), overtime climbing, and competitor rates moved up while contribution margin slipped 3.4 pts YTD.",
    supportingData: [
      "Parts COGS +11% YoY",
      "OT hours +18% vs prior summer",
      "Close rate still healthy at 46%",
      "Peer HVAC rates in region +4–9% this year",
    ],
    risks: [
      "Short-term cancel rate may rise ~1–2 pts",
      "Review velocity risk if messaging feels abrupt",
      "Loyalty customers may feel surprised without grandfathering",
    ],
    expectedOutcomes: [
      "+$9.8k/mo revenue at current volume if retention holds",
      "Margin recovery toward target within 2 billing cycles",
      "Cash buffer before Q4 hiring plan",
    ],
    confidence: 78,
    alternatives: [
      { name: "Hold prices through Q4", outcome: "Protects volume; margin stays compressed.", score: 42 },
      { name: "+4% across the board", outcome: "Softer shock; may under-recover costs.", score: 61 },
      { name: "+6% with loyalty grandfathering", outcome: "Best balance of margin and trust.", score: 78 },
      { name: "+8% emergency-only", outcome: "Targets peak demand; uneven brand signal.", score: 55 },
    ],
  },
  {
    id: "hire-tech",
    blunt: "Hire another technician.",
    title: "Add one field technician in August",
    why: "Same-day fill rate is capped by crew hours; overtime and callback delays are climbing on north routes.",
    supportingData: [
      "Utilization 94% last 6 weeks",
      "Missed same-day windows: 11 last month",
      "OT cost ~$920/mo avoidable with capacity",
    ],
    risks: [
      "Onboarding dips productivity 2–3 weeks",
      "If demand softens, idle cost rises",
      "Van/tool kit spend before first billable week",
    ],
    expectedOutcomes: [
      "+12 same-day slots/week after ramp",
      "OT down ~6 hrs/week system-wide",
      "CSAT recovery on wait-time complaints",
    ],
    confidence: 74,
    alternatives: [
      { name: "Defer hire to Q4", outcome: "Saves payroll; loses summer peak.", score: 48 },
      { name: "Subcontract peak days", outcome: "Flexible but higher unit cost.", score: 58 },
      { name: "Hire now + lease van", outcome: "Capacity + coverage for north routes.", score: 74 },
    ],
  },
  {
    id: "switch-supplier",
    blunt: "Switch suppliers.",
    title: "Move primary parts to Meridian",
    why: "Apex lead times doubled and quality complaints rose while Meridian quotes −11% with 2-day lead time.",
    supportingData: [
      "Apex delivery 4 days → 8 days",
      "Quality tickets +3 this quarter from Apex lots",
      "Meridian sample fill rate 97% in pilot",
    ],
    risks: [
      "Transition stockouts without dual-source overlap",
      "Receiving team retrain overhead",
      "Contract exit notice if mishandled",
    ],
    expectedOutcomes: [
      "~$18k annual parts savings after transition",
      "Fewer stockout callbacks",
      "Smoother same-day job starts",
    ],
    confidence: 84,
    alternatives: [
      { name: "Stay with Apex", outcome: "Cost and delay risk continue.", score: 41 },
      { name: "Full cutover now", outcome: "Max savings; single-source risk.", score: 72 },
      { name: "Dual-source 60 days", outcome: "Best risk/return balance.", score: 84 },
    ],
  },
] as const;

export function explainableForQuery(query: string) {
  const q = query.toLowerCase();
  if (q.includes("price") || q.includes("raise") || q.includes("rate")) {
    return explainableRecommendations[0];
  }
  if (q.includes("hire") || q.includes("technician") || q.includes("tech")) {
    return explainableRecommendations[1];
  }
  if (q.includes("supplier") || q.includes("parts") || q.includes("meridian")) {
    return explainableRecommendations[2];
  }
  return explainableRecommendations[0];
}

export const intelligenceScore = {
  score: 86,
  previous: 83,
  change: "+3 this week",
  business: "Summit Home Services",
  pillars: [
    { name: "Customer satisfaction", value: 94, delta: +1 },
    { name: "Response times", value: 91, delta: +4 },
    { name: "Revenue trends", value: 82, delta: +2 },
    { name: "Employee productivity", value: 88, delta: 0 },
    { name: "Marketing effectiveness", value: 79, delta: +3 },
    { name: "Cash flow", value: 85, delta: +1 },
    { name: "Inventory health", value: 74, delta: -2 },
    { name: "Compliance", value: 90, delta: 0 },
    { name: "Security", value: 93, delta: +1 },
    { name: "Growth", value: 80, delta: +2 },
  ],
  why: "Score rose because overnight response time dropped to 41s and Google Ads conversion improved.",
  drivers: [
    { label: "Response times", detail: "Overnight answer speed hit 41s", impact: "+2 pts" },
    { label: "Marketing effectiveness", detail: "Google Ads conversion up", impact: "+1 pt" },
    { label: "Inventory health", detail: "Filters trending low", impact: "-1 pt drag" },
  ],
  recommendations: [
    {
      title: "Reorder filters now",
      detail: "Inventory health is the weakest pillar. Ordering in 5 days avoids stockouts.",
      impact: "+3 to +5 pts",
      href: "/app/inventory",
    },
    {
      title: "Fill Tuesday gaps from the waitlist",
      detail: "Empty Tuesday slots are capping growth and revenue trends.",
      impact: "+2 to +4 pts",
      href: "/app/appointments",
    },
    {
      title: "Keep ETA texts on for long-wait recovery",
      detail: "Protects customer satisfaction gains from the quality plan.",
      impact: "Hold +2 pts",
      href: "/app/quality",
    },
  ],
  next: "Highest-impact fix: reorder filters and cut Tuesday gaps with waitlist fills.",
};

export const smartCalendarSignals = [
  "Employee schedules + certifications",
  "Holidays and vacation blackouts",
  "Equipment availability",
  "Travel time between jobs",
  "Live traffic",
  "Weather delays",
  "Historical job length by service type",
];

export const boardAdvisors = [
  { id: "ops", name: "Operations AI", focus: "Staffing · capacity · delivery" },
  { id: "finance", name: "Finance AI", focus: "Cash · margin · reserves" },
  { id: "marketing", name: "Marketing AI", focus: "Demand · brand · channels" },
  { id: "risk", name: "Risk AI", focus: "Lease · legal · downside" },
  { id: "ceo", name: "CEO AI", focus: "Balanced recommendation" },
] as const;

export const boardTopics = [
  {
    id: "second-location",
    question: "Should we open another location?",
    summary: "Balanced viewpoints rather than a single answer — wait three months while building cash.",
    voices: [
      {
        advisor: "Operations AI",
        stance: "Supportive",
        say: "We have enough staff.",
      },
      {
        advisor: "Finance AI",
        stance: "Caution",
        say: "It will reduce cash reserves by 22%.",
      },
      {
        advisor: "Marketing AI",
        stance: "Supportive",
        say: "Demand is strong in that market.",
      },
      {
        advisor: "Risk AI",
        stance: "Caution",
        say: "Lease costs are increasing.",
      },
      {
        advisor: "CEO AI",
        stance: "Recommend",
        say: "My recommendation is to wait three months while building a stronger cash buffer.",
      },
    ],
  },
  {
    id: "ads-budget",
    question: "Should we increase Google Ads spend 30%?",
    summary: "Grow carefully — raise spend 10% first and protect Tuesday fill rate.",
    voices: [
      {
        advisor: "Marketing AI",
        stance: "Supportive",
        say: "Conversion is up and the funnel can absorb more spend.",
      },
      {
        advisor: "Finance AI",
        stance: "Caution",
        say: "A 30% jump compresses contribution margin this month.",
      },
      {
        advisor: "Operations AI",
        stance: "Caution",
        say: "Tuesday capacity is already thin — more leads may increase wait times.",
      },
      {
        advisor: "Risk AI",
        stance: "Neutral",
        say: "Platform dependency rises if one channel dominates acquisition.",
      },
      {
        advisor: "CEO AI",
        stance: "Recommend",
        say: "Increase 10% now, fill Tuesday gaps, then revisit the full 30% in 30 days.",
      },
    ],
  },
  {
    id: "hire-apprentice",
    question: "Should we hire another apprentice this quarter?",
    summary: "Yes — hire one apprentice and pair with John for 60 days.",
    voices: [
      {
        advisor: "Operations AI",
        stance: "Supportive",
        say: "Route load justifies another trainee before summer peak.",
      },
      {
        advisor: "Finance AI",
        stance: "Neutral",
        say: "Payroll impact is manageable if overtime drops 8%.",
      },
      {
        advisor: "Marketing AI",
        stance: "Supportive",
        say: "Faster response supports review velocity and referrals.",
      },
      {
        advisor: "Risk AI",
        stance: "Caution",
        say: "Training quality must stay high — pair with a lead tech.",
      },
      {
        advisor: "CEO AI",
        stance: "Recommend",
        say: "Hire one apprentice, assign John as mentor, and review productivity at day 60.",
      },
    ],
  },
] as const;

export function boardReplyForQuestion(question: string) {
  const q = question.toLowerCase();
  if (q.includes("location") || q.includes("another") || q.includes("second")) {
    return boardTopics[0];
  }
  if (q.includes("ads") || q.includes("google") || q.includes("spend")) {
    return boardTopics[1];
  }
  if (q.includes("hire") || q.includes("apprentice") || q.includes("staff")) {
    return boardTopics[2];
  }
  return {
    id: "custom",
    question,
    summary: "The board weighed operations, finance, marketing, and risk — proceed only with a clear cash and capacity buffer.",
    voices: [
      { advisor: "Operations AI", stance: "Neutral", say: "Capacity can support it if we protect morning buffers." },
      { advisor: "Finance AI", stance: "Caution", say: "Model the cash impact for 90 days before committing." },
      { advisor: "Marketing AI", stance: "Supportive", say: "Customer demand signals are constructive." },
      { advisor: "Risk AI", stance: "Caution", say: "Watch concentration risk and contract terms." },
      { advisor: "CEO AI", stance: "Recommend", say: "Pilot small, measure for 30 days, then decide with a fuller cash buffer." },
    ],
  };
}

export const decisionDimensions = [
  { id: "financial", label: "Financial impact" },
  { id: "legal", label: "Legal considerations" },
  { id: "customer", label: "Customer experience" },
  { id: "workload", label: "Employee workload" },
  { id: "operational", label: "Operational effects" },
  { id: "risk", label: "Risk level" },
  { id: "return", label: "Expected return" },
  { id: "alternatives", label: "Alternative options" },
] as const;

export const decisionCases = [
  {
    id: "supplier-switch",
    title: "Switch primary parts supplier",
    asked: "Should we leave Apex Supply for Meridian Parts?",
    recommendation: "Approve the switch with a 60-day dual-source overlap.",
    confidence: 84,
    verdict: "Recommend",
    scores: {
      financial: { score: 82, note: "Parts cost −11% after transition; ~$18k annual savings." },
      legal: { score: 78, note: "Exit clause clean; keep 30-day notice in writing." },
      customer: { score: 88, note: "Fewer stockouts; callback rate projected −6%." },
      workload: { score: 71, note: "Receiving needs a 2-week retrain; temporary overtime +4%." },
      operational: { score: 86, note: "Lead time 4 days → 2 days; fill rate rises to 97%." },
      risk: { score: 74, note: "Medium — dual-source until Meridian proves 8 weeks of quality." },
      return: { score: 85, note: "Payback ~5 months including transition labor." },
      alternatives: {
        score: 80,
        note: "Three options scored: stay Apex, switch Meridian, dual-source 90 days.",
      },
    },
    alternatives: [
      { name: "Stay with Apex", outcome: "Cost stays high; delivery risk continues.", score: 41 },
      { name: "Full switch to Meridian", outcome: "Max savings; 3-week single-source risk.", score: 72 },
      { name: "Dual-source 60 days then cutover", outcome: "Best risk/return balance.", score: 84 },
    ],
  },
  {
    id: "second-van",
    title: "Purchase second service van",
    asked: "Buy the Ford Transit now or wait until Q4?",
    recommendation: "Buy now — utilization already justifies the asset.",
    confidence: 79,
    verdict: "Recommend",
    scores: {
      financial: { score: 76, note: "Payment $685/mo; overtime savings ~$920/mo." },
      legal: { score: 90, note: "Standard commercial lease; insurance quote ready." },
      customer: { score: 87, note: "Same-day windows expand north routes." },
      workload: { score: 84, note: "Cuts technician overtime 6–8 hrs/week." },
      operational: { score: 88, note: "Unlocks parallel job starts on peak days." },
      risk: { score: 70, note: "Residual value risk if growth stalls — mitigated by strong bookings." },
      return: { score: 81, note: "Expected ROI positive within 7 months." },
      alternatives: {
        score: 75,
        note: "Lease vs buy vs rent peak weeks only — lease wins on cash.",
      },
    },
    alternatives: [
      { name: "Wait until Q4", outcome: "Miss summer peak capacity.", score: 48 },
      { name: "Rent peak weeks only", outcome: "Flexible but $40+/day and unreliable.", score: 55 },
      { name: "Lease Transit now", outcome: "Capacity + overtime relief this month.", score: 79 },
    ],
  },
  {
    id: "price-increase",
    title: "Raise diagnostic fee $15",
    asked: "Should we increase the diagnostic fee across all tickets?",
    recommendation: "Phase it — raise for new customers first, grandfather 90 days.",
    confidence: 73,
    verdict: "Caution",
    scores: {
      financial: { score: 86, note: "+$4.2k/mo at current volume if retention holds." },
      legal: { score: 92, note: "Update posted rates and confirmation scripts." },
      customer: { score: 58, note: "Price-sensitive segment may push back; explain value." },
      workload: { score: 80, note: "Front desk script refresh only." },
      operational: { score: 77, note: "Minimal ops change; quote templates update." },
      risk: { score: 62, note: "Review velocity risk if messaging is weak." },
      return: { score: 74, note: "Strong if cancel rate stays under +2pts." },
      alternatives: {
        score: 78,
        note: "Flat raise vs phased vs bundle into service packages.",
      },
    },
    alternatives: [
      { name: "Flat raise for everyone now", outcome: "Fast revenue; higher churn risk.", score: 61 },
      { name: "Bundle into service packages", outcome: "Softer perception; slower cash.", score: 68 },
      { name: "Phased raise + grandfather", outcome: "Protects loyalty while lifting ARPA.", score: 73 },
    ],
  },
] as const;

export function decisionForQuery(query: string) {
  const q = query.toLowerCase();
  if (q.includes("supplier") || q.includes("parts") || q.includes("meridian") || q.includes("apex")) {
    return decisionCases[0];
  }
  if (q.includes("van") || q.includes("vehicle") || q.includes("transit") || q.includes("fleet")) {
    return decisionCases[1];
  }
  if (q.includes("price") || q.includes("fee") || q.includes("diagnostic") || q.includes("raise")) {
    return decisionCases[2];
  }
  return {
    id: "custom",
    title: "Custom decision review",
    asked: query || "Evaluate this major decision",
    recommendation: "Proceed only after financial, legal, CX, and capacity scores clear 70.",
    confidence: 71,
    verdict: "Caution" as const,
    scores: {
      financial: { score: 72, note: "Model 90-day cash impact before committing." },
      legal: { score: 75, note: "Confirm contract terms and notice windows." },
      customer: { score: 70, note: "Check appointment and complaint signals." },
      workload: { score: 68, note: "Estimate hours added to team this month." },
      operational: { score: 74, note: "Map routing, inventory, and schedule effects." },
      risk: { score: 65, note: "Medium until a pilot proves the assumption." },
      return: { score: 73, note: "Positive if leading indicators hold for 30 days." },
      alternatives: { score: 77, note: "Score at least three options before locking in." },
    },
    alternatives: [
      { name: "Do nothing", outcome: "Preserves status quo; may miss upside.", score: 45 },
      { name: "Pilot for 30 days", outcome: "Limits downside while collecting proof.", score: 78 },
      { name: "Full commit now", outcome: "Max speed; higher execution risk.", score: 60 },
    ],
  };
}

export const executiveTimelineCategories = [
  "Funding",
  "Hiring",
  "Major customers",
  "Lawsuits",
  "Product launches",
  "Revenue milestones",
  "Equipment purchases",
  "Acquisitions",
  "Compliance deadlines",
] as const;

export const executiveTimeline = [
  {
    id: "t1",
    date: "2025-08-12",
    category: "Funding",
    title: "Seed round closed — $850k",
    detail: "Lead: North Harbor Angels. Runway extended to 18 months.",
  },
  {
    id: "t2",
    date: "2025-09-03",
    category: "Hiring",
    title: "Hired lead technician John Reyes",
    detail: "Filled north-route capacity gap; overtime fell 11% in 30 days.",
  },
  {
    id: "t3",
    date: "2025-10-18",
    category: "Major customers",
    title: "Signed Harbor Property Group",
    detail: "12-property maintenance retainer — largest B2B account to date.",
  },
  {
    id: "t4",
    date: "2025-11-02",
    category: "Compliance deadlines",
    title: "EPA refrigerant certification renewed",
    detail: "All field techs current; audit packet stored in Atlas Vault.",
  },
  {
    id: "t5",
    date: "2025-12-09",
    category: "Equipment purchases",
    title: "Purchased second diagnostic kit set",
    detail: "Cut shared-tool delays on parallel HVAC jobs.",
  },
  {
    id: "t6",
    date: "2026-01-15",
    category: "Product launches",
    title: "Membership plan launched",
    detail: "Priority service + annual tune-up; 84 members in first month.",
  },
  {
    id: "t7",
    date: "2026-01-15",
    category: "Major customers",
    title: "Supplier switch approved (Apex → Meridian)",
    detail: "CEO approved after Decision Engine review of three alternatives.",
  },
  {
    id: "t8",
    date: "2026-02-20",
    category: "Revenue milestones",
    title: "First $120k revenue month",
    detail: "Driven by membership attach rate and Harbor retainer.",
  },
  {
    id: "t9",
    date: "2026-03-08",
    category: "Hiring",
    title: "Apprentice Maria Chen started",
    detail: "Paired with John for 60-day mentorship track.",
  },
  {
    id: "t10",
    date: "2026-04-01",
    category: "Compliance deadlines",
    title: "Workers’ comp audit packet due",
    detail: "Atlas assembled claims history and safety logs — due in 5 days.",
  },
  {
    id: "t11",
    date: "2026-05-14",
    category: "Lawsuits",
    title: "Vendor invoice dispute closed",
    detail: "Settled under $2.4k; no ongoing liability. Counsel: closed.",
  },
  {
    id: "t12",
    date: "2026-06-01",
    category: "Acquisitions",
    title: "Exploring bolt-on: Ridgeline Plumbing assets",
    detail: "LOI discussion only — Decision Engine flagged cash and culture risk.",
  },
  {
    id: "t13",
    date: "2026-07-10",
    category: "Equipment purchases",
    title: "Service van #2 leased",
    detail: "Ford Transit — unlocks same-day north corridor coverage.",
  },
  {
    id: "t14",
    date: "2026-07-22",
    category: "Funding",
    title: "Line of credit renewed — $150k",
    detail: "Same terms; unused. Emergency buffer for seasonal inventory.",
  },
] as const;

export const ceoMemories = [
  {
    id: "m-prices-2025",
    date: "September 18, 2025",
    question: "Why did we increase prices in 2025?",
    decision: "Approved 6% service-rate increase effective Oct 1, 2025, with loyalty grandfathering through year-end.",
    answer:
      "On September 18, 2025, you increased prices after parts inflation hit 11%, overtime climbed, and competitor rates moved up. Meeting notes from the leadership sync (Sep 16) show Finance modeling a 4–8% band; you chose 6% with loyalty protection. Supporting data: contribution margin −3.4 pts YTD, same-day demand still strong, and Board Advisor flagged cash risk if you delayed.",
    triggers: ["parts inflation +11%", "overtime climbing", "competitor rates up", "margin −3.4 pts YTD"],
    alternativesReviewed: ["Hold prices through Q4", "+4% across the board", "+6% with loyalty grandfathering", "+8% emergency-only"],
    approvedBy: "CEO",
    linkedDecisionId: "price-increase-2025",
    meetingNotes: [
      "Sep 16 leadership sync — Finance presented wage + parts pressure",
      "Marketing worried about review velocity if messaging felt greedy",
      "Ops confirmed capacity could absorb a short demand dip",
    ],
    supportingData: ["Parts COGS +11% YoY", "OT hours +18% vs prior summer", "Close rate still 46%"],
  },
  {
    id: "m-supplier",
    date: "January 15, 2026",
    question: "Why did we switch suppliers?",
    decision: "Approved switch from Apex Supply to Meridian Parts with 60-day dual-source overlap.",
    answer:
      "On January 15, supplier costs increased by 18%, delivery times doubled, and quality complaints rose. You approved the switch after reviewing three alternatives.",
    triggers: ["supplier costs +18%", "delivery times doubled", "quality complaints rose"],
    alternativesReviewed: ["Stay with Apex", "Full cutover to Meridian", "Dual-source 60 days then cutover"],
    approvedBy: "CEO",
    linkedDecisionId: "supplier-switch",
    meetingNotes: ["Vendor scorecard reviewed with Ops + Purchasing"],
    supportingData: ["On-time delivery 61%", "Defect rate 2.8%"],
  },
  {
    id: "m-van",
    date: "July 10, 2026",
    question: "Why did we lease a second van?",
    decision: "Lease Ford Transit to expand same-day north routes.",
    answer:
      "On July 10, north-route overtime hit 14 hours/week, same-day accept rate fell to 61%, and Decision Engine showed lease payback under 7 months. You approved the Transit lease over waiting until Q4.",
    triggers: ["overtime 14 hrs/week", "same-day accept 61%", "payback < 7 months"],
    alternativesReviewed: ["Wait until Q4", "Rent peak weeks only", "Lease Transit now"],
    approvedBy: "CEO",
    linkedDecisionId: "second-van",
    meetingNotes: ["Route board review with Scheduler AI"],
    supportingData: ["North ZIP density up 22%", "Missed same-day window: 17 jobs"],
  },
  {
    id: "m-price",
    date: "March 2, 2026",
    question: "Why did we raise the diagnostic fee?",
    decision: "Phased +$15 diagnostic fee for new customers; grandfather existing 90 days.",
    answer:
      "On March 2, contribution margin on diagnostics had compressed 9% while competitor fees moved up. You approved a phased raise after reviewing flat, bundled, and grandfathered options — protecting loyalty while lifting ARPA.",
    triggers: ["margin −9%", "competitor fees up", "ARPA lift opportunity"],
    alternativesReviewed: ["Flat raise for everyone", "Bundle into packages", "Phased + grandfather"],
    approvedBy: "CEO",
    linkedDecisionId: "price-increase",
    meetingNotes: ["Sales + Finance pricing huddle"],
    supportingData: ["Diagnostic margin −9%", "Competitor median fee +$20"],
  },
  {
    id: "m-location",
    date: "November 20, 2025",
    question: "Why did we delay the second location?",
    decision: "Wait three months while building cash reserves.",
    answer:
      "On November 20, Board Advisor flagged a 22% cash-reserve hit and rising lease costs. You accepted CEO AI’s recommendation to wait three months while demand stays strong.",
    triggers: ["cash reserves −22% if opened", "lease costs rising", "demand still strong"],
    alternativesReviewed: ["Open immediately", "Sign LOI only", "Wait 90 days"],
    approvedBy: "CEO",
    linkedDecisionId: null,
    meetingNotes: ["Board Advisor scenario pack reviewed"],
    supportingData: ["Cash runway 11 weeks", "Lease ask +14%"],
  },
] as const;

export function ceoMemoryForQuestion(question: string) {
  const q = question.toLowerCase();
  if ((q.includes("price") || q.includes("prices") || q.includes("increase")) && q.includes("2025")) {
    return ceoMemories[0];
  }
  if (q.includes("supplier") || q.includes("parts") || q.includes("apex") || q.includes("meridian")) {
    return ceoMemories[1];
  }
  if (q.includes("van") || q.includes("vehicle") || q.includes("fleet") || q.includes("transit")) {
    return ceoMemories[2];
  }
  if (q.includes("fee") || q.includes("diagnostic") || q.includes("raise")) {
    return ceoMemories[3];
  }
  if (q.includes("price") || q.includes("increase")) {
    return ceoMemories[0];
  }
  if (q.includes("location") || q.includes("second") || q.includes("delay") || q.includes("wait")) {
    return ceoMemories[4];
  }
  return {
    id: "m-custom",
    date: "Today",
    question,
    decision: "No exact match — Atlas searched executive decision history.",
    answer:
      "I don’t have a single matching decision yet. Ask about the 2025 price increase, suppliers, the second van, diagnostic fees, or the delayed second location — or open Decision Engine to log a new one.",
    triggers: ["search across Executive Memory", "link to Decision Engine", "executive timeline context"],
    alternativesReviewed: [] as string[],
    approvedBy: "—",
    linkedDecisionId: null as string | null,
    meetingNotes: [] as string[],
    supportingData: [] as string[],
  };
}

export const missionControl = {
  callsign: "Summit Home Services",
  ceo: "Jeff",
  status: "All systems online",
  intelligenceScore: 86,
  partnerLine:
    "I’m not waiting for instructions. Overnight is closed, live ops are green, and three decisions need you before noon.",
  lanes: [
    {
      id: "overnight",
      label: "Overnight",
      headline: "What happened while you slept",
      summary: "94 tasks handled · $4,280 booked · 0 lost calls",
      items: [
        { time: "2:14 AM", text: "Receptionist booked new plumbing customer — estimate created, tech scheduled." },
        { time: "4:02 AM", text: "Payment reminders sent on 3 overdue invoices; one paid overnight." },
        { time: "5:41 AM", text: "Route optimizer reshuffled Tuesday north corridor after a late cancel." },
        { time: "6:18 AM", text: "Review request sent to Harbor Property Group after completed tune-ups." },
      ],
    },
    {
      id: "now",
      label: "Live now",
      headline: "What’s happening right now",
      summary: "12 jobs in motion · 2 techs delayed · phones covered",
      items: [
        { time: "Now", text: "John is 15 minutes late to the Elm Street AC call — customer already texted." },
        { time: "Now", text: "Sarah (AI) is on a live quote call for a water heater replacement." },
        { time: "Now", text: "Inventory alert: R-410A cylinders at 2 days of stock at current burn." },
        { time: "Now", text: "Front desk queue: 1 hold, average answer 41 seconds." },
      ],
    },
    {
      id: "next",
      label: "Likely next",
      headline: "What is likely to happen next",
      summary: "Tuesday fill risk · weather delay · membership surge",
      items: [
        { time: "Today PM", text: "Model: 68% chance Tuesday afternoon opens drop below target without a promo push." },
        { time: "Tomorrow", text: "Storm window may slip 3 outdoor units — Atlas drafted reschedule texts." },
        { time: "This week", text: "Membership attach rate trending to +12% if diagnostic fee messaging stays consistent." },
        { time: "30 days", text: "Cash buffer supports second van lease; Board Advisor still cautions second location." },
      ],
    },
    {
      id: "decisions",
      label: "Decisions",
      headline: "Which decisions need attention",
      summary: "3 awaiting CEO · highest impact first",
      items: [
        {
          time: "Urgent",
          text: "Approve Johnson Construction estimate — $18,400. Decision Engine confidence 81.",
        },
        {
          time: "Today",
          text: "Supplier dual-source cutoff in 9 days — confirm Meridian quality gate or extend Apex.",
        },
        {
          time: "This week",
          text: "Phased diagnostic fee raise: grandfather window ends Friday for early adopters.",
        },
        {
          time: "Watch",
          text: "Ridgeline Plumbing LOI — keep exploratory; cash/culture risk still amber.",
        },
      ],
    },
    {
      id: "automate",
      label: "Automate",
      headline: "Actions Atlas can safely run",
      summary: "6 ready · within your standing rules",
      items: [
        { time: "Safe", text: "Send morning confirmation texts for today’s 9 appointments." },
        { time: "Safe", text: "Rebook the two soft cancels into Wednesday morning gaps." },
        { time: "Safe", text: "Publish the already-approved HVAC tip post to Google Business." },
        { time: "Safe", text: "Reorder R-410A to par level from Meridian under the dual-source rule." },
      ],
    },
    {
      id: "opportunities",
      label: "Opportunities",
      headline: "What opportunities are available",
      summary: "2 revenue · 1 capacity · 1 reputation",
      items: [
        {
          time: "Revenue",
          text: "Harbor Property asked about expanding to 4 more buildings — draft retainer ready.",
        },
        {
          time: "Capacity",
          text: "North corridor same-day slots open after van #2 — market a 4-hour window promo.",
        },
        {
          time: "Reputation",
          text: "11 five-star customers haven’t been asked for a Google review this month.",
        },
        {
          time: "Growth",
          text: "Membership plan conversion is highest after tune-up completions — push attach script.",
        },
      ],
    },
  ],
  priorities: [
    {
      id: "p1",
      rank: 1,
      title: "Approve Johnson estimate",
      impact: "$18,400",
      why: "Highest cash impact before noon; customer waiting on signature.",
      href: "/app/decisions",
    },
    {
      id: "p2",
      rank: 2,
      title: "Cover John’s delay",
      impact: "CX protect",
      why: "Customer already pinged — Atlas can send ETA + $25 courtesy credit if you approve.",
      href: "/app/quality",
    },
    {
      id: "p3",
      rank: 3,
      title: "Run safe automations",
      impact: "6 actions",
      why: "Confirmations, rebooks, post, and refrigerant reorder are inside standing authority.",
      href: "/app/workflows",
    },
  ],
  automations: [
    { id: "a1", label: "Send today’s appointment confirmations", status: "ready" as const },
    { id: "a2", label: "Rebook soft cancels into Wednesday gaps", status: "ready" as const },
    { id: "a3", label: "Publish approved HVAC tip post", status: "ready" as const },
    { id: "a4", label: "Reorder R-410A to par from Meridian", status: "ready" as const },
    { id: "a5", label: "Request Google reviews from 11 five-star jobs", status: "ready" as const },
    { id: "a6", label: "Draft Harbor retainer expansion proposal", status: "needs-confirm" as const },
  ],
};

export const intelligenceNetworkInsights = [
  {
    industry: "Restaurants",
    insight: "Restaurants in your region are seeing a 14% increase in takeout orders.",
    signal: "Demand shift",
  },
  {
    industry: "HVAC",
    insight: "HVAC companies that respond within five minutes are closing 37% more leads.",
    signal: "Speed-to-lead",
  },
  {
    industry: "Plumbing",
    insight: "Same-day photo collection during missed-call recovery lifts booking rate by 22%.",
    signal: "Recovery playbook",
  },
  {
    industry: "Salons",
    insight: "Review requests sent within two hours of service convert 2.1× better than next-day sends.",
    signal: "Reputation timing",
  },
] as const;

export const digitalEmployeeRoster = [
  { title: "CEO", emoji: "👨‍💼", expertise: "Priorities, strategy, overnight briefings, decision queues" },
  { title: "CFO", emoji: "💰", expertise: "Cashflow, invoices, payroll cues, expense patterns" },
  { title: "Marketing Director", emoji: "📈", expertise: "Campaigns, social, offers, brand-consistent messaging" },
  { title: "Sales Manager", emoji: "🤝", expertise: "Quotes, follow-ups, pipeline, close rates" },
  { title: "Customer Support", emoji: "🎧", expertise: "Tickets, complaints, retention, review recovery" },
  { title: "Operations Manager", emoji: "⚙️", expertise: "Jobs, routes, technicians, on-time performance" },
  { title: "HR Manager", emoji: "👷", expertise: "Hiring, training, handbook, performance notes" },
  { title: "IT Manager", emoji: "💻", expertise: "Integrations, access, system health, tooling" },
  { title: "Compliance Officer", emoji: "⚖️", expertise: "Policies, audit trails, escalation rules" },
  { title: "Supply Chain Manager", emoji: "📦", expertise: "Inventory, vendors, reorder alerts, parts" },
] as const;

export const businessDnaTraits = [
  { trait: "Writing style", value: "Clear, warm, short sentences. No corporate filler." },
  { trait: "Brand voice", value: "Neighborly expert — helpful first, sales second." },
  { trait: "Preferred discounts", value: "Up to 10% for repeat customers; never on emergency calls." },
  { trait: "Customer service philosophy", value: "Own the problem, offer two options, confirm next step." },
  { trait: "Escalation rules", value: "Transfer anything safety-related or over $2,500 immediately." },
  { trait: "Tone", value: "Calm under pressure. Never blame the customer." },
  { trait: "Pricing strategy", value: "Transparent ranges on chat; firm quotes after photos." },
] as const;

export const businessDnaSamples = [
  {
    prompt: "Customer asks if you can do better on price.",
    generic: "We may be able to offer a discount depending on availability.",
    dna: "I can honor 10% for returning customers on maintenance visits — emergency calls stay at the listed rate so we can keep crews ready.",
  },
  {
    prompt: "Customer is upset about a late tech.",
    generic: "Sorry for the inconvenience. We’ll be there soon.",
    dna: "You’re right to expect better. Alex is 15 minutes out — I’ve already texted an updated ETA and a $25 courtesy credit for the wait.",
  },
] as const;

export const autonomousLoops = [
  {
    id: "missed-call",
    title: "Missed-call recovery",
    trigger: "Missed call detected · 2:14 AM",
    steps: [
      "Detected missed call from Marcus Nguyen",
      "Sent recovery text with booking link",
      "Booked Thursday 10:00 AM appointment",
      "Updated CRM profile + photos",
      "Alerted technician Sam on route board",
      "Queued day-before reminder",
      "Scheduled review request after job",
    ],
    ownerSees: "New overnight customer booked — confirm if you want Sam auto-assigned.",
    needsConfirm: true,
  },
  {
    id: "invoice-chase",
    title: "Overdue invoice chase",
    trigger: "Invoice #1840 past due · 7:05 AM",
    steps: [
      "Detected overdue balance $890",
      "Sent polite payment reminder (Business DNA tone)",
      "Logged CRM note",
      "Flagged Finance digital employee",
    ],
    ownerSees: "Reminder sent to Nina Alvarez. No further action needed unless she disputes.",
    needsConfirm: false,
  },
  {
    id: "review-ask",
    title: "Post-job review loop",
    trigger: "Job #1842 marked complete · 4:40 PM",
    steps: [
      "Confirmed job completion",
      "Sent thank-you + review request",
      "Tracked open rate",
      "Posted owner alert when 5-star review landed",
    ],
    ownerSees: "Sarah left a 5-star review. Atlas already replied in your voice.",
    needsConfirm: false,
  },
] as const;

export const simulatorScenarios = [
  {
    id: "min-wage",
    prompt: "What happens if minimum wage increases?",
    summary:
      "Payroll rises first. With a 4% service-rate adjustment and slightly slower hiring, profit holds within 1.2 points while cash dips for one quarter.",
    impacts: [
      { label: "Payroll impact", value: "+$6,400/mo", tone: "warn" as const },
      { label: "Pricing adjustments", value: "+4% rates", tone: "ok" as const },
      { label: "Profit changes", value: "-1.2 pts", tone: "warn" as const },
      { label: "Hiring impact", value: "Defer 1 role", tone: "warn" as const },
      { label: "Customer demand", value: "-2% short-term", tone: "warn" as const },
      { label: "Cash flow", value: "-$11k Q1", tone: "warn" as const },
    ],
  },
  {
    id: "fuel",
    prompt: "What if fuel costs rise 20%?",
    summary:
      "Route density becomes the lever. Consolidating afternoon stops and a $9 trip fee protect margin without cutting volume.",
    impacts: [
      { label: "Payroll impact", value: "Flat", tone: "ok" as const },
      { label: "Pricing adjustments", value: "+$9 trip fee", tone: "ok" as const },
      { label: "Profit changes", value: "-0.4 pts", tone: "warn" as const },
      { label: "Hiring impact", value: "None", tone: "ok" as const },
      { label: "Customer demand", value: "Stable", tone: "ok" as const },
      { label: "Cash flow", value: "-$2.1k/mo", tone: "warn" as const },
    ],
  },
  {
    id: "ads",
    prompt: "What if we raise Google Ads 15%?",
    summary:
      "Leads climb if response stays under five minutes. Without Receptionist coverage, CAC rises and close rate slips.",
    impacts: [
      { label: "Payroll impact", value: "+overtime risk", tone: "warn" as const },
      { label: "Pricing adjustments", value: "None", tone: "ok" as const },
      { label: "Profit changes", value: "+2.4 pts", tone: "ok" as const },
      { label: "Hiring impact", value: "Need capacity", tone: "warn" as const },
      { label: "Customer demand", value: "+11% leads", tone: "ok" as const },
      { label: "Cash flow", value: "+$4.8k/mo", tone: "ok" as const },
    ],
  },
] as const;

export const operatingSystemApps = [
  { name: "Email", href: "/app/documents", detail: "Inbox drafts + follow-ups" },
  { name: "Phone", href: "/app/phone", detail: "Live lines + missed-call recovery" },
  { name: "Calendar", href: "/app/appointments", detail: "Jobs, routes, availability" },
  { name: "CRM", href: "/app/customers", detail: "Profiles, timelines, notes" },
  { name: "Inventory", href: "/app/inventory", detail: "Parts, reorder, equipment" },
  { name: "Invoices", href: "/app/payments", detail: "Billing, deposits, reminders" },
  { name: "Payroll", href: "/app/accountant", detail: "Integrations + cost signals" },
  { name: "Marketing", href: "/app/marketing", detail: "Campaigns, posts, promos" },
  { name: "Projects", href: "/app/projects", detail: "Jobs and milestones" },
  { name: "Documents", href: "/app/documents", detail: "Contracts, quotes, files" },
  { name: "Analytics", href: "/app/analytics", detail: "Revenue and performance" },
  { name: "Autonomous", href: "/app/autonomous", detail: "Continuous AI loops" },
] as const;

export const businessBuilderSteps = [
  { id: "name", title: "Generate a business plan", detail: "One-pager: market, offer, pricing, first 90 days" },
  { id: "brand", title: "Create logos & branding", detail: "Logo mark, teal/brass palette, neighborly voice" },
  { id: "website", title: "Build a website", detail: "Services, prices, FAQ, booking, chatbot" },
  { id: "domain", title: "Register domains", detail: "summitaircare.com + .net redirect" },
  { id: "contracts", title: "Draft contracts", detail: "Service agreement + maintenance plan PDF" },
  { id: "marketing", title: "Create marketing campaigns", detail: "Google Business · launch offer · first 3 posts" },
  { id: "accounting", title: "Set up accounting", detail: "Chart of accounts · invoice templates · tax set-aside" },
  { id: "store", title: "Launch online store", detail: "Maintenance plans + filter kits for checkout" },
  { id: "workflows", title: "Set up workflows", detail: "Missed-call recovery · review asks · invoicing" },
  { id: "customers", title: "Acquire first customers", detail: "Neighborhood outreach list · referral script" },
] as const;

export const riskCenterAlerts = [
  {
    id: "csat",
    category: "Customer satisfaction",
    severity: "High",
    title: "Declining customer satisfaction",
    detail: "CSAT slipped from 4.9 → 4.6 over 21 days. Long-wait jobs are the top complaint theme.",
    action: "Auto-send apology + morning make-good windows to affected customers.",
  },
  {
    id: "burnout",
    category: "Employee burnout",
    severity: "Medium",
    title: "Employee burnout risk",
    detail: "Alex overtime 14 hrs/week; after-hours texts up 40%. Burnout score rising.",
    action: "Cap overtime next week and shift two north jobs to Sam.",
  },
  {
    id: "compliance",
    category: "Compliance deadlines",
    severity: "High",
    title: "Compliance deadline in 9 days",
    detail: "Contractor license renewal packet incomplete — insurance cert missing.",
    action: "Draft renewal checklist and ping Compliance Officer.",
  },
  {
    id: "equipment",
    category: "Equipment failure risk",
    severity: "Medium",
    title: "Equipment failure risk",
    detail: "Van #2 compressor clutch hours exceed predicted failure window.",
    action: "Schedule preventive service before Saturday peak.",
  },
  {
    id: "cash",
    category: "Cash-flow concerns",
    severity: "High",
    title: "Cash-flow concern",
    detail: "Overdue AR $2,310 + payroll Friday creates a 6-day tight window.",
    action: "Chase top 3 invoices and delay noncritical PO.",
  },
  {
    id: "account",
    category: "Unusual account activity",
    severity: "Medium",
    title: "Unusual account activity",
    detail: "Three refunds same day + export permission change requested.",
    action: "Hold refunds over $200 for owner confirm; review role change.",
  },
] as const;

export const businessCommandExamples = [
  "Increase Facebook ads by 20% if lead quality stays above last month’s average.",
  "If a VIP customer hasn’t visited in 90 days, create a follow-up task and draft a personalized email.",
  "Pause Google Ads when cost per booked job exceeds $85 for three days.",
  "Text the on-call tech when an emergency call comes in after 6pm.",
] as const;

export function compileBusinessCommand(command: string) {
  const q = command.toLowerCase();

  if (q.includes("facebook") || (q.includes("ads") && q.includes("20"))) {
    return {
      id: "fb-ads",
      title: "Conditional Facebook ad increase",
      plainEnglish: command.trim() || businessCommandExamples[0],
      trigger: "Daily at 7:00 AM — evaluate yesterday’s Facebook lead quality",
      condition: "Lead quality score ≥ last month’s average (currently 72)",
      actions: [
        "Increase Facebook Ads daily budget by 20%",
        "Log change to Marketing AI memory",
        "Notify owner if spend jumps more than $150/day",
      ],
      safeguards: ["Cap total daily spend at $400", "Auto-revert if quality drops below average for 2 days"],
      status: "Ready to activate",
    };
  }

  if (q.includes("vip") || (q.includes("90") && q.includes("follow"))) {
    return {
      id: "vip-followup",
      title: "VIP dormant follow-up",
      plainEnglish: command.trim() || businessCommandExamples[1],
      trigger: "Nightly CRM scan — VIP customers with no visit in 90+ days",
      condition: "Customer tagged VIP AND last completed job ≥ 90 days ago",
      actions: [
        "Create follow-up task assigned to account owner",
        "Draft personalized email using Customer Digital Twin preferences",
        "Queue task for human send approval if LTV > $5,000",
      ],
      safeguards: ["Skip if open complaint ticket", "Do not email more than once per 60 days"],
      status: "Ready to activate",
    };
  }

  if (q.includes("google") || q.includes("cost per")) {
    return {
      id: "pause-ads",
      title: "Pause ads on unit economics",
      plainEnglish: command.trim() || businessCommandExamples[2],
      trigger: "Every morning — compute 3-day rolling cost per booked job",
      condition: "Cost per booked job > $85 for 3 consecutive days",
      actions: ["Pause Google Ads campaigns tagged ‘acquisition’", "Alert Marketing AI + owner", "Suggest creative refresh"],
      safeguards: ["Leave brand-search campaigns running", "Require owner confirm to resume spend"],
      status: "Ready to activate",
    };
  }

  if (q.includes("emergency") || q.includes("after") || q.includes("on-call") || q.includes("6pm")) {
    return {
      id: "after-hours",
      title: "After-hours emergency text",
      plainEnglish: command.trim() || businessCommandExamples[3],
      trigger: "Inbound call classified as emergency after 6:00 PM local",
      condition: "Intent = emergency AND outside regional business hours",
      actions: ["Text on-call technician with address + issue summary", "Create high-priority job draft", "Send ETA SMS to caller"],
      safeguards: ["Escalate to owner if no tech ack in 10 minutes"],
      status: "Ready to activate",
    };
  }

  return {
    id: "custom",
    title: "Compiled automation",
    plainEnglish: command.trim() || businessCommandExamples[0],
    trigger: "When the described condition becomes true",
    condition: "Parsed from your plain-English rule",
    actions: [
      "Convert the instruction into an Atlas workflow",
      "Attach to the matching agents (Marketing, CRM, or Ops)",
      "Ask for confirmation if the action is sensitive",
    ],
    safeguards: ["Human approval required for spend, refunds, or data exports"],
    status: "Draft — review steps",
  };
}

export const governanceApprovals = [
  {
    id: "ga1",
    action: "Increase Facebook Ads budget +20%",
    requester: "Marketing AI",
    risk: "Medium",
    status: "Pending",
    why: "Spend change over $100/day requires owner approval.",
  },
  {
    id: "ga2",
    action: "Export full customer list to CSV",
    requester: "Jordan Lee",
    risk: "High",
    status: "Pending",
    why: "Bulk PII export needs dual approval.",
  },
  {
    id: "ga3",
    action: "Issue refund $640 — Harbor Dental",
    requester: "Finance AI",
    risk: "Medium",
    status: "Approved",
    why: "Within refund policy; owner approved remotely.",
  },
] as const;

export const governanceAuditLog = [
  {
    id: "al1",
    time: "Today 9:14 AM",
    actor: "Owner",
    event: "Approved Facebook budget change",
    detail: "Governance workflow GW-184",
  },
  {
    id: "al2",
    time: "Yesterday 4:02 PM",
    actor: "Security AI",
    event: "Blocked unusual login from new device",
    detail: "MFA challenge sent to owner",
  },
  {
    id: "al3",
    time: "Yesterday 11:20 AM",
    actor: "Jordan Lee",
    event: "Role change: Scheduling → Manager",
    detail: "Permission set updated; audit retained 7 years",
  },
  {
    id: "al4",
    time: "Mon 2:45 PM",
    actor: "Compliance AI",
    event: "Generated SOC2 access report",
    detail: "Exported to Trust Center folder",
  },
] as const;

export const governanceRoles = [
  {
    role: "Owner",
    permissions: ["Approve all sensitive actions", "Manage roles", "Change retention", "View audit log"],
  },
  {
    role: "Manager",
    permissions: ["Approve medium-risk actions", "View team data", "Run reports", "Cannot export full CRM"],
  },
  {
    role: "Technician",
    permissions: ["View assigned jobs", "Update job notes", "No pricing or refunds"],
  },
  {
    role: "AI Agent",
    permissions: ["Propose actions", "Auto-run low-risk loops", "Escalate high-risk for human approval"],
  },
] as const;

export const governanceRetention = [
  { data: "Call recordings", keep: "24 months", status: "Active" },
  { data: "Chat & SMS transcripts", keep: "36 months", status: "Active" },
  { data: "Audit logs", keep: "7 years", status: "Locked" },
  { data: "Marketing audiences", keep: "13 months", status: "Active" },
  { data: "Deleted customer PII", keep: "30-day purge queue", status: "Scheduled" },
] as const;

export const governanceReports = [
  {
    id: "r1",
    name: "Monthly access & approval report",
    cadence: "1st of month",
    audience: "Owner · Compliance",
  },
  {
    id: "r2",
    name: "Sensitive decision human-approval log",
    cadence: "Weekly",
    audience: "Owner · Board",
  },
  {
    id: "r3",
    name: "Data retention compliance summary",
    cadence: "Quarterly",
    audience: "Legal · IT",
  },
] as const;

export const customerDigitalTwins = [
  {
    id: "elena",
    name: "Elena Brooks",
    segment: "VIP · Residential",
    ltv: "$12,480",
    loyalty: "Gold",
    satisfaction: "4.9 / 5",
    preference: "Text first · mornings · Sam preferred",
    purchases: [
      "AC tune-up plan — annual",
      "Capacitor replacement — Mar 2026",
      "Duct cleaning — Nov 2025",
    ],
    serviceHistory: [
      "Mar 12 — capacitor swap, same-day",
      "Nov 3 — duct clean, 2 techs",
      "Jul 2025 — emergency no-cool",
    ],
    satisfactionTrend: ["5.0", "5.0", "4.8", "4.9"],
    upcomingNeeds: ["Filter reminder in 18 days", "Likely tune-up renewal in June"],
    personalizedOpener:
      "Hi Elena — Sam can swing by mornings next week for your filter swap before peak heat.",
  },
  {
    id: "harbor",
    name: "Harbor Dental",
    segment: "Commercial · Contract",
    ltv: "$48,200",
    loyalty: "Platinum",
    satisfaction: "4.7 / 5",
    preference: "Email + portal · no SMS after 7pm",
    purchases: [
      "Quarterly HVAC maintenance",
      "RTU repair — Jan 2026",
      "IAQ sensor install — 2025",
    ],
    serviceHistory: [
      "Jan 28 — RTU #2 compressor",
      "Oct 2025 — quarterly PM",
      "Aug 2025 — after-hours callout",
    ],
    satisfactionTrend: ["4.6", "4.8", "4.7", "4.7"],
    upcomingNeeds: ["Q2 PM due in 21 days", "Budget cycle — propose multi-year PM"],
    personalizedOpener:
      "Harbor team — your Q2 PM window opens Apr 14. I can hold Tuesday mornings to avoid patient hours.",
  },
  {
    id: "nina",
    name: "Nina Alvarez",
    segment: "At-risk · Residential",
    ltv: "$3,120",
    loyalty: "Standard",
    satisfaction: "4.2 / 5",
    preference: "Phone · evenings",
    purchases: ["Diagnostic visit", "Thermostat install"],
    serviceHistory: ["Feb 2 — diagnostic, deferred repair", "Sep 2025 — thermostat"],
    satisfactionTrend: ["4.8", "4.5", "4.1", "4.2"],
    upcomingNeeds: ["Deferred repair follow-up", "Payment plan offer if needed"],
    personalizedOpener:
      "Hi Nina — checking in on the repair we quoted in February. I can hold last month’s rate through Friday.",
  },
] as const;

export const executiveSchedule = [
  { time: "8:30 AM", title: "Standup with Sam & Alex", place: "Shop · 20 min" },
  { time: "10:00 AM", title: "Elena Brooks · AC diagnostic", place: "Oak Ave · Van 2" },
  { time: "1:00 PM", title: "Johnson Construction estimate call", place: "Phone · Atlas joining" },
  { time: "3:30 PM", title: "Supplier check-in · recovery machine", place: "Zoom" },
  { time: "5:00 PM", title: "Owner wrap · cash & tomorrow routes", place: "Voice mode" },
];

export const executiveTasks = [
  { title: "Approve Johnson Construction estimate", due: "Today", priority: "High" },
  { title: "Review overdue invoices (3)", due: "Today", priority: "High" },
  { title: "Confirm apprentice job post", due: "Mon", priority: "Medium" },
  { title: "Sign spring promo creative", due: "Wed", priority: "Medium" },
];

export const executiveEmails = [
  {
    from: "Harbor Dental",
    subject: "Q2 PM window + portal access",
    why: "Contract customer awaiting schedule",
  },
  {
    from: "City Permit Office",
    subject: "Inspection reschedule request",
    why: "Blocks second-location timeline",
  },
  {
    from: "Nina Alvarez",
    subject: "Can we revisit the repair quote?",
    why: "At-risk customer · sentiment soft",
  },
];

export const executiveBills = [
  { name: "Fleet insurance", amount: "$1,240", due: "Aug 3" },
  { name: "Parts vendor · CoolTech", amount: "$860", due: "Aug 5" },
  { name: "Google Ads", amount: "$420", due: "Aug 7" },
  { name: "QuickBooks + Twilio", amount: "$96", due: "Aug 10" },
];

export const executiveCashFlow = [
  { label: "In today", value: "$3,482" },
  { label: "Out today", value: "$1,105" },
  { label: "7-day forecast", value: "+$18.4k" },
  { label: "Cash on hand", value: "$64.2k" },
];

export const executiveMetrics = [
  { label: "Revenue MTD", value: "$86.4k", detail: "+12% vs last month" },
  { label: "Jobs booked", value: "38", detail: "4 open slots tomorrow" },
  { label: "CSAT", value: "4.8", detail: "Last 30 days" },
  { label: "Response time", value: "42s", detail: "Phone + chat" },
];

export const executiveWeatherTraffic = {
  weather: "82° · Clear · Good outdoor job day",
  traffic: "Main St slow until 9:15 · add 12 min to Van 2",
  airQuality: "Moderate · remind techs on long roof jobs",
};

export const executiveRecommendations = [
  {
    title: "Approve the Johnson estimate before lunch",
    detail: "Closing probability 78% if sent today with same-day install option.",
  },
  {
    title: "Text Nina a revised payment plan",
    detail: "Customer Twin flags churn risk; hold February rate through Friday.",
  },
  {
    title: "Reorder capacitors — below 20",
    detail: "Automation Builder can notify you automatically next time.",
  },
];

export const computerCapabilities = [
  { label: "Open applications", detail: "QuickBooks, Sheets, CRM, email" },
  { label: "Fill forms", detail: "Permits, vendor portals, insurance" },
  { label: "Create spreadsheets", detail: "Job costs, payroll drafts, forecasts" },
  { label: "Send emails", detail: "Recaps, invoices, follow-ups" },
  { label: "Generate reports", detail: "Ops, margins, tax packets" },
  { label: "Navigate websites", detail: "Supplier sites, city portals" },
  { label: "Download files", detail: "PDFs, CSVs, statements" },
  { label: "Organize folders", detail: "Jobs, customers, compliance" },
];

export const computerTasks = [
  {
    id: "qb-invoice",
    title: "Create overdue invoice chase sheet",
    status: "Ready",
    steps: ["Open Sheets", "Pull unpaid invoices", "Sort by age", "Email summary to Jeff"],
  },
  {
    id: "permit-form",
    title: "Fill city permit follow-up form",
    status: "Needs permission",
    steps: ["Open city portal", "Fill inspection fields", "Attach plans", "Submit for review"],
  },
  {
    id: "folder-tidy",
    title: "Organize Johnson Construction folder",
    status: "Ready",
    steps: ["Create job folder", "Move estimate PDF", "Attach photos", "Share link with Alex"],
  },
];

export const portalFeatures = [
  "Schedule appointments",
  "Pay invoices",
  "Chat with AI",
  "Upload documents",
  "Track orders",
  "Open support tickets",
];

export const portalThemes = [
  { id: "teal", name: "Harbor Teal", accent: "#2f8f8a" },
  { id: "ink", name: "Owner Ink", accent: "#0f2a32" },
  { id: "sand", name: "Trade Sand", accent: "#d9a441" },
];

export const portalPreview = {
  business: "Atlas HVAC",
  headline: "Your service portal",
  nextAppointment: "Tue · 10–12 · Filter swap",
  openInvoice: "$289 · due Aug 12",
  ticket: "Parts delay · In progress",
};

export const financeBudgets = [
  { category: "Parts & inventory", planned: "$12k", actual: "$9.4k", status: "On track" },
  { category: "Marketing", planned: "$4.2k", actual: "$3.1k", status: "Under" },
  { category: "Payroll", planned: "$28k", actual: "$27.2k", status: "On track" },
  { category: "Fleet", planned: "$3.5k", actual: "$4.1k", status: "Over" },
];

export const financeForecast = [
  { period: "This week", cashIn: "$22.4k", cashOut: "$14.1k", net: "+$8.3k" },
  { period: "Next week", cashIn: "$19.8k", cashOut: "$16.0k", net: "+$3.8k" },
  { period: "This month", cashIn: "$96k", cashOut: "$71k", net: "+$25k" },
];

export const financeSubscriptions = [
  { name: "QuickBooks", amount: "$65/mo", status: "Keep", note: "Core ledger" },
  { name: "Twilio SMS", amount: "$31/mo", status: "Keep", note: "Missed-call recovery" },
  { name: "Unused design SaaS", amount: "$29/mo", status: "Cancel", note: "No logins in 90 days" },
  { name: "Route planner legacy", amount: "$49/mo", status: "Review", note: "Replaced by Atlas Routes" },
];

export const financeInvoices = [
  { customer: "Johnson Construction", amount: "$18,400", status: "Pending approval", age: "2d" },
  { customer: "Harbor Dental", amount: "$1,120", status: "Sent", age: "5d" },
  { customer: "Nina Alvarez", amount: "$640", status: "Overdue", age: "18d" },
];

export const financePayroll = {
  nextRun: "Fri · $27,200",
  overtimeRisk: "Sam +4h this week",
  tip: "Shift one non-urgent job to Monday to avoid OT.",
};

export const financeTaxPlan = [
  "Set aside 22% of net for quarterly estimate",
  "Expense optimization found $780/yr in unused subscriptions",
  "Section 179 candidate: second recovery machine",
];

export const salesCoachCalls = [
  {
    id: "johnson",
    title: "Johnson Construction · remodel estimate",
    duration: "18:42",
    talkListen: "46% / 54%",
    closingProbability: "78%",
    objections: ["Price vs. prior GC", "Timeline for start"],
    missed: ["Didn’t offer phased payment", "No referral ask"],
    suggestions: [
      "Mirror their timeline concern before price",
      "Offer 40/40/20 milestone billing",
      "Ask who else on site needs HVAC next quarter",
    ],
    transcript: [
      { speaker: "Rep", text: "We can start the week of the 18th if permits clear." },
      { speaker: "Buyer", text: "That’s steeper than our last GC quote." },
      { speaker: "Rep", text: "This includes recovery equipment and after-hours contingency." },
    ],
  },
  {
    id: "nina",
    title: "Nina Alvarez · deferred repair",
    duration: "09:15",
    talkListen: "61% / 39%",
    closingProbability: "41%",
    objections: ["Cash this month"],
    missed: ["Talked over her budget concern", "No payment-plan bridge"],
    suggestions: [
      "Drop talk ratio below 50%",
      "Lead with payment plan before features",
      "Confirm evening phone preference",
    ],
    transcript: [
      { speaker: "Rep", text: "The compressor path is the lasting fix." },
      { speaker: "Buyer", text: "I just can’t put that much on the card right now." },
      { speaker: "Rep", text: "It’s the better long-term value though." },
    ],
  },
];

export const voiceEndpoints = [
  { id: "mobile", name: "Mobile app", status: "Connected", detail: "Push + wake word" },
  { id: "desktop", name: "Desktop app", status: "Connected", detail: "Hands-free on shop PC" },
  { id: "watch", name: "Smartwatch", status: "Paired", detail: "Glance metrics · approve" },
  { id: "car", name: "Car integration", status: "Ready", detail: "Android Auto / CarPlay" },
  { id: "speaker", name: "Smart speakers", status: "Optional", detail: "Shop & home" },
  { id: "web", name: "Web browser", status: "Live", detail: "This session" },
  { id: "phone", name: "Phone calls", status: "Live", detail: "Receptionist + owner line" },
];

