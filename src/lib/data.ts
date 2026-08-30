export const industries = [
  "Plumbing",
  "HVAC",
  "Electrician",
  "Barber",
  "Dentist",
  "Veterinarian",
  "Roofing",
  "Landscaping",
  "Auto Repair",
  "Law Firm",
  "Real Estate",
  "Cleaning Service",
] as const;

export type Industry = (typeof industries)[number];

export const owner = {
  name: "Jeff",
  business: "Summit Home Services",
};

export const customEmployee = {
  name: "Sarah",
  role: "Office Manager",
  personality: "Friendly · Professional",
  languages: ["English", "Spanish"],
};

export const morningBriefing = [
  "You made $4,280 yesterday.",
  "I booked 9 appointments overnight.",
  "Two customers canceled.",
  "Three invoices are overdue.",
  "I responded to 47 customer messages.",
  "Your technician is running 15 minutes late.",
  "You have enough work scheduled for the next six days.",
  "I found two opportunities that could increase revenue this week.",
];

export const aiEmployees = [
  {
    id: "ceo",
    name: "CEO Assistant",
    emoji: "🧭",
    role: "Owner cockpit",
    status: "Online",
    duties: ["Shows owner everything", "Prioritizes the day", "Surfaces decisions"],
    canAuto: ["Morning briefing", "Priority ranking", "Overnight summary"],
    needsConfirm: ["Approve large estimates", "Change strategy"],
  },
  {
    id: "receptionist",
    name: "Receptionist",
    emoji: "🧑‍💼",
    role: "Front desk",
    status: "Online",
    duties: ["Answers phones", "Books appointments", "Transfers emergencies"],
    canAuto: ["Answer FAQs", "Book routine jobs", "Send confirmations"],
    needsConfirm: ["Override capacity", "Discount on the call"],
  },
  {
    id: "sales",
    name: "Sales Manager",
    emoji: "💰",
    role: "Revenue",
    status: "Online",
    duties: ["Creates estimates", "Negotiates pricing", "Tracks leads"],
    canAuto: ["Draft quotes", "Lead follow-up", "Conversion tracking"],
    needsConfirm: ["Send final pricing", "Negotiate below floor"],
  },
  {
    id: "success",
    name: "Customer Success",
    emoji: "🤝",
    role: "Retention",
    status: "Online",
    duties: ["Follows up", "Requests reviews", "Handles complaints"],
    canAuto: ["Review requests", "Thank-you texts", "Reminder follow-ups"],
    needsConfirm: ["Issue refunds", "Public complaint replies"],
  },
  {
    id: "marketing",
    name: "Marketing Director",
    emoji: "📣",
    role: "Growth",
    status: "Online",
    duties: ["Creates social posts", "Creates emails", "Runs promotions"],
    canAuto: ["Draft captions", "Schedule posts", "Birthday messages"],
    needsConfirm: ["Publish campaigns", "Spend ad budget"],
  },
  {
    id: "finance",
    name: "Finance Manager",
    emoji: "📒",
    role: "Money",
    status: "Online",
    duties: ["Invoices", "Payments", "Taxes", "Expenses", "Payroll"],
    canAuto: ["Payment reminders", "Categorize receipts", "Draft invoices"],
    needsConfirm: ["Send payroll", "File taxes", "Issue refunds"],
  },
  {
    id: "scheduler",
    name: "Scheduler",
    emoji: "📅",
    role: "Calendar",
    status: "Online",
    duties: ["Optimizes calendar", "Avoids conflicts", "Reduces drive time"],
    canAuto: ["Fill empty slots", "Weather-aware nudges", "Route suggestions"],
    needsConfirm: ["Move a full day", "Cancel multiple jobs"],
  },
  {
    id: "operations",
    name: "Operations Manager",
    emoji: "🛠️",
    role: "Ops",
    status: "Online",
    duties: ["Tracks inventory", "Tracks equipment", "Tracks employees"],
    canAuto: ["Reorder reminders", "Late-tech alerts", "Job status updates"],
    needsConfirm: ["Purchase orders over limit"],
  },
  {
    id: "hr",
    name: "HR Assistant",
    emoji: "📋",
    role: "People",
    status: "Online",
    duties: ["Hiring", "Training", "Handbook", "Performance reviews"],
    canAuto: ["Draft job posts", "Onboarding checklists"],
    needsConfirm: ["Send offers", "Finalize reviews"],
  },
] as const;

