# BOS UX 3.0 — KONTRAKT PROJEKTOWY 1.0

**Identyfikator:** UX3-01  
**Status:** APPROVED — kontrakt bazowy dla dalszego projektowania  
**Data:** 2026-10-19  
**Produkt:** BOS — Standardy Operacyjne Biznesu  
**Repozytorium:** vernegroup/bos-platform  
**Charakter:** kontrakt warstwy prezentacji i interakcji; bez zmian domenowych

## 1. Cel i zasada nadrzędna

**Użytkownik zarządza pracą, BOS zarządza jej udokumentowaniem.**

Interfejs ma odpowiadać kolejno na pytania:
1. **Co się dzieje?** — aktualny stan procesu, czynności i pracownika.
2. **Co mam teraz zrobić?** — następne dozwolone działanie opisane językiem pracy.
3. **Co się zmieniło?** — wynik operacji i jednoznaczny stan jej zapisu.

BOS nie może stawiać mechaniki potwierdzania ponad opisem rzeczywistego działania. Dokumentowanie ma być naturalnym skutkiem świadomej akcji użytkownika, a nie dodatkowym, osobnym procesem administracyjnym.

## 2. Granice kontraktu (inwarianty)

UX3.0 NIE ZMIENIA:
- sekwencji **WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ**, ani warunków jej realizacji;
- warunków rozpoczęcia, bramek, blokad i reguł przejść;
- oddzielności czynności, etapów, kryteriów gotowości i decyzji końcowej;
- roli człowieka w ocenie rzeczywistego wykonania i podjęciu decyzji;
- uprawnień, kontroli dostępu, izolacji organizacji i przypisania ról;
- tożsamości autora, czasu, treści i historii każdego zapisanego potwierdzenia;
- wersjonowania Standardów i przypisania procesu do właściwej wersji;
- istniejących danych, zapisów historycznych i zasad audytowalności;
- semantyki wyników GOTOWY / JESZCZE NIE / STOP;
- logiki rozliczeń, licencji i integracji niezwiązanych z UX.

Nie wolno uznać etapu za wykonany bez skutecznej, autoryzowanej operacji po stronie serwera. Interfejs nie może omijać blokad rdzenia.

## 3. Dozwolone zmiany

Dozwolone są:
- zmiany nazw, etykiet, opisów, kolejności informacji i hierarchii wizualnej;
- prezentacja pięciu etapów jednej czynności w jednym panelu;
- wskazywanie następnego dozwolonego działania;
- uproszczenie nawigacji i usunięcie zbędnych przejść między ekranami;
- czytelne prezentowanie autorów, dat, postępu i historii;
- stany interakcji: gotowy, zapisywanie, zapisano, błąd, zablokowany;
- poprawa synchronizacji widoku ze stanem serwera;
- kontekstowa pomoc operacyjna.

Nowy układ może zmniejszać liczbę kliknięć i przejść, ale nie liczbę wymaganych dowodów, potwierdzeń ani bramek bez odrębnej decyzji projektowej.

## 4. Kontrakt języka operacyjnego

Tekst główny opisuje **działanie w rzeczywistym procesie**, nie operację w bazie danych.

| Pojęcie domenowe | Preferowany komunikat operacyjny |
|---|---|
| WYJAŚNIJ | Omów zadanie z pracownikiem |
| POKAŻ | Pokaż sposób wykonania |
| RAZEM | Wykonajcie zadanie wspólnie |
| SAM | Pracownik wykonuje zadanie samodzielnie |
| SPRAWDŹ | Sprawdź rezultat pracy |
| Potwierdzenie kryterium | Oceń, czy wymaganie zostało spełnione |
| Bramka niespełniona | Do zakończenia pozostały wymagane działania |
| Potwierdzenie zapisane | Zapisano potwierdzenie — [czas], [autor] |

**Warunek semantyczny:** komunikat po akcji nie może twierdzić więcej niż ustalił system. „Potwierdzono w systemie” nie oznacza „system zweryfikował rzeczywistą kompetencję”. „Pracownik gotowy” jest wynikiem decyzji uprawnionej osoby, a nie automatycznym wnioskiem z samych checkboxów.

Przycisk kończący etap musi jednoznacznie informować, że użytkownik poświadcza wykonanie opisanej pracy (np. „Omówiono — zapisz potwierdzenie”), nawet jeśli główny nagłówek opisuje samo działanie.

## 5. Kontrakt interakcji i zapisu

