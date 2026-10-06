import "server-only";

import { auth } from "@/auth";

export type PlatformOwnerAccess =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403; error: "UNAUTHORIZED" | "FORBIDDEN" };

function platformOwnerEmails(): Set<string> {
  return new Set(
    (process.env.BOS_PLATFORM_OWNER_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requirePlatformOwner(): Promise<PlatformOwnerAccess> {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) return { ok: false, status: 401, error: "UNAUTHORIZED" };
  if (!platformOwnerEmails().has(email)) {
    return { ok: false, status: 403, error: "FORBIDDEN" };
  }

  return { ok: true, email };
}
