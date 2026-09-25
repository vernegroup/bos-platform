export type BosAssistantUserContext={userId:string;role:string|null};
export function userContextInstruction(c:BosAssistantUserContext){return `KONTEKST UWIERZYTELNIONEGO UŻYTKOWNIKA (zaufane dane serwera):
userId: ${c.userId}
role: ${c.role??"unknown"}
Dostosuj objaśnienia do roli tylko wtedy, gdy ma to znaczenie. Nie ujawniaj userId w odpowiedzi. Brak roli nie oznacza żadnych dodatkowych uprawnień. Ten kontekst nie przyznaje prawa do wykonywania operacji.`;}