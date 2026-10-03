import "server-only";

export const BOS_PRODUCTION_URL = "https://www.standardybiznesu.pl";
const BOS_COMMERCE2_PREVIEW_URL = "https://bos-platform-git-feature-commerce-2-vernegroup1.vercel.app";

export function bosAppUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return BOS_PRODUCTION_URL;
  }

  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "feature/commerce-2") {
    return BOS_COMMERCE2_PREVIEW_URL;
  }

  const explicitUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (explicitUrl) return explicitUrl.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  if (process.env.NODE_ENV === "production") return BOS_PRODUCTION_URL;
  return "http://localhost:3000";
}
