/** CRM — unified customer profile + timeline channels + relationship summary. */

import {
  loadCrmCustomers,
  loadTimelineItems,
  type CrmCustomer,
  type TimelineItem,
} from "@/lib/surface-workspace";

export const TIMELINE_CHANNELS = [
  "Call",
  "Message",
  "Email",
  "Purchase",
  "Appointment",
  "Support",
  "Review",
  "Quote",
  "Invoice",
  "Task",
  "Note",
  "Marketing",
] as const;

export type CustomerTimelineEvent = {
  id: string;
  channel: string;
  text: string;
  when: string;
};

export function timelineForCustomer(customerName: string): CustomerTimelineEvent[] {
  const items = loadTimelineItems().filter(
    (t) => t.customer.toLowerCase() === customerName.toLowerCase(),
  );
  return items.map((t) => ({
    id: t.id,
    channel: t.channel,
    text: t.text,
    when: t.when,
  }));
}

export function customerRelationshipSummary(customer: CrmCustomer): string {
  const name = customer.name || customer.businessName || "This customer";
  const timeline = timelineForCustomer(name);
  const years = customer.createdAt
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(customer.createdAt).getTime()) / (365 * 24 * 60 * 60 * 1000),
        ),
      )
    : 1;
  const spent = customer.value && !customer.value.includes("demo") ? customer.value : null;
  const complaints = timeline.filter((t) => /complaint|issue|unresolved/i.test(t.text)).length;
  const lastPurchase = timeline.find((t) =>
    ["Purchase", "Invoice", "Payment"].includes(t.channel),
  );
  const daysSincePurchase = lastPurchase ? "recent activity on timeline" : "no purchases on timeline";

  const parts = [`${name} has been with you ~${years} year(s).`];
  if (spent) parts.push(`Recorded value: ${spent}.`);
  else parts.push("No verified spend total — connect payments or enter manually.");
  if (complaints) parts.push(`${complaints} unresolved complaint signal(s) on timeline.`);
  parts.push(lastPurchase ? `Last money event: ${lastPurchase.when}.` : `No purchase recorded — ${daysSincePurchase}.`);
  return parts.join(" ");
}

export function seedTimelineIfEmpty(customerName: string) {
  const existing = loadTimelineItems();
  if (existing.some((t) => t.customer === customerName)) return;
  // Caller may add via createTimelineItem in UI
}
