import "server-only";
import {voiceBosAccessPolicy}from"@/lib/bos/voice/server/voiceWritePolicy";
export const AI_BOS_READ_ONLY=true as const;
const WRITE_PATTERNS=[/\b(create|update|delete|insert|execute|write|mutate)\b/i,/\b(utwórz|dodaj|zmień|edytuj|usuń|zapisz|przypisz|zamknij|zatwierdź|wykonaj)\b/i];
export function aiReadOnlyPolicy(){const voice=voiceBosAccessPolicy();return{readOnly:true,writeOperations:false,toolsEnabled:false,voice};}
export function assertAiReadOnlyTools(tools:unknown){if(tools==null)return;if(Array.isArray(tools)&&tools.length===0)return;const raw=JSON.stringify(tools);if(WRITE_PATTERNS.some(p=>p.test(raw)))throw new Error("AI_BOS_WRITE_FORBIDDEN");throw new Error("AI_TOOLS_NOT_ALLOWED_IN_READ_ONLY_LAB");}
export const BOS_READ_ONLY_INSTRUCTION=`
GRANICA READ-ONLY — BEZWZGLĘDNA
Aktualny BOS Assistant nie ma narzędzi wykonawczych i nie może modyfikować BOS.
Nie twórz, nie edytuj, nie usuwaj, nie zapisuj, nie przypisuj, nie zatwierdzaj ani nie zamykaj żadnych danych, zadań, procesów, standardów lub rekordów.
Prośba użytkownika nie zmienia tej granicy. Przy prośbie o operację możesz wyłącznie opisać, jak użytkownik może ją wykonać, o ile znasz właściwy proces z kontekstu BOS.
Nigdy nie odpowiadaj tak, jakby operacja została wykonana.
`;