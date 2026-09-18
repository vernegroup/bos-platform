"use server";
import { revalidatePath } from "next/cache";
import { canManageMembers,requireBOSAccess,type BOSRole } from "@/lib/bos/access";
import { inviteOrganizationMember,updateMemberRole } from "@/lib/bos/organizationRepository";
const assignableRoles=new Set<BOSRole>(["ADMIN","MANAGER","USER"]);
export async function inviteMemberAction(formData:FormData){
  const access=await requireBOSAccess();
  if(!canManageMembers(access.membership.role))throw new Error("Brak uprawnień.");
  const email=String(formData.get("email")??""),displayName=String(formData.get("displayName")??""),role=String(formData.get("role")??"USER") as BOSRole;
  if(!email||!displayName||!assignableRoles.has(role))throw new Error("Nieprawidłowe dane.");
  await inviteOrganizationMember(access,{email,displayName,role:role as Exclude<BOSRole,"OWNER">});
  revalidatePath("/app/users");
}
export async function updateMemberRoleAction(formData:FormData){
  const access=await requireBOSAccess();
  if(!canManageMembers(access.membership.role))throw new Error("Brak uprawnień.");
  const membershipId=String(formData.get("membershipId")??""),role=String(formData.get("role")??"") as BOSRole;
  if(!membershipId||!assignableRoles.has(role))throw new Error("Nieprawidłowa rola.");
  await updateMemberRole(access,membershipId,role as Exclude<BOSRole,"OWNER">);
  revalidatePath("/app/users");
}
