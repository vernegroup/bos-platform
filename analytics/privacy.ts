export interface PrivacyViolation {
  path: string;
  code: "FORBIDDEN_KEY" | "PII_VALUE";
}

const FORBIDDEN_KEYS = new Set([
  "password","passwd","passcode","secret","token","access_token","refresh_token","id_token",
  "authorization","cookie","set-cookie","message","messages","prompt","response","conversation",
  "transcript","chat","email","e-mail","name","first_name","last_name","fullname","full_name",
  "phone","telephone","address","street","postal_code","postcode","nip","pesel","innertext",
  "textcontent","value","formdata","form_data","clipboard"
]);

const SENSITIVE_KEY_PARTS = [
  "password","secret","token","authorization","cookie","prompt","conversation","transcript",
  "clipboard","formdata","form_data"
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POLISH_PESEL = /^\d{11}$/;
const LONG_TOKEN = /^[A-Za-z0-9_\-+/=.]{32,}$/;

function normalizedKey(key: string): string {
  return key.trim().toLowerCase().replace(/[-\s]/g, "_");
}

function forbiddenKey(key: string): boolean {
  const normalized = normalizedKey(key);
  return FORBIDDEN_KEYS.has(normalized) || SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

function piiString(value: string): boolean {
  const trimmed = value.trim();
  return EMAIL.test(trimmed) || POLISH_PESEL.test(trimmed) || LONG_TOKEN.test(trimmed);
}

export function findAnalyticsPrivacyViolations(value: unknown, path = "$"): PrivacyViolation[] {
  const violations: PrivacyViolation[] = [];
  if (typeof value === "string") {
    if (piiString(value)) violations.push({ path, code: "PII_VALUE" });
    return violations;
  }
  if (!value || typeof value !== "object") return violations;
  if (Array.isArray(value)) {
    value.forEach((child, index) => violations.push(...findAnalyticsPrivacyViolations(child, path + "[" + index + "]")));
    return violations;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = path + "." + key;
    if (forbiddenKey(key)) {
      violations.push({ path: childPath, code: "FORBIDDEN_KEY" });
      continue;
    }
    violations.push(...findAnalyticsPrivacyViolations(child, childPath));
  }
  return violations;
}

export function containsForbiddenAnalyticsData(value: unknown): boolean {
  return findAnalyticsPrivacyViolations(value).length > 0;
}
