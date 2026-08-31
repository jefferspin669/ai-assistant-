import type { PlannedStep } from "@/lib/orchestrator/types";
import type { Capability } from "@/lib/orchestrator/types";

export type PlannerResult = {
  intent: string;
  steps: PlannedStep[];
};

function step(
  id: string,
  kind: PlannedStep["kind"],
  label: string,
  extra: Partial<PlannedStep> = {},
): PlannedStep {
  return { id, kind, label, ...extra };
}

/** Dynamic plan for a new request. Not a hardcoded workflow catalog of every possible job. */
export function planGoal(goal: string, capabilities: Capability[]): PlannerResult {
  const q = goal.toLowerCase();
  const canSms = capabilities.some((c) => c.id === "send_sms" && c.status !== "UNAVAILABLE");
  const channel = canSms ? "send_sms" : "send_email";

  if (/overdue|unpaid|collect|invoice paid|past due/.test(q)) {
    return {
      intent: "recover_invoice",
      steps: [
        step("s1", "find_customer", "Find customer"),
        step("s2", "find_invoice", "Find invoice"),
        step("s3", "inspect", "Check payment history"),
        step("s4", "choose_channel", "Determine best contact method"),
        step("s5", "draft", "Draft message"),
        step("s6", "evaluate_rules", "Check business rules"),
        step("s7", "approval", "Request approval if required"),
        step("s8", "invoke", "Send", { capability: channel, compensate: "log_send" }),
        step("s9", "wait", "Wait 3 days", { waitHours: 72 }),
        step("s10", "check_payment", "Check payment"),
        step("s11", "escalate", "Escalate if unpaid"),
      ],
    };
  }

  if (/missed call|follow up|follow-up/.test(q)) {
    return {
      intent: "missed_call_recovery",
      steps: [
        step("s1", "find_customer", "Identify caller"),
        step("s4", "choose_channel", "Determine best contact method"),
        step("s5", "draft", "Draft follow-up"),
        step("s6", "evaluate_rules", "Check business rules"),
        step("s8", "invoke", "Send follow-up", { capability: channel }),
      ],
    };
  }

  if (/book|appointment|schedule/.test(q)) {
    return {
      intent: "schedule_appointment",
      steps: [
        step("s1", "find_customer", "Find customer"),
        step("s6", "evaluate_rules", "Check schedule rules"),
        step("s8", "invoke", "Create appointment", {
          capability: "calendar_create",
          compensate: "cancel_appointment",
        }),
        step("s8b", "invoke", "Send confirmation", { capability: channel }),
      ],
    };
  }

  return {
    intent: "generic_goal",
    steps: [
      step("s1", "find_customer", "Understand who this is about"),
      step("s6", "evaluate_rules", "Check business rules"),
      step("s7", "approval", "Ask the owner if this is outside Atlas authority"),
    ],
  };
}
