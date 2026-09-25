export type BosAssistantErrorCode="UNAUTHORIZED"|"AI_NOT_CONFIGURED"|"RATE_LIMITED"|"UPSTREAM"|"EMPTY_RESPONSE"|"NETWORK"|"UNKNOWN";
export const BOS_ASSISTANT_FALLBACKS:Record<BosAssistantErrorCode,string>={
 UNAUTHORIZED:"Sesja BOS wygasła. Zaloguj się ponownie.",
 AI_NOT_CONFIGURED:"BOS Assistant jest chwilowo niedostępny.",
 RATE_LIMITED:"BOS Assistant ma chwilowo zbyt wiele zapytań. Spróbuj ponownie za moment.",
 UPSTREAM:"Nie udało się uzyskać odpowiedzi AI. Spróbuj ponownie za chwilę.",
 EMPTY_RESPONSE:"AI nie zwróciło odpowiedzi. Spróbuj ponownie.",
 NETWORK:"Nie udało się połączyć z BOS Assistant. Sprawdź połączenie i spróbuj ponownie.",
 UNKNOWN:"Wystąpił błąd BOS Assistant. Spróbuj ponownie za chwilę."
};
export function fallbackForHttp(status:number,error?:string){if(status===401)return BOS_ASSISTANT_FALLBACKS.UNAUTHORIZED;if(status===429)return BOS_ASSISTANT_FALLBACKS.RATE_LIMITED;if(error==="AI_NOT_CONFIGURED")return BOS_ASSISTANT_FALLBACKS.AI_NOT_CONFIGURED;if(error==="AI_EMPTY_RESPONSE")return BOS_ASSISTANT_FALLBACKS.EMPTY_RESPONSE;if(status>=500)return BOS_ASSISTANT_FALLBACKS.UPSTREAM;return BOS_ASSISTANT_FALLBACKS.UNKNOWN;}