import { FeatureView } from "@/components/FeatureView";
import { accountantTasks } from "@/lib/atlas-platform";
import { payments } from "@/lib/data";

export default function AccountantPage() {
  return (
    <FeatureView
      title="AI Accountant Helper"
      subtitle="Not replacing accountants — helping them with expenses, receipts, profit estimates, tax reminders, and cash flow."
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
          type: "table",
          title: "Recent money movement",
          headers: ["Customer", "Amount", "Method", "Status", "When"],
          rows: payments.map((p) => [p.customer, p.amount, p.method, p.status, p.when]),
        },
      ]}
    />
  );
}
