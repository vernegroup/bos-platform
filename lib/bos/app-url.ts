import "server-only";

export const BOS_PRODUCTION_URL = "https://www.standardybiznesu.pl";

export function bosAppUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return BOS_PRODUCTION_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  const explicitUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (explicitUrl) return explicitUrl.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") return BOS_PRODUCTION_URL;
  return "http://localhost:3000";
}
