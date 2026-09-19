import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export type AuthTokenPurpose = "VERIFY_EMAIL" | "RESET_PASSWORD";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashAuthToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createAuthTokenValue() {
  return randomBytes(32).toString("base64url");
}

export function safeHashEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function findUserForCredentials(email: string) {
  const sql = db();
  const rows = await sql.unsafe(
    "SELECT u.id,u.display_name,u.email,u.status,u.email_verified_at,c.password_hash FROM users u JOIN user_credentials c ON c.user_id=u.id WHERE lower(u.email)=$1 AND u.status IN ('ACTIVE','INVITED') LIMIT 1",
    [normalizeEmail(email)],
  );
  return rows[0] ?? null;
}

export async function findUserForEmailVerification(email: string) {
  const sql = db();
  const rows = await sql.unsafe(
    "SELECT id,display_name,email,status,email_verified_at FROM users WHERE lower(email)=$1 AND status IN ('ACTIVE','INVITED') LIMIT 1",
    [normalizeEmail(email)],
  );
  return rows[0] ?? null;
}

export async function findUserForPasswordReset(email: string) {
  const sql = db();
  const rows = await sql.unsafe(
    "SELECT id,display_name,email,status,email_verified_at FROM users WHERE lower(email)=$1 AND status='ACTIVE' AND email_verified_at IS NOT NULL LIMIT 1",
    [normalizeEmail(email)],
  );
  return rows[0] ?? null;
}

export async function setUserPasswordHash(userId: string, passwordHash: string) {
  const sql = db();
  await sql.unsafe(
    "INSERT INTO user_credentials(user_id,password_hash) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET password_hash=EXCLUDED.password_hash,password_changed_at=now(),updated_at=now()",
    [userId, passwordHash],
  );
}

export async function markEmailVerified(userId: string) {
  const sql = db();
  await sql.unsafe(
    "UPDATE users SET email_verified_at=COALESCE(email_verified_at,now()),status='ACTIVE',updated_at=now() WHERE id=$1",
    [userId],
  );
}

export async function issueAuthToken(userId: string, purpose: AuthTokenPurpose, lifetimeMinutes: number) {
  const sql = db();
  const token = createAuthTokenValue();
  const tokenHash = hashAuthToken(token);

  await sql.begin(async (tx) => {
    await tx.unsafe(
      "UPDATE auth_tokens SET consumed_at=now() WHERE user_id=$1 AND purpose=$2 AND consumed_at IS NULL",
      [userId, purpose],
    );
    await tx.unsafe(
      "INSERT INTO auth_tokens(user_id,purpose,token_hash,expires_at) VALUES($1,$2,$3,now()+($4 * interval '1 minute'))",
      [userId, purpose, tokenHash, lifetimeMinutes],
    );
  });

  return token;
}

export async function consumeAuthToken(token: string, purpose: AuthTokenPurpose) {
  const sql = db();
  const tokenHash = hashAuthToken(token);
  return sql.begin(async (tx) => {
    const rows = await tx.unsafe(
      "SELECT id,user_id FROM auth_tokens WHERE token_hash=$1 AND purpose=$2 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",
      [tokenHash, purpose],
    );
    if (!rows.length) return null;
    await tx.unsafe("UPDATE auth_tokens SET consumed_at=now() WHERE id=$1", [rows[0].id]);
    return { userId: rows[0].user_id as string };
  });
}
