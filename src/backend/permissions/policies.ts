/** First-class action risk rules. Owner can raise autonomy later by editing these. */

export type PolicyMode = "automatic" | "approval";

export type ActionPolicy = {
  action: string;
  /** Dollar cap for money actions; percent cap for discounts. Null = no numeric limit. */
  limit: number | null;
  limitUnit: "usd" | "percent" | "none";
  mode: PolicyMode;
};

export const DEFAULT_ACTION_POLICIES: ActionPolicy[] = [
  { action: "send_email", limit: null, limitUnit: "none", mode: "automatic" },
  { action: "send_message", limit: null, limitUnit: "none", mode: "automatic" },
  { action: "book_appointment", limit: null, limitUnit: "none", mode: "automatic" },
  { action: "discount", limit: 10, limitUnit: "percent", mode: "automatic" },
  { action: "refund", limit: 100, limitUnit: "usd", mode: "automatic" },
  { action: "vendor_payment", limit: 1000, limitUnit: "usd", mode: "approval" },
  { action: "employee_termination", limit: null, limitUnit: "none", mode: "approval" },
  { action: "bank_transfer", limit: 500, limitUnit: "usd", mode: "approval" },
  { action: "file_taxes", limit: null, limitUnit: "none", mode: "approval" },
  { action: "sign_contract", limit: null, limitUnit: "none", mode: "approval" },
];
