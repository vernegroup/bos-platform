import "server-only";

import argon2 from "argon2";
import { db } from "@/lib/db";
import { hashAuthToken } from "@/lib/bos/authRepository";

export async function acceptOrganizationInvitation(token:string,password:string){
  const passwordHash=await argon2.hash(password,{type:argon2.argon2id});
  const tokenHash=hashAuthToken(token);
  const sql=db();

  return sql.begin(async(tx)=>{
    const rows=await tx.unsafe(
      `SELECT t.id,t.user_id,t.membership_id
       FROM auth_tokens t
       JOIN memberships m ON m.id=t.membership_id AND m.user_id=t.user_id
       JOIN users u ON u.id=t.user_id
       WHERE t.token_hash=$1
         AND t.purpose='ORGANIZATION_INVITE'
         AND t.consumed_at IS NULL
         AND t.expires_at>now()
         AND m.status='INVITED'
         AND u.status='INVITED'
       FOR UPDATE OF t,m,u`,
      [tokenHash],
    );
    if(!rows.length)return {ok:false as const};

    const row=rows[0];
    await tx.unsafe(
      "INSERT INTO user_credentials(user_id,password_hash) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET password_hash=EXCLUDED.password_hash,password_changed_at=now(),updated_at=now()",
      [row.user_id,passwordHash],
    );
    await tx.unsafe(
      "UPDATE users SET status='ACTIVE',email_verified_at=COALESCE(email_verified_at,now()),updated_at=now() WHERE id=$1 AND status='INVITED'",
      [row.user_id],
    );
    const membership=await tx.unsafe(
      "UPDATE memberships SET status='ACTIVE',joined_at=COALESCE(joined_at,now()),updated_at=now() WHERE id=$1 AND user_id=$2 AND status='INVITED' RETURNING id",
      [row.membership_id,row.user_id],
    );
    if(!membership.length)throw new Error("INVITATION_MEMBERSHIP_NOT_ACTIVATED");
    await tx.unsafe("UPDATE auth_tokens SET consumed_at=now() WHERE id=$1",[row.id]);
    return {ok:true as const};
  });
}
