# BOS UX 3.0 — OPIS FUNKCJONALNY 1.0

**Identyfikator:** UX3-02  
**Status:** SPEC COMPLETE — gotowy do audytu UX3-03; niezaimplementowany  
**Data:** 2026-10-19  
**Podstawa:** `docs/ux/BOS-UX3-CONTRACT-1.0.md` (UX3-01)  
**Zasada:** **Użytkownik zarządza pracą, BOS zarządza jej udokumentowaniem.**

## 1. Cel i ograniczenia

Dokument definiuje zachowanie warstwy operacyjnej UI BOS, nie zmieniając rdzenia, schematu danych, semantyki potwierdzeń, uprawnień, bramek ani wersjonowania. Nazwy komponentów i przepływy są **specyfikacją docelową**, nie twierdzeniem o obecnym kodzie. Ich dopasowanie do repozytorium i API jest zadaniem UX3-03.

Na każdym ekranie użytkownik ma znaleźć:
1. **Co się dzieje?** — stan i kontekst.
2. **Co mam zrobić?** — najbliższa dozwolona czynność.
3. **Co się zmieniło?** — wynik ostatniej akcji, zapis i jego autor.

Nie przedstawiać zapisanego potwierdzenia jako automatycznej weryfikacji rzeczywistej kompetencji.

## 2. Reguły wspólne

- **Jedno działanie główne** na aktualnym etapie; działania dodatkowe nie konkurują wizualnie.
- **Opis czynności przed kontrolką**: nagłówek w trybie operacyjnym, poniżej sens działania i warunki jego wykonania, na końcu kontrolka zapisująca potwierdzenie.
- **Świadome poświadczenie**: etykieta kontrolki jasno oznacza zapis deklaracji, np. „Omówiono — zapisz potwierdzenie”; nie sam „Dalej”.
- **Pięć etapów widocznych razem**, lecz tylko dostępne według rdzenia mogą zostać potwierdzone. Nie ma „Zalicz wszystko”.
- **Wynik serwera jest źródłem prawdy**: do otrzymania sukcesu brak trwałego zielonego statusu.
- **Autor i czas** prezentowane przy zapisanych etapach na podstawie odpowiedzi serwera.
- **Przyczyna blokady** dostępna przy każdej niedozwolonej akcji; bez obchodzenia walidacji.
- **Nawigacja nie jest potwierdzeniem**. Przejście do kolejnego panelu nie tworzy zdarzenia.
- **Dostępność**: etykiety tekstowe obok kolorów, klawiatura, widoczny focus, aria-live dla wyników zapisu, sensowna kolejność tabulacji, brak polegania wyłącznie na animacji.

## 3. Wspólny model interakcji

### 3.1. Stany zapisu

| Stan | Widok | Zachowanie |
|---|---|---|
| IDLE | Dostępna akcja z opisem | Można rozpocząć autoryzowaną operację |
| SAVING | „Zapisywanie…” i wskaźnik | Akcja zablokowana przed ponowieniem |
| SAVED | „Zapisano potwierdzenie”, autor i czas | Aktualizacja postępu bez ręcznego odświeżenia |
| ERROR | „Nie zapisano. Spróbuj ponownie.” + szczegóły | Bez pozornego ukończenia |
| CONFLICT | „Stan procesu uległ zmianie. Odświeżamy dane.” | Pobranie stanu serwera i ponowna ocena dostępnych działań |
| BLOCKED | „Najpierw wykonaj: …” | Bez możliwości obejścia bramki |
| UNKNOWN | „Nie udało się potwierdzić wyniku zapisu. Sprawdzamy stan.” | Odczyt stanu serwera przed ponowieniem; unika podwójnego zapisu |

Przy utracie połączenia nie zakładamy ani sukcesu, ani porażki operacji. Po ustaleniu stanu można bezpiecznie ponowić działanie. Sposób ochrony przed duplikacją wymaga audytu UX3-03.

### 3.2. Wzorce komponentów

