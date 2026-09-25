const FORBIDDEN_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "cookie",
  "message",
  "prompt",
  "response",
  "email",
  "name",
  "innertext",
  "value",
  "clipboard",
]);

export function containsForbiddenAnalyticsData(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsForbiddenAnalyticsData);

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) return true;
    if (containsForbiddenAnalyticsData(child)) return true;
  }
  return false;
}
