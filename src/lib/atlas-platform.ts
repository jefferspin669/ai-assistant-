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
] as const;

export const securityStats = [
  { label: "Threats blocked", value: "3", detail: "Last 7 days" },
  { label: "Pending approvals", value: "3", detail: "Export · spend · role" },
  { label: "Healthy connectors", value: "12", detail: "Keys rotated" },
  { label: "Risk level", value: "Low", detail: "Monitoring on" },
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
  meetingNotes,
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
  { kind: "Trigger", label: "New review" },
  { kind: "Action", label: "Send text" },
  { kind: "Action", label: "Create customer" },
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
    name: "Missed-call recovery",
    steps: workflowSteps,
    blurb: "Text the caller, create the customer, book a callback, notify Jeff.",
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
  {
    id: "lead-ping",
    name: "New lead → CRM → owner ping",
    steps: [
      { id: "t3", kind: "Trigger", label: "Missed call" },
      { id: "a7", kind: "Action", label: "Create customer" },
      { id: "a8", kind: "Action", label: "Notify owner" },
    ],
    blurb: "Capture the lead instantly and alert the owner.",
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
  "Workflows",
  "AI prompts",
  "Dashboards",
  "Industry templates",
  "Automation packs",
  "Reports",
  "Training courses",
] as const;

export const marketplaceShares = [
  {
    id: "missed-call",
    name: "Missed-call recovery workflow",
    type: "Workflows",
    rating: "4.9",
    price: "Free",
    seller: "Atlas Labs",
    blurb: "Text, create customer, schedule callback, notify owner.",
  },
  {
    id: "hvac-prompts",
    name: "HVAC overnight receptionist prompts",
    type: "AI prompts",
    rating: "4.8",
    price: "$19",
    seller: "Summit Packs",
    blurb: "Empathy + booking scripts tuned for AC emergencies.",
  },
  {
    id: "morning-dash",
    name: "Owner morning dashboard",
    type: "Dashboards",
    rating: "4.7",
    price: "$29",
    seller: "Atlas Labs",
    blurb: "Overnight money, jobs, risks, and AI actions at a glance.",
  },
  {
    id: "plumbing-pack",
    name: "Plumbing industry starter pack",
    type: "Industry templates",
    rating: "4.9",
    price: "$49",
    seller: "Trade Kits",
    blurb: "Services, price sheet, intake forms, and policies.",
  },
  {
    id: "review-auto",
    name: "Review request automation",
    type: "Automation packs",
    rating: "4.8",
    price: "Free",
    seller: "Atlas Labs",
    blurb: "Ask for reviews after paid jobs and draft replies.",
  },
  {
    id: "weekly-ops",
    name: "Weekly ops health report",
    type: "Reports",
    rating: "4.6",
    price: "$15",
    seller: "Insight Co",
    blurb: "Revenue, on-time %, quality alerts, compliance due.",
  },
  {
    id: "apprentice",
    name: "Apprentice safety course",
    type: "Training courses",
    rating: "4.6",
    price: "$39",
    seller: "Safety First AI",
    blurb: "Ladder, PPE, and lockout lessons with quizzes.",
  },
] as const;

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
      href: "/app/scheduling",
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