- **OperationalHeader**: proces, pracownik, Standard i wersja, bieżący status.
- **ActionPanel**: opis bieżącego działania, warunki i kontrolka poświadczenia.
- **ProgressSequence**: pięć etapów z rozróżnieniem zakończonych, bieżącego, oczekujących i zablokowanych.
- **SaveFeedback**: komunikat o operacji i ewentualnym błędzie, bez mylenia z walidacją kompetencji.
- **NextStep**: następne możliwe działanie wynikające z aktualnego stanu serwera.
- **AuditDetails**: rozwijane szczegóły autorów, czasów, historii i identyfikatorów; bez usuwania dostępu do danych.

To nazwy koncepcyjne, nie deklaracja istnienia komponentów w repozytorium.

## 4. Ekran 1 — Karta Postępu Wdrożenia (pierwszy zakres wdrożenia)

### 4.1. Układ

**Nagłówek:** „Wdrażanie pracownika” → pracownik, stanowisko, Standard vN, status.  
**Lista czynności:** tytuł zadania, krótkie objaśnienie, postęp 0–5, znacznik krytyczności (jeśli istnieje).  
**Otwarta czynność:** panel z całą sekwencją WYJAŚNIJ / POKAŻ / RAZEM / SAM / SPRAWDŹ, zawsze w tej samej kolejności.  
**Dół panelu:** stan zapisu, kolejny krok, rozwijana historia potwierdzeń.

### 4.2. Pięć etapów — język operacyjny

| Kod domenowy (bez zmian) | Nagłówek użytkownika | Instrukcja | Akcja zapisująca |
|---|---|---|---|
| WYJAŚNIJ | Omów zadanie | Wyjaśnij sposób wykonania, zasady i typowe błędy. | Omówiono — zapisz potwierdzenie |
| POKAŻ | Pokaż wykonanie | Zaprezentuj prawidłowy przebieg pracy. | Pokazano — zapisz potwierdzenie |
| RAZEM | Wykonajcie zadanie wspólnie | Przećwiczcie czynność z udziałem prowadzącego. | Wykonano wspólnie — zapisz potwierdzenie |
| SAM | Praca samodzielna | Pozwól pracownikowi wykonać czynność samodzielnie. | Wykonano samodzielnie — zapisz potwierdzenie |
| SPRAWDŹ | Sprawdź rezultat | Oceń wynik i odnotuj wymagane informacje. | Sprawdzono — zapisz potwierdzenie |

Instrukcje są opisem ogólnym; szczegółowa treść Standardu pozostaje nadrzędna i musi być widoczna w kontekście.

### 4.3. Reguły

- Przycisk danego etapu dostępny tylko jeśli rdzeń dopuszcza akcję dla bieżącego użytkownika i stanu.
- Po zapisie **jednego** etapu interfejs aktualizuje tylko odpowiadający mu stan i pobiera autorytatywny postęp.
- Po piątym etapie komunikat: „Nauka tej czynności została udokumentowana. Przejdź do kolejnej czynności lub oceny wymagań.” Nie „Pracownik jest gotowy”.
- Wymagane notatki i pola dodatkowe pozostają wymagane, jeśli narzuca je istniejąca logika.
- Cofanie/korekta nie może być dodana jako dowolne odznaczanie checkboxa: tylko jeśli obecny rdzeń przewiduje taką operację i ślad audytowy.

### 4.4. Przykładowa makieta tekstowa

```text
Wdrażanie: AUDYT Magazynier             W TOKU
Standard: Magazynier · wersja 1

Przyjęcie towaru                        2 z 5 etapów
[✓] Omów zadanie         Zapisano · autor, czas
[✓] Pokaż wykonanie      Zapisano · autor, czas
[→] Wykonajcie wspólnie
    Przećwiczcie przyjęcie dostawy.
    [Wykonano wspólnie — zapisz potwierdzenie]
[○] Praca samodzielna    Oczekuje
[○] Sprawdź rezultat     Oczekuje

Co dalej: Po wspólnym wykonaniu pracownik
przechodzi do samodzielnej próby.
[Szczegóły potwierdzeń i historia]
```

## 5. Ekran 2 — Przygotowanie Wdrożenia

