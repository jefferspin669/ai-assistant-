export type AgentId =
  | "ceo"
  | "receptionist"
  | "sales"
  | "success"
  | "marketing"
  | "finance"
  | "scheduler"
  | "operations"
  | "hr";

export type CommandResult = {
  agent: AgentId;
  agentLabel: string;
  reply: string;
  needsConfirm: boolean;
  confirmPrompt?: string;
  doneLabel?: string;
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function runOwnerCommand(input: string): CommandResult {
  const q = input.toLowerCase().trim();

  if (includesAny(q, ["most important", "focus on today", "top priority"])) {
    return {
      agent: "ceo",
      agentLabel: "CEO Assistant",
      needsConfirm: false,
      reply:
        "Your business is running well. I handled 94 routine tasks overnight. Your top priority today is approving the estimate for Johnson Construction, worth $18,400.",
    };
  }

  if (includesAny(q, ["how is business", "how's business", "how’s business", "business doing"])) {
    return {
      agent: "ceo",
      agentLabel: "Atlas",
      needsConfirm: false,
      reply:
        "Strong day forming. Yesterday: $4,280. Overnight: 9 bookings, 47 messages handled, 2 cancellations. Three invoices are overdue ($2,310). Next six days are fully scheduled. Want the two revenue opportunities?",
    };
  }

  if (includesAny(q, ["who canceled", "who cancelled", "canceled", "cancelled"])) {
    return {
      agent: "scheduler",
      agentLabel: "Scheduler",
      needsConfirm: false,
      reply: "John Smith canceled his 2:30 PM filter replacement. That opens a drive-efficient slot near Alex’s afternoon route.",
    };
  }

  if (includesAny(q, ["fill his spot", "fill the spot", "fill john"])) {
    return {
      agent: "scheduler",
      agentLabel: "Scheduler",
      needsConfirm: true,
      reply:
        "I found 6 waitlist customers near John’s neighborhood. I can text the top 3 and likely fill the slot within an hour.",
      confirmPrompt: "Contact waitlist customers to fill John’s spot?",
      doneLabel: "Contacting waitlist customers now. I’ll lock the first confirmation.",
    };
  }

  if (includesAny(q, ["how much money", "made today", "revenue today", "make today"])) {
    return {
      agent: "finance",
      agentLabel: "Finance Manager",
      needsConfirm: false,
      reply: "$3,482 so far today — three completed jobs and one signed estimate deposit.",
    };
  }

  if (includesAny(q, ["find the ac", "ac install from april", "find the"])) {
    return {
      agent: "ceo",
      agentLabel: "Atlas",
      needsConfirm: false,
      reply:
        "Found it: April 12 AC install for Elena Brooks. Contract, warranty, photos, and voice note are in her timeline. She prefers mornings and always requests John.",
    };
  }

  if (includesAny(q, ["johnson", "approve the", "18,400", "estimate"])) {
    return {
      agent: "sales",
      agentLabel: "Sales Manager",
      needsConfirm: true,
      reply:
        "Johnson Construction estimate is ready: remodel package $18,400, 40% deposit, start window next Tuesday.",
      confirmPrompt: "Approve and send the $18,400 Johnson Construction estimate?",
      doneLabel: "Estimate approved and sent. Deposit invoice queued for when they sign.",
    };
  }

  if (includesAny(q, ["overdue", "who hasn’t paid", "hasnt paid", "hasn't paid", "invoices"])) {
    return {
      agent: "finance",
      agentLabel: "Finance Manager",
      needsConfirm: false,
      reply:
        "Three overdue invoices: Nina Alvarez $890, Tom Rivera $960, and Harbor Dental $460. Total $2,310. I can send reminders automatically.",
    };
  }

  if (includesAny(q, ["academy", "train employees", "certification", "role-play", "roleplay"])) {
    return {
      agent: "hr",
      agentLabel: "Atlas Academy",
      needsConfirm: false,
      reply:
        "Atlas Academy is live for your team — interactive lessons, role-play, certifications, knowledge tests, and voice practice. Managers can see Alex at 81%, Sam at 94%, and Jordan at 36%.",
    };
  }

  if (includesAny(q, ["start a company", "business builder", "choose a name", "register domain"])) {
    return {
      agent: "ceo",
      agentLabel: "Business Builder",
      needsConfirm: false,
      reply:
        "I can help create the company end-to-end: name, branding, website, pricing, domains, contracts, workflows, launch marketing, and first-customer outreach. Open Business Builder to continue.",
    };
  }

  if (includesAny(q, ["increase prices in 2025", "why did we increase", "prices in 2025"])) {
    return {
      agent: "ceo",
      agentLabel: "Executive Memory",
      needsConfirm: false,
      reply:
        "On September 18, 2025 you approved a 6% service-rate increase after parts inflation hit 11% and overtime climbed. Supporting data and the Sep 16 leadership meeting notes are in Executive Memory.",
    };
  }

  if (includesAny(q, ["risk center", "burnout", "cash-flow concern", "compliance deadline"])) {
    return {
      agent: "ceo",
      agentLabel: "Risk Center",
      needsConfirm: false,
      reply:
        "Risk Center is flagging declining CSAT (4.9→4.6), Alex burnout from overtime, a license renewal in 9 days, and a tight cash window before Friday payroll. Open Risk Center to act.",
    };
  }

  if (includesAny(q, ["autonomous", "work continuously", "without me", "on its own"])) {
    return {
      agent: "ceo",
      agentLabel: "Autonomous Mode",
      needsConfirm: false,
      reply:
        "Autonomous Mode is on. Overnight I recovered a missed call, booked the job, updated CRM, alerted Sam, queued reminders, and staged a review request. You only need to confirm Sam’s auto-assignment.",
    };
  }

  if (includesAny(q, ["minimum wage", "what happens if", "simulate", "simulator"])) {
    return {
      agent: "ceo",
      agentLabel: "Business Simulator",
      needsConfirm: false,
      reply:
        "If minimum wage rises: payroll +$6,400/mo, recommend +4% rates, profit -1.2 pts, defer one hire, demand -2% short-term, cash -$11k in Q1. Open Simulator for the full model.",
    };
  }

  if (includesAny(q, ["operating system", "one workspace", "one login"])) {
    return {
      agent: "ceo",
      agentLabel: "AI Operating System",
      needsConfirm: false,
      reply:
        "Everything is already in one Atlas workspace — email, phone, calendar, CRM, inventory, invoices, payroll, marketing, projects, documents, and analytics — one login, one memory, one AI.",
    };
  }

  if (includesAny(q, ["network", "industry trend", "trends for my industry", "benchmark"])) {
    return {
      agent: "ceo",
      agentLabel: "Intelligence Network",
      needsConfirm: false,
      reply:
        "Across the Atlas network (private data never shared): HVAC companies that respond within five minutes close 37% more leads. In your region, same-day photo capture on missed calls lifts bookings 22%. Want me to tighten your response SLA?",
    };
  }

  if (includesAny(q, ["business dna", "brand voice", "our tone", "sound like us"])) {
    return {
      agent: "ceo",
      agentLabel: "Business DNA",
      needsConfirm: false,
      reply:
        "Your DNA is locked in: neighborly expert voice, 10% max loyalty discount (never on emergencies), escalate safety or anything over $2,500, and transparent chat ranges with firm quotes after photos.",
    };
  }

  if (includesAny(q, ["opportunities", "increase revenue"])) {
    return {
      agent: "ceo",
      agentLabel: "CEO Assistant",
      needsConfirm: false,
      reply:
        "Opportunity 1: fill Tuesday gaps from the waitlist (~$1,800). Opportunity 2: maintenance plan push to past AC installs (~$2,400/mo recurring).",
    };
  }

  return {
    agent: "ceo",
    agentLabel: "Atlas",
    needsConfirm: false,
    reply:
      "I can brief the business, fill canceled spots, find documents, approve estimates, chase invoices, or tell you the top priority. Try: “What’s the most important thing I should focus on today?”",
  };
}
