/** Static catalog data for the Atlas platform surfaces (integrations, security,
 * industry templates, pricing tiers, guardrails, onboarding). Pure data. */

export type Integration = { id: string; name: string; category: string; emoji: string; blurb: string };
export const INTEGRATIONS: Integration[] = [
  { id: "gmail", name: "Gmail", category: "Email", emoji: "✉️", blurb: "Sync email, send from Atlas, log to customers." },
  { id: "outlook", name: "Outlook", category: "Email", emoji: "📧", blurb: "Microsoft 365 mail + contacts." },
  { id: "gcal", name: "Google Calendar", category: "Calendar", emoji: "📅", blurb: "Two-way calendar sync." },
  { id: "ocal", name: "Outlook Calendar", category: "Calendar", emoji: "🗓️", blurb: "Microsoft 365 calendar sync." },
  { id: "quickbooks", name: "QuickBooks", category: "Accounting", emoji: "📒", blurb: "Invoices, expenses, and P&L." },
  { id: "xero", name: "Xero", category: "Accounting", emoji: "📗", blurb: "Cloud accounting sync." },
  { id: "stripe", name: "Stripe", category: "Payments", emoji: "💳", blurb: "Take payments and reconcile." },
  { id: "square", name: "Square", category: "Payments", emoji: "⬛", blurb: "In-person and online payments." },
  { id: "twilio", name: "Twilio", category: "Phone / SMS", emoji: "📱", blurb: "Two-way SMS and call logging." },
  { id: "ringcentral", name: "RingCentral", category: "Phone / SMS", emoji: "☎️", blurb: "Business phone + texts." },
  { id: "gusto", name: "Gusto", category: "Payroll", emoji: "💵", blurb: "Payroll, pay stubs, and tax docs." },
  { id: "adp", name: "ADP", category: "Payroll", emoji: "🏦", blurb: "Enterprise payroll + HR." },
  { id: "gdrive", name: "Google Drive", category: "Cloud storage", emoji: "🗂️", blurb: "Documents and shared files." },
  { id: "dropbox", name: "Dropbox", category: "Cloud storage", emoji: "📦", blurb: "File storage and sharing." },
];

export type SecurityFeature = { id: string; name: string; desc: string; on: boolean; managed?: boolean };
export const SECURITY_FEATURES: SecurityFeature[] = [
  { id: "sso", name: "Single Sign-On (SSO)", desc: "SAML / OIDC with Google, Microsoft, Okta.", on: true },
  { id: "mfa", name: "Multi-Factor Authentication", desc: "TOTP, SMS, and hardware keys; enforceable org-wide.", on: true },
  { id: "encrypt_transit", name: "Encryption in transit", desc: "TLS 1.2+ on every connection.", on: true, managed: true },
  { id: "encrypt_rest", name: "Encryption at rest", desc: "AES-256 for stored data and backups.", on: true, managed: true },
  { id: "backups", name: "Automated backups", desc: "Continuous backups with point-in-time restore.", on: true, managed: true },
  { id: "dr", name: "Disaster recovery", desc: "Multi-region failover; tested RPO/RTO targets.", on: true, managed: true },
  { id: "admin", name: "Enterprise admin controls", desc: "Roles, SCIM provisioning, session policies, IP allow-lists.", on: true },
  { id: "audit", name: "Full audit logging", desc: "Every permission-sensitive action recorded and exportable.", on: true, managed: true },
];

export type IndustryTemplate = { id: string; name: string; emoji: string; sets: string[] };
export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  { id: "hvac", name: "HVAC / Field service", emoji: "🔧", sets: ["Dispatch & routing", "Service history per unit", "Maintenance contracts", "Technician mobile mode", "Parts inventory"] },
  { id: "law", name: "Law firm", emoji: "⚖️", sets: ["Matters & clients", "Billable time tracking", "Document retention rules", "Conflict checks", "Trust accounting"] },
  { id: "restaurant", name: "Restaurant", emoji: "🍽️", sets: ["Shift scheduling", "Tip pooling", "Food-safety checklists", "Vendor orders", "Table reservations"] },
  { id: "trucking", name: "Trucking / Logistics", emoji: "🚚", sets: ["Loads & dispatch", "Driver hours (HOS)", "Vehicle maintenance", "Fuel & expenses", "Proof-of-delivery"] },
  { id: "construction", name: "Construction", emoji: "🏗️", sets: ["Projects & phases", "Crews & subcontractors", "Permits & inspections", "Change orders", "Site safety logs"] },
  { id: "general", name: "General business", emoji: "🏢", sets: ["Customers (CRM)", "Tasks & scheduling", "Invoicing", "Team messaging", "Basic reporting"] },
];

export type PricingTier = { id: string; name: string; price: string; blurb: string; features: string[]; highlight?: boolean };
export const PRICING_TIERS: PricingTier[] = [
  { id: "starter", name: "Starter", price: "$29 / user / mo", blurb: "For small teams getting organized.", features: ["Up to 10 employees", "Tasks, CRM, scheduling", "Employee portal + mobile", "Email & calendar integrations", "Community support"] },
  { id: "growth", name: "Growth", price: "$59 / user / mo", blurb: "For growing businesses.", features: ["Everything in Starter", "Approvals & permissions", "Accounting & payments integrations", "Announcements + feedback", "Priority support"], highlight: true },
  { id: "enterprise", name: "Enterprise", price: "Custom", blurb: "For multi-location organizations.", features: ["Everything in Growth", "SSO, SCIM, advanced admin", "Custom roles & location access", "Audit logs + data residency", "Dedicated success manager"] },
  { id: "ceo", name: "CEO / Executive", price: "Add-on", blurb: "The executive AI layer.", features: ["Control Center & governance", "Atlas Voice (CEO mode)", "‘What needs my attention’ briefings", "Conditional approvals & delegation", "Break-glass emergency access"] },
];

export type Guardrail = { id: string; rule: string; example: string };
export const GUARDRAILS: Guardrail[] = [
  { id: "limits", rule: "Never exceed configured approval limits", example: "A $2,400 refund over a $500 limit is routed for approval, not auto-issued." },
  { id: "destructive", rule: "Require explicit on-screen confirmation for destructive actions", example: "Deleting a customer needs a typed/tapped confirmation and is audit-logged." },
  { id: "permissions", rule: "Voice and AI actions honor the same permissions as the UI", example: "‘Show me payroll’ is refused for someone without payroll access." },
  { id: "uncertainty", rule: "Ask before acting when intent is ambiguous", example: "‘Refund the customer’ with no amount → Atlas asks which order and how much." },
  { id: "preview", rule: "Preview & approve for broad actions", example: "A company-wide broadcast shows a draft + audience count before sending." },
  { id: "audit", rule: "Everything important is recorded", example: "Approvals, overrides, deletions, and grants are written to the audit log." },
];

export const ONBOARDING_QUICKSTART: { step: string; detail: string }[] = [
  { step: "Pick your industry", detail: "Atlas pre-configures the right modules, fields, and templates." },
  { step: "Import or add your team", detail: "Bulk import employees, or add a few to start; roles get sensible defaults." },
  { step: "Connect your tools", detail: "Email, calendar, accounting, and payments in a couple of clicks." },
  { step: "Set who can do what", detail: "Apply a permission template; customize later in the Control Center." },
  { step: "Invite your team", detail: "Employees get the portal + mobile app and a guided first day." },
];