export const commandSuggestions = [
  "Atlas, create an invoice for Acme Corp for $1,250, email it, remind them in 7 days if it’s unpaid, and update my books.",
  "How do I create an invoice?",
  "How is business?",
  "What’s the most important thing I should focus on today?",
  "Who canceled?",
  "Fill his spot.",
  "How much money did we make today?",
  "Approve the Johnson Construction estimate.",
  "Show overdue invoices.",
];

export const phases = [
  {
    phase: "Phase 1",
    title: "Foundation",
    items: ["Missed calls", "AI receptionist", "Scheduling", "CRM"],
  },
  {
    phase: "Phase 2",
    title: "Money loop",
    items: ["Quotes", "Invoices", "Payments", "Customer follow-up"],
  },
  {
    phase: "Phase 3",
    title: "Assistant layer",
    items: ["Voice assistant", "Analytics", "AI recommendations"],
  },
  {
    phase: "Phase 4",
    title: "Growth ops",
    items: ["Marketing", "Inventory", "Employee management"],
  },
  {
    phase: "Phase 5",
    title: "Platform",
    items: ["Industry-specific AI", "Third-party integrations", "Marketplace"],
  },
];

export const dashboardMetrics = [
  { label: "Today’s revenue", value: "$3,482", detail: "+9% vs avg" },
  { label: "Weekly revenue", value: "$18,940", detail: "On pace" },
  { label: "Monthly revenue", value: "$64,210", detail: "+12%" },
  { label: "Yearly revenue", value: "$612k", detail: "YTD" },
  { label: "Jobs completed", value: "126", detail: "This month" },
  { label: "Pending jobs", value: "38", detail: "Next 6 days full" },
  { label: "Missed calls", value: "3", detail: "All recovered" },
  { label: "Response time", value: "41s", detail: "AI + human" },
  { label: "Conversion rate", value: "46%", detail: "+4 pts" },
  { label: "Customer satisfaction", value: "4.9", detail: "147 reviews" },
  { label: "AI usage", value: "94", detail: "Tasks overnight" },
  { label: "Employee productivity", value: "92%", detail: "On-time arrivals" },
];

export const timelineEvents = [
  { when: "Today · 7:42 AM", channel: "Phone", text: "Atlas answered overnight AC call, booked 10–12 window, collected photos." },
  { when: "Yesterday · 4:18 PM", channel: "Text", text: "Payment reminder sent for overdue invoice #$1840." },
  { when: "Yesterday · 1:05 PM", channel: "Quote", text: "Estimate drafted for Johnson Construction — $18,400 pending approval." },
  { when: "Apr 12", channel: "Job", text: "AC install completed. Warranty + photos stored. Prefers mornings. Requests John." },
  { when: "9 months ago", channel: "Note", text: "First call — mentioned three dogs and gated driveway access." },
];

export const memoryFacts = [
  "Prefers morning appointments",
  "Has three dogs",
  "Always requests John",
  "Called first 9 months ago about a leaking outdoor faucet",
  "Pays by card same day when reminded once",
];

export const activityFeed = [
  { time: "2:14 AM", text: "Receptionist booked new plumbing customer overnight — estimate created, tech scheduled." },
  { time: "6:40 AM", text: "Scheduler flagged Alex running 15 minutes late · customer already notified." },
  { time: "7:05 AM", text: "Finance Manager: 3 overdue invoices totaling $2,310." },
  { time: "7:12 AM", text: "CEO Assistant found 2 revenue opportunities for this week." },
  { time: "7:20 AM", text: "Customer Success thanked Sarah for a 5-star review." },
];

