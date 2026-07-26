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
  { time: "2:14 PM", text: "AI booked water heater install for Jamie Cole — Thu 10:00 AM" },
  { time: "1:52 PM", text: "Missed call recovered: Marcus left photos + preferred window" },
  { time: "1:21 PM", text: "Chatbot captured lead asking about emergency service pricing" },
  { time: "12:40 PM", text: "Review request sent after job #1842" },
  { time: "11:08 AM", text: "Quote signed: Replace garbage disposal — $420" },
  { time: "9:33 AM", text: "Urgent call transferred to you from receptionist" },
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
  { href: "/app", label: "Today", exact: true },
  { href: "/app/receptionist", label: "AI Receptionist" },
  { href: "/app/missed-calls", label: "Missed Calls" },
  { href: "/app/chatbot", label: "AI Chatbot" },
  { href: "/app/appointments", label: "Appointments" },
  { href: "/app/customers", label: "Customer CRM" },
  { href: "/app/quotes", label: "AI Quotes" },
  { href: "/app/reviews", label: "Review Manager" },
  { href: "/app/marketing", label: "Marketing" },
  { href: "/app/analytics", label: "Analytics" },
  { href: "/app/insights", label: "AI Insights" },
  { href: "/app/team", label: "Team" },
  { href: "/app/payments", label: "Payments" },
];
