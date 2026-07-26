export type AgentId = "receptionist" | "sales" | "scheduler" | "marketing" | "analyst";

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

  if (includesAny(q, ["how’s the business", "hows the business", "how is the business", "business doing"])) {
    return {
      agent: "analyst",
      agentLabel: "Business Analyst",
      needsConfirm: false,
      reply:
        "Revenue is up 12% from last month. You have five new leads, two overdue invoices totaling $1,850, and your conversion rate improved to 46%.",
    };
  }

  if (includesAny(q, ["fill my tuesday", "fill tuesday", "fill my schedule", "open time slots"])) {
    return {
      agent: "scheduler",
      agentLabel: "Scheduler",
      needsConfirm: true,
      reply:
        "I found six customers waiting for appointments. If I contact them, I estimate I can fill four of your six open Tuesday slots.",
      confirmPrompt: "Contact waitlist customers to fill Tuesday?",
      doneLabel: "Scheduler is texting the waitlist now. I’ll update you as slots fill.",
    };
  }

  if (includesAny(q, ["book john"]) || (q.includes("book") && q.includes("friday") && q.includes("3"))) {
    return {
      agent: "receptionist",
      agentLabel: "Receptionist",
      needsConfirm: false,
      reply:
        "Booked John for Friday at 3:00 PM with Sam. Confirmation text sent, and it’s on Google Calendar.",
    };
  }

  if (includesAny(q, ["missed their appointment", "missed appointment", "no-show", "no show"])) {
    return {
      agent: "receptionist",
      agentLabel: "Receptionist",
      needsConfirm: true,
      reply: "I found 3 no-shows from this week. I can call each one, apologize, and offer the next open slot.",
      confirmPrompt: "Call all no-show customers now?",
      doneLabel: "Calling the 3 no-show customers and offering reschedule options.",
    };
  }

  if (includesAny(q, ["send a quote", "quote to sarah", "quote"])) {
    return {
      agent: "sales",
      agentLabel: "Sales Manager",
      needsConfirm: true,
      reply:
        "I drafted a quote for Sarah based on her last inquiry (filter replacement + tune-up) for $289. Ready to send by text and email.",
      confirmPrompt: "Send Sarah’s $289 quote now?",
      doneLabel: "Quote sent to Sarah. I’ll follow up in 24 hours if she doesn’t open it.",
    };
  }

  if (includesAny(q, ["revenue", "how much did we make", "this month"])) {
    return {
      agent: "analyst",
      agentLabel: "Business Analyst",
      needsConfirm: false,
      reply:
        "This month you’ve made $28,420 so far — up 12% versus last month. AI-booked jobs account for $9,160 of that.",
    };
  }

  if (includesAny(q, ["who hasn’t paid", "hasnt paid", "hasn't paid", "overdue", "unpaid"])) {
    return {
      agent: "sales",
      agentLabel: "Sales Manager",
      needsConfirm: false,
      reply:
        "Two overdue invoices: Nina Alvarez $890 (3 days) and Tom Rivera $960 (5 days). Total $1,850. Want me to send payment reminders?",
    };
  }

  if (includesAny(q, ["rain", "move tomorrow", "reschedule tomorrow", "weather"])) {
    return {
      agent: "scheduler",
      agentLabel: "Scheduler",
      needsConfirm: true,
      reply:
        "Tomorrow has 5 outdoor-adjacent jobs. I can move them to Thursday/Friday and text customers with two new time options each.",
      confirmPrompt: "Reschedule tomorrow’s jobs because of rain?",
      doneLabel: "Customers are being offered Thursday/Friday windows. I’ll lock in replies as they come in.",
    };
  }

  if (includesAny(q, ["promotion", "campaign", "coupon", "marketing"])) {
    return {
      agent: "marketing",
      agentLabel: "Marketing Manager",
      needsConfirm: true,
      reply: "I can draft a weekend HVAC filter promo to 842 past customers. Estimated reach cost is low; conversion lift usually ~6%.",
      confirmPrompt: "Send the weekend filter promo?",
      doneLabel: "Campaign queued for Friday 10 AM. I’ll report opens and bookings Saturday morning.",
    };
  }

  if (includesAny(q, ["review", "5-star", "sarah left"])) {
    return {
      agent: "marketing",
      agentLabel: "Marketing Manager",
      needsConfirm: false,
      reply: "Sarah’s 5-star Google review is live. I already replied with a thank-you note in your voice.",
    };
  }

  return {
    agent: "analyst",
    agentLabel: "Assistant",
    needsConfirm: false,
    reply:
      "I can book jobs, chase no-shows, send quotes, check revenue, find unpaid invoices, or reshape the schedule. Try: “How’s the business doing?”",
  };
}