export const insights = [
  {
    title: "Revenue story",
    body: "Revenue increased 17% this month. Tuesdays are your weakest day — Scheduler can fill them from the waitlist.",
  },
  {
    title: "Demand shift",
    body: "Emergency calls doubled. Sales Manager recommends publishing after-hours pricing on the website chatbot.",
  },
  {
    title: "Risk flag",
    body: "You’re losing customers when response time slips past 2 minutes. Atlas is covering overnight so humans stay focused on jobs.",
  },
];

export const missedCallLeads = [
  {
    name: "Marcus Nguyen",
    phone: "(555) 204-1182",
    problem: "Kitchen sink leaking under cabinet",
    preferred: "Tomorrow morning",
    address: "418 Oak Ave",
    photos: 2,
    status: "New",
  },
  {
    name: "Priya Shah",
    phone: "(555) 771-9034",
    problem: "AC blowing warm air",
    preferred: "Today after 4 PM",
    address: "90 Cedar Ct",
    photos: 3,
    status: "Booked",
  },
  {
    name: "Tom Rivera",
    phone: "(555) 440-2281",
    problem: "Toilet running constantly",
    preferred: "Any weekday",
    address: "12 Willow St",
    photos: 1,
    status: "Follow-up",
  },
];

export const appointments = [
  { time: "9:00 AM", customer: "Elena Brooks", job: "Drain clearing", staff: "Alex", status: "Confirmed" },
  { time: "10:30 AM", customer: "Jamie Cole", job: "Water heater install", staff: "Sam", status: "Confirmed" },
  { time: "1:00 PM", customer: "Chris Park", job: "Estimate visit", staff: "Alex", status: "Reminder sent" },
  { time: "3:30 PM", customer: "Nina Alvarez", job: "Faucet replacement", staff: "Sam", status: "Reschedule requested" },
];

export const customers = [
  {
    name: "Jamie Cole",
    phone: "(555) 882-1100",
    email: "jamie@email.com",
    jobs: 4,
    value: "$2,140",
    last: "Quote signed today",
  },
  {
    name: "Marcus Nguyen",
    phone: "(555) 204-1182",
    email: "marcus@email.com",
    jobs: 1,
    value: "$0",
    last: "Missed-call lead",
  },
  {
    name: "Elena Brooks",
    phone: "(555) 301-7788",
    email: "elena@email.com",
    jobs: 7,
    value: "$5,680",
    last: "Appointment today",
  },
];

export const quotes = [
  { id: "Q-2041", title: "Replace water heater", customer: "Jamie Cole", amount: "$1,850", status: "Signed" },
  { id: "Q-2099", title: "Johnson Construction remodel", customer: "Johnson Construction", amount: "$18,400", status: "Needs approval" },
  { id: "Q-2038", title: "Main line camera inspection", customer: "Chris Park", amount: "$275", status: "Sent" },
];

export const reviews = [
  { source: "Google", rating: 5, text: "They texted me instantly after I missed them. Booked same day.", author: "Marcus N." },
  { source: "Google", rating: 5, text: "Clear quote, easy to sign on my phone.", author: "Jamie C." },
  { source: "Facebook", rating: 4, text: "Great communication throughout the job.", author: "Elena B." },
];

export const campaigns = [
  { name: "Spring maintenance special", type: "Promotion", status: "Scheduled", reach: "842 customers" },
  { name: "Holiday open hours", type: "Holiday special", status: "Draft", reach: "1,204 customers" },
  { name: "Birthday discount", type: "Coupon", status: "Active", reach: "68 this month" },
];

export const team = [
  { name: "Alex Rivera", role: "Lead tech", jobs: 12, rating: "4.9", perms: "Jobs, calendar" },
  { name: "Sam Ortiz", role: "Tech", jobs: 9, rating: "4.8", perms: "Jobs" },
  { name: "John Hale", role: "Tech", jobs: 11, rating: "5.0", perms: "Jobs" },
  { name: "You", role: "Owner", jobs: "—", rating: "—", perms: "Full access" },
];

