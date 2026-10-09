import type { HelpContext, HelpProduct } from "./helpContext";

export type HelpInstruction = {
  title: string;
  steps: readonly string[];
  note?: string;
  href?: string;
  linkLabel?: string;
};

const screens: Record<HelpProduct, Record<string, HelpInstruction>> = {
  core: {
    dashboard: { title: "Od czego zacząć", steps: ["Wybierz produkt z górnego paska.", "Otwórz obszar, w którym chcesz pracować."] },
    general: { title: "Jak korzystać z BOS", steps: ["Wybierz produkt lub ekran z nawigacji.", "Wróć do pomocy po otwarciu właściwego procesu."] },
  },
  onboarding: {
    overview: { title: "Jak rozpocząć wdrożenie", steps: ["Przygotuj Standard Stanowiska.", "Utwórz wdrożenie na podstawie opublikowanej wersji.", "Przeprowadź etapy i potwierdź gotowość."], href: "/app/onboarding/standards", linkLabel: "Przejdź do standardów" },
    standards: { title: "Jak przygotować Standard", steps: ["Wybierz gotowy wzór BOS albo utwórz własny Standard.", "Dostosuj czynności, warunki rozpoczęcia i kryteria gotowości.", "Opublikuj właściwą wersję, aby móc wykorzystać ją we wdrożeniu."] },
    "process-list": { title: "Jak rozpocząć wdrożenie", steps: ["Wybierz „Nowe wdrożenie”.", "Przypisz pracownika i opublikowaną wersję Standardu Stanowiska.", "Otwórz utworzony proces, aby przeprowadzić czynności."] },
    "process-new": { title: "Tworzenie wdrożenia", steps: ["Wskaż pracownika i Standard Stanowiska.", "Sprawdź wybraną wersję i wymagane dane.", "Zapisz proces, a następnie potwierdź warunki rozpoczęcia."] },
    "process-detail": { title: "Jak prowadzić wdrożenie", steps: ["Potwierdź warunki rozpoczęcia.", "Wykonaj etapy WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ.", "Potwierdź kryteria gotowości i przejdź do decyzji."] },
    "process-close": { title: "Zamknięcie procesu", steps: ["Sprawdź wykonanie czynności i kryteriów.", "Podejmij decyzję na podstawie udokumentowanej weryfikacji.", "Po zamknięciu odszukaj rekord w historii."] },
    history: { title: "Jak korzystać z historii", steps: ["Odszukaj proces na liście.", "Otwórz zapis decyzji i wersję Standardu.", "Sprawdź wynik weryfikacji i dane zakończenia."] },
    "closure-detail": { title: "Jak odczytać rekord", steps: ["Sprawdź decyzję końcową.", "Porównaj zapis z wersją Standardu przypisaną do procesu."] },
  },
  promotions: {
    overview: { title: "Jak rozpocząć zmianę roli", steps: ["Otwórz zmiany stanowiska.", "Utwórz proces A → B na podstawie Standardu roli docelowej.", "Oceń wymagania, przeprowadź brakujące czynności i zweryfikuj gotowość."], href: "/app/promotions/processes", linkLabel: "Otwórz zmiany stanowiska" },
    "process-list": { title: "Jak pracować ze zmianami", steps: ["Otwórz proces w toku albo utwórz nowy.", "Sprawdź, które bramki pozostają niespełnione.", "Uzupełniaj wymagania w procesie A → B."] },
    "process-new": { title: "Tworzenie zmiany A → B", steps: ["Wskaż rolę obecną i docelową.", "Przypisz właściwy Standard roli B.", "Zapisz proces i przejdź do oceny wejściowej."] },
    "process-detail": { title: "Jak doprowadzić do decyzji", steps: ["Uzupełnij ocenę wejściową.", "Przeprowadź wymagane etapy wdrożenia.", "Potwierdź gotowość i przekazanie obowiązków.", "Sprawdź wszystkie siedem bramek przed decyzją GOTOWY."] },
    history: { title: "Jak sprawdzić wynik", steps: ["Otwórz zakończony proces.", "Sprawdź decyzję oraz zapisane uzasadnienie.", "Zweryfikuj historię zmiany roli."] },
    "closure-detail": { title: "Jak odczytać decyzję", steps: ["Sprawdź wynik procesu A → B.", "Przejrzyj weryfikację i potwierdzenia przejścia."] },
  },
};

const states: Record<string, HelpInstruction> = {
  "start-blocked": { title: "Warunki rozpoczęcia", steps: ["Odszukaj sekcję warunków startu.", "Potwierdź każdy wymagany warunek.", "Dopiero wtedy przejdź do etapów czynności."] },
  "tasks-pending": { title: "Czynności do wykonania", steps: ["Otwórz nieukończoną czynność.", "Potwierdzaj po kolei WYJAŚNIJ, POKAŻ, RAZEM, SAM i SPRAWDŹ.", "Powtórz dla pozostałych czynności."] },
  "critical-pending": { title: "Czynności krytyczne K", steps: ["Znajdź czynności oznaczone K.", "Ukończ wymagane etapy SAM i SPRAWDŹ.", "Sprawdź ponownie bramkę gotowości."] },
  "readiness-pending": { title: "Potwierdzenie gotowości", steps: ["Przejdź do kryteriów gotowości.", "Zweryfikuj wymagania wskazaną metodą.", "Zapisz potwierdzenia po faktycznej weryfikacji."] },
  "ready-for-decision": { title: "Można podjąć decyzję", steps: ["Przejrzyj zapisane wyniki i potwierdzenia.", "Przejdź do sekcji decyzji.", "Wybierz wynik zgodny z oceną osoby uprawnionej."] },
  "gate-standard": { title: "Bramka STANDARD", steps: ["Sprawdź przypisanie Standardu roli B.", "Uzupełnij brakujący lub niepoprawny Standard.", "Wróć do procesu i sprawdź status bramki."] },
  "gate-process": { title: "Bramka PROCES", steps: ["Sprawdź wymagane dane procesu A → B.", "Uzupełnij puste lub niepoprawne pola.", "Sprawdź status bramki."] },
  "gate-entry": { title: "Bramka OCENA WEJŚCIOWA", steps: ["Oceń wymagania roli B.", "Zweryfikuj pozycje DO SPRAWDZENIA.", "Zapisz wyniki i brakujące dowody."] },
  "gate-deployment": { title: "Bramka WDROŻENIE", steps: ["Znajdź czynności DO WDROŻENIA.", "Dla każdej wykonaj pięć etapów BOS w kolejności.", "Sprawdź status bramki."] },
  "gate-critical": { title: "Bramka K", steps: ["Odszukaj czynności krytyczne K.", "Ukończ dla nich pełną wymaganą ścieżkę BOS.", "Sprawdź, czy bramka K jest spełniona."] },
  "gate-readiness": { title: "Bramka GOTOWOŚĆ", steps: ["Przejdź do kryteriów gotowości roli B.", "Zweryfikuj każde kryterium.", "Zapisz wynik PASS lub FAIL na podstawie faktów."] },
  "gate-transition": { title: "Bramka PRZEJŚCIE", steps: ["Dodaj co najmniej jeden element przejścia A → B.", "Potwierdź jako WYKONANE wszystkie wymagane elementy.", "Sprawdź status bramki PRZEJŚCIE."] },
};

/** Static, audited instructions only. No AI, personal data or business writes. */
export function resolveHelpInstruction(context: HelpContext): HelpInstruction {
  if (context.state && states[context.state]) return states[context.state];
  return screens[context.product][context.screen] ?? screens.core.general;
}
