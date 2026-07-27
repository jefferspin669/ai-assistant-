export type NavItem = { href: string; label: string; exact?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "Command",
    items: [
      { href: "/app", label: "Atlas", exact: true },
      { href: "/app/brain", label: "Atlas Brain" },
      { href: "/app/memory", label: "AI Memory" },
      { href: "/app/knowledge", label: "Knowledge Base" },
      { href: "/app/voice", label: "Voice" },
    ],
  },
  {
    label: "Front desk",
    items: [
      { href: "/app/receptionist", label: "Voice Receptionist" },
      { href: "/app/phone", label: "Phone System" },
      { href: "/app/call-summaries", label: "Call Summaries" },
      { href: "/app/missed-calls", label: "Missed Calls" },
      { href: "/app/chatbot", label: "Website Chat" },
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
      { href: "/app/marketing", label: "Marketing AI" },
      { href: "/app/payments", label: "Payments" },
      { href: "/app/accountant", label: "Accountant Helper" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/app/appointments", label: "Smart Calendar" },
      { href: "/app/scheduling", label: "Intelligent Scheduling" },
      { href: "/app/routes", label: "Route Optimization" },
      { href: "/app/inventory", label: "AI Inventory" },
      { href: "/app/purchasing", label: "Purchasing AI" },
      { href: "/app/team", label: "Employee Hub" },
      { href: "/app/training", label: "AI Training" },
      { href: "/app/quality", label: "Quality Control" },
      { href: "/app/compliance", label: "Compliance" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/app/analytics", label: "AI Dashboard" },
      { href: "/app/insights", label: "Predictive Analytics" },
      { href: "/app/score", label: "Intelligence Score" },
      { href: "/app/digital-twin", label: "Digital Twin" },
      { href: "/app/security", label: "Security Center" },
    ],
  },
  {
    label: "Create & automate",
    items: [
      { href: "/app/documents", label: "Document Builder" },
      { href: "/app/vision", label: "Atlas Vision" },
      { href: "/app/meetings", label: "Meeting Assistant" },
      { href: "/app/projects", label: "Project Manager" },
      { href: "/app/workflows", label: "Workflow Builder" },
      { href: "/app/coach", label: "Live AI Coach" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/app/employees", label: "AI Agents" },
      { href: "/app/marketplace", label: "Marketplace" },
      { href: "/app/app-store", label: "App Store" },
      { href: "/app/developers", label: "Atlas API" },
      { href: "/app/industries", label: "Industry Packs" },
      { href: "/app/workforce", label: "AI Workforce" },
      { href: "/app/personal", label: "Personal AI" },
      { href: "/app/events", label: "Event AI" },
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
  { name: "Alex Rivera", role: "New hire · Tech", overall: 81, modulesDone: 2, modulesTotal: 4 },
  { name: "Sam Ortiz", role: "Tech", overall: 94, modulesDone: 4, modulesTotal: 4 },
  { name: "Jordan Lee", role: "Apprentice", overall: 36, modulesDone: 1, modulesTotal: 4 },
];

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
  { pattern: "Long wait", count: 5, severity: "High", ownerAlert: true },
  { pattern: "Clear communication", count: 18, severity: "Positive", ownerAlert: false },
  { pattern: "Mess left behind", count: 2, severity: "Medium", ownerAlert: true },
];

export const complianceItems = [
  { item: "Business license", due: "Nov 12", status: "OK" },
  { item: "Liability insurance", due: "Aug 3", status: "Renew soon" },
  { item: "EPA 608 · John Hale", due: "Jun 2027", status: "OK" },
  { item: "Vehicle inspections", due: "Sep 1", status: "Scheduled" },
  { item: "OSHA toolbox talk", due: "Weekly", status: "Due Friday" },
];

export const securityEvents = [
  { event: "Login from new device", detail: "Owner iPhone · Cupertino", status: "Allowed" },
  { event: "Unusual refund attempt", detail: "$2,400 after hours", status: "Blocked" },
  { event: "API key rotated", detail: "Payments connector", status: "Healthy" },
  { event: "Export of customer list", detail: "Requested by Alex", status: "Needs approval" },
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
];

export const visionExamples = [
  { industry: "HVAC", result: "This capacitor looks damaged." },
  { industry: "Restaurant", result: "Is this food safe? Hold time may be exceeded." },
  { industry: "Retail", result: "Shelf count: 24 units · 3 facing gaps." },
  { industry: "Construction", result: "Framing looks consistent with the uploaded plan." },
];

export const meetingNotes = {
  title: "Weekly ops standup",
  notes: ["Covered route delays on Main St", "Approved spring promo budget", "Hiring one apprentice"],
  decisions: ["Buy second recovery machine", "Move Tuesday marketing blast to Wednesday"],
  tasks: [
    { owner: "Sam", task: "Order recovery machine", due: "Fri" },
    { owner: "Emma", task: "Rewrite promo copy", due: "Wed" },
  ],
};

export const projects = [
  {
    name: "Open second location",
    progress: "38%",
    budget: "$120k est.",
    risk: "Permit delay",
    next: "Coordinate inspection · order equipment · update owner Friday",
  },
  {
    name: "Spring maintenance campaign",
    progress: "72%",
    budget: "$4.2k",
    risk: "Low",
    next: "Publish Facebook + SMS sequence",
  },
];

export const workflowSteps = [
  { kind: "Trigger", label: "Missed call" },
  { kind: "Action", label: "Send text" },
  { kind: "Action", label: "Create customer" },
  { kind: "Action", label: "Schedule callback" },
  { kind: "Action", label: "Notify owner" },
];

export const appStoreModules = [
  { name: "HVAC tools", installs: "8.2k", blurb: "Model lookups, refrigerant charts, capacitor math." },
  { name: "Legal intake", installs: "3.1k", blurb: "Conflict checks and matter opening scripts." },
  { name: "Dental scheduling", installs: "5.4k", blurb: "Chair-time aware booking." },
  { name: "Real estate CRM", installs: "9.8k", blurb: "Showings, offers, and document packs." },
  { name: "Restaurant ordering", installs: "12.0k", blurb: "Voice takeout + allergy notes." },
  { name: "Fleet management", installs: "4.6k", blurb: "Vehicles, fuel, maintenance." },
  { name: "Fitness coaching", installs: "18.6k", blurb: "Programs, check-ins, form tips." },
];

export const apiConnectors = [
  { name: "Accounting", examples: "QuickBooks · Xero" },
  { name: "Payments", examples: "Stripe · Square" },
  { name: "Calendar", examples: "Google · Outlook" },
  { name: "Email", examples: "Gmail · Microsoft 365" },
  { name: "SMS", examples: "Twilio · MessageBird" },
  { name: "Shipping", examples: "UPS · USPS · FedEx" },
  { name: "E-commerce", examples: "Shopify · WooCommerce" },
  { name: "Custom", examples: "REST · webhooks · your stack" },
];

export const agentGoals = [
  {
    goal: "Open a second location",
    atlas: "Checklist created, cost estimate drafted, permits tracked, construction milestones watched, equipment ordered, owner brief every Friday.",
  },
  {
    goal: "Fill next week’s empty Tuesday",
    atlas: "Waitlist texted, three bookings confirmed, routes rebalanced, John assigned to preferred customers.",
  },
];

export const twinLayers = [
  { layer: "Employees", signal: "4 techs · 92% on-time" },
  { layer: "Customers", signal: "1,204 active · 46% convert" },
  { layer: "Inventory", signal: "Filters low in 5 days" },
  { layer: "Cash flow", signal: "Healthy · 6-week runway" },
  { layer: "Marketing", signal: "Google Ads leading ROI" },
  { layer: "Equipment", signal: "1 recovery machine on order" },
  { layer: "Locations", signal: "HQ live · #2 at 38%" },
  { layer: "Performance", signal: "Intelligence Score 86" },
];

export const marketplaceShares = [
  { name: "Missed-call recovery workflow", type: "Workflow", rating: "4.9" },
  { name: "HVAC overnight receptionist prompts", type: "Prompts", rating: "4.8" },
  { name: "Owner morning dashboard", type: "Dashboard", rating: "4.7" },
  { name: "Plumbing industry starter pack", type: "Template", rating: "4.9" },
  { name: "Review request automation", type: "Automation pack", rating: "4.8" },
  { name: "Apprentice safety course", type: "Training", rating: "4.6" },
];

export const intelligenceScore = {
  score: 86,
  change: "+3 this week",
  pillars: [
    { name: "Customer satisfaction", value: 94 },
    { name: "Response times", value: 91 },
    { name: "Revenue trends", value: 82 },
    { name: "Employee productivity", value: 88 },
    { name: "Marketing effectiveness", value: 79 },
    { name: "Cash flow", value: 85 },
    { name: "Inventory health", value: 74 },
    { name: "Compliance", value: 90 },
    { name: "Security", value: 93 },
    { name: "Growth", value: 80 },
  ],
  why: "Score rose because overnight response time dropped to 41s and Google Ads conversion improved.",
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
