import "server-only";

import argon2 from "argon2";
import { db } from "@/lib/db";
import { hashAuthToken } from "@/lib/bos/authRepository";

export async function claimPurchaseAccount(token:string,password:string){
  // Hashing happens before the transaction so an argon2 failure cannot consume the claim.
  const passwordHash=await argon2.hash(password,{type:argon2.argon2id});
  const tokenHash=hashAuthToken(token);
  const sql=db();
  return sql.begin(async(tx)=>{
    const rows=await tx.unsafe(
      "SELECT id,user_id FROM auth_tokens WHERE token_hash=$1 AND purpose='CLAIM_PURCHASE' AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",
      [tokenHash],
    );
    if(!rows.length)return {ok:false as const};
    const userId=rows[0].user_id as string;

    await tx.unsafe(
      "INSERT INTO user_credentials(user_id,password_hash) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET password_hash=EXCLUDED.password_hash,password_changed_at=now(),updated_at=now()",
      [userId,passwordHash],
    );
    await tx.unsafe("UPDATE users SET email_verified_at=COALESCE(email_verified_at,now()),status='ACTIVE',updated_at=now() WHERE id=$1",[userId]);
    await tx.unsafe("UPDATE memberships SET status='ACTIVE',joined_at=COALESCE(joined_at,now()),updated_at=now() WHERE user_id=$1 AND role='OWNER' AND status='INVITED'",[userId]);
    await tx.unsafe("UPDATE auth_tokens SET consumed_at=now() WHERE id=$1",[rows[0].id]);
    return {ok:true as const};
  });
}
