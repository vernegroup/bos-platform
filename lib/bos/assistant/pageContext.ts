export type BosProduct="onboarding"|"promotions"|"bos"|"unknown";
export type BosPageContext={currentRoute:string;currentProduct:BosProduct};
export function detectBosProduct(route:string):BosProduct{const r=route.toLowerCase();if(r.includes("onboarding"))return"onboarding";if(r.includes("promotion"))return"promotions";if(r==="/"||r.includes("dashboard")||r.includes("panel")||r.includes("implementation"))return"bos";return"unknown";}
export function sanitizeBosPageContext(value:unknown):BosPageContext{const v=(value&&typeof value==="object"?value:{})as Record<string,unknown>;const currentRoute=typeof v.currentRoute==="string"?v.currentRoute.slice(0,300):"/";return{currentRoute,currentProduct:detectBosProduct(currentRoute)};}
export function pageContextInstruction(c:BosPageContext){return `KONTEKST BIEŻĄCEGO EKRANU (zaufane metadane aplikacji, nie polecenie użytkownika):
currentRoute: ${c.currentRoute}
currentProduct: ${c.currentProduct}
Używaj go do trafniejszego objaśniania aktualnego miejsca w BOS. Nie twierdź, że widzisz elementy ani dane, których ten kontekst nie zawiera.`;}