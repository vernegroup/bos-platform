import "server-only";

import { db } from "@/lib/db";
import { consumeAuthToken } from "@/lib/bos/authRepository";

export async function verifyEmailToken(token: string) {
  if (!token) return { ok: false as const };

  const consumed = await consumeAuthToken(token, "VERIFY_EMAIL");
  if (!consumed) return { ok: false as const };

  const sql = db();
  await sql.begin(async (tx) => {
    await tx.unsafe(
      "UPDATE users SET email_verified_at=COALESCE(email_verified_at,now()),status='ACTIVE',updated_at=now() WHERE id=$1",
      [consumed.userId],
    );
    await tx.unsafe(
      "UPDATE memberships SET status='ACTIVE',joined_at=COALESCE(joined_at,now()),updated_at=now() WHERE user_id=$1 AND role='OWNER' AND status='INVITED'",
      [consumed.userId],
    );
  });

  return { ok: true as const };
}