Dla każdej mutacji:
1. UI prezentuje akcję dozwoloną przez aktualny stan i uprawnienia.
2. Po uruchomieniu pokazuje stan **Zapisywanie…** i zabezpiecza przed przypadkowym ponowieniem.
3. Dopiero potwierdzona odpowiedź serwera uprawnia do pokazania **Zapisano** i trwałego oznaczenia etapu.
4. Po błędzie UI pokazuje **Nie zapisano**, zachowuje możliwość bezpiecznego ponowienia i nie symuluje sukcesu.
5. Po sukcesie widok prezentuje aktualny stan bez konieczności ręcznego odświeżania.
6. Przy konflikcie, nieaktualnym stanie lub utracie połączenia UI pobiera stan autorytatywny i wyjaśnia użytkownikowi wynik.
7. Nie wolno tworzyć fikcyjnego autora, czasu ani zdarzenia. Wyświetlane dane pochodzą ze zweryfikowanego stanu serwera.

Szczegółowa technika synchronizacji i idempotencji zostanie ustalona podczas UX3-03, po audycie istniejących endpointów.

## 6. Kontrakt informacji i odpowiedzialności

- Domyślnie pokazujemy bieżącą czynność, jej sens, postęp i następny krok.
- Szczegóły techniczne i historia mogą być zwijane, ale muszą pozostać dostępne.
- Statusy „nie wykonano”, „zablokowane”, „oczekuje na ocenę” i „błąd zapisu” muszą być rozróżnialne.
- Nie maskujemy brakujących danych ani niespełnionych wymagań estetycznym wskaźnikiem postępu.
- Nie pokazujemy kompletności zapisów jako gwarancji poprawności pracy pracownika.
- Interfejs powinien pozostać czytelny przy obsłudze klawiaturą i na mniejszych ekranach.

## 7. Zakres zastosowania i kolejność

Kontrakt obowiązuje dla całego BOS, ale wdrożenie przebiega etapowo:
1. Karta Postępu Wdrożenia — pięć etapów jednej czynności.
2. Warunki rozpoczęcia, kryteria i zamknięcie Wdrożenia.
3. Biblioteka i edytor Standardów.
4. Awanse.
5. Pomoc kontekstowa i spójność pozostałych ekranów.

Zakres każdej iteracji musi być osobno opisany i przetestowany.

## 8. Kryteria akceptacji

**PASS UX3.0** wymaga łącznie:
- identycznych reguł domenowych przed i po zmianie;
- pięciu odrębnych, autoryzowanych potwierdzeń w pięcioetapowej sekwencji;
- poprawnej historii, autora i czasu dla każdego potwierdzenia;
- braku obejścia blokad i eskalacji uprawnień;
- widocznego stanu zapisywania, sukcesu i błędu;
- zgodności widoku z autorytatywnym stanem serwera bez ręcznego odświeżenia po prawidłowej operacji;
- poprawnych komunikatów odróżniających deklarację użytkownika od rzeczywistego dowodu kompetencji;
- pozytywnych testów regresyjnych Wdrożeń i Awansów dla zmienionych obszarów.

**Miernik eksperymentalny (nie warunek gwarantowany):** skrócenie czasu administracyjnej obsługi pięciu etapów o co najmniej 25% przy niezmienionym zakresie rejestrowanych zdarzeń. Wynik wymaga pomiaru A/B na identycznym scenariuszu.

## 9. Kontrola zmian i stop conditions

Zmiana wymagająca modyfikacji modelu domenowego, schematu Neon, autoryzacji, semantyki potwierdzeń, reguł bramek albo historii jest **poza zakresem UX3.0** i wymaga osobnego kontraktu oraz zatwierdzenia.

Wstrzymać wdrożenie, jeśli test wykaże:
- pozorne potwierdzenie bez zapisu;
- utratę autora, czasu lub historii;
- obejście kolejności albo bramki;
- zmianę znaczenia decyzji końcowej;
- niejednoznaczne poświadczenie rzeczywistej kompetencji;
- regresję izolacji organizacji lub uprawnień.

## 10. Przekazanie do kolejnych etapów

- **UX3-02 — opis funkcjonalny:** teksty, stany, scenariusze i makiety ekranów zgodne z niniejszym kontraktem.
- **UX3-03 — audyt techniczny:** mapa kodu, API, stanu UI i ryzyk; klasyfikacja UI ONLY / UI + STATE / API REQUIRED / CORE RISK.
- **UX3-04 — wdrożenie:** małe pakiety, testy regresyjne i odbiór według §8.

**Ten dokument zatwierdza reguły projektowe. Nie stanowi potwierdzenia wykonania UX3-02, UX3-03, UX3-04 ani produkcyjnej implementacji.**
