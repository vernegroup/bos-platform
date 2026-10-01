"use server";
import { claimPurchaseAccount } from "@/lib/bos/purchaseClaimRepository";
export type ClaimState={status:"idle"|"error"|"success";message?:string};
export async function claimPurchaseAction(_previous:ClaimState,formData:FormData):Promise<ClaimState>{
 const token=String(formData.get("token")??""); const password=String(formData.get("password")??""); const confirm=String(formData.get("passwordConfirm")??"");
 if(!token)return {status:"error",message:"Link aktywacyjny jest nieprawidłowy lub wygasł."};
 if(password.length<12)return {status:"error",message:"Hasło musi mieć co najmniej 12 znaków."};
 if(password!==confirm)return {status:"error",message:"Hasła nie są identyczne."};
 const result=await claimPurchaseAccount(token,password);
 return result.ok?{status:"success",message:"Dostęp został aktywowany. Możesz teraz zalogować się do BOS."}:{status:"error",message:"Link aktywacyjny jest nieprawidłowy, wygasł lub został już użyty."};
}
