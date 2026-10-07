"use server";

import { acceptOrganizationInvitation } from "@/lib/bos/organizationInviteRepository";

export type InviteState={status:"idle"|"error"|"success";message?:string};

export async function acceptInviteAction(_previous:InviteState,formData:FormData):Promise<InviteState>{
  const token=String(formData.get("token")??"");
  const password=String(formData.get("password")??"");
  const confirm=String(formData.get("passwordConfirm")??"");
  if(!token)return {status:"error",message:"Link zaproszenia jest nieprawidłowy lub wygasł."};
  if(password.length<12)return {status:"error",message:"Hasło musi mieć co najmniej 12 znaków."};
  if(password!==confirm)return {status:"error",message:"Hasła nie są identyczne."};
  const result=await acceptOrganizationInvitation(token,password);
  return result.ok
    ?{status:"success",message:"Konto zostało aktywowane. Możesz teraz zalogować się do BOS."}
    :{status:"error",message:"Link zaproszenia jest nieprawidłowy, wygasł lub został już użyty."};
}
