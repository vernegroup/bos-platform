import type { Session } from "next-auth";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type VoicePrincipal = {
  userId: string;
  email: string | null;
  role: string | null;
};

export class VoiceAuthError extends Error {
  readonly status = 401;
  readonly code = "UNAUTHORIZED";
}

async function resolveUserRole(userId: string): Promise<string | null> {
  const sql = db();
  try {
    const rows = await sql.unsafe(
      "SELECT role FROM organization_members WHERE user_id=$1 AND status='ACTIVE' ORDER BY created_at ASC LIMIT 1",
      [userId],
    );
    return typeof rows[0]?.role === "string" ? rows[0].role : null;
  } catch (error) {
    console.warn("[voice/auth] User role unavailable", error);
    return null;
  }
}

export async function requireVoicePrincipal(): Promise<VoicePrincipal> {
  const session = (await auth()) as Session | null;
  const userId = session?.user?.id?.trim();
  if (!userId) throw new VoiceAuthError();

  const email = session?.user?.email?.trim().toLowerCase() || null;

  return {
    userId,
    email,
    role: await resolveUserRole(userId),
  };
}
