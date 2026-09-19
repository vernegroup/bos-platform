import "server-only";

import argon2 from "argon2";
import { db } from "@/lib/db";
import { issueAuthToken } from "@/lib/bos/authRepository";

export type RegisterCompanyInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  taxId: string;
  country: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeTaxId(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function slugBase(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "organizacja";
}

export async function registerCompanyAccount(input: RegisterCompanyInput) {
  const email = normalizeEmail(input.email);
  const taxId = normalizeTaxId(input.taxId);
  const displayName = [input.firstName.trim(), input.lastName.trim()].filter(Boolean).join(" ");
  const companyName = input.companyName.trim();
  const country = input.country.trim().toUpperCase();

  if (!displayName || !companyName || !email || !taxId || !country) {
    return { ok: false as const, reason: "INVALID" as const };
  }

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
  const sql = db();

  try {
    const userId = await sql.begin(async (tx) => {
      const existing = await tx.unsafe(
        "SELECT id FROM users WHERE lower(email)=$1 LIMIT 1",
        [email],
      );
      if (existing.length) throw new Error("ACCOUNT_EXISTS");

      const orgIdRows = await tx.unsafe(
        "INSERT INTO organizations(name,slug,legal_name,tax_id,status) VALUES($1,$2,$3,$4,'ACTIVE') RETURNING id",
        [companyName, `${slugBase(companyName)}-${crypto.randomUUID().slice(0, 8)}`, companyName, taxId],
      );
      const organizationId = orgIdRows[0].id;

      const userRows = await tx.unsafe(
        "INSERT INTO users(display_name,email,status) VALUES($1,$2,'INVITED') RETURNING id",
        [displayName, email],
      );
      const newUserId = userRows[0].id;

      await tx.unsafe(
        "INSERT INTO user_credentials(user_id,password_hash) VALUES($1,$2)",
        [newUserId, passwordHash],
      );
      await tx.unsafe(
        "INSERT INTO memberships(organization_id,user_id,role,status,invited_at) VALUES($1,$2,'OWNER','INVITED',now())",
        [organizationId, newUserId],
      );

      return newUserId as string;
    });

    const verificationToken = await issueAuthToken(userId, "VERIFY_EMAIL", 60 * 24);
    return { ok: true as const, userId, verificationToken };
  } catch (error) {
    if (error instanceof Error && error.message === "ACCOUNT_EXISTS") {
      return { ok: false as const, reason: "ACCOUNT_EXISTS" as const };
    }
    throw error;
  }
}
