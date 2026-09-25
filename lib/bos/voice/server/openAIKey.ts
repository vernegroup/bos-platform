import "server-only";

const FORBIDDEN_PUBLIC_KEYS=["NEXT_PUBLIC_OPENAI_API_KEY","NEXT_PUBLIC_OPENAI_KEY","NEXT_PUBLIC_OPENAI_REALTIME_API_KEY"] as const;

export function getServerOpenAIApiKey():string|null{
  for(const name of FORBIDDEN_PUBLIC_KEYS){
    if(process.env[name]) throw new Error(`Unsafe Voice configuration: ${name} must never contain an OpenAI API key.`);
  }
  const key=process.env.OPENAI_API_KEY?.trim();
  return key||null;
}
