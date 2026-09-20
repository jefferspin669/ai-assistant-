/**
 * Sanitize retrieved business text before it enters the model context.
 * Treats document/memory bodies as untrusted data, not instructions.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  /you\s+are\s+now\s+(?:in\s+)?(?:dan|developer|god)\s+mode/gi,
  /system\s*:\s*/gi,
  /<\s*\/?\s*system\s*>/gi,
  /\[INST\]/gi,
  /<<\s*SYS\s*>>/gi,
];

export function sanitizeUntrustedContent(value: unknown, max = 240): string {
  let text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  for (const pattern of INJECTION_PATTERNS) {
    text = text.replace(pattern, "[filtered]");
  }
  if (text.length > max) text = `${text.slice(0, max - 1)}…`;
  return text;
}

/** Wrap for system/tool prompts so the model sees an explicit untrusted boundary. */
export function wrapUntrustedBusinessData(label: string, body: string): string {
  const clean = sanitizeUntrustedContent(body, 2_000);
  return `<untrusted_business_data source="${label}">${clean}</untrusted_business_data>`;
}
