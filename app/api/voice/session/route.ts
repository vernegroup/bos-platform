import { NextResponse } from "next/server";
import { requireVoicePrincipal, VoiceAuthError } from "@/lib/bos/voice/server/voiceAuth";
import { createEphemeralVoiceCredential, VoiceCredentialError } from "@/lib/bos/voice/server/ephemeralCredential";
import { checkVoiceSessionRateLimit, voiceRateLimitHeaders } from "@/lib/bos/voice/server/voiceRateLimit";
import { getServerOpenAIApiKey } from "@/lib/bos/voice/server/openAIKey";
import { buildBosAssistantInstructions } from "@/lib/bos/assistant/instructions";
import { sanitizeBosPageContext } from "@/lib/bos/assistant/pageContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime";
function errorResponse(error:string,status:number,headers:Record<string,string>={}) {
  return NextResponse.json({error},{status,headers:{"Cache-Control":"no-store, private",...headers}});
}
export async function POST(request: Request) {
  let principal;
  try { principal=await requireVoicePrincipal(); }
  catch(error){
    if(error instanceof VoiceAuthError)return errorResponse(error.code,error.status);
    console.error("[voice/session] Authentication failed",error);return errorResponse("UNAUTHORIZED",401);
  }
  const rate=checkVoiceSessionRateLimit(principal.userId);const rateHeaders=voiceRateLimitHeaders(rate);
  if(!rate.allowed)return errorResponse("VOICE_RATE_LIMITED",429,{...rateHeaders,"Retry-After":String(rate.retryAfterSeconds)});
  const apiKey=getServerOpenAIApiKey();
  if(!apiKey)return errorResponse("VOICE_NOT_CONFIGURED",503,rateHeaders);
  try{
    let body: { context?: unknown } = {};
    try { body = await request.json(); } catch {}
    const pageContext=sanitizeBosPageContext(body.context);
    const instructions=buildBosAssistantInstructions(pageContext,{userId:principal.userId,role:principal.role},"voice");
    const credential=await createEphemeralVoiceCredential(apiKey,REALTIME_MODEL,instructions);
    return NextResponse.json({...credential,userContext:{authenticated:true,userRole:principal.role}}, {headers:{
      "Cache-Control":"no-store, private",Pragma:"no-cache",Expires:"0",...rateHeaders,
    }});
  }catch(error){
    if(error instanceof VoiceCredentialError){
      console.error("[voice/session] Ephemeral credential failed",error.upstreamStatus,error.message);
      if(error.upstreamStatus===429)return errorResponse("VOICE_UPSTREAM_RATE_LIMITED",503,{...rateHeaders,"Retry-After":"5"});
      if(error.upstreamStatus===401||error.upstreamStatus===403)return errorResponse("VOICE_PROVIDER_AUTH_FAILED",503,rateHeaders);
    }else console.error("[voice/session] Unexpected credential error",error);
    return errorResponse("VOICE_SESSION_FAILED",502,rateHeaders);
  }
}