- Nagłówek: „Przygotuj wdrożenie pracownika”.
- Sekcja: „Zanim rozpoczniesz”, z warunkami wynikającymi z wybranego Standardu.
- Każdy warunek pokazuje opis rzeczywistej gotowości organizacyjnej i świadomą akcję „Warunek spełniony — zapisz potwierdzenie”.
- W przypadku blokady: „Nie można rozpocząć szkolenia. Pozostały warunki: …”.
- Po skompletowaniu: „Warunki rozpoczęcia zostały potwierdzone w BOS. Możesz rozpocząć szkolenie”.
- Nie zakładamy automatycznej weryfikacji szkoleń, uprawnień ani wyposażenia.

## 6. Ekran 3 — Kryteria i zakończenie Wdrożenia

- Nagłówek: „Oceń przygotowanie pracownika”.
- Każde kryterium zawiera wymaganie, ewentualne wskazówki i akcję „Spełnienie ocenione — zapisz potwierdzenie” lub dokładniejszą etykietę odpowiadającą istniejącej operacji.
- Komunikat kompletności: „Zapisano wszystkie wymagane oceny”; nie „BOS zweryfikował kompetencje”.
- Ekran decyzji: „Podejmij decyzję o zakończeniu wdrożenia”; wyniki GOTOWY / JESZCZE NIE / STOP pozostają niezmienione.
- Dla zablokowanego GOTOWY pokazujemy **konkretną listę brakujących działań** na podstawie rdzenia.
- Karta Zakończenia prezentuje: „Decyzja [wynik], podjęta przez [osoba], [czas], na podstawie zapisanych potwierdzeń”. Nie przypisuje systemowi osobistej obserwacji pracy.

## 7. Ekran 4 — Biblioteka wzorów

- Nagłówek: „Wybierz wzór stanowiska”.
- Wyszukiwarka i filtr obszaru pozostają.
- Karta wzoru wyjaśnia zawartość i że jest to **punkt wyjścia wymagający dopasowania do firmy**.
- Akcja: „Utwórz Standard z tego wzoru” (zamiast niejednoznacznego „Użyj wzoru”).
- Podgląd zawartości przed skopiowaniem — proponowana funkcja, wymagająca oceny kosztu technicznego w UX3-03; brak podglądu nie może blokować pierwszego wdrożenia UX3.0.
- Po utworzeniu: „Utworzono roboczy Standard. Dostosuj go do sposobu pracy w Twojej firmie”.

## 8. Ekran 5 — Edytor Standardu

- Nagłówek: „Przygotuj zasady pracy dla stanowiska”.
- Sekcje opisane zadaniowo: „Jakie zadania wykonuje pracownik?”, „Co musi być przygotowane przed rozpoczęciem?”, „Po czym kierownik pozna, że pracownik opanował zadania?”.
- Zachować wszystkie wymagane pola, limity, walidacje i zasady publikacji.
- Po zapisaniu części: „Zapisano zmiany w [sekcja]”; bez sugerowania zapisu pozostałych sekcji.
- Przed publikacją: „Sprawdź, czy Standard odpowiada pracy w Twojej firmie”; status kompletności pól nie zastępuje oceny merytorycznej.
- Po publikacji: propozycja „Rozpocznij wdrożenie z tym Standardem” — przejście na istniejący formularz z prawidłowym kontekstem, jeśli architektura pozwala; do weryfikacji w UX3-03.

## 9. Ekran 6 — Awanse

- Nagłówek: „Przygotowanie do nowej roli”.
- Kontekst: pracownik, obecna rola → docelowa rola, Standard docelowy i status.
- Zamiast prezentować wyłącznie „2/7 bramek”, pokazać: „Co jeszcze trzeba zrobić przed decyzją?”.
- Każdy brak ma objaśnienie w języku pracy i odnośnik do istniejącego miejsca wykonania; **nie wolno obiecywać akcji naprawczej, której aplikacja nie obsługuje**.
- Nie zmieniać siedmiu bramek, ocen, uprawnień, warunków GOTOWY/JESZCZE NIE/STOP.
- Jeśli stan jest niespójny lub nie można przypisać Standardu, pokazać uczciwą informację i dostępną drogę wsparcia; faktyczną naprawę klasyfikować w UX3-03.