export const payments = [
  { customer: "Jamie Cole", amount: "$1,850", method: "Card", status: "Paid", when: "Today" },
  { customer: "Elena Brooks", amount: "$420", method: "ACH", status: "Paid", when: "Yesterday" },
  { customer: "Chris Park", amount: "$275", method: "Deposit", status: "Due", when: "Tomorrow" },
  { customer: "Nina Alvarez", amount: "$890", method: "Invoice", status: "Overdue", when: "3 days" },
  { customer: "Tom Rivera", amount: "$960", method: "Invoice", status: "Overdue", when: "5 days" },
];

export const audiences = [
  {
    id: "individual",
    label: "Individual",
    emoji: "👤",
    blurb: "A life manager for calendar, bills, trips, budgets, and documents.",
  },
  {
    id: "family",
    label: "Family",
    emoji: "👨‍👩‍👧",
    blurb: "Shared reminders, school schedules, groceries, and household planning.",
  },
  {
    id: "events",
    label: "Event organizer",
    emoji: "🎉",
    blurb: "Weddings, birthdays, reunions — guest lists, vendors, budgets, timelines.",
  },
  {
    id: "business",
    label: "Small business",
    emoji: "🏢",
    blurb: "AI receptionist, scheduling, CRM, quotes, invoices, and marketing.",
    beachhead: true,
  },
  {
    id: "nonprofit",
    label: "Nonprofit",
    emoji: "🏛️",
    blurb: "Donor follow-up, event logistics, volunteer scheduling, and outreach.",
  },
  {
    id: "school",
    label: "School",
    emoji: "🎓",
    blurb: "Study plans, parent communication, calendars, and administrative help.",
  },
] as const;

export const teamAi = [
  { name: "Sarah", role: "Receptionist", focus: "Answers calls · books jobs · transfers emergencies" },
  { name: "Mike", role: "Scheduler", focus: "Routes · cancellations · fills empty slots" },
  { name: "Emma", role: "Sales", focus: "Estimates · lead follow-up · conversions" },
  { name: "David", role: "Marketing", focus: "Posts · promos · review requests" },
  { name: "Alex", role: "Finance", focus: "Invoices · payments · overdue chase" },
];

export const marketplaceAssistants = [
  { name: "Legal Assistant", category: "Professional", installs: "12.4k" },
  { name: "Real Estate Assistant", category: "Professional", installs: "9.8k" },
  { name: "Restaurant Host", category: "Hospitality", installs: "15.1k" },
  { name: "Tutor", category: "Education", installs: "22.0k" },
  { name: "Fitness Coach", category: "Personal", installs: "18.6k" },
  { name: "Travel Planner", category: "Personal", installs: "11.2k" },
  { name: "Wedding Planner", category: "Events", installs: "27.3k" },
  { name: "HR Assistant", category: "Business", installs: "8.4k" },
  { name: "Bookkeeper", category: "Finance", installs: "14.7k" },
];

export const industryPacks = [
  { name: "Medical", emoji: "🏥" },
  { name: "Real Estate", emoji: "🏠" },
  { name: "Trucking", emoji: "🚚" },
  { name: "Barber Shops", emoji: "✂️" },
  { name: "Restaurants", emoji: "🍕" },
  { name: "Law Firms", emoji: "⚖️" },
  { name: "HVAC", emoji: "🔧" },
  { name: "Salons", emoji: "💄" },
  { name: "Veterinarians", emoji: "🐶" },
  { name: "Dentists", emoji: "🦷" },
];

export const personalCapabilities = [
  "Manage your calendar",
  "Pay bill reminders",
  "Plan trips",
  "Budget",
  "Grocery lists",
  "Study plans",
  "Fitness goals",
  "Store important documents",
  "Schedule appointments",
  "Answer questions about your own information",
];

export const personalPrompts = [
  "Remind me to renew my driver’s license.",
  "Find my car insurance.",
  "How much did I spend on food this month?",
];

