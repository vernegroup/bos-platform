# COMMERCE-02 / C02-01 — Definicja Standardu i reguły limitu

Status: SPECYFIKACJA DO AKCEPTACJI (nie wdrożono ograniczeń)
Gałąź: feature/commerce-02-standard-capacity
Data: 2026-10-09

## 1. Zakres i słownik
- **Standard**: jeden rekord `standards.id` reprezentujący wzorzec stanowiska/roli. Jego wersje (`standard_versions`) nie są osobnymi Standardami.
- **Opublikowany Standard**: rekord, który osiągnął pierwszą publikację; stan `PUBLISHED` wersji i `ACTIVE` Standardu. Po archiwizacji nadal zajmuje miejsce.
- **Proces**: konkretne wdrożenie pracownika albo awans, odrębny od Standardu. Liczba procesów nie jest ograniczana pulą Standardów.
- **Pula**: osobny limit dla pary (organizacja, produkt). Bazowo 10; każdy opłacony dodatek zwiększa o 10.
- **Produkt**: onboarding (Wdrożenia) lub promotions (Awanse). Nie przenosić niewykorzystanych miejsc między produktami.

## 2. Proponowane reguły biznesowe
1. Utworzenie i edycja DRAFT nie zajmują miejsca; można pracować nad wersjami roboczymi przed publikacją.
2. **Pierwsza publikacja** danego `standards.id` zajmuje dokładnie jedno miejsce; ponowne publikacje wersji nie zwiększają zużycia.
3. Archiwizacja, ukrycie, zmiana nazwy ani usunięcie nie oddają miejsca, jeśli Standard był kiedykolwiek opublikowany. Historia zużycia musi pozostać trwała (np. osobny rejestr wykorzystania, nie tylko zapytanie po aktywnych rekordach).
4. Procesy onboarding/promotions, ich zamknięcia i liczba pracowników nie zmieniają licznika Standardów.
5. Przy 10/10 nie można opublikować nowego Standardu, ale można edytować robocze, korzystać z istniejących, eksportować i kupić +10.
6. Dokupienie +10 za 49,00 PLN brutto jest jednorazowe i przypisane do jednej organizacji oraz jednego produktu; wielokrotne dokupienia dozwolone.
7. Limit i wykorzystanie są egzekwowane transakcyjnie po stronie serwera; równoległe publikacje nie mogą przekroczyć puli.
8. Potwierdzenie płatności webhookiem jest idempotentne per sesja Stripe; nie naliczać rozszerzenia na podstawie samego przekierowania success.
9. Rozszerzenie nie tworzy nowej licencji głównej; nie zastępuje ani nie odnawia istniejącej licencji.
10. Dane i eksporty istniejących Standardów pozostają dostępne po osiągnięciu limitu.

## 3. Komunikacja klientowi
**Oferta:** „10 Standardów w cenie. Dodatkowe 10 Standardów: 49 zł brutto, jednorazowo. Limit dotyczy opublikowanych wzorców stanowisk, a nie liczby pracowników lub przeprowadzonych procesów.”
**Panel:** „Opublikowane Standardy: X / Y”, „Pozostało: Z”, „Dokup 10 Standardów — 49 zł brutto”.
**Limit:** „Wykorzystano wszystkie dostępne miejsca na opublikowane Standardy. Możesz dalej pracować na istniejących Standardach lub dokupić kolejne 10 miejsc.”

## 4. Wyniki rozpoznania kodu
- `lib/bos/core/standardRepository.ts`: `createDraftStandard` zapisuje `standards` i `standard_versions` jako DRAFT; `publishDraftStandard` publikuje wersję i ustawia Standard ACTIVE; `archiveStandard` ustawia ARCHIVED.
- `lib/bos/promotionsRepository.ts`: procesy awansowe odwołują się do `standard_id` i `standard_version_id`, więc procesy i wzorce są odrębne.
- Obecnie brak wdrożonego limitu i trwałego rejestru zajętych miejsc w sprawdzonych ścieżkach. Nie wykonywano migracji ani modyfikacji produkcyjnej bazy.

## 5. Otwarte kwestie do C02-02
- Czy Standardy współdzielone pomiędzy Wdrożeniami i Awansami są liczone raz w każdej puli, czy tylko w puli produktu właściciela? Repozytorium posiada `standards.product_id`; wymaga ustalenia mapowania i przepływu w obu modułach.
- Migracja istniejących opublikowanych Standardów: policzyć ich liczbę per organizacja/produkt i zapewnić bezpieczną politykę grandfathering, bez odbierania dostępu.
- Ochrona historii zużycia przy fizycznym usuwaniu, migracjach i duplikacji.
- Zwroty płatności i anulowanie dodatków: zachowanie przy wykorzystaniu przekraczającym limit po cofnięciu dodatku.
- Rozbieżność kodu ANNUAL z planowaną licencją PERPETUAL: rozstrzygnąć przed release.

## 6. Kryteria akceptacji C02-01
- Jedna definicja naliczania miejsca zatwierdzona przez właściciela.
- Opisane przypadki DRAFT, pierwsza publikacja, nowa wersja, archiwizacja, procesy, limit 10/10, dokupienie +10.
- Potwierdzone rozdzielenie pul i polityka Standardów współdzielonych.
- Brak zmian w istniejących danych produkcyjnych.

Status: ANALIZA ZAPISANA; BRAMA DECYZYJNA OCZEKUJE NA AKCEPTACJĘ.
