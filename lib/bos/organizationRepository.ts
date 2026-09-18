import "server-only";
import { db } from "@/lib/db";
import type { BOSAccess, BOSRole } from "@/lib/bos/access";

export async function listOrganizationMembers(access:BOSAccess){
  const sql=db();
  return sql.unsafe("SELECT m.id,m.role,m.status,u.id AS user_id,u.display_name,u.email,u.status AS user_status,m.invited_at,m.joined_at FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1 ORDER BY CASE m.role WHEN 'OWNER' THEN 1 WHEN 'ADMIN' THEN 2 WHEN 'MANAGER' THEN 3 ELSE 4 END,u.display_name",[access.organization.id]);
}
export async function inviteOrganizationMember(access:BOSAccess,input:{email:string;displayName:string;role:Exclude<BOSRole,"OWNER">}){
  const sql=db(),email=input.email.trim().toLowerCase(),displayName=input.displayName.trim();
  return sql.begin(async(tx)=>{
    const users=await tx.unsafe("INSERT INTO users(display_name,email,status) VALUES($1,$2,'INVITED') ON CONFLICT(email) DO UPDATE SET display_name=CASE WHEN users.status='INVITED' THEN EXCLUDED.display_name ELSE users.display_name END,updated_at=now() RETURNING id",[displayName,email]);
    const memberships=await tx.unsafe("INSERT INTO memberships(organization_id,user_id,role,status,invited_at) VALUES($1,$2,$3,'INVITED',now()) ON CONFLICT(organization_id,user_id) DO UPDATE SET role=EXCLUDED.role,status='INVITED',invited_at=now(),updated_at=now() RETURNING id",[access.organization.id,users[0].id,input.role]);
    return memberships[0];
  });
}
export async function updateMemberRole(access:BOSAccess,membershipId:string,role:Exclude<BOSRole,"OWNER">){
  const sql=db();
  const result=await sql.unsafe("UPDATE memberships SET role=$1,updated_at=now() WHERE id=$2 AND organization_id=$3 AND role<>'OWNER' RETURNING id",[role,membershipId,access.organization.id]);
  return result[0]??null;
}
