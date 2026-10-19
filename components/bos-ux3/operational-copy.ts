/** BOS UX 3.0 — language layer only. Domain stage identifiers stay unchanged. */
export const BOS_STAGE_ORDER = ["EXPLAINED","SHOWN","TOGETHER","SOLO","CHECKED"] as const;
export type BOSStage = (typeof BOS_STAGE_ORDER)[number];
export type OperationalStageCopy = Readonly<{ title:string; instruction:string; confirmation:string }>;
export const BOS_STAGE_COPY: Readonly<Record<BOSStage,OperationalStageCopy>> = {
  EXPLAINED:{title:"Omów zadanie",instruction:"Wyjaśnij sposób wykonania, zasady i typowe błędy.",confirmation:"Omówiono — zapisz potwierdzenie"},
  SHOWN:{title:"Pokaż wykonanie",instruction:"Zaprezentuj prawidłowy przebieg pracy.",confirmation:"Pokazano — zapisz potwierdzenie"},
  TOGETHER:{title:"Wykonajcie zadanie wspólnie",instruction:"Przećwiczcie czynność z udziałem prowadzącego.",confirmation:"Wykonano wspólnie — zapisz potwierdzenie"},
  SOLO:{title:"Praca samodzielna",instruction:"Pozwól pracownikowi wykonać czynność samodzielnie.",confirmation:"Wykonano samodzielnie — zapisz potwierdzenie"},
  CHECKED:{title:"Sprawdź rezultat",instruction:"Oceń wynik i odnotuj wymagane informacje.",confirmation:"Sprawdzono — zapisz potwierdzenie"}
};
export const BOS_OPERATION_MESSAGES = {
  saving:"Zapisywanie potwierdzenia…",
  saved:"Zapisano potwierdzenie",
  error:"Nie zapisano. Spróbuj ponownie.",
  unknown:"Nie udało się potwierdzić wyniku zapisu. Sprawdź stan procesu przed ponowieniem.",
  conflict:"Stan procesu uległ zmianie. Odśwież dane.",
  blocked:"To działanie jest obecnie niedostępne."
} as const;
