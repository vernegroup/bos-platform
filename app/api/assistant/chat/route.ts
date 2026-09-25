import {NextResponse}from"next/server";
import {auth}from"@/auth";
import {getServerOpenAIApiKey}from"@/lib/bos/voice/server/openAIKey";
import {BOS_ASSISTANT_SYSTEM_PROMPT}from"@/lib/bos/assistant/systemPrompt";
import {BOS_SCOPE_CLASSIFIER_PROMPT,BOS_SCOPE_REFUSAL,classifyBosScope}from"@/lib/bos/assistant/scopeGuard";
export const runtime="nodejs";export const dynamic="force-dynamic";
type ChatMessage={role:"assistant"|"user";content:string};const MAX_MESSAGES=20,MAX_CONTENT=4000;
function conversationForModel(messages:ChatMessage[]){return messages.map(m=>({role:m.role,content:m.content}));}
function scopeContext(messages:ChatMessage[]){return messages.slice(-8).map(m=>`${m.role.toUpperCase()}: ${m.content}`).join("\n");}
async function modelScopeCheck(apiKey:string,model:string,messages:ChatMessage[]){
 const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model,instructions:BOS_SCOPE_CLASSIFIER_PROMPT,input:scopeContext(messages),max_output_tokens:8})});
 if(!r.ok)return false;const d=await r.json() as {output_text?:string;output?:Array<{content?:Array<{type?:string;text?:string}>}>};const out=d.output_text?.trim()||d.output?.flatMap(x=>x.content??[]).find(x=>x.type==="output_text")?.text?.trim()||"";return out.toUpperCase()==="ALLOW";
}
export async function POST(request:Request){
 const session=await auth();if(!session?.user?.id)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 const apiKey=getServerOpenAIApiKey();if(!apiKey)return NextResponse.json({error:"AI_NOT_CONFIGURED"},{status:503});
 let body:{messages?:ChatMessage[]};try{body=await request.json();}catch{return NextResponse.json({error:"INVALID_JSON"},{status:400});}
 const messages=(body.messages??[]).slice(-MAX_MESSAGES).filter(m=>(m.role==="user"||m.role==="assistant")&&typeof m.content==="string").map(m=>({role:m.role,content:m.content.slice(0,MAX_CONTENT)}));if(!messages.length)return NextResponse.json({error:"EMPTY_CONVERSATION"},{status:400});
 const lastUser=[...messages].reverse().find(m=>m.role==="user");if(!lastUser)return NextResponse.json({error:"EMPTY_USER_MESSAGE"},{status:400});
 const model=process.env.OPENAI_TEXT_MODEL?.trim()||"gpt-5.6-luna";const scope=classifyBosScope(lastUser.content);
 if(scope==="deny")return NextResponse.json({message:BOS_SCOPE_REFUSAL,scope:"denied"},{headers:{"Cache-Control":"no-store"}});
 if(scope==="review"&&!(await modelScopeCheck(apiKey,model,messages)))return NextResponse.json({message:BOS_SCOPE_REFUSAL,scope:"denied"},{headers:{"Cache-Control":"no-store"}});
 const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model,input:conversationForModel(messages),instructions:BOS_ASSISTANT_SYSTEM_PROMPT,max_output_tokens:500})});
 if(!response.ok){console.error("[bos/text-ai] OpenAI error",response.status,await response.text());return NextResponse.json({error:"AI_UPSTREAM_ERROR"},{status:response.status===429?429:502});}
 const data=await response.json() as {output_text?:string;output?:Array<{content?:Array<{type?:string;text?:string}>}>};const text=data.output_text?.trim()||data.output?.flatMap(x=>x.content??[]).find(x=>x.type==="output_text")?.text?.trim();if(!text)return NextResponse.json({error:"AI_EMPTY_RESPONSE"},{status:502});
 return NextResponse.json({message:text,model,scope:"allowed",contextMessages:messages.length},{headers:{"Cache-Control":"no-store"}});
}