## 10. Ekran 7 — Pomoc kontekstowa

- Pomoc odpowiada na pytanie z **bieżącego ekranu**: co robię, po co, czego wymaga następny krok, co oznacza blokada.
- Dla „Użytkowników”: „Kto może prowadzić, sprawdzać i zarządzać dostępem?” zamiast ogólnego „Wybierz produkt lub ekran”.
- Dla Wdrożeń: „Jak rozpocząć?”, „Dlaczego etap jest zablokowany?”, „Co oznacza zapisane potwierdzenie?”.
- Dla Awansów: „Co oznacza brak wymagania?”, „Co jeszcze trzeba zrobić przed decyzją?”.
- Bez AI, bez automatycznej oceny kompetencji, bez obietnic przyszłych funkcji.

## 11. Scenariusze odbioru

**T01 — ścieżka poprawna:** otwarcie czynności, pięć oddzielnych zapisów, pięciu etapów nie da się pominąć, historia i autorzy zachowani.  
**T02 — błąd zapisu:** brak fałszywego sukcesu; widoczna możliwość bezpiecznego ponowienia.  
**T03 — opóźniona odpowiedź:** blokada wielokrotnego kliknięcia, jedno potwierdzenie w historii.  
**T04 — wynik nieznany:** odczyt stanu serwera przed ponowną próbą.  
**T05 — zmiana stanu równolegle:** konflikt wyjaśniony, interfejs aktualizuje stan autorytatywny.  
**T06 — uprawnienia:** nieuprawniony użytkownik nie potwierdzi etapu ani nie ominie blokady.  
**T07 — nieukończona czynność:** GOTOWY pozostaje zablokowane zgodnie z rdzeniem.  
**T08 — komplet pięciu etapów:** nie zalicza automatycznie kryteriów końcowych.  
**T09 — odświeżenie/nawigacja:** po zapisie stan pozostaje trwały, bez konieczności odświeżania do zobaczenia sukcesu.  
**T10 — język:** komunikaty nie przypisują BOS samodzielnej weryfikacji rzeczywistej kompetencji.  
**T11 — Standard:** kopiowanie, edycja, publikacja i przypisanie wersji nie zmieniają semantyki.  
**T12 — Awanse:** wszystkie bramki i wyniki zachowują aktualne reguły.  
**T13 — dostępność:** klawiatura, focus, czytelne etykiety, komunikaty stanu dla technologii asystujących.

## 12. Zakres pierwszego wdrożenia i decyzje dla UX3-03

**MVP UX3.0:** Karta Postępu Wdrożenia (sekcja 4) + wspólny mechanizm informacji o zapisie (sekcja 3) w zakresie tej karty. Pozostałe ekrany w kolejnych pakietach.

Audyt UX3-03 ma ustalić:
1. istniejące komponenty, trasy, API i sposób przechowywania etapów;
2. źródło obserwowanego braku aktualizacji UI po zapisie;
3. dostępność identyfikatorów autora i czasu w odpowiedziach API;
4. ochronę przed duplikacją, konfliktem i wynikiem nieznanym;
5. rzeczywiste reguły notatek, cofania i kolejności;
6. wykonalność podglądu wzoru i przejścia do wdrożenia po publikacji;
7. miejsca wspólne z Awansami i ryzyko regresji;
8. klasyfikację każdej zmiany: UI ONLY / UI + STATE / API REQUIRED / CORE RISK.

**STOP:** jakakolwiek zmiana semantyki potwierdzeń, reguł bramek, autoryzacji lub historii wymaga odrębnego kontraktu i decyzji.

## 13. Status i przekazanie

**UX3-02: SPEC COMPLETE.** Dokument zawiera mapę ekranów, język operacyjny, zachowanie stanów, szkic UI i scenariusze odbioru. Nie potwierdza zgodności z obecnym kodem ani zakończenia implementacji. Następny krok: **UX3-03 — audyt techniczny**.
