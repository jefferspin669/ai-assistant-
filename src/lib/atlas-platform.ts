export type NavItem = { href: string; label: string; exact?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "Command",
    items: [
      { href: "/app", label: "Atlas", exact: true },
      { href: "/app/mission-control", label: "Mission Control" },
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
      { href: "/app/network", label: "Intelligence Network" },
      { href: "/app/score", label: "Intelligence Score" },
      { href: "/app/board", label: "Board Advisor" },
      { href: "/app/decisions", label: "Decision Engine" },
      { href: "/app/executive-timeline", label: "Executive Timeline" },
      { href: "/app/ceo-memory", label: "CEO Memory" },
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
      { href: "/app/digital-employees", label: "Digital Employees" },
      { href: "/app/dna", label: "Business DNA" },
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
  },
] as const;

export function ceoMemoryForQuestion(question: string) {
  const q = question.toLowerCase();
  if (q.includes("supplier") || q.includes("parts") || q.includes("apex") || q.includes("meridian")) {
    return ceoMemories[0];
  }
  if (q.includes("van") || q.includes("vehicle") || q.includes("fleet") || q.includes("transit")) {
    return ceoMemories[1];
  }
  if (q.includes("fee") || q.includes("price") || q.includes("diagnostic") || q.includes("raise")) {
    return ceoMemories[2];
  }
  if (q.includes("location") || q.includes("second") || q.includes("delay") || q.includes("wait")) {
    return ceoMemories[3];
  }
  return {
    id: "m-custom",
    date: "Today",
    question,
    decision: "No exact match — Atlas searched decision history.",
    answer:
      "I don’t have a single matching decision yet. Ask about suppliers, the second van, diagnostic fees, or the delayed second location — or open Decision Engine to log a new one.",
    triggers: ["search across CEO Memory", "link to Decision Engine", "executive timeline context"],
    alternativesReviewed: [] as string[],
    approvedBy: "—",
    linkedDecisionId: null as string | null,
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
