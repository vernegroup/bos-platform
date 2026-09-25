import "server-only";

export const VOICE_BOS_WRITE_OPERATIONS_ENABLED=false as const;
const WRITE_VERBS=new Set(["create","add","set","update","edit","modify","delete","remove","archive","restore","assign","unassign","complete","close","reopen","approve","reject","publish","save","write","execute"]);
export class VoiceWriteOperationError extends Error{readonly code="VOICE_BOS_WRITE_FORBIDDEN";constructor(readonly operation:string){super(`BOS Voice write operation is disabled: ${operation}`);this.name="VoiceWriteOperationError";}}
export function isVoiceWriteOperation(operation:string){const tokens=operation.trim().toLowerCase().split(/[._:/\-\s]+/).filter(Boolean);return tokens.some(token=>WRITE_VERBS.has(token));}
export function assertVoiceReadOnlyOperation(operation:string){if(VOICE_BOS_WRITE_OPERATIONS_ENABLED||!isVoiceWriteOperation(operation))return;throw new VoiceWriteOperationError(operation);}
export function voiceBosAccessPolicy(){return {mode:"read-only" as const,writeOperations:false as const};}
