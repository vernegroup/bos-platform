import "server-only";
import { db } from "@/lib/db";
import type { BOSAccess, BOSRole } from "@/lib/bos/access";
import { createAuthTokenValue, hashAuthToken } from "@/lib/bos/authRepository";

export async function listOrganizationMembers(access:BOSAccess){
  const sql=db();
  return sql.unsafe("SELECT m.id,m.role,m.status,u.id AS user_id,u.display_name,u.email,u.status AS user_status,m.invited_at,m.joined_at FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1 ORDER BY CASE m.role WHEN 'OWNER' THEN 1 WHEN 'ADMIN' THEN 2 WHEN 'MANAGER' THEN 3 ELSE 4 END,u.display_name",[access.organization.id]);
}
export async function inviteOrganizationMember(access:BOSAccess,input:{email:string;displayName:string;role:Exclude<BOSRole,"OWNER">}){
  const sql=db(),email=input.email.trim().toLowerCase(),displayName=input.displayName.trim();
  const token=createAuthTokenValue(),tokenHash=hashAuthToken(token);
  return sql.begin(async(tx)=>{
    const existingUsers=await tx.unsafe("SELECT id,status FROM users WHERE lower(email)=$1 LIMIT 1 FOR UPDATE",[email]);
    let userId:string;

    if(existingUsers.length){
      userId=existingUsers[0].id as string;
      const existingMembership=await tx.unsafe("SELECT id,status FROM memberships WHERE organization_id=$1 AND user_id=$2 LIMIT 1 FOR UPDATE",[access.organization.id,userId]);
      if(existingMembership[0]?.status==="ACTIVE")throw new Error("MEMBER_ALREADY_ACTIVE");
      if(existingUsers[0].status==="ACTIVE")throw new Error("ACTIVE_ACCOUNT_INVITE_UNSUPPORTED");
      await tx.unsafe("UPDATE users SET display_name=$1,updated_at=now() WHERE id=$2 AND status='INVITED'",[displayName,userId]);
    }else{
      const users=await tx.unsafe("INSERT INTO users(display_name,email,status) VALUES($1,$2,'INVITED') RETURNING id",[displayName,email]);
      userId=users[0].id as string;
    }

    const memberships=await tx.unsafe(
      "INSERT INTO memberships(organization_id,user_id,role,status,invited_at) VALUES($1,$2,$3,'INVITED',now()) ON CONFLICT(organization_id,user_id) DO UPDATE SET role=EXCLUDED.role,invited_at=now(),updated_at=now() RETURNING id",
      [access.organization.id,userId,input.role],
    );
    const membershipId=memberships[0].id as string;
    await tx.unsafe("UPDATE auth_tokens SET consumed_at=now() WHERE user_id=$1 AND membership_id=$2 AND purpose='ORGANIZATION_INVITE' AND consumed_at IS NULL",[userId,membershipId]);
    await tx.unsafe(
      "INSERT INTO auth_tokens(user_id,membership_id,purpose,token_hash,expires_at) VALUES($1,$2,'ORGANIZATION_INVITE',$3,now()+interval '24 hours')",
      [userId,membershipId,tokenHash],
    );
    return {membershipId,userId,email,displayName,token};
  });
}
export async function updateMemberRole(access:BOSAccess,membershipId:string,role:Exclude<BOSRole,"OWNER">){
  const sql=db();
  const result=await sql.unsafe("UPDATE memberships SET role=$1,updated_at=now() WHERE id=$2 AND organization_id=$3 AND role<>'OWNER' RETURNING id",[role,membershipId,access.organization.id]);
  return result[0]??null;
}
