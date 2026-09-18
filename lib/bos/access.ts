import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type BOSRole = "OWNER" | "ADMIN" | "MANAGER" | "USER";
export type BOSAccess = {
  user: { id: string; displayName: string; email: string };
  membership: { id: string; role: BOSRole };
  organization: { id: string; name: string; slug: string };
};

export async function resolveBOSAccess(): Promise<BOSAccess | null> {
  const session = await auth();
  const provider = session?.user?.provider;
  const providerAccountId = session?.user?.providerAccountId;
  const email = session?.user?.email?.trim().toLowerCase();
  if (!session?.user || !provider || !providerAccountId || !email) return null;

  const sql = db();
  return sql.begin(async (tx) => {
    let identity = await tx.unsafe("SELECT u.id, u.display_name, u.email FROM auth_identities ai JOIN users u ON u.id = ai.user_id WHERE ai.provider = $1 AND ai.provider_account_id = $2 AND u.status = 'ACTIVE' LIMIT 1", [provider, providerAccountId]);
    if (!identity.length) {
      const invited = await tx.unsafe("SELECT id, display_name, email FROM users WHERE lower(email) = $1 AND status IN ('ACTIVE','INVITED') LIMIT 1", [email]);
      if (!invited.length) return null;
      await tx.unsafe("INSERT INTO auth_identities (user_id, provider, provider_account_id) VALUES ($1,$2,$3) ON CONFLICT (provider,provider_account_id) DO NOTHING", [invited[0].id, provider, providerAccountId]);
      await tx.unsafe("UPDATE users SET status='ACTIVE', updated_at=now() WHERE id=$1", [invited[0].id]);
      identity = invited;
    }
    const rows = await tx.unsafe("SELECT m.id AS membership_id,m.role,o.id AS organization_id,o.name AS organization_name,o.slug AS organization_slug FROM memberships m JOIN organizations o ON o.id=m.organization_id WHERE m.user_id=$1 AND m.status='ACTIVE' AND o.status='ACTIVE' ORDER BY m.joined_at NULLS LAST,m.created_at LIMIT 1", [identity[0].id]);
    if (!rows.length) return null;
    return {
      user: { id: identity[0].id, displayName: identity[0].display_name, email: identity[0].email },
      membership: { id: rows[0].membership_id, role: rows[0].role as BOSRole },
      organization: { id: rows[0].organization_id, name: rows[0].organization_name, slug: rows[0].organization_slug },
    };
  });
}

export async function requireBOSAccess() {
  const access = await resolveBOSAccess();
  if (!access) redirect("/no-access");
  return access;
}
export function canManageMembers(role: BOSRole) { return role === "OWNER" || role === "ADMIN"; }