export const eventTypes = [
  "Weddings",
  "Birthday parties",
  "Baby showers",
  "Graduation parties",
  "Family reunions",
  "Company events",
  "Holiday parties",
  "Charity events",
];

export const eventPlan = {
  prompt: "Plan a birthday party for 40 people with a $1,000 budget.",
  checklist: [
    "Confirm guest list (40)",
    "Send invitations + track RSVPs",
    "Reserve venue or backyard setup",
    "Order cake + catering within $450",
    "Decorations + playlist",
    "Day-of timeline + reminders",
  ],
  budget: [
    { item: "Food & cake", amount: "$450" },
    { item: "Decorations", amount: "$180" },
    { item: "Entertainment", amount: "$220" },
    { item: "Misc / buffer", amount: "$150" },
  ],
};

export const dashboardOverview = {
  yesterdayRevenue: 4280,
  weekChangePct: 8,
  revenue: 12840,
  profit: 7681,
  expenses: 5159,
  openTasks: 7,
};

export type ChartPeriod = "7D" | "30D" | "3M" | "1Y";

export type PerformancePoint = {
  label: string;
  revenue: number;
  profit: number;
  expenses: number;
};

export const performanceChart: Record<ChartPeriod, PerformancePoint[]> = {
  "7D": [
    { label: "Mon", revenue: 4200, profit: 2520, expenses: 1680 },
    { label: "Tue", revenue: 3800, profit: 2280, expenses: 1520 },
    { label: "Wed", revenue: 5100, profit: 3060, expenses: 2040 },
    { label: "Thu", revenue: 4600, profit: 2760, expenses: 1840 },
    { label: "Fri", revenue: 6200, profit: 3720, expenses: 2480 },
    { label: "Sat", revenue: 5400, profit: 3240, expenses: 2160 },
    { label: "Sun", revenue: 4280, profit: 2568, expenses: 1712 },
  ],
  "30D": [
    { label: "Wk 1", revenue: 18200, profit: 10920, expenses: 7280 },
    { label: "Wk 2", revenue: 21400, profit: 12840, expenses: 8560 },
    { label: "Wk 3", revenue: 19800, profit: 11880, expenses: 7920 },
    { label: "Wk 4", revenue: 23600, profit: 14160, expenses: 9440 },
  ],
  "3M": [
    { label: "Jun", revenue: 58200, profit: 34920, expenses: 23280 },
    { label: "Jul", revenue: 62400, profit: 37440, expenses: 24960 },
    { label: "Aug", revenue: 64210, profit: 38526, expenses: 25684 },
  ],
  "1Y": [
    { label: "Q1", revenue: 168000, profit: 100800, expenses: 67200 },
    { label: "Q2", revenue: 182400, profit: 109440, expenses: 72960 },
    { label: "Q3", revenue: 194200, profit: 116520, expenses: 77680 },
    { label: "Q4", revenue: 206800, profit: 124080, expenses: 82720 },
  ],
};

export const atlasBriefingItems = [
  { text: "2 customers canceled", tone: "warn" as const },
  { text: "3 invoices overdue", tone: "warn" as const },
  { text: "Technician running 15 minutes late", tone: "neutral" as const },
  { text: "2 revenue opportunities detected", tone: "ok" as const },
];

export const attentionItems = [
  {
    title: "Approve Johnson Construction estimate",
    detail: "$18,400 remodel · pending your OK",
    href: "/app/confirmations",
    priority: "high" as const,
  },
  {
    title: "Replace canceled appointment",
    detail: "2 open slots today · waitlist ready",
    href: "/app/appointments",
    priority: "high" as const,
  },
  {
    title: "Review overdue invoice",
    detail: "3 invoices · $2,310 total",
    href: "/app/payments",
    priority: "high" as const,
  },
  {
    title: "3 high-priority tasks",
    detail: "Due today on your task board",
    href: "/app/tasks",
    priority: "medium" as const,
  },
];

export function formatMoneyShort(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return k % 1 === 0 ? `$${k}K` : `$${k.toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatMoneyFull(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export { navItems, navGroups } from "@/lib/atlas-platform";
