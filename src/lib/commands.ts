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
