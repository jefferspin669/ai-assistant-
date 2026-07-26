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
  name: "Mike",
  business: "Smith Plumbing & HVAC",
};

export const morningBriefing = [
  "You have 8 appointments today.",
  "Two customers haven’t paid their invoices.",
  "Three missed calls came in overnight.",
  "I booked one appointment while you were asleep.",
  "Your busiest time today is 2–4 PM.",
  "Sarah left a 5-star review.",
  "I recommend ordering more HVAC filters this week.",
];

export const aiEmployees = [
  {
    id: "receptionist",
    name: "Receptionist",
    emoji: "🧑‍💼",
    role: "Front desk",
    status: "Online",
    canAuto: ["Answer common questions", "Book routine appointments", "Send confirmations"],
    needsConfirm: ["Transfer urgent calls after hours", "Override capacity"],
    duties: ["Answers calls", "Books appointments", "Greets customers"],
  },
  {
    id: "sales",
    name: "Sales Manager",
    emoji: "💰",
    role: "Revenue",
    status: "Online",
    canAuto: ["Draft quotes", "Follow up on warm leads", "Track conversions"],
    needsConfirm: ["Send final pricing", "Discount above 10%"],
    duties: ["Creates quotes", "Follows up on leads", "Tracks conversions"],
  },
  {
    id: "scheduler",
    name: "Scheduler",
    emoji: "📅",
    role: "Calendar",
    status: "Online",
    canAuto: ["Reminders", "Offer reschedule links", "Optimize same-day routes"],
    needsConfirm: ["Move a full day’s jobs", "Cancel multiple appointments"],
    duties: ["Optimizes routes and appointments", "Handles cancellations"],
  },
  {
    id: "marketing",
    name: "Marketing Manager",
    emoji: "📣",
    role: "Growth",
    status: "Online",
    canAuto: ["Request reviews after jobs", "Send appointment reminders"],
    needsConfirm: ["Mass promotions", "Holiday campaigns", "Coupons"],
    duties: ["Sends promotions", "Requests reviews", "Creates campaigns"],
  },
  {
    id: "analyst",
    name: "Business Analyst",
    emoji: "📊",
    role: "Insights",
    status: "Online",
    canAuto: ["Surface trends", "Flag slow periods", "Suggest improvements"],
    needsConfirm: ["Change prices", "Issue refunds"],
    duties: ["Watches trends", "Finds slow periods", "Suggests improvements"],
  },
] as const;

export type AgentId = (typeof aiEmployees)[number]["id"];

export const commandSuggestions = [
  "Book John for Friday at 3.",
  "Call everyone who missed their appointment.",
  "Send a quote to Sarah.",
  "How much revenue did we make this month?",
  "Who hasn’t paid?",
  "Move tomorrow’s jobs because it’s going to rain.",
  "How’s the business doing?",
  "Can you fill my Tuesday schedule?",
];

export const todayStats = [
  { label: "Calls answered", value: "28", detail: "+6 vs yesterday" },
  { label: "Missed calls", value: "4", detail: "All recovered" },
  { label: "New leads", value: "11", detail: "3 hot" },
  { label: "Appointments booked", value: "9", detail: "2 same-day" },
  { label: "Revenue estimate", value: "$4,820", detail: "From AI-booked jobs" },
  { label: "AI conversations", value: "63", detail: "Phone + web" },
  { label: "Reviews received", value: "3", detail: "5.0 average" },
];

export const activityFeed = [
  { time: "2:14 PM", text: "Scheduler booked water heater install for Jamie Cole — Thu 10:00 AM" },
  { time: "1:52 PM", text: "Receptionist recovered missed call: Marcus left photos + preferred window" },
  { time: "1:21 PM", text: "Sales Manager captured lead asking about emergency service pricing" },
  { time: "12:40 PM", text: "Marketing Manager sent review request after job #1842" },
  { time: "11:08 AM", text: "Sales Manager: quote signed — Replace garbage disposal — $420" },
  { time: "9:33 AM", text: "Receptionist transferred urgent call to you" },
];

export const insights = [
  {
    title: "Missed-call window",
    body: "You’re missing most calls between 12–2 PM. Turn on callback texts and auto-booking for lunch hours.",
  },
  {
    title: "Demand signal",
    body: "People keep asking about emergency service. Add after-hours pricing to the FAQ and quote templates.",
  },
  {
    title: "Revenue pattern",
    body: "Saturdays generate 40% more revenue. Open one extra Saturday slot and promote it this week.",
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
    problem: "No hot water — possible water heater failure",
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
  { id: "Q-2038", title: "Main line camera inspection", customer: "Chris Park", amount: "$275", status: "Sent" },
  { id: "Q-2033", title: "Bathroom remodel rough-in", customer: "Elena Brooks", amount: "$4,200", status: "Draft" },
];

export const reviews = [
  { source: "Google", rating: 5, text: "They texted me instantly after I missed them. Booked same day.", author: "Marcus N." },
  { source: "Google", rating: 5, text: "Clear quote, easy to sign on my phone.", author: "Jamie C." },
  { source: "Facebook", rating: 4, text: "Great communication throughout the job.", author: "Elena B." },
];

export const campaigns = [
  { name: "Spring drain special", type: "Promotion", status: "Scheduled", reach: "842 customers" },
  { name: "Holiday open hours", type: "Holiday special", status: "Draft", reach: "1,204 customers" },
  { name: "Birthday discount", type: "Coupon", status: "Active", reach: "68 this month" },
];

export const team = [
  { name: "Alex Rivera", role: "Lead tech", jobs: 12, rating: "4.9", perms: "Jobs, calendar" },
  { name: "Sam Ortiz", role: "Tech", jobs: 9, rating: "4.8", perms: "Jobs" },
  { name: "You", role: "Owner", jobs: "—", rating: "—", perms: "Full access" },
];

export const payments = [
  { customer: "Jamie Cole", amount: "$1,850", method: "Card", status: "Paid", when: "Today" },
  { customer: "Elena Brooks", amount: "$420", method: "ACH", status: "Paid", when: "Yesterday" },
  { customer: "Chris Park", amount: "$275", method: "Deposit", status: "Due", when: "Tomorrow" },
  { customer: "Nina Alvarez", amount: "$890", method: "Invoice", status: "Overdue", when: "3 days" },
  { customer: "Tom Rivera", amount: "$960", method: "Invoice", status: "Overdue", when: "5 days" },
];

export const roadmap = [
  "Missed-call texting",
  "Customer dashboard",
  "Appointment booking",
  "AI receptionist",
  "Website chatbot",
  "CRM",
  "Quotes and invoices",
  "Payments",
  "Analytics",
  "Industry-specific AI",
];

export const navItems: { href: string; label: string; exact?: boolean }[] = [
  { href: "/app", label: "Command Center", exact: true },
  { href: "/app/employees", label: "AI Employees" },
  { href: "/app/receptionist", label: "Receptionist" },
  { href: "/app/missed-calls", label: "Missed Calls" },
  { href: "/app/chatbot", label: "Website Chat" },
  { href: "/app/appointments", label: "Scheduler" },
  { href: "/app/customers", label: "Customer CRM" },
  { href: "/app/quotes", label: "Sales / Quotes" },
  { href: "/app/reviews", label: "Reviews" },
  { href: "/app/marketing", label: "Marketing" },
  { href: "/app/analytics", label: "Analytics" },
  { href: "/app/insights", label: "Analyst" },
  { href: "/app/team", label: "Human Team" },
  { href: "/app/payments", label: "Payments" },
];
