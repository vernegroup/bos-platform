import "server-only";

import argon2 from "argon2";
import { db } from "@/lib/db";
import { consumeAuthToken, setUserPasswordHash } from "@/lib/bos/authRepository";

export async function claimPurchaseAccount(token:string,password:string){
  const consumed=await consumeAuthToken(token,"CLAIM_PURCHASE");
  if(!consumed)return {ok:false as const};
  const passwordHash=await argon2.hash(password,{type:argon2.argon2id});
  await setUserPasswordHash(consumed.userId,passwordHash);
  const sql=db();
  await sql.begin(async(tx)=>{
    await tx.unsafe("UPDATE users SET email_verified_at=COALESCE(email_verified_at,now()),status='ACTIVE',updated_at=now() WHERE id=$1",[consumed.userId]);
    await tx.unsafe("UPDATE memberships SET status='ACTIVE',joined_at=COALESCE(joined_at,now()),updated_at=now() WHERE user_id=$1 AND role='OWNER' AND status='INVITED'",[consumed.userId]);
  });
  return {ok:true as const};
}
