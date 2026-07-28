import { FeatureView } from "@/components/FeatureView";
import { accountantTasks } from "@/lib/atlas-platform";
import { payments } from "@/lib/data";

export default function AccountantPage() {
  return (
    <FeatureView
      title="AI Accountant Helper"
      subtitle="Not replacing accountants — helping them with expenses, receipts, profit estimates, tax reminders, and cash flow. Deep income and deduction work lives in Tax Center."
      sections={[
        {
          type: "panel",
          title: "Helping this week",
          list: accountantTasks.map((task) => ({
            badge: "Assist",
            badgeTone: "ok" as const,
            text: task.task,
            sub: task.detail,
          })),
        },
        {
          type: "panel",
          title: "Tax Center",
          body: "Automatic income tracking, receipt extraction, and Needs Review for uncertain deductions — open /app/tax.",
          list: [
            {
              badge: "Income",
              badgeTone: "ok" as const,
              text: "Banks, payroll, Stripe, Square, PayPal, Venmo, Cash App, accounting, Atlas invoices, 1099 & W-2",
              sub: "Organized by business, job, client, and type",
            },
            {
              badge: "Review",
              badgeTone: "warn" as const,
              text: "Uncertain expenses stay Needs Review — never claimed automatically",
              sub: "Mileage, fuel, equipment, software, ads, and more",
            },
          ],
        },
        {
          type: "table",
          title: "Recent money movement",
          headers: ["Customer", "Amount", "Method", "Status", "When"],
          rows: payments.map((p) => [p.customer, p.amount, p.method, p.status, p.when]),
        },
      ]}
    />
  );
}
