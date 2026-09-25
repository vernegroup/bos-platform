import { resolveBOSAccess } from "@/lib/bos/access";
export type VoicePrincipal={userId:string;email:string|null;role:string|null};
export class VoiceAuthError extends Error{readonly status=401;readonly code="UNAUTHORIZED";}
export async function requireVoicePrincipal():Promise<VoicePrincipal>{const access=await resolveBOSAccess();if(!access){console.warn("[voice/auth] BOS access unavailable");throw new VoiceAuthError();}return{userId:access.user.id,email:access.user.email,role:access.membership.role};}